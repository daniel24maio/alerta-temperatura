import React from 'react';

interface ST7789DisplayProps {
  temp: number;
  humidity: number;
  noise: number;
  actuatorState: boolean;
  alertText?: string;
  hasAlert: boolean;
}

export const ST7789Display: React.FC<ST7789DisplayProps> = ({
  temp,
  humidity,
  noise,
  actuatorState,
  alertText = 'Ambiente OK - Condicoes ideais',
  hasAlert,
}) => {
  return (
    <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-sky-400 flex items-center gap-2">
          🖥️ Tela do Dispositivo (Display TFT ST7789 IPS SPI 2.25")
        </h3>
        <span className="text-xs text-slate-400 font-mono">76x284 Landscape</span>
      </div>

      <div className="bg-black border-4 border-slate-900 rounded-xl p-4 font-mono shadow-inner min-h-[130px] flex flex-col justify-between gap-3 text-slate-100">
        {/* Linha Superior */}
        <div className="flex justify-between items-center text-sm font-semibold border-b border-slate-800 pb-2">
          <span>
            TEMP: <span className={temp > 30 ? 'text-rose-500 font-bold' : 'text-emerald-400'}>{temp.toFixed(1)}</span>C
          </span>
          <span>
            UMID: <span className="text-sky-400">{humidity.toFixed(1)}</span>%
          </span>
          <span>
            SOM: <span className="text-amber-400">{noise}</span>dB
          </span>
        </div>

        {/* Linha Central */}
        <div className="flex justify-between items-center text-xs text-slate-300">
          <span>NET: <b className="text-emerald-400">OK</b></span>
          <span>MQTT: <b className="text-emerald-400">OK</b></span>
          <span>
            ATUADOR:{' '}
            <b className={actuatorState ? 'text-emerald-400' : 'text-rose-500'}>
              {actuatorState ? 'LIGADO' : 'DESLIG'}
            </b>
          </span>
        </div>

        {/* Faixa de Alerta Inferior */}
        <div
          className={`px-3 py-2 rounded text-xs font-bold uppercase truncate transition-all duration-300 ${
            hasAlert
              ? 'bg-rose-900/90 text-white animate-pulse'
              : 'bg-indigo-950 text-emerald-400'
          }`}
        >
          {alertText}
        </div>
      </div>
    </div>
  );
};
