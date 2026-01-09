import React, { useEffect, useState, useCallback, useContext } from 'react';
import dayjs from 'dayjs';
import { fetch, fetchPost } from "utils/fetch";
import { useSubmitting } from "utils";
import { API_URL, ROOT_URL, FILES_URL, DATE_FORMAT, DATETIME_FORMAT } from "config";
import { useDataAPI } from "utils/useDataAPI";
import { getFilterRangeValues, getFilterValue } from "utils";
import { 
  Button, Form, Input, Modal, Drawer, Image, 
  DatePicker, Space, Typography, Tag 
} from "antd";
import { 
  CameraOutlined, DeleteTwoTone, CaretDownOutlined, 
  CaretUpOutlined, SearchOutlined, SyncOutlined, EditOutlined,
  FilterOutlined, ClearOutlined
} from '@ant-design/icons';
import { BsFillEraserFill } from 'react-icons/bs';
import { useModal } from "react-modal-hook";
import ResponsiveModal from 'components/Modal';
import YScroll from 'components/YScroll';
import { AppContext } from "./App";
import { isRH } from './commons';
import { LayoutContext } from "./GridLayout";
import { Spinner, RefreshIcon, DownloadIcon, AlertIcon, CameraIcon } from "components/Icons";
import { SelectField, Field, RangeDateField, FormContainer, AlertsContainer } from 'components/FormFields';
import DownloadReport from 'components/DownloadReportsV2';


const Pic = ({ path }) => (
  <div className="flex justify-center p-4">
    <Image src={path} className="rounded-lg shadow-lg" style={{ maxHeight: '70vh' }} />
  </div>
);


const Fix = ({ parameters, loadParentData, openNotification }) => {
  const [form] = Form.useForm();
  const [fieldStatus, setFieldStatus] = useState({});
  const [formStatus, setFormStatus] = useState({ error: [], warning: [], info: [], success: [] });
  const submitting = useSubmitting(false);

  const typeList = [{ value: null, label: "" }, { value: "in", label: "Entrada" }, { value: "out", label: "Saída" }];

  useEffect(() => {
    if (!parameters.row) return;
    const vals = {
      ...parameters.row,
      dts: parameters.row.dts ? dayjs(parameters.row.dts).format(DATE_FORMAT) : null,
      ...Object.fromEntries(
        [1,2,3,4,5,6,7,8].map(i => [
          `ss_${String(i).padStart(2, '0')}`, 
          parameters.row[`ss_${String(i).padStart(2, '0')}`] ? dayjs(parameters.row[`ss_${String(i).padStart(2, '0')}`]) : null
        ])
      ),
      ...Object.fromEntries(
        [1,2,3,4,5,6,7,8].map(i => [
          `ty_${String(i).padStart(2, '0')}`, 
          parameters.row[`ty_${String(i).padStart(2, '0')}`] ? parameters.row[`ty_${String(i).padStart(2, '0')}`].trim() : null
        ])
      )
    };
    form.setFieldsValue(vals);
  }, [parameters.row]);

  const onFinish = async () => {
    submitting.trigger();
    let values = form.getFieldsValue(true);
    try {
      const vals = { ...values };
      [1,2,3,4,5,6,7,8].forEach(i => {
        const k = `ss_${String(i).padStart(2, '0')}`;
        if (vals[k]) vals[k] = dayjs(vals[k]).format(DATETIME_FORMAT);
      });

      let response = await fetchPost({ url: `${API_URL}/rponto/sqlp/`, withCredentials: true, parameters: { method: "UpdateRecords", values: vals } });
      if (response.data.status !== "error") {
        openNotification(response.data.status, 'top', "Sucesso", response.data.title);
        loadParentData();
      }
    } catch (e) {
      openNotification("error", 'top', "Erro", e.message);
    } finally { submitting.end(); }
  };

  const erase = (n) => {
    const field = `ss_${String(n).padStart(2, '0')}`;
    const type = `ty_${String(n).padStart(2, '0')}`;
    form.setFieldsValue({ [field]: null, [type]: null });
  };

  return (
    <div className="p-4 bg-white rounded-lg">
      <AlertsContainer fieldStatus={fieldStatus} formStatus={formStatus} portal={false} />
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 p-3 rounded border">
          <Form.Item name="num" label="Número"><Input disabled size="small"/></Form.Item>
          <Form.Item name="nome_colaborador" label="Nome"><Input disabled size="small"/></Form.Item>
          <Form.Item name="dts" label="Data"><Input disabled size="small"/></Form.Item>
        </div>
        
        <div className="space-y-2">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="flex items-center gap-2 group p-1 hover:bg-blue-50/50 rounded transition-colors">
              <span className="text-xs font-bold text-gray-400 w-6">{String(i).padStart(2, '0')}</span>
              <button type="button" onClick={() => erase(i)} className="p-1.5 text-gray-400 hover:text-red-500"><BsFillEraserFill /></button>
              <Form.Item name={`ss_${String(i).padStart(2, '0')}`} className="mb-0 flex-1">
                <DatePicker format={DATETIME_FORMAT} size="small" showTime className="w-full" />
              </Form.Item>
              <Form.Item name={`ty_${String(i).padStart(2, '0')}`} className="mb-0 w-32">
                <SelectField size="small" data={typeList} keyField="value" textField="label" />
              </Form.Item>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-bold transition-all">
            {submitting.state ? <SyncOutlined spin /> : 'Guardar Alterações'}
          </button>
        </div>
      </Form>
    </div>
  );
};

