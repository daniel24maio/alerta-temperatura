import React, { useState, useMemo } from 'react';
import { HistoryItem } from './HistoryTable';

type MetricType = 'temp' | 'humidity' | 'noiseLevel' | 'lux';

interface MetricConfig {
  id: MetricType;
  label: string;
  unit: string;
  icon: string;
  strokeColor: string;
  fillGradientStart: string;
  fillGradientEnd: string;
  referenceLine?: {
    value: number;
    label: string;
    color: string;
  };
}

const METRICS: MetricConfig[] = [
  {
    id: 'temp',
    label: 'Temperatura',
    unit: '°C',
    icon: '🌡️',
    strokeColor: '#f43f5e', // rose-500
    fillGradientStart: 'rgba(244, 63, 94, 0.4)',
    fillGradientEnd: 'rgba(244, 63, 94, 0.02)',
    referenceLine: { value: 30, label: 'Limiar Alerta (30°C)', color: '#fb7185' },
  },
  {
    id: 'humidity',
    label: 'Umidade',
    unit: '%',
    icon: '💧',
    strokeColor: '#38bdf8', // sky-400
    fillGradientStart: 'rgba(56, 189, 248, 0.4)',
    fillGradientEnd: 'rgba(56, 189, 248, 0.02)',
    referenceLine: { value: 40, label: 'Alerta Ar Seco (<40%)', color: '#f59e0b' },
  },
  {
    id: 'noiseLevel',
    label: 'Ruído',
    unit: 'dB',
    icon: '🔊',
    strokeColor: '#fbbf24', // amber-400
    fillGradientStart: 'rgba(251, 191, 36, 0.4)',
    fillGradientEnd: 'rgba(251, 191, 36, 0.02)',
    referenceLine: { value: 65, label: 'Conforto Acústico NBR 10151 (65 dB)', color: '#f87171' },
  },
  {
    id: 'lux',
    label: 'Luminosidade',
    unit: 'lx',
    icon: '💡',
    strokeColor: '#a855f7', // purple-500
    fillGradientStart: 'rgba(168, 85, 247, 0.4)',
    fillGradientEnd: 'rgba(168, 85, 247, 0.02)',
    referenceLine: { value: 300, label: 'Mínimo Escritório NBR 8995-1 (300 lx)', color: '#34d399' },
  },
];

