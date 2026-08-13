import React, { useState, useEffect } from 'react';
import { DeviceBadge } from './components/DeviceBadge';
import { MetricCard } from './components/MetricCard';
import { ST7789Display } from './components/ST7789Display';
import { ActuatorControl } from './components/ActuatorControl';
import { HistoryTable, HistoryItem } from './components/HistoryTable';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_HEADER = 'Basic ' + btoa('admin:admin123');

interface DeviceRecord {
  deviceId: string;
  status: 'online' | 'offline';
  lastSeen: string;
  state?: {
    temp: number;
    humidity: number;
    noiseLevel: number;
    alerts: string[];
    lcdText?: string;
    actuatorState: boolean;
  };
}

export function App() {
  const [device, setDevice] = useState<DeviceRecord | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingCommand, setIsLoadingCommand] = useState(false);

  const fetchDeviceData = async () => {
    try {
      const res = await fetch(`${API_BASE}/devices/esp32-temp-01`, {
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

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/devices/esp32-temp-01/history`, {
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

  const handleToggleActuator = async () => {
    if (!device) return;
    const currentState = device.state?.actuatorState || false;
    const newState = !currentState;

    setIsLoadingCommand(true);
    try {
      const res = await fetch(`${API_BASE}/devices/esp32-temp-01/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: AUTH_HEADER,
        },
        body: JSON.stringify({ action: 'SET_ACTUATOR', state: newState }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        alert(`✅ Comando confirmado com sucesso pelo ESP32 (ACK)! Atuador: ${newState ? 'LIGADO' : 'DESLIGADO'}`);
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
    fetchDeviceData();
    fetchHistory();
    const interval = setInterval(() => {
      fetchDeviceData();
      fetchHistory();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const state = device?.state;
  const temp = state?.temp || 0;
  const humidity = state?.humidity || 0;
  const noise = state?.noiseLevel || 0;
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

        <DeviceBadge status={device?.status || 'offline'} lastSeen={device?.lastSeen} />
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Tabela de Histórico */}
        <HistoryTable history={history} />
      </main>
    </div>
  );
}

export default App;