/* --- COMPONENTE BIOMETRIAS --- */
const Biometrias = ({ openNotification }) => {
    const dataAPI = useDataAPI({ payload: { url: `${API_URL}/rponto/sqlp/`, withCredentials: true, parameters: { method: "BiometriasList" }, pagination: { enabled: false }, filter: {}, sort: [] } });
    const submitting = useSubmitting(false);
    const [modalParameters, setModalParameters] = useState({});
    const [showModal, hideModal] = useModal(({ in: open }) => (
      <ResponsiveModal title={modalParameters?.title} onCancel={hideModal} width={modalParameters.width} footer="ref" yScroll><Pic path={modalParameters.path} /></ResponsiveModal>
    ), [modalParameters]);
    useEffect(() => { dataAPI.fetchPost(); }, []);
    const syncAll = async () => {
      submitting.trigger();
      try { await fetchPost({ url: `${API_URL}/rponto/sqlp/`, withCredentials: true, parameters: { method: "Sync" } }); openNotification("success", 'top', "Sincronização", "Dados sincronizados!"); } 
      catch (e) { openNotification("error", 'top', "Erro", e.message); } finally { submitting.end(); }
    };
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{dataAPI.rows?.length || 0} Biometrias</span>
          <button onClick={syncAll} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center gap-2">
            <SyncOutlined spin={submitting.state}/> Sincronizar
          </button>
        </div>
        <YScroll>
          <table className="w-full text-left text-sm border-collapse">
            <tbody className="divide-y divide-gray-100">
                {dataAPI.rows?.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                  <td className="p-3 font-black text-gray-900 w-24 border-r">{r.num}</td>
                  <td className="p-3 text-xs text-gray-500">{dayjs(r.t_stamp).format(DATETIME_FORMAT)}</td>
                  <td className="p-3 text-[10px] font-mono opacity-50">{r.file}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => { setModalParameters({ title: "Visualizar", path: `${FILES_URL}/static/faces/${r.file}`, width: "600px" }); showModal(); }} className="p-2 hover:bg-blue-100 rounded-full text-blue-600 transition-colors"><CameraOutlined /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </YScroll>
      </div>
    );
};

