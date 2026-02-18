import React, { useState, useRef, useEffect } from "react";
import { API_URL } from "config";
import dayjs from "dayjs";
import { DATE_FORMAT } from "config";
import { fetchPost } from "utils/fetch";
import ExportInfo from "./ExportInfo";

// Ícone de Download (mantido)
const DownloadIcon = (props) => (
  <svg width={20} height={20} viewBox="0 0 24 24" stroke="currentColor" fill="none" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" />
    <polyline points="7 10 12 15 17 10" strokeWidth="2" />
    <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" />
  </svg>
);

// Novos ícones para as opções do menu (mantidos)
const NormalExportIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/>
    <polyline points="14,2 14,8 20,8" strokeWidth="2"/>
    <rect x="3" y="12" width="4" height="4" strokeWidth="2"/>
    <rect x="7" y="12" width="4" height="4" strokeWidth="2"/>
  </svg>
);

const CleanExportIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M3 6h18M3 12h18M3 18h18" strokeWidth="2"/>
  </svg>
);

const DepartmentExportIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeWidth="2"/>
  </svg>
);

export default function DownloadReport({
  cols,
  filters = {},
  sort = [
    { column: "dts", direction: "DESC" },
    { column: "num", direction: "ASC" }
  ],
  filename = "picagens-export.xlsx",
  apiUrl = `${API_URL}/rponto/excel/`,
  pagination = {},
  label = "Exportar Excel",
  className = "",
  buttonClass = ""
}) {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const dropdownRef = useRef(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const prepareFilterData = () => {
    console.log('🔍 DownloadReport - Filters recebidos:', filters);
    
    let startDate = null;
    let endDate = null;

    // Extrair datas do fdata (array)
    if (filters?.fdata && Array.isArray(filters.fdata) && filters.fdata.length === 2) {
      const first = filters.fdata[0];
      const second = filters.fdata[1];
      
      // Se for string
      if (typeof first === 'string') {
        startDate = first.split(' ')[0];
        endDate = second.split(' ')[0];
      } 
      // Se for dayjs
      else if (first && first.format) {
        startDate = first.format(DATE_FORMAT);
        endDate = second.format(DATE_FORMAT);
      }
    }

    // Fallback
    if (!startDate || !endDate) {
      startDate = dayjs().subtract(30, 'days').format(DATE_FORMAT);
      endDate = dayjs().format(DATE_FORMAT);
    }

    const result = {
      fdateFrom: `${startDate} 00:00:00`,
      fdateTo: `${endDate} 23:59:59`,
      fnum: filters?.fnum || ''
    };

    return result;
  };

  const handleExport = async (exportType) => {
    setLoading(true);
    setShowOptions(false);
    setExportStatus({ type: 'Loading', msg: 'A processar...' });
    
    try {
      const finalFilter = prepareFilterData();
      const payload = {
        filter: finalFilter,
        exportType: exportType,  // 'normal', 'department', 'clean'
        sort,
        pagination,
        parameters: {
          export: "excel",
          cols
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

      if (exportType === 'normal' || exportType === 'clean') {
        let downloadFilename = filename; 
        const disposition = response.headers.get('Content-Disposition');
        
        if (disposition && disposition.indexOf('attachment') !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) { 
            downloadFilename = matches[1].replace(/['"]/g, '');
          }
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadFilename; 
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        setExportStatus({ type: 'Success', msg: 'Ficheiro exportado com sucesso!' });
      } else if (exportType === 'department') {
        setExportStatus({ 
          type: 'Success', 
          msg: 'Exportação iniciada! Os ficheiros serão atualizados na rede em breve.' 
        });
      }
    } catch (err) {
      console.error('Erro na exportação:', err);
      setExportStatus({ type: 'error', msg: `Falha: ${err.message}` });
    } finally {
      setLoading(false);
      setTimeout(() => setExportStatus(null), 5000);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={
          "flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-sm shadow-lg hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none " +
          buttonClass
        }
        disabled={loading}
        onClick={() => setShowOptions(!showOptions)}
      >
        <DownloadIcon className="w-5 h-5" />
        <span>
          {loading ? "A exportar..." : label}
        </span>
        <svg className={`w-4 h-4 transition-transform duration-200 ${showOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {exportStatus && (
        <div className="fixed bottom-10 right-10 z-[9999] animate-bounce-in">
          <ExportInfo statusExterno={exportStatus} />
        </div>
      )}

      {/* ===== MENU DE OPÇÕES MELHORADO - DROPDOWN ABAIXO DO BOTÃO ===== */}
      {showOptions && !loading && (
        <div className="absolute top-full mt-3 left-0 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 min-w-max transform transition-all duration-200 animate-fade-in-up">
          <div className="px-5 py-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800">Escolher Tipo de Exportação</h4>
          </div>
          
          <div className="p-3 space-y-2">
            {/* EXPORTAÇÃO NORMAL */}
            <button
              onClick={() => handleExport('normal')}
              className="group flex items-start gap-3 w-full text-left p-3 rounded-lg border border-blue-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:border-blue-200 transition-all duration-200"
            >
              <div className="flex-shrink-0 mt-0.5">
                <NormalExportIcon className="text-blue-600 group-hover:text-blue-700 transition-colors" />
              </div>
              <div>
                <div className="font-semibold text-blue-600 group-hover:text-blue-700 transition-colors text-sm">Exportação Normal</div>
                <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Turnos formatados e registos por pessoa
                </div>
              </div>
            </button>

            {/* EXPORTAÇÃO SEM FORMATAÇÃO */}
            <button
              onClick={() => handleExport('clean')}
              className="group flex items-start gap-3 w-full text-left p-3 rounded-lg border border-amber-100 hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-100 hover:border-amber-200 transition-all duration-200"
            >
              <div className="flex-shrink-0 mt-0.5">
                <CleanExportIcon className="text-amber-600 group-hover:text-amber-700 transition-colors" />
              </div>
              <div>
                <div className="font-semibold text-amber-600 group-hover:text-amber-700 transition-colors text-sm">Sem Formatação</div>
                <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Tabela normal sem formatação
                </div>
              </div>
            </button>

            {/* EXPORTAÇÃO POR DEPARTAMENTO */}
            <button
              onClick={() => handleExport('department')}
              className="group flex items-start gap-3 w-full text-left p-3 rounded-lg border border-green-100 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:border-green-200 transition-all duration-200"
            >
              <div className="flex-shrink-0 mt-0.5">
                <DepartmentExportIcon className="text-green-600 group-hover:text-green-700 transition-colors" />
              </div>
              <div>
                <div className="font-semibold text-green-600 group-hover:text-green-700 transition-colors text-sm">Por Departamento</div>
                <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Atualiza ficheiros Raw Data em cada pasta de departamento
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}