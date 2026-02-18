import React from 'react';

const ExportInfo = ({ statusExterno }) => {
  if (!statusExterno) return null;

  const isLoading = statusExterno.type === 'Loading';
  const isSuccess = statusExterno.type === 'Success';
  const isError = statusExterno.type === 'error';

  return (
    <div className={`
      p-6 bg-white rounded-xl shadow-2xl border
      transition-all duration-300 ease-out
      ${isLoading ? 'border-indigo-200 bg-gradient-to-br from-white to-indigo-50' : ''}
      ${isSuccess ? 'border-green-200 bg-gradient-to-br from-white to-green-50' : ''}
      ${isError ? 'border-red-200 bg-gradient-to-br from-white to-red-50' : ''}
      space-y-4 min-w-[320px]
    `}>
      
      {/* Header com ícone e título */}
      <div className="flex items-center gap-3">
        {isLoading ? (
          <div className="relative w-8 h-8">
            {/* Spinner externo */}
            <svg 
              className="absolute inset-0 animate-spin" 
              fill="none" 
              viewBox="0 0 24 24"
              style={{ animationDuration: '2s' }}
            >
              <circle 
                className="opacity-20" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="2"
                color="rgb(79, 70, 229)"
              />
              <path 
                className="opacity-100" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                color="rgb(79, 70, 229)"
              />
            </svg>

            {/* Pontos animados adicionais */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
            </div>
          </div>
        ) : isSuccess ? (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        ) : (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        <h2 className={`text-lg font-bold transition-colors duration-300 ${
          isLoading ? 'text-indigo-700' :
          isSuccess ? 'text-green-700' :
          'text-red-700'
        }`}>
          {isLoading ? 'A processar...' : isSuccess ? 'Sucesso!' : 'Erro'}
        </h2>
      </div>

      {/* Mensagem com animação */}
      <div className={`
        p-4 rounded-lg text-sm font-medium transition-all duration-300
        ${isLoading ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : ''}
        ${isSuccess ? 'bg-green-50 text-green-700 border border-green-200' : ''}
        ${isError ? 'bg-red-50 text-red-700 border border-red-200' : ''}
        ${isLoading ? 'animate-pulse' : 'animate-fade-in'}
      `}>
        {statusExterno.msg}
      </div>

      {/* Progress bar animada durante loading */}
      {isLoading && (
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-400 via-indigo-600 to-indigo-400 rounded-full"
            style={{
              animation: 'shimmer 2s infinite',
              backgroundSize: '200% 100%'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ExportInfo;

{/* Adiciona as animações globais */}
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`;
document.head.appendChild(style);