interface HistoryChartProps {
  history: HistoryItem[];
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ history }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('temp');
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    value: number;
    time: string;
  } | null>(null);

  const activeConfig = METRICS.find((m) => m.id === selectedMetric) || METRICS[0];

  // Inverte os pontos para cronologia crescente (da esquerda para direita: passado -> presente)
  const sortedPoints = useMemo(() => {
    return [...history].reverse();
  }, [history]);

  // Extrai valores numéricos válidos da métrica
  const dataPoints = useMemo(() => {
    return sortedPoints.map((item) => {
      const rawVal = item[selectedMetric];
      const val = typeof rawVal === 'number' && !isNaN(rawVal) ? rawVal : 0;
      return {
        value: val,
        time: new Date(item.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        fullDate: item.recordedAt,
      };
    });
  }, [sortedPoints, selectedMetric]);

  // Estatísticas (Mín, Média, Máx, Atual)
  const stats = useMemo(() => {
    if (dataPoints.length === 0) return { min: 0, max: 0, avg: 0, latest: 0 };
    const values = dataPoints.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
    const latest = values[values.length - 1];
    return { min, max, avg, latest };
  }, [dataPoints]);

  if (dataPoints.length === 0) {
    return null;
  }

  // Dimensões do viewBox SVG
  const width = 800;
  const height = 240;
  const paddingX = 45;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;

  // Escalas
  let minY = stats.min;
  let maxY = stats.max;

  // Dá margem para respirar e acomodar referências
  if (activeConfig.referenceLine) {
    minY = Math.min(minY, activeConfig.referenceLine.value);
    maxY = Math.max(maxY, activeConfig.referenceLine.value);
  }

  const rangeY = maxY - minY || 1;
  const yAxisMin = Math.floor(minY - rangeY * 0.15);
  const yAxisMax = Math.ceil(maxY + rangeY * 0.15);
  const totalYRange = yAxisMax - yAxisMin || 1;

  const getX = (index: number) => {
    if (dataPoints.length <= 1) return paddingX + chartWidth / 2;
    return paddingX + (index / (dataPoints.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const ratio = (val - yAxisMin) / totalYRange;
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  // Caminho da Linha e Área SVG
  const pointsString = dataPoints.map((pt, i) => `${getX(i)},${getY(pt.value)}`).join(' ');
  const areaPath = dataPoints.length > 0
    ? `M ${getX(0)},${paddingTop + chartHeight} L ${pointsString} L ${getX(dataPoints.length - 1)},${paddingTop + chartHeight} Z`
    : '';

  // Posição Y da linha de referência
  const refY = activeConfig.referenceLine ? getY(activeConfig.referenceLine.value) : null;

  return (
    <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Cabeçalho com Seleção de Métrica */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>📈</span> Curvas Temporais de Telemetria
          </h3>
          <p className="text-xs text-slate-400">
            Evolução temporal das variáveis coletadas pelo ESP32 ({dataPoints.length} amostras)
          </p>
        </div>

        {/* Abas das 4 Variáveis */}
        <div className="flex flex-wrap gap-1 bg-slate-900/70 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
          {METRICS.map((m) => {
            const isSelected = m.id === selectedMetric;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cartões Rápidos de Estatística */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Último Valor</span>
          <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
            {stats.latest.toFixed(1)} <span className="text-xs font-normal text-slate-400">{activeConfig.unit}</span>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Mínima</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            {stats.min.toFixed(1)} <span className="text-xs font-normal text-slate-400">{activeConfig.unit}</span>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Média</span>
          <div className="text-lg font-bold font-mono text-sky-400 mt-0.5">
            {stats.avg.toFixed(1)} <span className="text-xs font-normal text-slate-400">{activeConfig.unit}</span>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Máxima</span>
          <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
            {stats.max.toFixed(1)} <span className="text-xs font-normal text-slate-400">{activeConfig.unit}</span>
          </div>
        </div>
      </div>

      {/* Área do Gráfico SVG */}
      <div className="relative w-full overflow-hidden bg-slate-900/80 rounded-xl border border-slate-800 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[300px] overflow-visible select-none"
        >
          <defs>
            <linearGradient id={`grad-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeConfig.strokeColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={activeConfig.strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade Horizontais */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const val = yAxisMin + totalYRange * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#64748b"
                  fontFamily="monospace"
                >
                  {val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Linha de Referência Normativa (se houver) */}
          {refY !== null && refY >= paddingTop && refY <= paddingTop + chartHeight && activeConfig.referenceLine && (
            <g>
              <line
                x1={paddingX}
                y1={refY}
                x2={width - paddingX}
                y2={refY}
                stroke={activeConfig.referenceLine.color}
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text
                x={width - paddingX}
                y={refY - 5}
                textAnchor="end"
                fontSize="9"
                fontWeight="bold"
                fill={activeConfig.referenceLine.color}
              >
                {activeConfig.referenceLine.label}
              </text>
            </g>
          )}

          {/* Preenchimento Gradiente da Curva */}
          <path d={areaPath} fill={`url(#grad-${selectedMetric})`} />

          {/* Linha Contínua da Curva */}
          <polyline
            fill="none"
            stroke={activeConfig.strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsString}
          />

          {/* Pontos de Amostragem Interativos */}
          {dataPoints.map((pt, i) => {
            const x = getX(i);
            const y = getY(pt.value);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={dataPoints.length > 30 ? 2 : 3.5}
                fill="#0f172a"
                stroke={activeConfig.strokeColor}
                strokeWidth="2"
                className="cursor-pointer hover:scale-150 transition-transform"
                onMouseEnter={() => setHoveredPoint({ x, y, value: pt.value, time: pt.time })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* Eixo de Tempo (Labels embaixo) */}
          {dataPoints.length > 0 && (
            <>
              <text x={paddingX} y={height - 10} fontSize="10" fill="#64748b" fontFamily="monospace">
                {dataPoints[0].time}
              </text>
              {dataPoints.length > 2 && (
                <text
                  x={paddingX + chartWidth / 2}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                  fontFamily="monospace"
                >
                  {dataPoints[Math.floor(dataPoints.length / 2)].time}
                </text>
              )}
              <text
                x={width - paddingX}
                y={height - 10}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
                fontFamily="monospace"
              >
                {dataPoints[dataPoints.length - 1].time}
              </text>
            </>
          )}

          {/* Tooltip Dinâmico ao passar o mouse */}
          {hoveredPoint && (
            <g transform={`translate(${hoveredPoint.x}, ${hoveredPoint.y})`}>
              <circle r="6" fill={activeConfig.strokeColor} stroke="#ffffff" strokeWidth="2" />
              <g transform="translate(0, -32)">
                <rect
                  x="-45"
                  y="-12"
                  width="90"
                  height="26"
                  rx="6"
                  fill="#0f172a"
                  stroke="#475569"
                  strokeWidth="1"
                />
                <text
                  textAnchor="middle"
                  y="4"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#f8fafc"
                  fontFamily="monospace"
                >
                  {hoveredPoint.value.toFixed(1)} {activeConfig.unit}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
