import React from 'react';

export interface HistoryItem {
  temp: number;
  humidity: number;
  noiseLevel: number;
  alerts?: string[];
  actuatorState: boolean;
  recordedAt: string;
}

interface HistoryTableProps {
  history: HistoryItem[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-slate-100 mb-4">📜 Histórico de Telemetria Recente</h3>
        <p className="text-xs text-slate-400 text-center py-6">Nenhum registro encontrado no histórico.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-6 shadow-xl overflow-x-auto">
      <h3 className="text-base font-bold text-slate-100 mb-4">📜 Histórico de Telemetria Recente</h3>

      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-slate-700 text-xs font-semibold uppercase text-slate-400">
            <th className="py-3 px-4">Horário</th>
            <th className="py-3 px-4">Temperatura</th>
            <th className="py-3 px-4">Umidade</th>
            <th className="py-3 px-4">Ruído</th>
            <th className="py-3 px-4">Alertas</th>
            <th className="py-3 px-4">Atuador</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50 text-xs font-medium">
          {history.slice(0, 10).map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
              <td className="py-3 px-4 text-slate-400">
                {new Date(item.recordedAt).toLocaleTimeString()}
              </td>
              <td className="py-3 px-4 font-mono font-bold text-slate-100">
                {item.temp?.toFixed(1) || '--'} °C
              </td>
              <td className="py-3 px-4 font-mono text-sky-400">
                {item.humidity?.toFixed(1) || '--'} %
              </td>
              <td className="py-3 px-4 font-mono text-amber-400">
                {item.noiseLevel || '--'} dB
              </td>
              <td className="py-3 px-4 font-semibold">
                {item.alerts && item.alerts.length > 0 ? (
                  <span className="text-rose-400">{item.alerts.join(', ')}</span>
                ) : (
                  <span className="text-emerald-400">OK</span>
                )}
              </td>
              <td className="py-3 px-4">
                {item.actuatorState ? (
                  <span className="text-emerald-400 font-bold">⚡ LIGADO</span>
                ) : (
                  <span className="text-slate-400">⚪ DESLIGADO</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
