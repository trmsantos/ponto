import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { createUseStyles } from 'react-jss';
import styled from 'styled-components';
import Joi, { alternatives } from 'joi';
//import moment from 'moment';
import dayjs from 'dayjs';
import { useNavigate, useLocation } from "react-router-dom";
import { fetch, fetchPost } from "utils/fetch";
import { getSchema, pick, getStatus, validateMessages } from "utils/schemaValidator";
import { useSubmitting } from "utils";
import loadInit, { fixRangeDates } from "utils/loadInit";
import { API_URL, ROOT_URL, FILES_URL } from "config";
import { useDataAPI, getLocalStorage } from "utils/useDataAPI";
import { getFilterRangeValues, getFilterValue, secondstoDay } from "utils";
import Portal from "components/portal";
import { Button, Spin, Form, Space, Input, Typography, Modal, Select, Tag, Alert, Drawer, Image, TimePicker, InputNumber, DatePicker } from "antd";
const { TextArea } = Input;
import ToolbarTitle from './commons/ToolbarTitle';
const { Title } = Typography;
import { json } from "utils/object";
import { EditOutlined, CameraOutlined, DeleteTwoTone, CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import ResultMessage from 'components/resultMessage';
import Table from 'components/TableV2';
import { DATE_FORMAT, DATETIME_FORMAT, TIME_FORMAT, DATE_FORMAT_NO_SEPARATOR } from 'config';
import uuIdInt from "utils/uuIdInt";
import { useModal } from "react-modal-hook";
import ResponsiveModal from 'components/Modal';
import { Container, Row, Col, Visible, Hidden } from 'react-grid-system';
import { Field, Container as FormContainer, SelectField, AlertsContainer, RangeDateField, SelectDebounceField, CheckboxField, Selector, SelectMultiField } from 'components/FormFields';
import YScroll from 'components/YScroll';
import { MediaContext, AppContext } from "./App";
import { isRH, isPrivate, LeftUserItem } from './commons';
import { LayoutContext } from "./GridLayout";
import { BsFillEraserFill } from 'react-icons/bs';

const title = "Registo de Picagens";
const TitleForm = ({ isRH }) => {
  return (<ToolbarTitle title={<>
    <Col>
      <Row style={{ marginTop: "15px", marginBottom: "5px" }}>
        <Col xs='content' style={{}}><Row nogutter><Col><span style={{ fontSize: "21px", lineHeight: "normal", fontWeight: 900 }}>{isRH ? title : `${title} Pessoal`}</span></Col></Row></Col>
        {/* <Col xs='content' style={{ paddingTop: "3px" }}>{st && <Tag icon={<MoreOutlined />} color="#2db7f5">{st}</Tag>}</Col> */}
      </Row>

    </Col>
  </>
  }
  />);
}

const useStyles = createUseStyles({
  noOutline: {
    outline: "none !important"
  },
  notValid: {
    background: "#ffe7ba"
  },
  in: {
    background: "#95de64"
  },
  out: {
    background: "#d9f7be"
  },
  edit: {
    position: "relative",
    '&:before': {
      /* we need this to create the pseudo-element */
      content: "''",
      display: "block",
      /* position the triangle in the top right corner */
      position: "absolute",
      zIndex: "0",
      top: "0",
      right: "0",
      /* create the triangle */
      width: "0",
      height: "0",
      border: ".3em solid transparent",
      borderTopColor: "#66afe9",
      borderRightColor: "#66afe9"
    }
  }
});

const schema = (options = {}) => {
  return getSchema({}, options).unknown(true);
}
const ToolbarFilters = ({ dataAPI, auth, num, ...props }) => {
  return (<>
    {isRH(auth, num) && <>
      <Col width={80}>
        <Field name="fnum" label={{ enabled: true, text: "Número", pos: "top", padding: "0px" }}>
          <Input size='small' allowClear />
        </Field>
      </Col>
      <Col width={180}>
        <Field name="fnome" label={{ enabled: true, text: "Nome", pos: "top", padding: "0px" }}>
          <Input size='small' allowClear />
        </Field>
      </Col>
    </>}
    <Col xs='content'>
      <Field name="fdata" label={{ enabled: true, text: "Data", pos: "top", padding: "0px" }}>
        <RangeDateField size='small' allowClear />
      </Field>
    </Col>
  </>
  );
}
const moreFiltersRules = (keys) => { return getSchema({}, { keys }).unknown(true); }
const TipoRelation = () => <Select size='small' options={[{ value: "e" }, { value: "ou" }, { value: "!e" }, { value: "!ou" }]} />;
const moreFiltersSchema = ({ form }) => [
  { fnum: { label: "Número", field: { type: 'input', size: 'small' } } },
  { fnome: { label: "Nome", field: { type: 'input', size: 'small' } } },
  { fdata: { label: "Data", field: { type: "rangedate", size: 'small' } } }
];
const moreFiltersSchemaPrivate = ({ form }) => [
  { fdata: { label: "Data", field: { type: "rangedate", size: 'small' } } }
];

// const RegistosVisuaisViewer = ({ p, column, title, forInput, ...props }) => {
//   const [visible, setVisible] = useState(true);
//   const submitting = useSubmitting(true);
//   const [records, setRecords] = useState([]);

//   useEffect(() => {
//     const controller = new AbortController();
//     loadData({ signal: controller.signal });
//     return (() => { controller.abort(); });
//   }, []);

//   const loadData = async ({ signal } = {}) => {
//     try {
//       let response = await fetchPost({ url: `${API_URL}/rponto/sqlp/`, withCredentials: true, filter: {}, parameters: { method: "GetCameraRecords", date: moment(p.row.dts).format(DATE_FORMAT_NO_SEPARATOR), num: p.row.num } });
//       if (response.data.status !== "error") {
//         setRecords(response.data);
//       } else {
//         setRecords([]);
//       }
//       submitting.end();
//     } catch (e) {
//       setRecords([]);
//       submitting.end();
//     };
//   }
//   const onCancel = () => {
//     p.onClose();
//     setVisible(false);
//   };

//   return (
//     <Drawer push={false} title={title && title} open={visible} destroyOnClose onClose={onCancel} width="550px">
//       <YScroll>
//         <Container>
//           <Row>
//             {records.map((v, i) => {
//               const dt = p.row[`ss_${`${i + 1}`.padStart(2, '0')}`];
//               const type = p.row[`ty_${`${i + 1}`.padStart(2, '0')}`]?.trim();
//               return (<Col xs="content" key={`img-${i}`} style={{ marginBottom: "15px", display: "flex", flexDirection: "column", alignItems: "center" }}>
//                 <div style={{ padding: "2px", fontSize: "10px", ...type && { background: type == "in" ? "#95de64" : "#ff7875" } }}><b>{i + 1}.</b> {dt && moment(dt).format(DATETIME_FORMAT)}</div>
//                 <Image width="106px" src={`${ROOT_URL}/static/records/${v}`} />
//               </Col>);
//             })}
//           </Row>
//         </Container>
//       </YScroll>
//     </Drawer>
//   );
// }

const RegistosVisuaisViewer = ({ p, column, title, forInput, ...props }) => {
  const [visible, setVisible] = useState(true);
  const submitting = useSubmitting(true);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    loadData({ signal: controller.signal });
    return (() => { controller.abort(); });
  }, []);

  const loadData = async ({ signal } = {}) => {
    try {
      let response = await fetchPost({ url: `${API_URL}/rponto/sqlp/`, withCredentials: true, filter: {}, parameters: { method: "GetCameraRecords", date: dayjs(p.row.dts).format(DATE_FORMAT_NO_SEPARATOR), num: p.row.num } });
      if (response.data.status !== "error") {
        setRecords(response.data);
      } else {
        setRecords([]);
      }
      submitting.end();
    } catch (e) {
      setRecords([]);
      submitting.end();
    };
  }
  const onCancel = () => {
    p.onClose();
    setVisible(false);
  };

  return (
    // <Drawer push={false} title={title && title} open={visible} destroyOnClose onClose={onCancel} width="550px">
    <YScroll>
      <Container>
        <Row>
          {records.map((v, i) => {
            const dt = v.tstamp; //p.row[`ss_${`${i + 1}`.padStart(2, '0')}`];
            //const type = p.row[`ty_${`${i + 1}`.padStart(2, '0')}`]?.trim();
            return (<Col xs="content" key={`img-${i}`} style={{ marginBottom: "15px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ padding: "2px", fontSize: "10px", /* ...type && { background: type == "in" ? "#95de64" : "#ff7875" } */ }}><b>{i + 1}.</b> {dt && dayjs(dt).format(DATETIME_FORMAT)}</div>
              <Image width="106px" src={`${FILES_URL}/static/records/${v.filename}`} />
            </Col>);
          })}
        </Row>
      </Container>
    </YScroll>
    // </Drawer>
  );
}

const Pic = ({ p, path, title, ...props }) => {
  const [visible, setVisible] = useState(true);
  const submitting = useSubmitting(true);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    loadData({ signal: controller.signal });
    return (() => { controller.abort(); });
  }, []);

  const loadData = async ({ signal } = {}) => {
    submitting.end();
  }
  const onCancel = () => {
    setVisible(false);
    p.onClose();
  };

  return (
    <>
      {/* <Modal footer={null} title={title && title} open={visible} destroyOnClose onCancel={onCancel} bodyStyle={{ height: 400, display: "flex", justifyContent: "center" }} > */}
      <Image src={path ? path : p.row.path} height={350} />
      {/*     </Modal> */}
    </>
  );
}

