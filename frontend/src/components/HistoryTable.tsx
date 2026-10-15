import React, { useState, useMemo, useEffect } from 'react';

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
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  onExportCSV?: () => void;
}

const ITEMS_PER_PAGE = 50;

export const HistoryTable: React.FC<HistoryTableProps> = ({
  history,
  selectedDate: propSelectedDate,
  onDateChange: propOnDateChange,
  onExportCSV,
}) => {
  // Estado local para suportar modo controlado ou não-controlado
  const [localDate, setLocalDate] = useState<string>(propSelectedDate || '');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const activeDate = propSelectedDate !== undefined ? propSelectedDate : localDate;

  const handleDateChange = (date: string) => {
    setLocalDate(date);
    if (propOnDateChange) {
      propOnDateChange(date);
    }
    setCurrentPage(1);
  };

  // Extrai todas as datas distintas presentes no histórico para filtros rápidos em 1 clique
  const distinctDates = useMemo(() => {
    if (!history || history.length === 0) return [];
    const dateCounts = new Map<string, number>();

    for (const item of history) {
      if (item.recordedAt) {
        const d = new Date(item.recordedAt);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const key = `${y}-${m}-${day}`;
          dateCounts.set(key, (dateCounts.get(key) || 0) + 1);
        }
      }
    }

    return Array.from(dateCounts.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateStr, count]) => ({
        date: dateStr,
        count,
        label: new Date(`${dateStr}T12:00:00`).toLocaleDateString('pt-BR'),
      }));
  }, [history]);

  // Filtra as leituras pela data selecionada (caso haja filtro ativo)
  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (!activeDate) return history;

    return history.filter((item) => {
      if (!item.recordedAt) return false;
      const d = new Date(item.recordedAt);
      if (isNaN(d.getTime())) return false;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const itemLocal = `${y}-${m}-${day}`;
      const itemUtc = item.recordedAt.slice(0, 10);
      return itemLocal === activeDate || itemUtc === activeDate;
    });
  }, [history, activeDate]);

  // Paginação a cada 50 leituras
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE));

  // Garante que a página atual seja válida ao mudar filtro ou tamanho
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredHistory.length);
  const currentReadings = filteredHistory.slice(startIndex, endIndex);

  // Geração da lista de páginas visíveis
  const visiblePages = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

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

  const formatDateTime = (recordedAt: string) => {
    if (!recordedAt) return { dateStr: '--/--/----', timeStr: '--:--:--' };
    const d = new Date(recordedAt);
    if (isNaN(d.getTime())) return { dateStr: '--/--/----', timeStr: '--:--:--' };
    return {
      dateStr: d.toLocaleDateString('pt-BR'),
      timeStr: d.toLocaleTimeString('pt-BR'),
    };
  };

  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return (
    <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>📜</span> Histórico de Telemetria Aferida
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Paginação a cada 50 leituras
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registros temporais sincronizados com carimbo de data/hora de aferição via MQTT e Redis
          </p>
        </div>

        {onExportCSV && (
          <button
            onClick={onExportCSV}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold transition-all hover:scale-102 self-start lg:self-auto shadow-sm"
          >
            <span>📥</span> Exportar Relatório ({activeDate ? `Dia ${activeDate}` : 'Completo'}) .CSV
          </button>
        )}
      </div>

      {/* Barra de Filtro de Data e Dias Anteriores */}
      <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mr-1">
            <span>📅</span> Filtrar por Data:
          </label>
          <input
            type="date"
            value={activeDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
          />

          {/* Botões Rápidos de Acesso a Datas */}
          <button
            type="button"
            onClick={() => handleDateChange('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !activeDate
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            Ver Todas ({history.length})
          </button>

          <button
            type="button"
            onClick={() => handleDateChange(getTodayStr())}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeDate === getTodayStr()
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            Hoje
          </button>

          <button
            type="button"
            onClick={() => handleDateChange(getYesterdayStr())}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeDate === getYesterdayStr()
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            Ontem
          </button>

          {activeDate && (
            <button
              type="button"
              onClick={() => handleDateChange('')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-800/40 transition-colors flex items-center gap-1"
              title="Limpar filtro de data"
            >
              <span>✕</span> Limpar Filtro
            </button>
          )}
        </div>

        {/* Datas anteriores detectadas no banco Redis */}
        {distinctDates.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium mr-1 text-[11px] uppercase tracking-wider">
              Dias com telemetria:
            </span>
            {distinctDates.map((item) => {
              const isSelected = activeDate === item.date;
              return (
                <button
                  key={item.date}
                  type="button"
                  onClick={() => handleDateChange(item.date)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                    isSelected
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-400 font-bold shadow-sm'
                      : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
                  }`}
                >
                  {item.label} ({item.count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumo de Leituras e Status do Filtro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2 border-b border-slate-700/40 pb-3">
        <div className="flex items-center gap-2">
          <span>
            {activeDate ? (
              <>
                Filtrando por data:{' '}
                <strong className="text-sky-400">
                  {new Date(`${activeDate}T12:00:00`).toLocaleDateString('pt-BR')}
                </strong>{' '}
                — <span className="text-slate-200">{filteredHistory.length}</span> leituras aferidas
              </>
            ) : (
              <>
                Exibindo registros de todas as datas:{' '}
                <span className="text-slate-200 font-semibold">{filteredHistory.length} leituras no total</span>
              </>
            )}
          </span>
        </div>

        {filteredHistory.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="bg-slate-700/40 px-2.5 py-1 rounded-md font-mono text-slate-300">
              Página <strong className="text-sky-400">{currentPage}</strong> de {totalPages}
            </span>
            <span className="text-slate-400">
              (Leituras {startIndex + 1}–{endIndex})
            </span>
          </div>
        )}
      </div>

      {/* Tabela de Telemetrias */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm font-semibold text-slate-300">
            Nenhuma telemetria encontrada {activeDate ? `para a data ${new Date(`${activeDate}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Tente selecionar outro dia anterior no seletor acima ou clique em "Ver Todas".
          </p>
          {activeDate && (
            <button
              onClick={() => handleDateChange('')}
              className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Ver Todas as Leituras
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-700 text-xs font-semibold uppercase text-slate-300">
                <th className="py-3 px-3.5">#</th>
                <th className="py-3 px-3.5">Data e Hora da Aferição</th>
                <th className="py-3 px-3.5">Temperatura</th>
                <th className="py-3 px-3.5">Umidade</th>
                <th className="py-3 px-3.5">Ruído (dB)</th>
                <th className="py-3 px-3.5">Iluminação (Lux)</th>
                <th className="py-3 px-3.5">Alertas de Conformidade</th>
                <th className="py-3 px-3.5">Atuador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-xs font-medium">
              {currentReadings.map((item, idx) => {
                const readingIndex = startIndex + idx + 1;
                const noiseInfo = getNoiseBadge(item.noiseLevel || 40);
                const luxInfo = getLuxBadge(item.lux);
                const { dateStr, timeStr } = formatDateTime(item.recordedAt);

                return (
                  <tr key={`${item.recordedAt}-${idx}`} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-2.5 px-3.5 text-slate-500 font-mono text-[11px]">
                      {readingIndex}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="flex flex-col font-mono">
                        <span className="text-slate-100 font-bold">{dateStr}</span>
                        <span className="text-slate-400 text-[11px]">{timeStr}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-100">
                      {item.temp !== undefined ? `${item.temp.toFixed(1)} °C` : '--'}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-sky-400">
                      {item.humidity !== undefined ? `${item.humidity.toFixed(1)} %` : '--'}
                    </td>
                    <td className={`py-2.5 px-3.5 font-mono ${noiseInfo.color}`}>
                      {noiseInfo.label}
                    </td>
                    <td className={`py-2.5 px-3.5 font-mono ${luxInfo.color}`}>
                      {luxInfo.label}
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold">
                      {item.alerts && item.alerts.length > 0 ? (
                        <span className="text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/50">
                          {item.alerts.join(', ')}
                        </span>
                      ) : (
                        <span className="text-emerald-400">OK (Conforme)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5">
                      {item.actuatorState ? (
                        <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          ⚡ LIGADO
                        </span>
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
      )}

      {/* Controles de Paginação (a cada 50 leituras) */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-700/50">
          <div className="text-xs text-slate-400">
            Exibindo <span className="font-semibold text-slate-200">{startIndex + 1}</span> a{' '}
            <span className="font-semibold text-slate-200">{endIndex}</span> de{' '}
            <span className="font-semibold text-slate-200">{filteredHistory.length}</span> leituras aferidas
          </div>

          <div className="flex items-center gap-1.5">
            {/* Primeira Página */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Primeira Página"
            >
              ⏮️ Primeira
            </button>

            {/* Página Anterior */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ◀️ Anterior
            </button>

            {/* Números das Páginas */}
            <div className="flex items-center gap-1 mx-1">
              {visiblePages.map((page, index) => {
                if (typeof page === 'string') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-xs text-slate-500">
                      ...
                    </span>
                  );
                }
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-600 text-white ring-2 ring-sky-400 font-bold shadow-md'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Próxima Página */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próxima ▶️
            </button>

            {/* Última Página */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Última Página"
            >
              Última ⏭️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
