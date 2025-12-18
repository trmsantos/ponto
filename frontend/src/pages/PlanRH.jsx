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
import { API_URL, ROOT_URL } from "config";
import { useDataAPI } from "utils/useDataAPI";
import { getFilterRangeValues, getFilterValue, secondstoDay } from "utils";
import Portal from "components/portal";
import { Button, Spin, Form, Space, Input, Typography, Modal, Select, Tag, Alert, Drawer, Image, TimePicker, InputNumber } from "antd";
const { TextArea } = Input;
import ToolbarTitle from './commons/ToolbarTitle';
const { Title } = Typography;
import { json } from "utils/object";
import { EditOutlined, CameraOutlined, DeleteTwoTone, CaretDownOutlined, CaretUpOutlined, PrinterOutlined } from '@ant-design/icons';
import ResultMessage from 'components/resultMessage';
import Table from 'components/TableV2';
import { DATE_FORMAT, DATETIME_FORMAT, TIME_FORMAT, DATE_FORMAT_NO_SEPARATOR } from 'config';
import uuIdInt from "utils/uuIdInt";
import { useModal } from "react-modal-hook";
import ResponsiveModal from 'components/Modal';
import { Container, Row, Col, Visible, Hidden } from 'react-grid-system';
import { Field, Container as FormContainer, SelectField, AlertsContainer, RangeDateField, SelectDebounceField, CheckboxField, Selector, SelectMultiField } from 'components/FormFields';
import YScroll from 'components/YScroll';
import { isRH, isPrivate, LeftUserItem } from './commons';
import { MediaContext, AppContext } from "./App";
import { LayoutContext } from "./GridLayout";
import { BsFillEraserFill } from 'react-icons/bs';
import { downloadReport } from 'components/DownloadReports';

const title = "Plano de Horários";
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
    background: "#ff7875"
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
    {isRH(auth, num) && <><Col width={80}>
      <Field name="fnum" label={{ enabled: true, text: "Número", pos: "top", padding: "0px" }}>
        <InputNumber style={{ width: "100%" }} size='small' />
      </Field>
    </Col>
      <Col width={180}>
        <Field name="fnome" label={{ enabled: true, text: "Nome", pos: "top", padding: "0px" }}>
          <Input size='small' allowClear />
        </Field>
      </Col></>}
    <Col width={80}>
      <Field name="y" label={{ enabled: true, text: "Ano", pos: "top", padding: "0px" }}>
        <InputNumber style={{ width: "100%" }} size='small' min={2015} max={new Date().getFullYear()} />
      </Field>
    </Col>
    <Col width={80}>
      <Field name="m" label={{ enabled: true, text: "Mês", pos: "top", padding: "0px" }}>
        <InputNumber style={{ width: "100%" }} size='small' min={1} max={12} />
      </Field>
    </Col>
  </>
  );
}
const moreFiltersRules = (keys) => { return getSchema({}, { keys }).unknown(true); }
const TipoRelation = () => <Select size='small' options={[{ value: "e" }, { value: "ou" }, { value: "!e" }, { value: "!ou" }]} />;
const moreFiltersSchema = ({ form }) => [
  { fnum: { label: "Número", field: { type: 'inputnumber', min: 1, size: 'small' } } },
  { fnome: { label: "Nome", field: { type: 'input', size: 'small' } } },
  { y: { label: "Ano", field: { type: "inputnumber", size: 'small', min: 2015, max: (new Date().getFullYear()) } }, m: { label: "Mês", field: { type: "inputnumber", size: 'small', min: 1, max: 12 } } }
];
const moreFiltersSchemaPrivate = ({ form }) => [
  { y: { label: "Ano", field: { type: "inputnumber", size: 'small', min: 2015, max: (new Date().getFullYear()) } }, m: { label: "Mês", field: { type: "inputnumber", size: 'small', min: 1, max: 12 } } }
];