const Biometrias = ({ parameters }) => {
  const primaryKeys = ['file'];
  const defaultFilters = {};
  const defaultParameters = { method: "BiometriasList" };
  const defaultSort = [];
  const dataAPI = useDataAPI({ payload: { url: `${API_URL}/rponto/sqlp/`, withCredentials: true, parameters: {}, pagination: { enabled: false }, filter: defaultFilters, sort: [] } });
  const submitting = useSubmitting(true);

  const [modalParameters, setModalParameters] = useState({});
  const [showModal, hideModal] = useModal(({ in: open, onExited }) => {

    const content = () => {
      switch (modalParameters.content) {
        case "viewbiometria": return <Pic p={modalParameters.parameters.p} path={modalParameters.parameters.path} column="" parameters={modalParameters.parameters} />;
      }
    }

    return (
      <ResponsiveModal title={modalParameters?.title} type={modalParameters?.type} push={modalParameters?.push} onCancel={hideModal} width={modalParameters.width} height={modalParameters.height} footer="ref" extra="ref" yScroll>
        {content()}
      </ResponsiveModal>
    );
  }, [modalParameters]);

  useEffect(() => {
    const controller = new AbortController();
    const interval = loadData({ init: true, signal: controller.signal });
    return (() => { controller.abort(); (interval) && clearInterval(interval); });
  }, []);

  const loadData = async ({ init = false, signal } = {}) => {
    if (init) {
      dataAPI.addParameters(defaultParameters, true, true);
      dataAPI.fetchPost({ signal });
    }
    submitting.end();
  }

  const columns = [
    { key: 'num', width: 125, name: 'Número', sortable: false, formatter: p => <div style={{ fontWeight: 700 }}>{p.row.num}</div> },
    { key: 't_stamp', width: 150, name: 'Data', sortable: false, formatter: p => dayjs(p.row.t_stamp).format(DATETIME_FORMAT) },
    { key: 'file', name: 'Ficheiro', width: '0.93fr', sortable: false, formatter: p => <div style={{ fontWeight: 700 }}>{p.row.file}</div> },
    {
      key: 'pic', sortable: false, minWidth: 45, width: 45, name: "",
      formatter: p => <Button icon={<CameraOutlined />} size="small" onClick={() => onViewPic(p)} /* onClick={() => onRegistosVisuais(p)} */ />,//<CameraOutlined style={{ cursor: "pointer" }} />,
      //editor: (p) => { return <Pic p={p} column="" title="Registo Visual" /> },
      //editorOptions: { editOnClick: true }
    },
    { key: 'baction', name: '', minWidth: 45, maxWidth: 40, formatter: p => <Button icon={<DeleteTwoTone />} size="small" onClick={() => onDelFace(p.row)} /> },
  ];

  const onViewPic = (p) => {
    setModalParameters({ content: "viewbiometria", type: "modal", title: `Registo Visual`, push: false, width: "550px", parameters: { p, path: `${FILES_URL}/static/faces/${p.row.file}` } });
    showModal();
  }

  const syncAll = async () => {
    submitting.trigger();

    try {
      let response = await fetchPost({ url: `${API_URL}/rponto/sqlp/`, withCredentials: true, filter: {}, parameters: { method: "Sync" } });
      if (response.data.status !== "error") {
        parameters.openNotification(response.data.status, 'top', "Notificação", "Dados biométricos sincronizados com sucesso!");
      } else {
        parameters.openNotification(response.data.status, 'top', "Notificação", "Dados biométricos sincronizados com sucesso!");
      }
      submitting.end();
    } catch (e) {
      parameters.openNotification("error", 'top', "Notificação", e);
      submitting.end();
    };
  }

  const onDelFace = (r) => {
    Modal.confirm({
      title: <div>Eliminar Biometria <b>{r.num}</b></div>, content: "Tem a certeza que deseja eliminar a biometria selecionada?", onOk: async () => {
        submitting.trigger();
        try {
          let response = await fetchPost({ url: `${API_URL}/rponto/sqlp/`, withCredentials: true, filter: { num: r.num, file: r.file }, parameters: { method: "DelFace" } });
          if (response.data.status !== "error") {
            parameters.openNotification(response.data.status, 'top', "Notificação", `Biometria ${r.num} eliminada com sucesso!`);
            dataAPI.fetchPost();
          } else {
            parameters.openNotification(response.data.status, 'top', "Notificação", `Erro ao eliminar a biometria ${r.num}!`);
          }
        } catch (e) {
          parameters.openNotification("error", 'top', "Notificação", e);
        } finally {
          submitting.end();
        };
      }
    });
  }

  return (
    <YScroll>
      <Table
        loading={submitting.state}
        /*  actionColumn={<ActionContent dataAPI={dataAPI} onClick={onAction} modeEdit={modeEdit.datagrid} />} */
        frozenActionColumn={true}
        reportTitle="Biometrias"
        loadOnInit={false}
        columns={columns}
        dataAPI={dataAPI}
        toolbar={true}
        search={false}
        moreFilters={false}
        rowSelection={false}
        primaryKeys={primaryKeys}
        editable={true}
        clearSort={false}
        rowHeight={28}
        leftToolbar={<Space>
          <Button size="small" disabled={submitting.state} onClick={syncAll}>Sincronizar Tudo</Button>
        </Space>}
        toolbarFilters={{}}
      />
    </YScroll>
  );
}

