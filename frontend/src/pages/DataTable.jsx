import React, { useState, useCallback, useEffect } from 'react';
import { Form, Input, Drawer } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined, 
  EditOutlined,
  SyncOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchPost } from "utils/fetch";
import { RefreshIcon } from "components/Icons";
import { RangeDateField } from 'components/FormFields';
import { DATE_FORMAT, DATETIME_FORMAT } from "config";

/**
 * Componente de Tabela ReutilizÃ¡vel com Filtros e PaginaÃ§Ã£o
 */
const DataTable = ({
  columns = [],
  apiConfig = {},
  filterFields = [],
  onRowEdit,
  toolbarButtons = null,
  title = "Registos",
  pageSize = 20,
  defaultSort = [],
  rowClassName,
  stickyColumns = { left: 0, right: 0 },
  openNotification
}) => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [formFilter] = Form.useForm();

  // FunÃ§Ã£o principal de fetch de dados
  const fetchData = useCallback(async (page = 1, filtersToUse = {}) => {
    setIsLoading(true);
    try {
      const filterPayload = { tstamp: Date.now() };

      // Processar filtros dinamicamente
      Object.keys(filtersToUse).forEach(key => {
        const value = filtersToUse[key];
        
        // Filtro de data
        if (key === 'fdata' && Array.isArray(value) && value.length === 2) {
          let startDate, endDate;
          
          // Se for string, usa diretamente
          if (typeof value[0] === 'string') {
            startDate = value[0];
            endDate = value[1];
          } 
          // Se for objeto dayjs, converte
          else if (value[0] && value[0].format) {
            startDate = value[0].format(DATE_FORMAT);
            endDate = value[1].format(DATE_FORMAT);
          }
          
          // Adiciona ao payload no formato que o backend espera
          if (startDate && endDate) {
            filterPayload.fdata = [
              `>=${startDate} 00:00:00`,
              `<=${endDate} 23:59:59`
            ];
          }
        }
        // Filtros de texto
        else if (value && typeof value === 'string') {
          filterPayload[key] = value.includes('%') ? value : `%${value}%`;
        }
        // Outros filtros
        else if (value !== undefined && value !== null && value !== '') {
          filterPayload[key] = value;
        }
      });

      console.log('ðŸ" Filtros processados para DataTable:', filterPayload);

      const response = await fetchPost({
        url: apiConfig.url,
        withCredentials: true,
        parameters: { method: apiConfig.method },
        filter: filterPayload,
        pagination: {
          enabled: true,
          page: page,
          pageSize: pageSize
        },
        sort: defaultSort
      });

      if (response.data.status === "success") {
        setRows(response.data.rows || []);
        setTotal(response.data.total || 0);
        setCurrentPage(page);
      } else {
        openNotification?.("error", "top", "Erro", response.data.title || "Erro ao carregar dados");
      }
    } catch (error) {
      console.error("Erro na API:", error);
      openNotification?.("error", "top", "Erro", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, apiConfig, defaultSort, openNotification]);

  // Aplicar filtros
  const handleApplyFilters = (values) => {
    const processedValues = { ...values };
    
    console.log('ðŸ"¥ Valores do Form antes de processar:', values);
    
    // Processar datas - se for objeto do RangeDateField, extrair formatted
    if (values.fdata && typeof values.fdata === 'object' && values.fdata.formatted) {
      const { startValue, endValue } = values.fdata.formatted;
      if (startValue && endValue) {
        processedValues.fdata = [startValue, endValue];
      } else {
        processedValues.fdata = undefined;
      }
    }
    // Se jÃ¡ for array, mantÃ©m
    else if (Array.isArray(values.fdata) && values.fdata.length === 2) {
      processedValues.fdata = values.fdata;
    }
    
    console.log('ðŸ"¤ Valores do Form apÃ³s processar:', processedValues);
    
    // ðŸ"' IMPORTANTE: Guardar filtros NO ESTADO
    setActiveFilters(processedValues);
    
    setCurrentPage(1);
    // Passar os filtros processados diretamente
    fetchData(1, processedValues);
    setShowFilters(false);
  };

  // Limpar filtros
  const handleClearFilters = () => {
    formFilter.resetFields();
    const emptyFilters = {};
    setActiveFilters(emptyFilters);
    setCurrentPage(1);
    fetchData(1, emptyFilters);
  };

  // NavegaÃ§Ã£o
  const handleNextPage = () => {
    if ((currentPage * pageSize) < total) {
      fetchData(currentPage + 1, activeFilters);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchData(currentPage - 1, activeFilters);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchData(1, {});
  }, []);

  // Contar filtros ativos
  const activeFilterCount = Object.keys(activeFilters).filter(key => {
    const val = activeFilters[key];
    return val && val !== '' && (!Array.isArray(val) || val.length > 0);
  }).length;

  // Renderizar cÃ©lula
  const renderCell = (column, row, rowIndex) => {
    if (column.render) {
      return column.render(row[column.dataIndex], row, rowIndex);
    }
    return row[column.dataIndex];
  };

  // ðŸ"' IMPORTANTE: Renderizar toolbarButtons com filtros actuais
  const renderToolbarButtons = () => {
    if (!toolbarButtons) return null;
    
    if (typeof toolbarButtons === 'function') {
      console.log('ðŸ"¨ Renderizando toolbarButtons com activeFilters:', activeFilters);
      return toolbarButtons(activeFilters);
    }
    return toolbarButtons;
  };

  return (
    <div className="flex flex-col h-full">
      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* BotÃ£o de Filtros */}
          {filterFields.length > 0 && (
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeFilterCount > 0 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FilterOutlined /> 
              Filtros
              {activeFilterCount > 0 && (
                <span className="bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-black">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* BotÃµes customizados */}
          {renderToolbarButtons()}
        </div>
      </div>

      {/* PAINEL DE FILTROS */}
      {showFilters && filterFields.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-4">
          <Form 
            form={formFilter} 
            layout="inline" 
            onFinish={handleApplyFilters}
            initialValues={activeFilters}
            className="flex flex-wrap gap-3 items-end"
          >
            {filterFields.map(field => (
              <Form.Item 
                key={field.name} 
                name={field.name} 
                label={field.label} 
                className="mb-0"
              >
                {field.component || <Input placeholder={field.placeholder} size="middle" style={{ width: field.width || 200 }} />}
              </Form.Item>
            ))}
            
            <div className="flex gap-2">
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-all flex items-center gap-2"
              >
                <SearchOutlined /> Aplicar
              </button>
              
              <button 
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold transition-all flex items-center gap-2"
              >
                <ClearOutlined /> Limpar
              </button>
            </div>
          </Form>
        </div>
      )}

      {/* TABELA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4 flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((col, idx) => (
                  <th 
                    key={idx}
                    className={`px-4 py-4 font-bold text-xs uppercase text-gray-500 ${
                      col.sticky ? 'sticky bg-gray-50 z-10' : ''
                    } ${col.className || ''}`}
                    style={col.style}
                  >
                    {col.title}
                  </th>
                ))}
                {onRowEdit && (
                  <th className="px-4 py-4 font-bold text-xs uppercase text-gray-500 text-right">Ação</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + (onRowEdit ? 1 : 0)} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshIcon className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="text-gray-500 font-medium">A carregar registos...</span>
                    </div>
                  </td>
                </tr>
              ) : rows && rows.length > 0 ? (
                rows.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className={rowClassName ? rowClassName(row, idx) : "hover:bg-blue-50/30 transition-colors group"}
                  >
                    {columns.map((col, colIdx) => (
                      <td 
                        key={colIdx}
                        className={`px-4 py-3 ${
                          col.sticky ? 'sticky bg-white group-hover:bg-blue-50/30 shadow-sm' : ''
                        } ${col.cellClassName || ''}`}
                        style={col.cellStyle}
                      >
                        {renderCell(col, row, idx)}
                      </td>
                    ))}
                    {onRowEdit && (
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => onRowEdit(row)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <EditOutlined />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + (onRowEdit ? 1 : 0)} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <SearchOutlined className="text-4xl text-gray-300" />
                      <span className="text-gray-500 font-medium">
                        {activeFilterCount > 0 
                          ? 'Nenhum registo encontrado com os filtros aplicados' 
                          : 'Nenhum registo encontrado'
                        }
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINAÇÃO */}
        <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Total: {total} registos
            </span>
            {activeFilterCount > 0 && (
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                ({activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''} ativo{activeFilterCount > 1 ? 's' : ''})
              </span>
            )}
          </div>
          <div className="flex gap-1 items-center">
            <button 
              onClick={handlePreviousPage} 
              disabled={currentPage === 1 || isLoading} 
              className="px-4 py-2 bg-white border rounded text-xs font-bold hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-xs font-bold text-gray-600">
              Página {currentPage} de {Math.ceil(total / pageSize) || 1}
            </span>
            <button 
              onClick={handleNextPage} 
              disabled={(currentPage * pageSize) >= total || isLoading} 
              className="px-4 py-2 bg-white border rounded text-xs font-bold hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;