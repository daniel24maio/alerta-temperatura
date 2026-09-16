import React from 'react';

export interface HistoryItem {
  temp: number;
  humidity: number;
  noiseLevel: number;
  lux?: number;
  alerts?: string[];
  actuatorState: boolean;
  recordedAt: string;
}

interface HistoryTableProps {
  history: HistoryItem[];
  onExportCSV?: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ history, onExportCSV }) => {
  if (!history || history.length === 0) {
    return (
      <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-100">📜 Histórico de Telemetria Recente</h3>
        </div>
        <p className="text-xs text-slate-400 text-center py-6">Nenhum registro encontrado no histórico.</p>
      </div>
    );
  }

  const getNoiseBadge = (db: number) => {
    if (db < 50) return { label: `${db} dB (Silencioso)`, color: 'text-emerald-400' };
    if (db <= 65) return { label: `${db} dB (Moderado)`, color: 'text-amber-400' };
    return { label: `${db} dB (Ruidoso)`, color: 'text-rose-400' };
  };

  const getLuxBadge = (lux: number | undefined) => {
    if (lux === undefined || isNaN(lux)) return { label: '-- lx', color: 'text-slate-400' };
    if (lux < 100) return { label: `${lux.toFixed(0)} lx (Crítico)`, color: 'text-rose-400' };
    if (lux < 300) return { label: `${lux.toFixed(0)} lx (Baixo)`, color: 'text-amber-400' };
    if (lux <= 750) return { label: `${lux.toFixed(0)} lx (Ideal)`, color: 'text-emerald-400 font-semibold' };
    if (lux <= 1500) return { label: `${lux.toFixed(0)} lx (Alto)`, color: 'text-sky-400' };
    return { label: `${lux.toFixed(0)} lx (Ofuscante)`, color: 'text-purple-400' };
  };

  return (
    <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">📜 Histórico de Telemetria Recente</h3>
          <p className="text-xs text-slate-400">Últimos registros sincronizados via MQTT com o Redis</p>
        </div>
        {onExportCSV && (
          <button
            onClick={onExportCSV}
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold transition-colors self-start sm:self-auto"
          >
            <span>📥</span> Exportar Relatório (.CSV)
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-700 text-xs font-semibold uppercase text-slate-400">
              <th className="py-3 px-3">Horário</th>
              <th className="py-3 px-3">Temperatura</th>
              <th className="py-3 px-3">Umidade</th>
              <th className="py-3 px-3">Ruído (dB)</th>
              <th className="py-3 px-3">Iluminação (Lux)</th>
              <th className="py-3 px-3">Alertas</th>
              <th className="py-3 px-3">Atuador</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 text-xs font-medium">
            {history.slice(0, 15).map((item, idx) => {
              const noiseInfo = getNoiseBadge(item.noiseLevel || 45);
              const luxInfo = getLuxBadge(item.lux);

              return (
                <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400 font-mono">
                    {new Date(item.recordedAt).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-100">
                    {item.temp !== undefined ? `${item.temp.toFixed(1)} °C` : '--'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-sky-400">
                    {item.humidity !== undefined ? `${item.humidity.toFixed(1)} %` : '--'}
                  </td>
                  <td className={`py-2.5 px-3 font-mono ${noiseInfo.color}`}>
                    {noiseInfo.label}
                  </td>
                  <td className={`py-2.5 px-3 font-mono ${luxInfo.color}`}>
                    {luxInfo.label}
                  </td>
                  <td className="py-2.5 px-3 font-semibold">
                    {item.alerts && item.alerts.length > 0 ? (
                      <span className="text-rose-400">{item.alerts.join(', ')}</span>
                    ) : (
                      <span className="text-emerald-400">OK</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {item.actuatorState ? (
                      <span className="text-emerald-400 font-bold">⚡ LIGADO</span>
                    ) : (
                      <span className="text-slate-400">⚪ DESLIGADO</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
