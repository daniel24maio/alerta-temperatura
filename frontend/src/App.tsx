import React, { useState, useEffect } from 'react';
import { DeviceBadge } from './components/DeviceBadge';
import { MetricCard } from './components/MetricCard';
import { ST7789Display } from './components/ST7789Display';
import { ActuatorControl } from './components/ActuatorControl';
import { HistoryTable, HistoryItem } from './components/HistoryTable';
import { HistoryChart } from './components/HistoryChart';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:5001/api`
    : 'http://localhost:5001/api');
const AUTH_HEADER = 'Basic ' + btoa('admin:admin123');

interface DeviceRecord {
  deviceId: string;
  status: 'online' | 'offline';
  lastSeen: string;
  state?: {
    temp: number;
    humidity: number;
    noiseLevel: number;
    lux?: number;
    alerts: string[];
    lcdText?: string;
    actuatorState: boolean;
  };
}

/**
 * Diretivas Normativas de Saúde Visual e Ergonomia (NBR ISO/CIE 8995-1 / NHO 11 Fundacentro / NR-17):
 * - < 100 lx: Crítico / Insuficiente (Risco de astenopia e fadiga visual severa)
 * - 100 a 299 lx: Baixo / Penumbra (Aceitável para circulação/repouso, fraco para estudo/leitura)
 * - 300 a 750 lx: Ideal / Conforto Visual (Faixa recomendada para escritórios, salas de aula e terminais)
 * - 751 a 1500 lx: Alto / Alta Precisão (Trabalhos detalhados, laboratórios ou desenho técnico)
 * - > 1500 lx: Excessivo / Ofuscamento (Acima do necessário, risco de ofuscamento e cefaleia)
 */
function getLuminosityEvaluation(lux: number | undefined) {
  if (lux === undefined || isNaN(lux)) {
    return {
      subtitle: 'Aguardando Leitura...',
      colorClass: 'text-slate-400',
    };
  }
  if (lux < 100) {
    return {
      subtitle: '🔴 Muito Baixo (<100 lx): Insuficiente / Risco de Fadiga Ocular',
      colorClass: 'text-rose-500',
    };
  }
  if (lux < 300) {
    return {
      subtitle: '⚠️ Baixo (100-300 lx): Circulação / Fraco p/ Trabalho (NHO 11)',
      colorClass: 'text-amber-400',
    };
  }
  if (lux <= 750) {
    return {
      subtitle: '✅ Ideal (300-750 lx): Conforto Visual Normativo (NBR 8995-1)',
      colorClass: 'text-emerald-400',
    };
  }
  if (lux <= 1500) {
    return {
      subtitle: '💡 Alto (750-1500 lx): Adequado p/ Tarefas de Alta Precisão',
      colorClass: 'text-sky-400',
    };
  }
  return {
    subtitle: '⚡ Excessivo (>1500 lx): Acima do Necessário / Ofuscamento',
    colorClass: 'text-purple-400',
  };
}

export function App() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('esp32_temp');
  const [availableDevices, setAvailableDevices] = useState<string[]>(['esp32_temp', 'esp32-temp-01']);
  const [device, setDevice] = useState<DeviceRecord | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingCommand, setIsLoadingCommand] = useState(false);

  const fetchDeviceList = async () => {
    try {
      const res = await fetch(`${API_BASE}/devices`, {
        headers: { Authorization: AUTH_HEADER },
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const ids = list.map((d: any) => d.deviceId);
          setAvailableDevices(ids);
          // Prioriza o dispositivo online, dando preferência a esp32_temp
          const onlineDev = list.find((d: any) => d.status === 'online');
          if (onlineDev && !list.find((d: any) => d.deviceId === selectedDeviceId && d.status === 'online')) {
            setSelectedDeviceId(onlineDev.deviceId);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao listar dispositivos:', err);
    }
  };

  const fetchDeviceData = async (targetId = selectedDeviceId) => {
    try {
      const res = await fetch(`${API_BASE}/devices/${targetId}`, {
        headers: { Authorization: AUTH_HEADER },
      });
      if (res.ok) {
        const data = await res.json();
        setDevice(data);
      }
    } catch (err) {
      console.error('Erro ao buscar dispositivo:', err);
    }
  };

  const fetchHistory = async (targetId = selectedDeviceId) => {
    try {
      const res = await fetch(`${API_BASE}/devices/${targetId}/history?limit=100`, {
        headers: { Authorization: AUTH_HEADER },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch(`${API_BASE}/devices/${selectedDeviceId}/history/export`, {
        headers: { Authorization: AUTH_HEADER },
      });
      if (!res.ok) throw new Error('Erro ao exportar CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `telemetria-${selectedDeviceId}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Falha no download do CSV:', err);
      alert('Erro ao exportar o relatório CSV.');
    }
  };

  const handleToggleActuator = async () => {
    if (!device) return;
    const currentState = device.state?.actuatorState || false;
    const newState = !currentState;

    setIsLoadingCommand(true);
    try {
      const res = await fetch(`${API_BASE}/devices/${selectedDeviceId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: AUTH_HEADER,
        },
        body: JSON.stringify({ action: 'set', target: 'led', state: newState, value: newState }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        alert(`✅ Comando confirmado com sucesso pelo ESP32 (ACK/State)! Atuador: ${newState ? 'LIGADO' : 'DESLIGADO'}`);
        fetchDeviceData();
      } else {
        alert(`❌ Falha no envio: ${result.message || 'Timeout de resposta ACK do dispositivo.'}`);
      }
    } catch {
      alert('❌ Erro de conexão com o Backend.');
    } finally {
      setIsLoadingCommand(false);
    }
  };

  useEffect(() => {
    fetchDeviceList();
    fetchDeviceData();
    fetchHistory();
    const interval = setInterval(() => {
      fetchDeviceList();
      fetchDeviceData();
      fetchHistory();
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedDeviceId]);

  const state = device?.state;
  const temp = state?.temp || 0;
  const humidity = state?.humidity || 0;
  const noise = state?.noiseLevel || 0;
  const lux = state?.lux;
  const actuatorState = state?.actuatorState || false;
  const alerts = state?.alerts || [];
  const lcdText = state?.lcdText || 'Ambiente OK - Condicoes ideais';

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌡️</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
            Alerta de Temperatura & Saúde IoT
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {availableDevices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {availableDevices.map((id) => (
                <option key={id} value={id}>
                  {id} {id === 'esp32_temp' ? '(Padrão IFMG)' : ''}
                </option>
              ))}
            </select>
          )}
          <DeviceBadge status={device?.status || 'offline'} lastSeen={device?.lastSeen} />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Temperatura"
            value={temp.toFixed(1)}
            unit="°C"
            subtitle={temp > 30 ? '🔥 Alta Temperatura - Ativar Ar' : '✅ Temperatura Normal'}
            colorClass={temp > 30 ? 'text-rose-500' : 'text-emerald-400'}
          />

          <MetricCard
            title="Umidade Relativa"
            value={humidity.toFixed(1)}
            unit="%"
            subtitle={humidity < 40 ? '⚠️ Baixa Umidade - Manter Hidratação' : '✅ Umidade Confortável'}
            colorClass={humidity < 40 ? 'text-amber-400' : 'text-sky-400'}
          />

          <MetricCard
            title="Nível de Ruído"
            value={noise}
            unit="dB"
            subtitle={noise > 75 ? '🔊 Ruído Alto - Manter Silêncio' : '✅ Ambiente Silencioso'}
            colorClass={noise > 75 ? 'text-purple-400' : 'text-amber-400'}
          />

          <MetricCard
            title="Luminosidade"
            value={lux !== undefined ? lux.toFixed(0) : '--'}
            unit="lx"
            subtitle={getLuminosityEvaluation(lux).subtitle}
            colorClass={getLuminosityEvaluation(lux).colorClass}
          />
        </div>

        {/* Simulador ST7789 */}
        <ST7789Display
          temp={temp}
          humidity={humidity}
          noise={noise}
          actuatorState={actuatorState}
          alertText={lcdText}
          hasAlert={alerts.length > 0 && alerts[0] !== 'NONE'}
        />

        {/* Controle do Atuador */}
        <ActuatorControl
          actuatorState={actuatorState}
          onToggle={handleToggleActuator}
          isLoading={isLoadingCommand}
        />

        {/* Gráfico Temporal Interativo das 4 Variáveis */}
        <HistoryChart history={history} />

        {/* Tabela de Histórico */}
        <HistoryTable history={history} onExportCSV={handleExportCSV} />
      </main>
    </div>
  );
}

export default App;
