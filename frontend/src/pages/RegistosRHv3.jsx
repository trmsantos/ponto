import React, { useContext, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Drawer, Input, Image, Form, Button, Space, Alert, Spin, Empty, Avatar } from 'antd';
import { CameraOutlined, SearchOutlined, SyncOutlined, SaveOutlined, CloseOutlined, UserOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
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
import DataTable from './DataTable';

/* --- COMPONENTE IMAGEM --- */
const Pic = ({ path }) => (
  <div className="flex justify-center p-4">
    <Image src={path} className="rounded-lg shadow-lg" style={{ maxHeight: '70vh' }} />
  </div>
);

/* --- COMPONENTE BIOMETRIAS --- */
const Biometrias = ({ openNotification }) => {
  const dataAPI = useDataAPI({
    payload: {
      url: `${API_URL}/rponto/sqlp/`,
      withCredentials: true,
      parameters: { method: "BiometriasList" },
      pagination: { enabled: false },
      filter: {},
      sort: []
    }
  });
  const submitting = useSubmitting(false);
  const [modalParameters, setModalParameters] = useState({});
  const [showModal, hideModal] = useModal(
    ({ in: open }) => (
      <ResponsiveModal
        title={modalParameters?.title}
        onCancel={hideModal}
        width={modalParameters.width}
        footer="ref"
        yScroll
      >
        <Pic path={modalParameters.path} />
      </ResponsiveModal>
    ),
    [modalParameters]
  );

  useEffect(() => {
    dataAPI.fetchPost();
  }, []);

  const syncAll = async () => {
    submitting.trigger();
    try {
      await fetchPost({
        url: `${API_URL}/rponto/sqlp/`,
        withCredentials: true,
        parameters: { method: "Sync" }
      });
      openNotification("success", 'top', "Sincronização", "Dados sincronizados!");
      dataAPI.fetchPost();
    } catch (e) {
      openNotification("error", 'top', "Erro", e.message);
    } finally {
      submitting.end();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header com contador e botão */}
      <div className="p-4 border-b bg-white shadow-sm flex justify-between items-center">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">
          {dataAPI.rows?.length || 0} Biometrias
        </span>
        <Button
          onClick={syncAll}
          loading={submitting.state}
          icon={<SyncOutlined />}
          className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded text-xs"
        >
          Sincronizar
        </Button>
      </div>

      {/* Loading State */}
      {dataAPI.loading && (
        <div className="flex justify-center items-center p-8">
          <Spin size="large" />
          <span className="ml-3 text-gray-600">Carregando biometrias...</span>
        </div>
      )}

      {/* Error State */}
      {dataAPI.error && (
        <Alert
          message="Erro ao carregar biometrias"
          description={dataAPI.error}
          type="error"
          showIcon
          className="m-4"
        />
      )}

      {/* Empty State */}
      {!dataAPI.loading && !dataAPI.error && (!dataAPI.rows || dataAPI.rows.length === 0) && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Nenhuma biometria encontrada"
          className="mt-8"
        />
      )}

      {/* Tabela (mantida como estava, mas com melhorias visuais) */}
      {!dataAPI.loading && !dataAPI.error && dataAPI.rows && dataAPI.rows.length > 0 && (
        <YScroll>
          <table className="w-full text-left text-sm border-collapse">
            <tbody className="divide-y divide-gray-100">
              {dataAPI.rows?.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-black text-gray-900 w-24 border-r">{r.num}</td>
                  <td className="p-3 text-xs text-gray-500">
                    {dayjs(r.t_stamp).format(DATETIME_FORMAT)}
                  </td>
                  <td className="p-3 text-[10px] font-mono opacity-50">{r.file}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setModalParameters({
                          title: "Visualizar",
                          path: `${FILES_URL}/static/faces/${r.file}`,
                          width: "600px"
                        });
                        showModal();
                      }}
                      className="p-2 hover:bg-blue-100 rounded-full text-blue-600 transition-colors"
                    >
                      <CameraOutlined />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </YScroll>
      )}
    </div>
  );
};

