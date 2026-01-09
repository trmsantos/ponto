import React, { useContext, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Drawer, Input, Image, Form } from 'antd';
import { CameraOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { fetch, fetchPost } from "utils/fetch";
import { useSubmitting } from "utils";
import { API_URL, FILES_URL, DATE_FORMAT, DATETIME_FORMAT } from "config";
import { useDataAPI } from "utils/useDataAPI";
import { getFilterRangeValues } from "utils";
import { useModal } from "react-modal-hook";
import ResponsiveModal from 'components/Modal';
import YScroll from 'components/YScroll';
import { LayoutContext } from "./GridLayout";
import { CameraIcon, AlertIcon } from "components/Icons";
import { RangeDateField } from 'components/FormFields';
import DownloadReport from 'components/DownloadReportsV2';
import DataTable from './DataTable'; // Importar o novo componente

const Pic = ({ path }) => (
  <div className="flex justify-center p-4">
    <Image src={path} className="rounded-lg shadow-lg" style={{ maxHeight: '70vh' }} />
  </div>
);

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




export default () => {
  const { openNotification } = useContext(LayoutContext);
  const [showBiometrias, setShowBiometrias] = useState(false);
  const [showInvalidRecords, setShowInvalidRecords] = useState(false);
  const [showFix, setShowFix] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Definição das colunas da tabela
  const columns = [
    {
      title: 'Nº Colaborador',
      dataIndex: 'num',
      sticky: true,
      className: 'left-0 border-r',
      cellClassName: 'border-r',
      style: { left: 0 },
      render: (val) => <div className="font-bold text-gray-900 text-sm">Nº {val}</div>
    },
    {
      title: 'Colaborador',
      dataIndex: 'nome_colaborador',
      sticky: true,
      className: 'left-0 border-r',
      cellClassName: 'border-r',
      style: { left: 0 },
      render: (val) => <div className="font-bold text-gray-900 text-sm">{val || 'N/A'}</div>
    },
    {
      title: 'Data',
      dataIndex: 'dts',
      render: (val) => <span className="text-sm text-gray-600 whitespace-nowrap">{dayjs(val).format('DD/MM/YYYY')}</span>
    },
    // Picagens 1-8
    ...[...Array(8)].map((_, i) => ({
      title: `Pic.${i + 1}`,
      dataIndex: `ss_${String(i + 1).padStart(2, '0')}`,
      className: 'text-center border-l',
      cellClassName: 'border-l text-center',
      render: (val, row) => {
        const typeKey = `ty_${String(i + 1).padStart(2, '0')}`;
        const type = row[typeKey]?.trim().toLowerCase();
        return val ? (
          <div className={`inline-block px-2 py-1 rounded-full font-bold text-white text-xs ${
            type === 'in' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {dayjs(val).format('HH:mm')}
          </div>
        ) : null;
      }
    }))
  ];

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
  };

  // Definição dos campos de filtro
  const filterFields = [
    {
      name: 'fnum',
      label: 'Número',
      placeholder: 'Ex: 123',
      component: <Input placeholder="Ex: 123" size="middle" style={{ width: 120 }} />
    },
    {
      name: 'fdata',
      label: 'Período',
      component: <RangeDateField size="middle" />
    }
  ];

  const apiConfig = {
    url: `${API_URL}/rponto/sqlp/`,
    method: 'RegistosRH'
  };

  const defaultSort = [
    { column: "dts", direction: "DESC" },
    { column: "num", direction: "ASC" }
  ];

  const handleEdit = (row) => {
    setSelectedRecord(row);
    setShowFix(true);
  };

  const toolbarButtons = (filters) => (
      <>
        <DownloadReport filters={filters} />
        
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
      </>
    );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto h-[calc(100vh-2rem)]">
        {/* Usar o DataTable reutilizável */}
      <DataTable
          title="Registo de Picagens"
          columns={columns}
          apiConfig={apiConfig}
          filterFields={filterFields}
          defaultSort={defaultSort}
          onRowEdit={handleEdit}
          toolbarButtons={toolbarButtons}
          pageSize={20}
          openNotification={openNotification}
        />
      </div>

      {/* DRAWERS */}
      <Drawer 
        title="Biometrias" 
        width={800} 
        open={showBiometrias} 
        onClose={() => setShowBiometrias(false)} 
        destroyOnClose
      >
        <Biometrias openNotification={openNotification} />
      </Drawer>
      
      <Drawer 
        title="Registos Inválidos" 
        width={800} 
        open={showInvalidRecords} 
        onClose={() => setShowInvalidRecords(false)} 
        destroyOnClose
      >
        <InvalidRecords openNotification={openNotification} />
      </Drawer>
      
      {showFix && selectedRecord && (
        <Drawer 
          title="Corrigir Registo" 
          width={600} 
          open={showFix} 
          onClose={() => setShowFix(false)} 
          destroyOnClose
        >
          <Fix 
            parameters={{ row: selectedRecord }} 
            loadParentData={() => {/* Trigger refresh via ref ou callback */}} 
            openNotification={openNotification} 
          />
        </Drawer>
      )}
    </div>
  );
};