const InvalidRecords = ({ parameters }) => {
  const primaryKeys = ['k'];
  const defaultFilters = {};
  const [formFilter] = Form.useForm();
  const defaultParameters = { method: "InvalidRecordsList" };
  const defaultSort = [];
  const dataAPI = useDataAPI({ payload: { url: `${API_URL}/rponto/sqlp/`, withCredentials: true, parameters: {}, pagination: { enabled: false }, filter: defaultFilters, sort: [] } });
  const submitting = useSubmitting(true);

  const [modalParameters, setModalParameters] = useState({});
  const [showModal, hideModal] = useModal(({ in: open, onExited }) => {

    const content = () => {
      switch (modalParameters.content) {
        case "viewinvalidpic": return <Pic p={modalParameters.parameters.p} column="" parameters={modalParameters.parameters} />;
      }
    }

    return (
      <ResponsiveModal title={modalParameters?.title} type={modalParameters?.type} push={modalParameters?.push} onCancel={hideModal} width={modalParameters.width} height={modalParameters.height} footer="ref" extra="ref" yScroll>
        {content()}
      </ResponsiveModal>
    );
  }, [modalParameters]);


  useEffect(() => {
    const controller = new AbortController();
    const interval = loadData({ init: true, signal: controller.signal });
    return (() => { controller.abort(); (interval) && clearInterval(interval); });
  }, []);

  const rowFn = async (dt) => {
    const _dt = [];
    for (let [i, x] of dt.rows.entries()) {
      const v = x.filename.replace("../", "").replace("./", "");
      const r = v.split('/');
      console.log(r)
      if (r.length === 3) {
        let _f = r[2].split('.');
        _dt.push({ k: `${r[2]}.${i}`, name: `${_f[0]}.${_f[1]}`, path: `${FILES_URL}/static/${v.replace("../", "")}`, num: null, type: _f[2] });
      } else if (r.length === 4) {
        let _f = r[3].split('.');
        _dt.push({ k: `${r[3]}.${i}`, name: `${_f[0]}.${_f[1]}`, path: `${FILES_URL}/static/${v.replace("../", "")}`, num: r[2], type: _f[2] });
      }
    }
    submitting.end();
    return { rows: _dt };
  }

  const loadData = async ({ init = false, signal } = {}) => {
    if (init) {
      let { filterValues, fieldValues } = fixRangeDates(['fdata'], { fdata: [`>=${dayjs().format(DATE_FORMAT)}`, `<=${dayjs().format(DATE_FORMAT)}`] });
      console.log("loading--->", fieldValues, filterValues)
      formFilter.setFieldsValue({ ...fieldValues });
      dataAPI.addFilters({ ...filterValues }, true, false);

      dataAPI.addParameters(defaultParameters, true, true);
      dataAPI.fetchPost({
        signal, rowFn
      });
    }
    submitting.end();
  }

  const columns = [
    { key: 'num', width: 80, name: 'Número', frozen: true, sortable: false, formatter: p => <div style={{ fontWeight: 700 }}>{p.row.num}</div> },
    { key: 'name', width: "0.94fr", name: 'Ficheiro', sortable: false, formatter: p => <div style={{ fontWeight: 700 }}>{p.row.name}</div> },
    { key: 'type', width: 100, name: 'Evento', sortable: false, formatter: p => <div style={{ fontWeight: 700 }}>{p.row.type}</div> },
    {
      key: 'pic', sortable: false, minWidth: 45, width: 45, name: "",
      formatter: p => <Button icon={<CameraOutlined />} size="small" onClick={() => onViewPic(p)} /* onClick={() => onRegistosVisuais(p)} */ />,//<CameraOutlined style={{ cursor: "pointer" }} />,
      //editor: (p) => { return <Pic p={p} column="" title="Registo Visual" /> },
      //editorOptions: { editOnClick: true }
    }
  ];

const onFilterFinish = (type, values) => {
  switch (type) {
    case "filter":
      //remove empty values
      const vals = Object.fromEntries(Object.entries({ ...defaultFilters, ...values }).filter(([_, v]) => v !== null && v !== ''));
      const _values = {
        ...vals,
        fnum: getFilterValue(vals?.fnum, 'exact'),  // Changed from 'any' to 'exact' for exact match
        fnome: getFilterValue(vals?.fnome, 'any'),

        fdata: getFilterRangeValues(vals["fdata"]?.formatted),

      };
      dataAPI.addFilters(_values, true);
      dataAPI.addParameters(defaultParameters);
      dataAPI.first();
      dataAPI.fetchPost();
      break;
  }
};


  const onFilterChange = (changedValues, values) => {
    /* if ("type" in changedValues) {
        navigate("/app/picking/picknwlist", { state: { ...location?.state, ...formFilter.getFieldsValue(true), type: changedValues.type, tstamp: Date.now() }, replace: true });
    } */
  };

  const onViewPic = (p) => {
    setModalParameters({ content: "viewinvalidpic", type: "modal", title: `Registo Visual`, push: false, width: "550px", parameters: { p } });
    showModal();
  }

  return (
    <YScroll>
      <Table
        loading={submitting.state}
        /*  actionColumn={<ActionContent dataAPI={dataAPI} onClick={onAction} modeEdit={modeEdit.datagrid} />} */
        frozenActionColumn={true}
        reportTitle="Biometrias"
        loadOnInit={false}
        columns={columns}
        dataAPI={dataAPI}
        toolbar={true}
        search={true}
        moreFilters={false}
        rowSelection={false}
        primaryKeys={primaryKeys}
        editable={true}
        clearSort={false}
        rowHeight={28}
        leftToolbar={<Space>
          {/* <Button size="small" disabled={submitting.state} onClick={syncAll}>Sincronizar Tudo</Button> */}
        </Space>}
        toolbarFilters={{
          form: formFilter,/*  schema */ onFinish: onFilterFinish, onValuesChange: onFilterChange,
          filters:
            <>
              <Col xs='content'>
                <Field name="fnum" label={{ enabled: true, text: "Número", pos: "top", padding: "0px" }}>
                  <Input size='small' allowClear style={{ width: "70px" }} />
                </Field>
              </Col>
              <Col xs='content'>
                <Field name="fdata" label={{ enabled: true, text: "Data", pos: "top", padding: "0px" }}>
                  <RangeDateField size='small' allowClear />
                </Field>
              </Col>
            </>
        }}
      />
    </YScroll>
  );
}