/* --- COMPONENTE REGISTOS INVÁLIDOS --- */
const InvalidRecords = ({ openNotification }) => {
  const [formFilter] = Form.useForm();
  const dataAPI = useDataAPI({
    payload: {
      url: `${API_URL}/rponto/sqlp/`,
      withCredentials: true,
      parameters: { method: "InvalidRecordsList" },
      pagination: { enabled: false },
      filter: {
        fdata: [
          `>=${dayjs().format(DATE_FORMAT)}`,
          `<=${dayjs().format(DATE_FORMAT)}`
        ]
      }
    }
  });

  const rowFn = async (dt) => {
    const _dt = [];
    if (!dt?.rows) return { rows: [] };
    dt.rows.forEach((x, i) => {
      const v = x.filename.replace("../", "").replace("./", "");
      const r = v.split('/');
      if (r.length >= 3) {
        let _f = r[r.length - 1].split('.');
        _dt.push({
          k: i,
          name: `${_f[0]}.${_f[1]}`,
          path: `${FILES_URL}/static/${v}`,
          num: r.length === 4 ? r[2] : null,
          type: _f[2]
        });
      }
    });
    return { rows: _dt };
  };

  useEffect(() => {
    dataAPI.fetchPost({ rowFn });
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header com filtros */}
      <div className="p-3 bg-white border-b shadow-sm">
        <Form
          form={formFilter}
          layout="inline"
          onFinish={(v) => {
            dataAPI.addFilters(
              {
                ...v,
                fdata: getFilterRangeValues(v["fdata"]?.formatted)
              },
              true
            );
            dataAPI.fetchPost({ rowFn });
          }}
          initialValues={{ fdata: [dayjs(), dayjs()] }}
        >
          <Form.Item name="fnum">
            <Input placeholder="Número" size="small" style={{ width: 70 }} className="rounded" />
          </Form.Item>
          <Form.Item name="fdata">
            <RangeDateField size="small" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SearchOutlined />}
            className="bg-amber-500 hover:bg-amber-600 border-none rounded"
          >
            Filtrar
          </Button>
        </Form>
      </div>

      {/* Loading State */}
      {dataAPI.loading && (
        <div className="flex justify-center items-center p-8">
          <Spin size="large" />
          <span className="ml-3 text-gray-600">Carregando registos inválidos...</span>
        </div>
      )}

      {/* Error State */}
      {dataAPI.error && (
        <Alert
          message="Erro ao carregar registos inválidos"
          description={dataAPI.error}
          type="error"
          showIcon
          className="m-4"
        />
      )}

      {/* Empty State */}
      {!dataAPI.loading && !dataAPI.error && (!dataAPI.rows || dataAPI.rows.length === 0) && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Nenhum registo inválido encontrado"
          className="mt-8"
        />
      )}

      {/* Tabela (mantida como estava, mas com melhorias visuais) */}
      {!dataAPI.loading && !dataAPI.error && dataAPI.rows && dataAPI.rows.length > 0 && (
        <YScroll>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-gray-100">
              {dataAPI.rows?.map((r) => (
                <tr key={r.k} className="hover:bg-amber-50/50 group transition-colors">
                  <td className="p-3 font-bold text-amber-700 w-20">{r.num || "---"}</td>
                  <td className="p-3 text-[10px] font-mono">{r.name}</td>
                  <td className="p-3 text-right">
                    <Image
                      src={r.path}
                      width={30}
                      className="rounded border group-hover:scale-110 transition-transform"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </YScroll>
      )}
    </div>
  );
};

/* --- COMPONENTE EDITAR REGISTO --- */
const FixRecord = ({ record, openNotification, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const submitting = useSubmitting(false);
  const [formStatus, setFormStatus] = useState({ error: [], warning: [] });

  const typeList = [
    { value: null, label: "" },
    { value: "in", label: "Entrada" },
    { value: "out", label: "Saída" }
  ];

  useEffect(() => {
    if (!record) return;

    const vals = {
      num: record.num,
      dts: record.dts ? dayjs(record.dts) : null,
      ...Object.fromEntries(
        [1, 2, 3, 4, 5, 6, 7, 8].map(i => [
          `ss_${String(i).padStart(2, '0')}`,
          record[`ss_${String(i).padStart(2, '0')}`]
            ? dayjs(record[`ss_${String(i).padStart(2, '0')}`])
            : null
        ])
      ),
      ...Object.fromEntries(
        [1, 2, 3, 4, 5, 6, 7, 8].map(i => [
          `ty_${String(i).padStart(2, '0')}`,
          record[`ty_${String(i).padStart(2, '0')}`]?.trim() || null
        ])
      )
    };

    form.setFieldsValue(vals);
  }, [record, form]);

  const handleSave = async (values) => {
    submitting.trigger();
    try {
      const payload = {
        ...values,
        dts: values.dts?.format(DATE_FORMAT),
        ...Object.fromEntries(
          [1, 2, 3, 4, 5, 6, 7, 8].map(i => [
            `ss_${String(i).padStart(2, '0')}`,
            values[`ss_${String(i).padStart(2, '0')}`]?.format(DATETIME_FORMAT) || null
          ])
        )
      };

      await fetchPost({
        url: `${API_URL}/rponto/sqlp/`,
        withCredentials: true,
        body: {
          method: "UpdatePicagem",
          data: payload
        }
      });

      openNotification("success", 'top', "Sucesso", "Registo actualizado com sucesso!");
      onSave();
    } catch (e) {
      setFormStatus({
        error: [e.message],
        warning: []
      });
      openNotification("error", 'top', "Erro", e.message);
    } finally {
      submitting.end();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Error Alert */}
      {formStatus.error.length > 0 && (
        <Alert
          message="Erro"
          description={formStatus.error.join(", ")}
          type="error"
          closable
          onClose={() => setFormStatus({ ...formStatus, error: [] })}
          className="m-4"
        />
      )}

      {/* Form */}
      <YScroll className="flex-1">
        <div className="p-4">
          <Spin spinning={submitting.state} tip="A guardar...">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              disabled={submitting.state}
            >
              <Form.Item label="Número" name="num">
                <Input disabled className="bg-gray-100" />
              </Form.Item>

              <Form.Item label="Data" name="dts">
                <Input disabled className="bg-gray-100" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="border rounded p-3 bg-white shadow-sm">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Picagem {i}
                    </label>
                    <Form.Item
                      name={`ss_${String(i).padStart(2, '0')}`}
                      noStyle
                    >
                      <Input placeholder="HH:mm" type="time" size="small" />
                    </Form.Item>
                    <Form.Item
                      name={`ty_${String(i).padStart(2, '0')}`}
                      noStyle
                    >
                      <select className="mt-2 w-full px-2 py-1 border rounded text-sm">
                        {typeList.map(t => (
                          <option key={t.value} value={t.value || ""}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </Form.Item>
                  </div>
                ))}
              </div>
            </Form>
          </Spin>
        </div>
      </YScroll>

      {/* Footer com botões */}
      <div className="p-4 border-t bg-white flex justify-end gap-2">
        <Button onClick={onCancel} icon={<CloseOutlined />}>
          Cancelar
        </Button>
        <Button
          type="primary"
          onClick={() => form.submit()}
          loading={submitting.state}
          icon={<SaveOutlined />}
          className="bg-green-600 hover:bg-green-700 border-none"
        >
          Guardar
        </Button>
      </div>
    </div>
  );
};

/* --- COMPONENTE PRINCIPAL --- */
export default function RegistosRH() {
  const { openNotification } = useContext(LayoutContext);
  const [showBiometrias, setShowBiometrias] = useState(false);
  const [showInvalidRecords, setShowInvalidRecords] = useState(false);
  const [showFix, setShowFix] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // DEBUG: Logs para verificar se os estados mudam
  useEffect(() => {
    console.log('Estado showBiometrias:', showBiometrias);
  }, [showBiometrias]);

  useEffect(() => {
    console.log('Estado showInvalidRecords:', showInvalidRecords);
  }, [showInvalidRecords]);

  useEffect(() => {
    console.log('Estado showFix:', showFix);
  }, [showFix]);

  const toolbarButtons = (filters) => {
    console.log('🔧 RegistosRH - toolbarButtons recebeu filters:', filters);
    
    return (
      <>
        <DownloadReport filters={filters} />

        <Button
          onClick={() => {
            console.log('Botão Biometrias clicado'); // DEBUG
            setShowBiometrias(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-black transition-all"
        >
          <CameraIcon className="w-4 h-4" /> Biometrias
        </Button>

        <Button
          onClick={() => {
            console.log('Botão Inválidos clicado'); // DEBUG
            setShowInvalidRecords(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-all"
        >
          <AlertIcon className="w-4 h-4" /> Inválidos
        </Button>
      </>
    );
  };

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
      title: 'Departamento',
      dataIndex: 'dep',
      sticky: true,
      className: 'left-20 border-r',
      cellClassName: 'border-r',
      style: { left: 60 },
      render: (val) => <div className="text-sm text-gray-700">{val || '-'}</div>
    },
    {
      title: 'Tipo Horário',
      dataIndex: 'tp_hor',
      sticky: true,
      className: 'left-56 border-r',
      cellClassName: 'border-r',
      style: { left: 160 },
      render: (val) => <div className="text-sm text-gray-700">{val || '-'}</div>
    },
    {
      title: 'Colaborador',
      dataIndex: 'nome_colaborador',
      sticky: true,
      className: 'left-96 border-r',
      cellClassName: 'border-r',
      style: { left: 280 },
      render: (val) => <div className="font-bold text-gray-900 text-sm">{val || 'N/A'}</div>
    },
    {
      title: 'Data',
      dataIndex: 'dts',
      render: (val) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {dayjs(val).format('DD/MM/YYYY')}
        </span>
      )
    },
    // Picagens 1-8
    ...[...Array(8)].map((_, i) => ({
      title: `Pic.${i + 1}`,
      dataIndex: `ss_${String(i + 1).padStart(2, '0')}`,
      className: 'text-center border-l',
      cellClassName: 'border-l text-center',
      render: (val, row) => {
        const typeKey = `ty_${String(i + 1).padStart(2, '0')}`;
        const typeVal = row[typeKey];
        const type = typeVal ? String(typeVal).trim().toLowerCase() : null;

        return val ? (
          <div
            className={`inline-block px-2 py-1 rounded-full font-bold text-white text-xs ${
              type === 'in' ? 'bg-green-600' : type === 'out' ? 'bg-red-600' : 'bg-gray-400'
            }`}
          >
            {dayjs(val).format('HH:mm')}
          </div>
        ) : null;
      }
    }))
  ];

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

  const handleSaveRecord = () => {
    setShowFix(false);
    setSelectedRecord(null);
  };



  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto h-[calc(100vh-2rem)]">
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
        title={
          <div className="flex items-center gap-2">
            <UserOutlined className="text-blue-500" />
            Biometrias
          </div>
        }
        width={800}
        open={showBiometrias}
        onClose={() => setShowBiometrias(false)}
        destroyOnClose
      >
        <Biometrias openNotification={openNotification} />
      </Drawer>

      <Drawer
        title={
          <div className="flex items-center gap-2">
            <WarningOutlined className="text-amber-500" />
            Registos Inválidos
          </div>
        }
        width={800}
        open={showInvalidRecords}
        onClose={() => setShowInvalidRecords(false)}
        destroyOnClose
      >
        <InvalidRecords openNotification={openNotification} />
      </Drawer>

      <Drawer
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined className="text-red-500" />
            Corrigir Registo
          </div>
        }
        width={700}
        open={showFix}
        onClose={() => {
          setShowFix(false);
          setSelectedRecord(null);
        }}
        destroyOnClose
      >
        {selectedRecord && (
          <FixRecord
            record={selectedRecord}
            openNotification={openNotification}
            onSave={handleSaveRecord}
            onCancel={() => {
              setShowFix(false);
              setSelectedRecord(null);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}