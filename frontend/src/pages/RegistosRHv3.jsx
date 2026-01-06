import React, { useEffect, useState, useCallback, useContext } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt';
import { fetchPost } from "utils/fetch";
import { API_URL, FILES_URL, DATE_FORMAT, DATETIME_FORMAT } from "config";
import { 
  SearchIcon, RefreshIcon, XIcon, 
  CameraIcon, EditIcon, AlertCircleIcon 
} from "components/Icons"; 
import { LayoutContext } from "./GridLayout";
import DownloadReport from 'components/DownloadReportsV2';

dayjs.locale('pt');

// Componentes UI Auxiliares
const Spinner = () => <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />;

const Input = ({ value, onChange, placeholder, type = 'text', icon }) => (
  <div className="relative w-full">
    {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">{icon}</div>}
    <input 
      type={type} 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${icon ? 'pl-10' : ''}`} 
    />
  </div>
);

const Button = ({ children, onClick, variant = 'default', loading = false, icon, className = '' }) => {
  const variants = {
    default: "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
    primary: "bg-blue-600 border-transparent text-white hover:bg-blue-700",
    danger: "bg-red-50 border-transparent text-red-600 hover:bg-red-100",
    ghost: "bg-transparent border-transparent text-gray-500 hover:bg-gray-100"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={loading}
      className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
};

const Drawer = ({ isOpen, onClose, title, children }) => (
  <>
    <div className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
    <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-16 flex items-center justify-between px-6 border-b">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><XIcon size={20} /></button>
      </div>
      <div className="p-6 overflow-y-auto h-[calc(100vh-64px)]">{children}</div>
    </div>
  </>
);

export default function RegistosRHv3() {
  const { openNotification } = useContext(LayoutContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    nome: '',
    dataInicio: '', // Vazio para não filtrar por defeito
    dataFim: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  const [showBiometrias, setShowBiometrias] = useState(false);
  const [showInvalidRecords, setShowInvalidRecords] = useState(false);
  const [showFix, setShowFix] = useState(false);
  const [showVisualRecords, setShowVisualRecords] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Carregar dados da tabela
 const loadData = useCallback(async () => {
  setLoading(true);
  try {
    const response = await fetchPost({
      url: `${API_URL}/rh/sqlp/`,
      parameters: {
        filter: {
          method: 'RegistosRH',
          fnum: filters.nome || undefined, 
          fdata: (filters.dataInicio && filters.dataFim) ? 
                  [filters.dataInicio, filters.dataFim] : undefined
        },
        pagination: { page: currentPage, limit: pageSize },
        sort: [{ column: 'tstamp', direction: 'desc' }]
      }
    });

    if (response.data) {
      setData(response.data.rows || []);
      setTotalRecords(response.data.total || 0);
    }
  } catch (e) {
    openNotification("error", "topRight", "Erro", "Erro ao carregar dados.");
  } finally {
    setLoading(false);
  }
}, [filters, currentPage, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-slideUp">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Registos de Picagens V3</h2>
          <p className="text-sm text-gray-500">Gestão centralizada de assiduidade</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* COMPONENTE EXPORTAR CORRIGIDO */}
          <DownloadReport 
            filter={{
                method: 'RegistosRH',
                fnum: filters.nome || undefined,
                fdata: (filters.dataInicio && filters.dataFim) ? [filters.dataInicio, filters.dataFim] : undefined
            }}
            sort={[{ column: 'tstamp', direction: 'DESC' }]}
            filename={`picagens_${dayjs().format('YYYYMMDD')}.xlsx`}
            cols={[
              { label: 'Data/Hora', key: 'tstamp' },
              { label: 'Número', key: 'colaborador_num' },
              { label: 'Nome', key: 'nome' },
              { label: 'Tipo', key: 'tipo' },
              { label: 'Relógio', key: 'relógio_nome' }
            ]}
          />
          
          <Button onClick={() => setShowBiometrias(true)} icon={<RefreshIcon size={16} />}>Sincronizar</Button>
          <Button variant="danger" onClick={() => setShowInvalidRecords(true)} icon={<AlertCircleIcon size={16} />}>Inválidos</Button>
        </div>
      </div>

      {/* Filtros Funcionais */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Pesquisar por Nome</label>
          <Input 
            placeholder="Digite o nome do colaborador..." 
            value={filters.nome}
            onChange={(e) => handleFilterChange('nome', e.target.value)}
            icon={<SearchIcon size={18} />}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Data Início</label>
          <Input 
            type="date" 
            value={filters.dataInicio}
            onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Data Fim</label>
          <Input 
            type="date" 
            value={filters.dataFim}
            onChange={(e) => handleFilterChange('dataFim', e.target.value)}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4 text-center">Tipo</th>
                <th className="px-6 py-4">Equipamento</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center"><Spinner /><p className="mt-2 text-gray-400">A procurar registos...</p></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="5" className="py-20 text-center text-gray-400 font-medium">Sem dados para este período ou filtro.</td></tr>
              ) : data.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-700">{dayjs(row.tstamp).format(DATETIME_FORMAT)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{row.nome}</span>
                      <span className="text-xs text-slate-400">ID: {row.colaborador_num}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${row.tipo === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {row.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{row.relógio_nome || 'Web Portal'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setSelectedRecord(row); setShowVisualRecords(true); }}
                        className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors" title="Ver Foto"
                      >
                        <CameraIcon size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedRecord(row); setShowFix(true); }}
                        className="p-2 text-amber-500 hover:bg-amber-100 rounded-lg transition-colors" title="Editar"
                      >
                        <EditIcon size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between text-slate-600">
          <div className="text-sm">Total: <span className="font-bold">{totalRecords}</span></div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
            <span className="text-xs font-bold bg-white px-3 py-1 border rounded shadow-sm">Pág. {currentPage}</span>
            <Button variant="ghost" onClick={() => setCurrentPage(p => p + 1)} disabled={data.length < pageSize}>Próximo</Button>
          </div>
        </div>
      </div>

      {/* Drawers de Funcionalidade */}
      <Drawer isOpen={showVisualRecords} onClose={() => setShowVisualRecords(false)} title="Evidência Visual">
        {selectedRecord && (
          <div className="space-y-4">
            <div className="aspect-video bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
               <img 
                 src={`${FILES_URL}/${selectedRecord.foto}`} 
                 alt="Snapshot" 
                 className="w-full h-full object-cover" 
                 onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=Imagem+Nao+Disponivel'} 
               />
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-800"><b>Colaborador:</b> {selectedRecord.nome}</p>
              <p className="text-sm text-blue-800"><b>Hora:</b> {dayjs(selectedRecord.tstamp).format(DATETIME_FORMAT)}</p>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer isOpen={showFix} onClose={() => setShowFix(false)} title="Ajustar Registo">
        {selectedRecord && (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm mb-4">
             A editar picagem de <b>{selectedRecord.nome}</b> realizada em {dayjs(selectedRecord.tstamp).format(DATE_FORMAT)}.
          </div>
        )}
        <Button variant="primary" className="w-full" onClick={() => setShowFix(false)}>Guardar Alterações</Button>
      </Drawer>
    </div>
  );
}