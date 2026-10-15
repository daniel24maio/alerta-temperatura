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
    recordedAt?: string;
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
  const [selectedDate, setSelectedDate] = useState<string>('');
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

  const fetchHistory = async (targetId = selectedDeviceId, dateFilter = selectedDate) => {
    try {
      const url = `${API_BASE}/devices/${targetId}/history?limit=2000${dateFilter ? `&date=${dateFilter}` : ''}`;
      const res = await fetch(url, {
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
      const url = `${API_BASE}/devices/${selectedDeviceId}/history/export?limit=5000${selectedDate ? `&date=${selectedDate}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: AUTH_HEADER },
      });
      if (!res.ok) throw new Error('Erro ao exportar CSV');
      const blob = await res.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      const dateSuffix = selectedDate ? `-${selectedDate}` : `-${new Date().toISOString().slice(0, 10)}`;
      a.download = `telemetria-${selectedDeviceId}${dateSuffix}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
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
    fetchHistory(selectedDeviceId, selectedDate);
    const interval = setInterval(() => {
      fetchDeviceList();
      fetchDeviceData();
      fetchHistory(selectedDeviceId, selectedDate);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedDeviceId, selectedDate]);

  const state = device?.state;
  const temp = state?.temp || 0;
  const humidity = state?.humidity || 0;
  const noise = state?.noiseLevel || 0;
  const lux = state?.lux;
  const actuatorState = state?.actuatorState || false;
  const alerts = state?.alerts || [];

  // Avaliação de Conformidade do Ambiente: reflete no status do ambiente somente o item fora da conformidade
  const nonConformingItems: string[] = [];
  if (temp > 30) nonConformingItems.push('Temperatura');
  if (humidity < 40) nonConformingItems.push('Umidade');
  if (noise > 75) nonConformingItems.push('Ruído');
  if (lux !== undefined && lux > 0 && (lux < 100 || lux > 1500)) {
    nonConformingItems.push('Luminosidade');
  }

  const isEnvironmentConform = nonConformingItems.length === 0;
  // Quando algum dos índices estiver fora de conformidade, o atuador é ligado
  const effectiveActuatorState = !isEnvironmentConform ? true : actuatorState;

  const environmentStatusText = isEnvironmentConform
    ? 'Ambiente em Conformidade'
    : `${nonConformingItems.length === 1 ? 'Item fora da conformidade' : 'Itens fora da conformidade'}: ${nonConformingItems.join(', ')}`;
  const displayLcdText = isEnvironmentConform
    ? 'AMBIENTE EM CONFORMIDADE'
    : `FORA DE CONFORMIDADE: ${nonConformingItems.join(', ').toUpperCase()}`;

  const telemetryTimestamp = state?.recordedAt || device?.lastSeen;
  const formattedTelemetryDate = telemetryTimestamp
    ? `${new Date(telemetryTimestamp).toLocaleDateString('pt-BR')} às ${new Date(telemetryTimestamp).toLocaleTimeString('pt-BR')}`
    : '--';

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
          {telemetryTimestamp && (
            <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs text-slate-300 shadow-sm">
              <span className="text-sky-400">📅</span>
              <span>
                Telemetria aferida em:{' '}
                <strong className="text-slate-100 font-mono">{formattedTelemetryDate}</strong>
              </span>
            </div>
          )}
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
        {/* Painel de Status do Ambiente */}
        <div
          className={`rounded-2xl p-5 border transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl ${
            isEnvironmentConform
              ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/70 text-rose-200 shadow-rose-950/40'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-3.5 rounded-xl text-3xl flex items-center justify-center shadow-md ${
                isEnvironmentConform
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
              }`}
            >
              {isEnvironmentConform ? '🌿' : '⚠️'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Status do Ambiente
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${
                    isEnvironmentConform
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                  }`}
                >
                  {isEnvironmentConform ? 'EM CONFORMIDADE' : 'CONDIÇÃO ANORMAL'}
                </span>
              </div>
              <p
                className={`text-lg md:text-xl font-bold mt-1 tracking-tight ${
                  isEnvironmentConform ? 'text-emerald-400' : 'text-rose-300'
                }`}
              >
                {environmentStatusText}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEnvironmentConform
                  ? 'Todos os sensores operando dentro dos parâmetros ideais de conforto e saúde.'
                  : 'Apenas os parâmetros assinalados acima demandam intervenção ou atenção corretiva.'}
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span>🕒</span>
                  <span>Data da telemetria aferida:</span>
                </span>
                <span className="font-mono font-bold text-slate-100 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
                  {formattedTelemetryDate}
                </span>
                <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded">
                  Tempo Real (MQTT)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            {isEnvironmentConform ? (
              <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-600/40 px-3.5 py-2 rounded-xl font-medium flex items-center gap-1.5">
                <span>✅</span> Condições ideais no ambiente
              </span>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex flex-wrap gap-2">
                  {nonConformingItems.map((item) => (
                    <span
                      key={item}
                      className="bg-rose-900/80 text-rose-100 border border-rose-500/60 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>❌</span> {item} fora da conformidade
                    </span>
                  ))}
                </div>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <span>⚡</span> Atuador LIGADO (Automático)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Temperatura"
            value={temp.toFixed(1)}
            unit="°C"
            subtitle={temp > 30 ? '⚠️ Fora da Conformidade (>30°C)' : '✅ Em Conformidade (≤30°C)'}
            colorClass={temp > 30 ? 'text-rose-500' : 'text-emerald-400'}
          />

          <MetricCard
            title="Umidade Relativa"
            value={humidity.toFixed(1)}
            unit="%"
            subtitle={humidity < 40 ? '⚠️ Fora da Conformidade (<40%)' : '✅ Em Conformidade (≥40%)'}
            colorClass={humidity < 40 ? 'text-amber-400' : 'text-sky-400'}
          />

          <MetricCard
            title="Nível de Ruído"
            value={noise}
            unit="dB"
            subtitle={noise > 75 ? '⚠️ Fora da Conformidade (>75 dB)' : '✅ Em Conformidade (≤75 dB)'}
            colorClass={noise > 75 ? 'text-purple-400' : 'text-emerald-400'}
          />

          <MetricCard
            title="Luminosidade"
            value={lux !== undefined ? lux.toFixed(0) : '--'}
            unit="lx"
            subtitle={
              lux !== undefined && lux > 0 && (lux < 100 || lux > 1500)
                ? '⚠️ Fora da Conformidade (NHO 11)'
                : getLuminosityEvaluation(lux).subtitle
            }
            colorClass={
              lux !== undefined && lux > 0 && (lux < 100 || lux > 1500)
                ? 'text-rose-400'
                : getLuminosityEvaluation(lux).colorClass
            }
          />
        </div>

        {/* Simulador ST7789 */}
        <ST7789Display
          temp={temp}
          humidity={humidity}
          noise={noise}
          actuatorState={effectiveActuatorState}
          alertText={displayLcdText}
          hasAlert={!isEnvironmentConform}
        />

        {/* Controle do Atuador */}
        <ActuatorControl
          actuatorState={effectiveActuatorState}
          onToggle={handleToggleActuator}
          isLoading={isLoadingCommand}
        />

        {/* Gráfico Temporal Interativo das 4 Variáveis */}
        <HistoryChart history={history} />

        {/* Tabela de Histórico com Paginação a cada 50 leituras e Filtro de Datas Anteriores */}
        <HistoryTable
          history={history}
          selectedDate={selectedDate}
          onDateChange={(newDate) => {
            setSelectedDate(newDate);
            fetchHistory(selectedDeviceId, newDate);
          }}
          onExportCSV={handleExportCSV}
        />
      </main>
    </div>
  );
}

export default App;
