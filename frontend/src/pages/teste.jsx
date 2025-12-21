import React, { useState } from 'react';

const TailwindTest = () => {
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('blue');
  const [inputValue, setInputValue] = useState('');

  const colors = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    red: 'bg-red-500 hover:bg-red-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            🎨 Tailwind CSS Test Page
          </h1>
          <p className="text-gray-600">
            Se você vê cores, animações e estilos bonitos, o Tailwind está funcionando! ✨
          </p>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 - Contador */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 transform hover:-translate-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Contador</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                Interativo
              </span>
            </div>
            <div className="text-center">
              <div className="text-6xl font-black text-blue-600 mb-6">
                {count}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCount(count - 1)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform active:scale-95 shadow-md hover:shadow-lg"
                >
                  -
                </button>
                <button
                  onClick={() => setCount(0)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform active:scale-95 shadow-md hover:shadow-lg"
                >
                  Reset
                </button>
                <button
                  onClick={() => setCount(count + 1)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform active:scale-95 shadow-md hover:shadow-lg"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 - Cores */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 transform hover:-translate-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Seletor de Cores</h3>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                Dinâmico
              </span>
            </div>
            <div className="space-y-3">
              {Object.keys(colors).map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-full ${colors[color]} text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform active:scale-95 shadow-md hover:shadow-lg ${
                    selectedColor === color ? 'ring-4 ring-offset-2 ring-gray-400' : ''
                  }`}
                >
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Card 3 - Modal */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 transform hover:-translate-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Modal</h3>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                Overlay
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              Teste o modal com overlay e animações
            </p>
            <button
              onClick={() => setIsOpen(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform active:scale-95 shadow-md hover:shadow-lg"
            >
              Abrir Modal
            </button>
          </div>

        </div>

        {/* Seção de Inputs */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Formulário Interativo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Input de Texto
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Digite algo..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              {inputValue && (
                <p className="mt-2 text-sm text-gray-600">
                  Você digitou: <span className="font-bold text-blue-600">{inputValue}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white">
                <option>Opção 1</option>
                <option>Opção 2</option>
                <option>Opção 3</option>
              </select>
            </div>
          </div>
        </div>

        {/* Badges e Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Badges</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                Blue
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                Green
              </span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                Yellow
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                Red
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                Purple
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Alerts</h3>
            <div className="space-y-3">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-blue-800 text-sm">
                  <span className="font-bold">Info:</span> Mensagem informativa
                </p>
              </div>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-green-800 text-sm">
                  <span className="font-bold">Success:</span> Operação bem-sucedida
                </p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-800 text-sm">
                  <span className="font-bold">Error:</span> Algo deu errado
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Animações */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Animações</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg transform hover:scale-110 transition-transform duration-300 cursor-pointer shadow-lg hover:shadow-2xl">
              <div className="text-center">
                <div className="text-3xl mb-2">🚀</div>
                <p className="font-bold">Hover para Scale</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg transform hover:rotate-6 transition-transform duration-300 cursor-pointer shadow-lg hover:shadow-2xl">
              <div className="text-center">
                <div className="text-3xl mb-2">🎨</div>
                <p className="font-bold">Hover para Rotate</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg animate-pulse cursor-pointer shadow-lg hover:shadow-2xl">
              <div className="text-center">
                <div className="text-3xl mb-2">✨</div>
                <p className="font-bold">Pulse Animation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Spinners */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Loading Spinners</h3>
          <div className="flex justify-around items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Status Final */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-xl p-8 text-white">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-black mb-2">Tailwind CSS está funcionando!</h2>
            <p className="text-green-100">
              Se você vê todos estes elementos estilizados, o Tailwind está configurado corretamente.
            </p>
          </div>
        </div>

      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay Background */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle max-w-lg w-full animate-bounce-in">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h3 className="text-2xl font-bold text-white">Modal Exemplo</h3>
              </div>
              <div className="bg-white px-6 py-6">
                <p className="text-gray-700 mb-4">
                  Este é um modal criado com Tailwind CSS! 🎉
                </p>
                <p className="text-gray-600 text-sm">
                  Perceba o backdrop blur, as animações e o design responsivo.
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 transform active:scale-95"
                >
                  Fechar
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 transform active:scale-95"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TailwindTest;