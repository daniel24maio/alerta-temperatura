import React from 'react';

interface ActuatorControlProps {
  actuatorState: boolean;
  onToggle: () => void;
  isLoading: boolean;
}

export const ActuatorControl: React.FC<ActuatorControlProps> = ({
  actuatorState,
  onToggle,
  isLoading,
}) => {
  return (
    <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
      <div>
        <h3 className="text-base font-bold text-slate-100 mb-1">
          Controle Remoto do Atuador (Cooler / Relé / LED)
        </h3>
        <p className="text-xs text-slate-400">
          Envia comando MQTT via API REST e aguarda confirmação de resposta ACK do ESP32.
        </p>
      </div>

      <button
        onClick={onToggle}
        disabled={isLoading}
        className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg flex items-center gap-2 ${
          actuatorState
            ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-600/30'
            : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/30'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Enviando & Aguardando ACK...</span>
          </>
        ) : (
          <>
            <span>⚡</span>
            <span>{actuatorState ? 'Desligar Atuador' : 'Ligar Atuador'}</span>
          </>
        )}
      </button>
    </div>
  );
};