const typeList = [{ value: null, label: "" }, { value: "in", label: "Entrada" }, { value: "out", label: "Saída" }];

const Fix = ({ closeSelf, parentRef, parameters, ...props }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const classes = useStyles();
  const [form] = Form.useForm();
  const [fieldStatus, setFieldStatus] = useState({});
  const [formStatus, setFormStatus] = useState({ error: [], warning: [], info: [], success: [] });
  const submitting = useSubmitting(true);
  Form.useWatch("ss_01", form);
  Form.useWatch("ss_02", form);
  Form.useWatch("ss_03", form);
  Form.useWatch("ss_04", form);
  Form.useWatch("ss_05", form);
  Form.useWatch("ss_06", form);
  Form.useWatch("ss_07", form);
  Form.useWatch("ss_08", form);

  const schemaFix = (options = {}) => {
    return getSchema({}, options).unknown(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    loadData({ signal: controller.signal });
    return (() => controller.abort());
  }, []);

  const loadData = async ({ signal } = {}) => {
    submitting.trigger();
    let nt = 0;
    if (parameters.row.ss_01) { nt += 1; }
    if (parameters.row.ss_02) { nt += 1; }
    if (parameters.row.ss_03) { nt += 1; }
    if (parameters.row.ss_04) { nt += 1; }
    if (parameters.row.ss_05) { nt += 1; }
    if (parameters.row.ss_06) { nt += 1; }
    if (parameters.row.ss_07) { nt += 1; }
    if (parameters.row.ss_08) { nt += 1; }


    const vals = {
      ...parameters.row,
      nt,
      dts: parameters.row?.dts && dayjs(parameters.row.dts).format(DATE_FORMAT),
      ss_01: parameters.row?.ss_01 && dayjs(parameters.row.ss_01),
      ss_02: parameters.row?.ss_02 && dayjs(parameters.row.ss_02),
      ss_03: parameters.row?.ss_03 && dayjs(parameters.row.ss_03),
      ss_04: parameters.row?.ss_04 && dayjs(parameters.row.ss_04),
      ss_05: parameters.row?.ss_05 && dayjs(parameters.row.ss_05),
      ss_06: parameters.row?.ss_06 && dayjs(parameters.row.ss_06),
      ss_07: parameters.row?.ss_07 && dayjs(parameters.row.ss_07),
      ss_08: parameters.row?.ss_08 && dayjs(parameters.row.ss_08),
      ty_01: parameters.row?.ty_01 && parameters.row.ty_01.trim(),
      ty_02: parameters.row?.ty_02 && parameters.row.ty_02.trim(),
      ty_03: parameters.row?.ty_03 && parameters.row.ty_03.trim(),
      ty_04: parameters.row?.ty_04 && parameters.row.ty_04.trim(),
      ty_05: parameters.row?.ty_05 && parameters.row.ty_05.trim(),
      ty_06: parameters.row?.ty_06 && parameters.row.ty_06.trim(),
      ty_07: parameters.row?.ty_07 && parameters.row.ty_07.trim(),
      ty_08: parameters.row?.ty_08 && parameters.row.ty_08.trim(),
      nome: `${parameters.row.SRN_0} ${parameters.row.NAM_0}`
    }
    form.setFieldsValue(vals);
    submitting.end();
  }

  const onFinish = async () => {
    submitting.trigger();
    let values = form.getFieldsValue(true);
    const v = schema().validate(values, { abortEarly: false, messages: validateMessages, context: {} });
    let { errors, warnings, value, ...status } = getStatus(v);
    const vals = { ...values };
    let nt = 0;
    if (errors === 0) {
      for (let i = 1; i < 8; i++) {
        vals[`ss_${`${i}`.padStart(2, '0')}`] = vals[`ss_${`${i}`.padStart(2, '0')}`] && dayjs(vals[`ss_${`${i}`.padStart(2, '0')}`]).format(DATETIME_FORMAT);
        let v1 = values[`ss_${`${i}`.padStart(2, '0')}`];
        let v2 = values[`ss_${`${i + 1}`.padStart(2, '0')}`];
        if (v1) {
          nt++;
        }
        v1 = v1 && v1.unix();//dayjs.duration(v1.format(TIME_FORMAT)).asSeconds();
        v2 = v2 && v2.unix();//dayjs.duration(v2.format(TIME_FORMAT)).asSeconds();
        if (v1 && !values[`ty_${`${i}`.padStart(2, '0')}`]) {
          errors = 1;
          status.fieldStatus[`ty_${`${i}`.padStart(2, '0')}`] = { status: "error", messages: [{ message: `[Picagem ${`${i}`.padStart(2, '0')}] o tipo tem de estar preenchido!` }] };
        }
        if (v2 && !v1) {
          errors = 1;
          status.fieldStatus[`ss_${`${i}`.padStart(2, '0')}`] = { status: "error", messages: [{ message: `[Picagem ${`${i}`.padStart(2, '0')}] a hora tem de estar preenchida!` }] };
        } else {
          if ((v1 && v2) && v2 < v1) {
            status.fieldStatus[`ss_${`${i + 1}`.padStart(2, '0')}`] = { status: "error", messages: [{ message: `[Picagem ${`${i + 1}`.padStart(2, '0')}] a hora de picagem tem de ser superior à hora de picagem anterior!` }] };
          }
        }
      }
    }
    setFieldStatus({ ...status.fieldStatus });
    setFormStatus({ ...status.formStatus });
    if (errors === 0) {
      try {
        vals["nt"] = nt;
        let response = await fetchPost({ url: `${API_URL}/rponto/sqlp/`, withCredentials: true, filter: {}, parameters: { method: "UpdateRecords", values: vals } });
        if (response.data.status !== "error") {
          parameters.openNotification(response.data.status, 'top', "Notificação", response.data.title);
          props?.loadParentData();
        } else {
          status.formStatus.error.push({ message: response.data.title });
          setFormStatus({ ...status.formStatus });
        }
      } catch (e) {
        Modal.error({ centered: true, width: "auto", style: { maxWidth: "768px" }, title: 'Erro!', content: <div style={{ display: "flex" }}><div style={{ maxHeight: "60vh", width: "100%" }}><YScroll>{e.message}</YScroll></div></div> });

      } finally {
        submitting.end();
      };
    } else {
      submitting.end();
    }
  }

  const onValuesChange = (changedValues, values) => {
    for (let key of Object.keys(changedValues)) {
      if (!key.startsWith('ss_')) continue;
      if (changedValues[key]) {
        //form.setFieldValue(key, moment(moment(values.dts + ' ' + changedValues[key].format(TIME_FORMAT), DATETIME_FORMAT)));
      }
    }
  }

  const down = (n) => {
    submitting.trigger();
    let vals = form.getFieldsValue(true);
    if (!vals[`ss_${`${n}`.padStart(2, '0')}`]) {
      submitting.end();
      return;
    }
    if (!vals[`ss_${`${n + 1}`.padStart(2, '0')}`]) {
      vals[`ss_${`${n + 1}`.padStart(2, '0')}`] = vals[`ss_${`${n}`.padStart(2, '0')}`];
      vals[`ss_${`${n}`.padStart(2, '0')}`] = null;
      vals[`ty_${`${n + 1}`.padStart(2, '0')}`] = vals[`ty_${`${n}`.padStart(2, '0')}`];
      vals[`ty_${`${n}`.padStart(2, '0')}`] = null;
    } else if (!vals[`ss_${`${8}`.padStart(2, '0')}`]) {
      for (let i = 8; i > n; i--) {
        vals[`ss_${`${i}`.padStart(2, '0')}`] = vals[`ss_${`${i - 1}`.padStart(2, '0')}`];
        vals[`ty_${`${i}`.padStart(2, '0')}`] = vals[`ty_${`${i - 1}`.padStart(2, '0')}`];
      }
      vals[`ss_${`${n}`.padStart(2, '0')}`] = null;
      vals[`ty_${`${n}`.padStart(2, '0')}`] = null;
    }
    form.setFieldsValue(vals);
    submitting.end();
  }

  const up = (n) => {
    submitting.trigger();
    let vals = form.getFieldsValue(true);
    if (!vals[`ss_${`${n}`.padStart(2, '0')}`]) {
      submitting.end();
      return;
    }
    if (!vals[`ss_${`${n - 1}`.padStart(2, '0')}`]) {
      vals[`ss_${`${n - 1}`.padStart(2, '0')}`] = vals[`ss_${`${n}`.padStart(2, '0')}`];
      vals[`ss_${`${n}`.padStart(2, '0')}`] = null;
      vals[`ty_${`${n - 1}`.padStart(2, '0')}`] = vals[`ty_${`${n}`.padStart(2, '0')}`];
      vals[`ty_${`${n}`.padStart(2, '0')}`] = null;
    } else if (!vals[`ss_${`${1}`.padStart(2, '0')}`]) {
      for (let i = 1; i < n; i++) {
        vals[`ss_${`${i}`.padStart(2, '0')}`] = vals[`ss_${`${i + 1}`.padStart(2, '0')}`];
        vals[`ty_${`${i}`.padStart(2, '0')}`] = vals[`ty_${`${i + 1}`.padStart(2, '0')}`];
      }
      vals[`ss_${`${n}`.padStart(2, '0')}`] = null;
      vals[`ty_${`${n}`.padStart(2, '0')}`] = null;
    }
    form.setFieldsValue(vals);
    submitting.end();
  }

  const erase = (n) => {
    let vals = form.getFieldsValue(true);
    vals[`ss_${`${n}`.padStart(2, '0')}`] = null;
    vals[`ty_${`${n}`.padStart(2, '0')}`] = null;
    form.setFieldsValue(vals);
  }

  return (
    <YScroll>
      <AlertsContainer /* id="el-external" */ mask fieldStatus={fieldStatus} formStatus={formStatus} portal={false} />
      <FormContainer initialValues={{}} id="LAY-FIX" fluid loading={submitting.state} wrapForm={true} form={form} fieldStatus={fieldStatus} setFieldStatus={setFieldStatus} onFinish={onFinish} onValuesChange={onValuesChange} schema={schemaFix} wrapFormItem={true} forInput={true} alert={{ tooltip: true, pos: "none" }}>
        <Row style={{ marginBottom: "20px" }} gutterWidth={10}>
          <Col xs="content"><Field forInput={false} wrapFormItem={true} name="num" label={{ enabled: true, text: "Número" }}><Input size="small" /></Field></Col>
          <Col width={300}><Field forInput={false} wrapFormItem={true} name="nome" label={{ enabled: true, text: "Nome" }}><Input size="small" /></Field></Col>
          <Col xs="content"><Field forInput={false} wrapFormItem={true} name="dts" label={{ enabled: true, text: "Data" }}><Input size="small" /></Field></Col>
        </Row>
        <Row style={{}} gutterWidth={10}>
          <Col width={20} style={{ padding: "3px" }}>01</Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<BsFillEraserFill />} onClick={() => erase(1)} /></Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button disabled size="small" icon={<CaretUpOutlined />} onClick={() => up(1)} /></Col>
          <Col width={20} style={{ marginRight: "10px", alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretDownOutlined />} onClick={() => down(1)} /></Col>
          <Col width={200}><Field wrapFormItem={true} name="ss_01" label={{ enabled: false, text: "Picagem 01" }}><DatePicker format={DATETIME_FORMAT} size="small" showTime /></Field></Col>
          <Col xs="content"><Field wrapFormItem={true} name="ty_01" label={{ enabled: false, text: "Tipo" }}><SelectField style={{ width: "90px" }} size="small" keyField="value" textField="label" data={typeList} /></Field></Col>
        </Row>
        <Row style={{}} gutterWidth={10}>
          <Col width={20} style={{ padding: "3px" }}>02</Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<BsFillEraserFill />} onClick={() => erase(2)} /></Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretUpOutlined />} onClick={() => up(2)} /></Col>
          <Col width={20} style={{ marginRight: "10px", alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretDownOutlined />} onClick={() => down(2)} /></Col>
          <Col width={200}><Field wrapFormItem={true} name="ss_02" label={{ enabled: false, text: "Picagem 02" }}><DatePicker format={DATETIME_FORMAT} size="small" showTime /></Field></Col>
          <Col xs="content"><Field wrapFormItem={true} name="ty_02" label={{ enabled: false, text: "Tipo" }}><SelectField style={{ width: "90px" }} size="small" keyField="value" textField="label" data={typeList} /></Field></Col>
        </Row>
        <Row style={{}} gutterWidth={10}>
          <Col width={20} style={{ padding: "3px" }}>03</Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<BsFillEraserFill />} onClick={() => erase(3)} /></Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretUpOutlined />} onClick={() => up(3)} /></Col>
          <Col width={20} style={{ marginRight: "10px", alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretDownOutlined />} onClick={() => down(3)} /></Col>
          <Col width={200}><Field wrapFormItem={true} name="ss_03" label={{ enabled: false, text: "Picagem 03" }}><DatePicker format={DATETIME_FORMAT} size="small" showTime /></Field></Col>
          <Col xs="content"><Field wrapFormItem={true} name="ty_03" label={{ enabled: false, text: "Tipo" }}><SelectField style={{ width: "90px" }} size="small" keyField="value" textField="label" data={typeList} /></Field></Col>
        </Row>
        <Row style={{}} gutterWidth={10}>
          <Col width={20} style={{ padding: "3px" }}>04</Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<BsFillEraserFill />} onClick={() => erase(4)} /></Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretUpOutlined />} onClick={() => up(4)} /></Col>
          <Col width={20} style={{ marginRight: "10px", alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretDownOutlined />} onClick={() => down(4)} /></Col>
          <Col width={200}><Field wrapFormItem={true} name="ss_04" label={{ enabled: false, text: "Picagem 04" }}><DatePicker format={DATETIME_FORMAT} size="small" showTime /></Field></Col>
          <Col xs="content"><Field wrapFormItem={true} name="ty_04" label={{ enabled: false, text: "Tipo" }}><SelectField style={{ width: "90px" }} size="small" keyField="value" textField="label" data={typeList} /></Field></Col>
        </Row>
        <Row style={{}} gutterWidth={10}>
          <Col width={20} style={{ padding: "3px" }}>05</Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<BsFillEraserFill />} onClick={() => erase(5)} /></Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretUpOutlined />} onClick={() => up(5)} /></Col>
          <Col width={20} style={{ marginRight: "10px", alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretDownOutlined />} onClick={() => down(5)} /></Col>
          <Col width={200}><Field wrapFormItem={true} name="ss_05" label={{ enabled: false, text: "Picagem 05" }}><DatePicker format={DATETIME_FORMAT} size="small" showTime /></Field></Col>
          <Col xs="content"><Field wrapFormItem={true} name="ty_05" label={{ enabled: false, text: "Tipo" }}><SelectField style={{ width: "90px" }} size="small" keyField="value" textField="label" data={typeList} /></Field></Col>
        </Row>
        <Row style={{}} gutterWidth={10}>
          <Col width={20} style={{ padding: "3px" }}>06</Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<BsFillEraserFill />} onClick={() => erase(6)} /></Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretUpOutlined />} onClick={() => up(6)} /></Col>
          <Col width={20} style={{ marginRight: "10px", alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretDownOutlined />} onClick={() => down(6)} /></Col>
          <Col width={200}><Field wrapFormItem={true} name="ss_06" label={{ enabled: false, text: "Picagem 06" }}><DatePicker format={DATETIME_FORMAT} size="small" showTime /></Field></Col>
          <Col xs="content"><Field wrapFormItem={true} name="ty_06" label={{ enabled: false, text: "Tipo" }}><SelectField style={{ width: "90px" }} size="small" keyField="value" textField="label" data={typeList} /></Field></Col>
        </Row>
        <Row style={{}} gutterWidth={10}>
          <Col width={20} style={{ padding: "3px" }}>07</Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<BsFillEraserFill />} onClick={() => erase(7)} /></Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretUpOutlined />} onClick={() => up(7)} /></Col>
          <Col width={20} style={{ marginRight: "10px", alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretDownOutlined />} onClick={() => down(7)} /></Col>
          <Col width={200}><Field wrapFormItem={true} name="ss_07" label={{ enabled: false, text: "Picagem 07" }}><DatePicker format={DATETIME_FORMAT} size="small" showTime /></Field></Col>
          <Col xs="content"><Field wrapFormItem={true} name="ty_07" label={{ enabled: false, text: "Tipo" }}><SelectField style={{ width: "90px" }} size="small" keyField="value" textField="label" data={typeList} /></Field></Col>
        </Row>
        <Row style={{}} gutterWidth={10}>
          <Col width={20} style={{ padding: "3px" }}>08</Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<BsFillEraserFill />} onClick={() => erase(8)} /></Col>
          <Col width={20} style={{ alignSelf: "end", padding: "3px" }}><Button size="small" icon={<CaretUpOutlined />} onClick={() => up(8)} /></Col>
          <Col width={20} style={{ marginRight: "10px", alignSelf: "end", padding: "3px" }}><Button size="small" disabled icon={<CaretDownOutlined />} onClick={() => down(8)} /></Col>
          <Col width={200}><Field wrapFormItem={true} name="ss_08" label={{ enabled: false, text: "Picagem 08" }}><DatePicker format={DATETIME_FORMAT} size="small" showTime /></Field></Col>
          <Col xs="content"><Field wrapFormItem={true} name="ty_08" label={{ enabled: false, text: "Tipo" }}><SelectField style={{ width: "90px" }} size="small" keyField="value" textField="label" data={typeList} /></Field></Col>
        </Row>
      </FormContainer>
      {props?.extraRef && <Portal elId={props?.extraRef.current}>
        <Space>
          <Button type="primary" disabled={submitting.state} onClick={onFinish}>Registar</Button>
          <Button onClick={props?.closeParent}>Cancelar</Button>
        </Space>
      </Portal>
      }
    </YScroll>
  );
}