/* --- COMPONENTE REGISTOS INVÁLIDOS --- */
const InvalidRecords = ({ openNotification }) => {
    const [formFilter] = Form.useForm();
    const dataAPI = useDataAPI({ payload: { url: `${API_URL}/rponto/sqlp/`, withCredentials: true, parameters: { method: "InvalidRecordsList" }, pagination: { enabled: false }, filter: { fdata: [`>=${dayjs().format(DATE_FORMAT)}`, `<=${dayjs().format(DATE_FORMAT)}`] } } });
    const rowFn = async (dt) => {
        const _dt = [];
        if (!dt?.rows) return { rows: [] };
        dt.rows.forEach((x, i) => {
            const v = x.filename.replace("../", "").replace("./", "");
            const r = v.split('/');
            if (r.length >= 3) {
                let _f = r[r.length-1].split('.');
                _dt.push({ k: i, name: `${_f[0]}.${_f[1]}`, path: `${FILES_URL}/static/${v}`, num: r.length === 4 ? r[2] : null, type: _f[2] });
            }
        });
        return { rows: _dt };
    };
    useEffect(() => { dataAPI.fetchPost({ rowFn }); }, []);
    return (
        <div className="flex flex-col h-full">
            <div className="p-3 bg-gray-50 border-b">
                <Form form={formFilter} layout="inline" onFinish={(v) => { dataAPI.addFilters({...v, fdata: getFilterRangeValues(v["fdata"]?.formatted)}, true); dataAPI.fetchPost({ rowFn }); }} initialValues={{ fdata: [dayjs(), dayjs()] }}>
                    <Form.Item name="fnum"><Input placeholder="Número" size="small" style={{ width: 70 }} /></Form.Item>
                    <Form.Item name="fdata"><RangeDateField size="small" /></Form.Item>
                    <button type="submit" className="p-1.5 bg-white border rounded hover:bg-gray-100 transition-colors"><SearchOutlined /></button>
                </Form>
            </div>
            <YScroll>
                <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-gray-100">
                        {dataAPI.rows?.map((r) => (
                            <tr key={r.k} className="hover:bg-amber-50/50 group">
                                <td className="p-3 font-bold text-amber-700 w-20">{r.num || "---"}</td>
                                <td className="p-3 text-[10px] font-mono">{r.name}</td>
                                <td className="p-3 text-right">
                                    <Image src={r.path} width={30} className="rounded border group-hover:scale-110 transition-transform" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </YScroll>
        </div>
    );
};

/* --- COMPONENTE PRINCIPAL --- */
export default () => {
    const { auth } = useContext(AppContext);
    const { openNotification } = useContext(LayoutContext);
    const [showBiometrias, setShowBiometrias] = useState(false);
    const [showInvalidRecords, setShowInvalidRecords] = useState(false);
    const [showFix, setShowFix] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    
    const [rows, setRows] = useState([]); // Nome correto do estado
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const pageSize = 20;

    const [activeFilters, setActiveFilters] = useState({});
    const [formFilter] = Form.useForm();

    const fetchRegistos = useCallback(async (page = 1, currentFilters = activeFilters) => {
        setIsLoading(true);
        try {
            const filterPayload = {};
            
            // Mapeia 'num' do formulário para 'fnum' do backend e adiciona wildcards
            if (currentFilters.num) {
                filterPayload.fnum = `%${currentFilters.num}%`;
            }
            
            if (currentFilters.nome_colaborador) {
                filterPayload.fnome = `%${currentFilters.nome_colaborador}%`;
            }

            // Tratamento do range de datas
            if (currentFilters.fdata && currentFilters.fdata.length === 2) {
                filterPayload.fdata = {
                    dts: [
                        dayjs(currentFilters.fdata[0]).startOf('day').format(DATETIME_FORMAT),
                        dayjs(currentFilters.fdata[1]).endOf('day').format(DATETIME_FORMAT)
                    ]
                };
            }

            // Estrutura do payload SEM a chave 'parameters' extra
            const payload = {
                filter: filterPayload,
                pagination: {
                    enabled: true,
                    page: page - 1, // Backend 0-indexed
                    pageSize: pageSize
                },
                sort: [{ column: "dts", direction: "DESC" }]
            };

            const response = await fetchPost({ 
                url: `${API_URL}/RegistosRH/`, 
                parameters: payload 
            });

            if (response.data.status === "success") {
                setRows(response.data.rows); // Antes estavas a usar setRegistos
                setTotal(response.data.total);
                setCurrentPage(page);
            }
        } catch (error) {
            openNotification("error", "top", "Erro ao carregar", error.message);
        } finally {
            setIsLoading(false);
        }
    }, [activeFilters]); // Dependência correta

    // Handlers de interface
    const handleApplyFilters = (values) => {
        setActiveFilters(values);
        setCurrentPage(1);
        fetchRegistos(1, values);
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        formFilter.resetFields();
        setActiveFilters({});
        setCurrentPage(1);
        fetchRegistos(1, {});
    };

    const handleNextPage = () => {
        if ((currentPage * pageSize) < total) {
            fetchRegistos(currentPage + 1, activeFilters);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            fetchRegistos(currentPage - 1, activeFilters);
        }
    };

    useEffect(() => {
        fetchRegistos(1, {});
    }, []);



    const activeFilterCount = Object.keys(activeFilters).filter(key => {
      const val = activeFilters[key];
      return val && val !== '' && (!Array.isArray(val) || val.length > 0);
    }).length;

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="max-w-full mx-auto space-y-4">
                
                {/* TOOLBAR */}
                <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black text-gray-800 tracking-tight">Registo de Picagens</h1>
                        <button 
                            onClick={() => fetchRegistos(currentPage, activeFilters)} 
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            disabled={isLoading}
                        >
                            <RefreshIcon className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* BOTÃO DE FILTROS */}
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

                        {/* BOTÃO DE DOWNLOAD */}
                        <DownloadReport 
                            dataAPI={{ rows, total }}
                            filters={activeFilters}
                            title="Relatório de Picagens"
                        />
                        
                        <button 
                            onClick={() => setShowBiometrias(true)} 
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-black transition-all"
                        >
                            <CameraIcon className="w-4 h-4" /> Biometrias
                        </button>
                        
                        <button 
                            onClick={() => setShowInvalidRecords(true)} 
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-all"
                        >
                            <AlertIcon className="w-4 h-4" /> Inválidos
                        </button>
                    </div>
                </div>

                {/* PAINEL DE FILTROS */}
                {showFilters && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <Form 
                            form={formFilter} 
                            layout="inline" 
                            onFinish={handleApplyFilters}
                            initialValues={activeFilters}
                            className="flex flex-wrap gap-3 items-end"
                        >
                            <Form.Item name="num" label="Número" className="mb-0">
                                <Input placeholder="Ex: 123" size="middle" style={{ width: 120 }} />
                            </Form.Item>
                            
                            <Form.Item name="nome_colaborador" label="Nome" className="mb-0">
                                <Input placeholder="Nome do colaborador" size="middle" style={{ width: 200 }} />
                            </Form.Item>
                            
                            <Form.Item name="fdata" label="Período" className="mb-0">
                                <RangeDateField size="middle" />
                            </Form.Item>
                            
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-4 font-bold text-xs uppercase text-gray-500 sticky left-0 bg-gray-50 z-10 border-r">Colaborador</th>
                                    <th className="px-4 py-4 font-bold text-xs uppercase text-gray-500">Data</th>
                                    {[...Array(8)].map((_, i) => (
                                        <th key={i} className="px-4 py-4 font-bold text-xs uppercase text-gray-500 text-center border-l">Pic.{i+1}</th>
                                    ))}
                                    <th className="px-4 py-4 font-bold text-xs uppercase text-gray-500 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="11" className="p-8 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshIcon className="w-8 h-8 animate-spin text-blue-600" />
                                                <span className="text-gray-500 font-medium">A carregar registos...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : rows && rows.length > 0 ? (
                                  rows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-blue-50/30 border-r shadow-sm">
                                            <div className="font-bold text-gray-900 text-sm leading-tight">{row.nome_colaborador || 'N/A'}</div>
                                            <div className="text-[10px] font-mono text-blue-500 font-bold uppercase">Nº {row.num}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{dayjs(row.dts).format('DD/MM/YYYY')}</td>
                                        {[...Array(8)].map((_, i) => {
                                            const field = `ss_${String(i + 1).padStart(2, '0')}`;
                                            const typeKey = `ty_${String(i + 1).padStart(2, '0')}`;
                                            const type = row[typeKey];
                                            const val = row[field];
                                            return (
                                                <td key={i} className="px-2 py-3 border-l text-center">
                                                    {val && (
                                                        <div className={`inline-block px-2 py-0.5 rounded border-b-2 ${type === 'in' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
                                                            <div className="text-[10px] font-black">{dayjs(val).format('HH:mm')}</div>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 text-right">
                                            <button 
                                                onClick={() => { setSelectedRecord(row); setShowFix(true); }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <EditOutlined />
                                            </button>
                                        </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="11" className="p-8 text-center">
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

            {/* DRAWERS */}
            <Drawer title="Biometrias" width={800} open={showBiometrias} onClose={() => setShowBiometrias(false)} destroyOnClose>
                <Biometrias openNotification={openNotification} />
            </Drawer>
            
            <Drawer title="Registos Inválidos" width={800} open={showInvalidRecords} onClose={() => setShowInvalidRecords(false)} destroyOnClose>
                <InvalidRecords openNotification={openNotification} />
            </Drawer>
            
            {showFix && selectedRecord && (
              <Drawer title="Corrigir Registo" width={600} open={showFix} onClose={() => setShowFix(false)} destroyOnClose>
                  <Fix parameters={{ row: selectedRecord }} loadParentData={() => fetchRegistos(currentPage)} openNotification={openNotification} />
              </Drawer>
            )}
        </div>
    );
};