const PrintRPD = ({ closeSelf, parentRef, parameters, ...props }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const classes = useStyles();
  const [form] = Form.useForm();
  const [fieldStatus, setFieldStatus] = useState({});
  const [formStatus, setFormStatus] = useState({ error: [], warning: [], info: [], success: [] });
  const submitting = useSubmitting(true);

  const schemaRPD = (options = {}) => {
    return getSchema({
      num: Joi.any().label("Número").required(),
      month: Joi.any().label("Mês").required(),
      year: Joi.number().positive().integer().label("Ano").required()
    }, options).unknown(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    loadData({ signal: controller.signal });
    return (() => controller.abort());
  }, []);

  const loadData = async ({ signal } = {}) => {
    submitting.trigger();
    var currentTime = new Date();
    const vals = {
      month: [{ value: currentTime.getMonth() + 1, label: currentTime.getMonth() + 1 }],
      year: currentTime.getFullYear()
    }
    form.setFieldsValue(vals);
    submitting.end();
  }

  const onFinish = async () => {
    submitting.trigger();
    const values = form.getFieldsValue(true);
    const v = schemaRPD().validate(values, { abortEarly: false, messages: validateMessages, context: {} });
    let { errors, warnings, value, ...status } = getStatus(v);
    setFieldStatus({ ...status.fieldStatus });
    setFormStatus({ ...status.formStatus });
    if (errors === 0) {
      let data = {
        months: values.month,
        y: values.year,
        fnum: values.num.REFNUM_0.replace("F", "")
      }

      let cols = {};
      if (Array.isArray(parameters.columns)) {
        for (const v of parameters.columns) {
          if (!v?.ignoreReport) {
            cols[v.key] = { title: v?.reportTitle ? v.reportTitle : (typeof (v.name) !== "object" ? v.name : v.key), width: v.width, format: v?.reportFormat && v.reportFormat };
          }
        }
        cols["NAM_0"] = { title: "NAME_0", width: 150 };
      }


      downloadReport({
        request: { url: `${API_URL}/rponto/sqlp/`, withCredentials: true, parameters: { method: "CalendarList" }, filter: { ...data } },
        type: { key: "template-p-xls" },
        limit: 2000,
        dataexport: { template: "planRH.xlsx", cols, extension: "zip" }
      });

    }
    submitting.end();
  }

  const onValuesChange = (changedValues, values) => {

  }

  return (
    <YScroll>
      <AlertsContainer /* id="el-external" */ mask fieldStatus={fieldStatus} formStatus={formStatus} portal={false} />
      <FormContainer initialValues={{}} id="LAY-PRT" fluid loading={submitting.state} wrapForm={true} form={form} fieldStatus={fieldStatus} setFieldStatus={setFieldStatus} onFinish={onFinish} onValuesChange={onValuesChange} schema={schemaRPD} wrapFormItem={true} forInput={true} alert={{ tooltip: true, pos: "none" }}>
        <Row style={{}} gutterWidth={10}>
          <Col>
            <Field wrapFormItem={true} name="num" label={{ enabled: true, text: "Número" }}>
              <Selector
                title="Colaboradores"
                params={{ payload: { url: `${API_URL}/rponto/sqlp/`, withCredentials: true, parameters: { method: "EmployeesLookup" }, pagination: { enabled: false, limit: 150 }, filter: {}, sort: [{ column: "REFNUM_0", direction: "ASC" }] } }}
                keyField={["REFNUM_0"]}
                textField="FULLNAME"
                detailText={r => r?.REFNUM_0}
                columns={[
                  { key: 'REFNUM_0', name: 'Número', width: 90 },
                  { key: 'FULLNAME', name: 'Nome' }
                ]}
                filters={{ fmulti: { type: "any", width: 150, text: "Colaborador", autoFocus: true } }}
                moreFilters={{}}
              />
            </Field>
            {/* <Field wrapFormItem={true} name="num" label={{ enabled: true, text: "Número" }}><InputNumber size="small" min={1} /></Field> */}
          </Col>
        </Row>
        <Row style={{}} gutterWidth={10}>
          <Col><Field wrapFormItem={true} name="month" label={{ enabled: true, text: "Mês" }}>
            <SelectMultiField allowClear data={[{ key: 1, value: 1 }, { key: 2, value: 2 }, { key: 3, value: 3 }, { key: 4, value: 4 }, { key: 5, value: 5 }, { key: 6, value: 6 }, { key: 7, value: 7 }, { key: 8, value: 8 }, { key: 9, value: 9 }, { key: 10, value: 10 }, { key: 11, value: 11 }, { key: 12, value: 12 }]} />
          </Field>
          </Col>
          <Col xs="content"><Field wrapFormItem={true} name="year" label={{ enabled: true, text: "Ano" }}><InputNumber min={2015} max={(new Date()).getFullYear} /></Field></Col>
        </Row>
      </FormContainer>
      {props?.extraRef && <Portal elId={props?.extraRef.current}>
        <Space>
          <Button size='large' icon={<PrinterOutlined />} type="primary" disabled={submitting.state} onClick={onFinish} />
          <Button size='large' onClick={props?.closeParent}>Cancelar</Button>
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
  const primaryKeys = ['REFNUM_0', 'date'];
  const defaultFilters = {};
  const defaultParameters = { method: "CalendarList" };
  const defaultSort = [{ column: "REFNUM_0", direction: "ASC" }, { column: "C.[date]", direction: "DESC" }];
  const dataAPI = useDataAPI({ id: props.id, payload: { url: `${API_URL}/rponto/sqlp/`, withCredentials: true, parameters: {}, pagination: { enabled: true, page: 1, pageSize: 20 }, filter: defaultFilters, sort: [] } });
  const submitting = useSubmitting(true);
  const [num, setNum] = useState(null);

  const [modalParameters, setModalParameters] = useState({});
  const [showModal, hideModal] = useModal(({ in: open, onExited }) => {

    const content = () => {
      switch (modalParameters.content) {
        case "printrpd": return <PrintRPD parameters={modalParameters.parameters} />;
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
    /*  if (col === "ss") {
       if (v?.trim() === 'in') {
         return classes.in;
       } else if (v?.trim() === 'out') {
         return classes.out;
       }
     } */
  }

  const columns = [
    /* { key: 'bprint', name: '', ignoreReport: true, minWidth: 40, maxWidth: 40, formatter: p => <Button icon={<PrinterOutlined />} size="small" onClick={() => onFix(p.row)} /> }, */
    ...isRH(auth, num) ? [{ key: 'REFNUM_0', name: 'Número', width: 90, formatter: p => <div style={{ fontWeight: 700 }}>{p.row.REFNUM_0}</div> }] : [],
    { key: 'date', width: 100, name: 'Data', formatter: p => dayjs(p.row.date).format(DATE_FORMAT) },
    { key: 'WEEK', width: 100, name: 'Semana', formatter: p => p.row.WEEK },
    { key: 'wdayname', width: 100, name: 'Dia Semana', formatter: p => p.row.wdayname },
    ...isRH(auth, num) ? [{ key: 'FULLNAME', width: "1fr", name: 'Nome', formatter: p => <div style={{ fontWeight: 700 }}>{`${p.row.SRN_0} ${p.row.NAM_0}`}</div> }] : [],
    { key: 'PLNTYP_0', name: 'Planemeanto', width: 95, formatter: p => p.row.PLNTYP_0 },
    { key: 'EN_MANHA', width: 130, name: 'Entrada Manhã', formatter: p => p.row.EN_MANHA },
    { key: 'SA_MANHA', width: 130, name: 'Saída Manhã', formatter: p => p.row.SA_MANHA },
    { key: 'EN_TARDE', width: 130, name: 'Entrada Tarde', formatter: p => p.row.EN_TARDE },
    { key: 'SA_TARDE', width: 130, name: 'Saída Tarde', formatter: p => p.row.SA_TARDE }
  ];

  useEffect(() => {
    const controller = new AbortController();
    const interval = loadData({ init: true, signal: controller.signal });
    return (() => { controller.abort(); (interval) && clearInterval(interval); });
  }, [location?.state]);

  const loadData = async ({ init = false, signal } = {}) => {
    if (init) {
      const { num: _num, ...initFilters } = loadInit({ y: new Date().getFullYear(), m: (new Date().getMonth() + 1) }, { ...dataAPI.getAllFilter(), tstamp: dataAPI.getTimeStamp() }, props, { ...location?.state }, [...Object.keys(location?.state ? location?.state : {}), ...Object.keys(dataAPI.getAllFilter())]);
      setNum(_num);
      //const initFilters = loadInit({ y: new Date().getFullYear(), m: (new Date().getMonth() + 1) }, { ...dataAPI.getAllFilter(), tstamp: dataAPI.getTimeStamp() }, props, {}, [...Object.keys(dataAPI.getAllFilter())]);
      let { filterValues, fieldValues } = fixRangeDates([], initFilters);
      formFilter.setFieldsValue({ ...fieldValues });
      dataAPI.addFilters({ ...filterValues, ...(_num && { num: _num }) }, true, false);
      dataAPI.setSort(defaultSort);
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
          fnome: getFilterValue(vals?.fnome, 'any')
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


  const onPrintRPD = () => {
    setModalParameters({ content: "printrpd", type: "drawer", title: "Imprimir", push: false, width: "400px", loadData: () => dataAPI.fetchPost(), parameters: { openNotification, columns } });
    showModal();
  }

  return (
    <>
      {!setFormTitle && <TitleForm isRH={isRH(auth, num)} />}
      <Table
        loading={submitting.state}
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
          {isRH(auth, num) && <Button size="large" icon={<PrinterOutlined />} disabled={submitting.state} onClick={onPrintRPD}>Imprimir Plano Mensal</Button>}
          {(!isRH(auth, num)) && <> <LeftUserItem auth={auth} /></>}
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