export default ({ setFormTitle, ...props }) => {
  const media = useContext(MediaContext);
  const { openNotification } = useContext(LayoutContext);
  const { auth } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();
  const classes = useStyles();
  const [formFilter] = Form.useForm();
  const primaryKeys = ['id'];
  const defaultFilters = {};
  const defaultParameters = { method: "RegistosRH" };
  const defaultSort = [{ column: "dts", direction: "DESC" }, { column: "num", direction: "ASC" }];
  const dataAPI = useDataAPI({ id: props.id, payload: { url: `${API_URL}/rponto/sqlp/`, withCredentials: true, parameters: {}, pagination: { enabled: true, page: 1, pageSize: 20 }, filter: defaultFilters, sort: [] } });
  const submitting = useSubmitting(true);
  const [num, setNum] = useState(null);

  const [modalParameters, setModalParameters] = useState({});
  const [showModal, hideModal] = useModal(({ in: open, onExited }) => {

    const content = () => {
      switch (modalParameters.content) {
        case "viewregistosvisuais": return <RegistosVisuaisViewer p={modalParameters.parameters.p} column="" parameters={modalParameters.parameters} />;
        case "viewbiometrias": return <Biometrias parameters={modalParameters.parameters} />;
        case "viewinvalidrecords": return <InvalidRecords parameters={modalParameters.parameters} />;
        case "fix": return <Fix parameters={modalParameters.parameters} loadParentData={modalParameters.loadData} />;
      }
    }

    return (
      <ResponsiveModal title={modalParameters?.title} type={modalParameters?.type} push={modalParameters?.push} onCancel={hideModal} width={modalParameters.width} height={modalParameters.height} footer="ref" extra="ref" yScroll>
        {content()}
      </ResponsiveModal>
    );
  }, [modalParameters]);

  const editable = (row, col) => {
    /* if (modeEdit.datagrid && permission.isOk({ action: "changeDestino" }) && !row?.carga_id && !row?.SDHNUM_0) {
        return (col === "destino") ? true : false;
    } */
    return false;
  }
  const editableClass = (row, col, v) => {
    if (col === "ss") {
      if (v?.trim() === 'in') {
        return classes.in;
      } else if (v?.trim() === 'out') {
        return classes.out;
      }
    }
  }

  const columns = [
     ...isRH(auth, num) ? [
        { key: 'num', name: 'Número', frozen: true, width: 90, formatter: p => <div style={{ fontWeight: 700 }}>{p.row.num}</div> },
        { key: 'nome_colaborador', name: 'Nome', width: 200, formatter: p => <div style={{ fontWeight: 700 }}>{p.row.nome_colaborador}</div> },
        { key: 'data_turno', name: 'Data Turno', width: 100, reportTitle: 'Data do Turno' },
        { key: 'tipo_turno', name: 'Tipo Turno', width: 120, reportTitle: 'Tipo de Turno' },
        { key: 'hora_entrada', name: 'Entrada', width: 80 },
        { key: 'hora_saida', name: 'Saída', width: 80 },
        { key: 'duracao_turno', name: 'Duração', width: 80 },
    ] : [],
    { key: 'dts', width: 100, name: 'Data', frozen: true, formatter: p => dayjs(p.row.dts).format(DATE_FORMAT) },
    ...(isRH(auth, num)) ? [{ key: 'baction', name: '', minWidth: 45, maxWidth: 40, formatter: p => <Button icon={<EditOutlined />} size="small" onClick={() => onFix(p.row)} /> }] : [],
    ...isRH(auth, num) ? [{ key: 'SRN_0', name: 'Nome', width: '0.94fr', formatter: p => <div style={{ fontWeight: 700 }}>{`${p.row.SRN_0} ${p.row.NAM_0}`}</div> }] : [],
    { key: 'nt', name: 'Picagens', width: 80, formatter: p => p.row.nt },
    { key: 'ty_01', name: '', hidden: true, reportTitle: "es_01", minWidth: 35, width: 35, formatter: p => p.row.ty_01?.trim() === 'in' ? "E" : "S" },
    { key: 'ss_01', width: 130, name: 'P01', formatter: p => p.row.ss_01 && dayjs(p.row.ss_01).format(DATETIME_FORMAT), cellClass: r => editableClass(r, 'ss', r.ty_01) },
    { key: 'ty_02', name: '', hidden: true, reportTitle: "es_02", minWidth: 35, width: 35, formatter: p => p.row.ty_02?.trim() === 'in' ? "E" : "S" },
    { key: 'ss_02', width: 130, name: 'P02', formatter: p => p.row.ss_02 && dayjs(p.row.ss_02).format(DATETIME_FORMAT), cellClass: r => editableClass(r, 'ss', r.ty_02) },
    { key: 'ty_03', name: '', hidden: true, reportTitle: "es_03", minWidth: 35, width: 35, formatter: p => p.row.ty_03?.trim() === 'in' ? "E" : "S" },
    { key: 'ss_03', width: 130, name: 'P03', formatter: p => p.row.ss_03 && dayjs(p.row.ss_03).format(DATETIME_FORMAT), cellClass: r => editableClass(r, 'ss', r.ty_03) },
    { key: 'ty_04', name: '', hidden: true, reportTitle: "es_04", minWidth: 35, width: 35, formatter: p => p.row.ty_04?.trim() === 'in' ? "E" : "S" },
    { key: 'ss_04', width: 130, name: 'P04', formatter: p => p.row.ss_04 && dayjs(p.row.ss_04).format(DATETIME_FORMAT), cellClass: r => editableClass(r, 'ss', r.ty_04) },
    { key: 'ty_05', name: '', hidden: true, reportTitle: "es_05", minWidth: 35, width: 35, formatter: p => p.row.ty_05?.trim() === 'in' ? "E" : "S" },
    { key: 'ss_05', width: 130, name: 'P05', formatter: p => p.row.ss_05 && dayjs(p.row.ss_05).format(DATETIME_FORMAT), cellClass: r => editableClass(r, 'ss', r.ty_05) },
    { key: 'ty_06', name: '', hidden: true, reportTitle: "es_06", minWidth: 35, width: 35, formatter: p => p.row.ty_06?.trim() === 'in' ? "E" : "S" },
    { key: 'ss_06', width: 130, name: 'P06', formatter: p => p.row.ss_06 && dayjs(p.row.ss_06).format(DATETIME_FORMAT), cellClass: r => editableClass(r, 'ss', r.ty_06) },
    { key: 'ty_07', name: '', hidden: true, reportTitle: "es_07", minWidth: 35, width: 35, formatter: p => p.row.ty_07?.trim() === 'in' ? "E" : "S" },
    { key: 'ss_07', width: 130, name: 'P07', formatter: p => p.row.ss_07 && dayjs(p.row.ss_07).format(DATETIME_FORMAT), cellClass: r => editableClass(r, 'ss', r.ty_07) },
    { key: 'ty_08', name: '', hidden: true, reportTitle: "es_08", minWidth: 35, width: 35, formatter: p => p.row.ty_08?.trim() === 'in' ? "E" : "S" },
    { key: 'ss_08', width: 130, name: 'P08', formatter: p => p.row.ss_08 && dayjs(p.row.ss_08).format(DATETIME_FORMAT), cellClass: r => editableClass(r, 'ss', r.ty_08) },
    ...(isRH(auth, num)) ? [{
      key: 'pic', sortable: false,
      minWidth: 45, width: 45,
      name: "",
      formatter: p => <Button icon={<CameraOutlined />} size="small" onClick={() => onRegistosVisuais(p)} />
      //formatter: p => <CameraOutlined style={{ cursor: "pointer" }} onClick={() => <RegistosVisuaisViewer p={p} column="" title="Registos Visuais" />} />,
      //editor: (p) => { return <RegistosVisuaisViewer p={p} column="" title="Registos Visuais" /> },
      //editorOptions: { editOnClick: true },
    }] : []

  ];

  useEffect(() => {
    const controller = new AbortController();
    const interval = loadData({ init: true, signal: controller.signal });
    return (() => { controller.abort(); (interval) && clearInterval(interval); });
  }, []);

  const loadData = async ({ init = false, signal } = {}) => {
    if (init) {
      const { num: _num, ...initFilters } = loadInit({}, { ...dataAPI.getAllFilter(), tstamp: dataAPI.getTimeStamp() }, props, { ...location?.state }, [...Object.keys(location?.state ? location?.state : {}), ...Object.keys(dataAPI.getAllFilter())]);
      setNum(_num);
      let { filterValues, fieldValues } = fixRangeDates(['fdata'], initFilters);
      formFilter.setFieldsValue({ ...fieldValues });
      dataAPI.addFilters({ ...filterValues, ...(_num && { num: _num }) }, true, false);
      dataAPI.setSort(defaultSort, false);
      dataAPI.addParameters(defaultParameters, true, true);
      dataAPI.fetchPost({ signal });

    }
    submitting.end();
  }

  const onFilterFinish = (type, values) => {
    switch (type) {
      case "filter":
        //remove empty values
        const vals = Object.fromEntries(Object.entries({ ...defaultFilters, ...values }).filter(([_, v]) => v !== null && v !== ''));
        const _values = {
          ...vals,
          fnum: getFilterValue(vals?.fnum, 'any'),
          fnome: getFilterValue(vals?.fnome, 'any'),
          fdata: getFilterRangeValues(vals["fdata"]?.formatted),

        };
        dataAPI.addFilters(_values, true);
        dataAPI.addParameters(defaultParameters);
        dataAPI.first();
        dataAPI.fetchPost();
        break;
    }
  };
  const onFilterChange = (changedValues, values) => {
    /* if ("type" in changedValues) {
        navigate("/app/picking/picknwlist", { state: { ...location?.state, ...formFilter.getFieldsValue(true), type: changedValues.type, tstamp: Date.now() }, replace: true });
    } */
  };

  const onViewBiometrias = () => {
    setModalParameters({ content: "viewbiometrias", type: "drawer", title: "Biometrias", push: false, width: "650px", parameters: { openNotification } });
    showModal();
  }

  const onInvalidRecords = () => {
    setModalParameters({ content: "viewinvalidrecords", type: "drawer", title: "Registos Inválidos", push: false, width: "550px", parameters: { openNotification } });
    showModal();
  }


  const onFix = (row) => {
    setModalParameters({ content: "fix", type: "drawer", title: `Corrigir Registo de Picagem`, push: false, width: "90%", loadData: () => dataAPI.fetchPost(), parameters: { openNotification, row } });
    showModal();
  }

  const onRegistosVisuais = (p) => {
    setModalParameters({ content: "viewregistosvisuais", type: "drawer", title: `Registos Visuais`, push: false, width: "550px", loadData: () => dataAPI.fetchPost(), parameters: { openNotification, p } });
    showModal();
  }

  return (
    <>
      {!setFormTitle && <TitleForm isRH={isRH(auth, num)} />}
      <Table
        loading={submitting.state}
        /*  actionColumn={<ActionContent dataAPI={dataAPI} onClick={onAction} modeEdit={modeEdit.datagrid} />} */
        frozenActionColumn={true}
        reportTitle={title}
        loadOnInit={false}
        columns={columns}
        dataAPI={dataAPI}
        toolbar={true}
        search={true}
        moreFilters={true}
        rowSelection={false}
        primaryKeys={primaryKeys}
        editable={true}
        clearSort={false}
        rowHeight={28}
        rowClass={(row) => (row?.valid === 0 ? classes.notValid : undefined)}
        leftToolbar={<Space>
          {(isRH(auth, num)) && <>
            <Button disabled={submitting.state} onClick={onViewBiometrias}>Biometrias</Button>
            <Button disabled={submitting.state} onClick={onInvalidRecords}>Registos Inválidos</Button></>
          }
          {(!isRH(auth, num)) && <><LeftUserItem auth={auth} /></>}
        </Space>}
        toolbarFilters={{
          form: formFilter, schema, onFinish: onFilterFinish, onValuesChange: onFilterChange,
          filters: <ToolbarFilters dataAPI={dataAPI} auth={auth} num={num} />,
          moreFilters: { schema: isRH(auth, num) ? moreFiltersSchema : moreFiltersSchemaPrivate, rules: moreFiltersRules, width: 500, mask: true }
        }}
      />
    </>
  );


};