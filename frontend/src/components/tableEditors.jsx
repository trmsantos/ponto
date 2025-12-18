import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { createUseStyles } from 'react-jss';
import styled from 'styled-components';
import Joi, { alternatives } from 'joi';
import classNames from "classnames";
//import moment from 'moment';
import dayjs from 'dayjs';
import { useNavigate, useLocation } from "react-router-dom";
import { fetch, fetchPost, cancelToken } from "utils/fetch";
import { getSchema, pick, getStatus, validateMessages } from "utils/schemaValidator";
import { useSubmitting } from "utils";
import loadInit, { fixRangeDates } from "utils/loadInit";
import { useDataAPI } from "utils/useDataAPI";
import Toolbar from "components/toolbar";
import { getFilterRangeValues, getFilterValue, secondstoDay } from "utils";
import Portal from "components/portal";
import { Button, Spin, Form, Space, Input, InputNumber, Tooltip, Menu, Collapse, Typography, Modal, Select, Tag, DatePicker, Alert, Drawer, Badge, Checkbox } from "antd";
const { TextArea } = Input;
const { Title } = Typography;
import { CheckCircleOutlined, DeleteOutlined, PlusOutlined, CopyOutlined, AppstoreAddOutlined, PrinterOutlined, SyncOutlined, SnippetsOutlined, CheckOutlined, MoreOutlined, EditOutlined, ReadOutlined, LockOutlined, DeleteFilled, PlusCircleOutlined } from '@ant-design/icons';
import ResultMessage from 'components/resultMessage';
import Table from 'components/TableV2';
import uuIdInt from "utils/uuIdInt";
import { useModal } from "react-modal-hook";
import ResponsiveModal from 'components/Modal';
import { Container, Row, Col, Visible, Hidden } from 'react-grid-system';
import YScroll from 'components/YScroll';
import { Field, Container as FormContainer, SelectField, AlertsContainer, RangeDateField, SelectDebounceField, CheckboxField, Selector, SwitchField, Label, SelectMultiField } from 'components/FormFields';
import { API_URL, DOSERS, TIME_FORMAT, BOBINE_DEFEITOS, BOBINE_ESTADOS, DATE_FORMAT, DATETIME_FORMAT, TIPOEMENDA_OPTIONS, SOCKET, FORMULACAO_CUBAS, JUSTIFICATION_OUT } from 'config';
import { Status } from '../pages/bobines/commons';
import IconButton from "components/iconButton";
import { CgCloseO } from 'react-icons/cg';
import { sha1 } from 'crypto-hash';
import { json, orderObjectKeys } from "utils/object";

export const useEditorStyles = createUseStyles({
    noOutline: {
        outline: "none !important"
    },
    notValid: {
        background: "#ffe7ba"
    },
    center: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%"
    },
    bold: {
        fontWeight: 700
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

const focus = (el, h,) => { el?.focus(); };

export const CheckColumn = ({ id, name, onChange, defaultChecked = false, forInput, valid }) => {
    const ref = useRef();
    const onCheckChange = (e) => {
        ref.current.checked = !ref.current.checked;
        onChange(id, e);
    }
    return (<Space>{name}{(forInput) && <Checkbox ref={ref} onChange={onCheckChange} defaultChecked={defaultChecked} />}</Space>);
};

export const FieldDefeitos = ({ p }) => {
    return (
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "row" }}>
                {p.row.defeitos && p.row.defeitos.filter(v => v.value !== 'furos' && v.value !== 'buraco' && v.value !== 'rugas' && v.value !== 'ff' && v.value !== 'fc').map((v) => {
                    return (<Tag key={`d${v.value}-${p.row.id}`} color="error">{v.label}</Tag>);
                })}
            </div>
        </div>
    );
}


const schemaRange = ({ wrapObject = false, wrapArray = true, excludeKeys = [], keys = [] } = {}) => {
    return getSchema(
        Joi.object(
            pick(keys, {
                min: Joi.number().required().label("Mínimo"),
                max: Joi.number().greater(Joi.ref('min')).required().label("Máximo")
            }, excludeKeys)).unknown(true), { wrapObject, wrapArray, excludeKeys, keys });
}

export const ItemsField = ({ row, column }) => {
    const count = row[column] ? row[column].length : null;
    return (
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", height: "100%", alignItems: "center" }}><Badge count={count} /></div>
    )
}

export const ModalRangeEditor = ({ p, type, column, title, forInput, valid, unit = "m", ...props }) => {
    const classes = useEditorStyles();
    const [visible, setVisible] = useState(true);
    const [value, setvalue] = useState();
    const [form] = Form.useForm();
    const [fieldStatus, setFieldStatus] = useState({});
    const [formStatus, setFormStatus] = useState({ error: [], warning: [], info: [], success: [] });
    const submitting = useSubmitting(false);

    useEffect(() => {
        form.setFieldsValue({ items: p.row[column] });
    }, []);

    const onFinish = (e) => {
        if (!forInput || valid !== 1) {
            p.onClose();
            setVisible(false);
            return;
        }
        submitting.trigger();
        const values = form.getFieldsValue(true);
        if (e.type === "click" || (e.type === "keydown" && e.key === 'Enter')) {
            const v = schemaRange().label("items").required().messages({ "any.required": "É obrigatório definir pelo menos um intervalo de valores!" }).validate(values?.items, { abortEarly: false, messages: validateMessages });
            const { errors, warnings, value, ...status } = getStatus(v);
            setFieldStatus({ ...status.fieldStatus });
            setFormStatus({ ...status.formStatus });
            if (errors === 0) {
                const _value1 = json(value).map(({ min, max, unit, type }) => (orderObjectKeys({ min, max, unit, type })));
                const _value2 = json(p.row[column], null);
                const notValid = JSON.stringify(_value1) !== JSON.stringify(_value2 ? _value2.map(v => orderObjectKeys(v)) : _value2) ? 1 : 0;
                p.onRowChange({ ...p.row, [column]: _value1, notValid: (p.row?.notValid ? p.row?.notValid : notValid) }, true);
                p.onClose(true);
                setVisible(false);
            }
        }
        submitting.end();
    }

    const onValuesChange = () => { };
    const onCancel = () => {
        p.onClose();
        setVisible(false);

    };

    return (
        <Modal title={title} open={visible} destroyOnClose onCancel={onCancel} onOk={onFinish} width="350px">

            <Form form={form} name={`f-range`} onValuesChange={onValuesChange} initialValues={{}}>
                <AlertsContainer /* id="el-external" */ mask /* fieldStatus={fieldStatus} */ formStatus={formStatus} portal={false} />
                <FormContainer id="FRM-RANGE" fluid forInput={forInput} loading={submitting.state} wrapForm={false} form={form} fieldStatus={fieldStatus} setFieldStatus={setFieldStatus} style={{ marginTop: "5px", padding: "0px" }} schema={schemaRange} wrapFormItem={true} alert={{ tooltip: true, pos: "none" }}>
                    <Form.List name="items">
                        {(fields, { add, remove, move }) => {
                            const addRow = (fields) => {
                                if (fields.length === 0 && type == "furos") {
                                    add({ [`min`]: 1, [`max`]: p.row.comp_actual, "unit": unit });
                                } else {
                                    add({ [`min`]: null, [`max`]: null, "unit": unit, ...(type == "ff" && { "type": "Desbobinagem" }) });
                                }
                            }
                            const removeRow = (fieldName, field) => {
                                remove(fieldName);
                            }
                            const moveRow = (from, to) => {
                                //move(from, to);
                            }
                            return (
                                <>
                                    <div style={{ height: "300px" }}>
                                        <YScroll>
                                            {fields.map((field, index) => (
                                                <Row key={field.key} gutterWidth={1}>
                                                    <Col><Field name={[field.name, `min`]} label={{ enabled: false }}><InputNumber autoFocus size="small" style={{ width: "100%", textAlign: "right" }} controls={false} addonAfter={<b>{unit}</b>} min={0} max={p.row.comp} /></Field></Col>
                                                    <Col><Field name={[field.name, `max`]} label={{ enabled: false }} includeKeyRules={['min']} allValues={{ min: form.getFieldValue(['items', index, 'min']) }}><InputNumber size="small" style={{ width: "100%", textAlign: "right" }} controls={false} addonAfter={<b>{unit}</b>} min={0} max={p.row.comp_actual} /></Field></Col>
                                                    {type === "ff" && <Col xs="content"><Field name={[field.name, `type`]} label={{ enabled: false }}><Select size="small" style={{ width: "100%", textAlign: "right" }} options={[{ value: "Bobinagem" }, { value: "Desbobinagem" }]} /></Field></Col>}
                                                    <Col xs={2}>{forInput && <div className={classNames(classes.center)}><IconButton onClick={() => removeRow(field.name, field)} style={{ alignSelf: "center" }}><CgCloseO /></IconButton></div>}</Col>
                                                </Row>
                                            ))}
                                        </YScroll>
                                    </div>
                                    {forInput && <Row style={{ marginTop: "5px" }}><Col><Button disabled={!forInput} type="default" onClick={() => addRow(fields)} style={{ width: "100%" }}><PlusOutlined />Adicionar</Button></Col></Row>}
                                </>
                            )
                        }
                        }
                    </Form.List>
                </FormContainer>
            </Form>

        </Modal>
    );
}

export const SwitchEditor = ({ column, p, onChange, ...props }) => {
    return <SwitchField style={{}} autoFocus value={p.row[column]} onChange={onChange ? v => onChange(p.row, v,p) : (e) => p.onRowChange({ ...p.row, notValid: p.row[column] !== e ? 1 : 0, valid: p.row[column] !== e ? 0 : null, [column]: e }, true)} {...props} />
};

export const InputNumberEditor = ({ field, p, onChange, ...props }) => {
    return <InputNumber style={{ width: "100%", padding: "3px" }} keyboard={false} controls={false} bordered={true} size="small" value={p.row[field]} ref={focus} onChange={onChange ? v => onChange(p, v) : (e) => p.onRowChange({ ...p.row, valid: p.row[field] !== e ? 0 : null, [field]: e }, true)} {...props} />
}
export const DateTimeEditor = ({ field, p, onChange, ...props }) => {
    return <DatePicker showTime size="small" format={DATETIME_FORMAT} value={dayjs(p.row[field])} ref={focus} onChange={onChange ? v => onChange(p, v) : (e) => p.onRowChange({ ...p.row, valid: p.row[field] !== e ? 0 : null, [field]: e }, true)} {...props}><Input /></DatePicker>
}
export const SelectDebounceEditor = ({ field, keyField, textField, p, ...props }) => {
    return (<SelectDebounceField
        autoFocus
        value={{ value: p.row[field], label: p.row[field] }}
        size="small"
        style={{ width: "100%", padding: "3px" }}
        keyField={keyField ? keyField : field}
        textField={textField ? textField : field}
        showSearch
        showArrow
        ref={focus}
        {...props}
    />)
}

export const ModalObsEditor = ({ p, column, title, forInput, ...props }) => {
    const [visible, setVisible] = useState(true);
    const [value, setvalue] = useState(p.row[column]);

    const onConfirm = (e) => {
        if (e.type === "click" || (e.type === "keydown" && e.key === 'Enter')) {
            p.onRowChange({ ...p.row, notValid: p.row[column] !== value ? 1 : 0, valid: p.row[column] !== value ? 0 : null, [column]: value }, true);
            p.onClose(true);
        }
    }
    const onCancel = () => {
        p.onClose();
        setVisible(false);

    };

    return (
        <Drawer push={false} title={title} open={visible} destroyOnClose onClose={onCancel} width="550px"
            extra={<Space>{forInput && <><Button onClick={onCancel}>Cancelar</Button><Button onClick={onConfirm} type="primary">Registar</Button></>}</Space>}>
            {forInput && <TextArea autoSize={{ minRows: 4, maxRows: 12 }} disabled={!forInput} autoFocus value={value} onChange={(e) => setvalue(e.target.value)} onKeyDown={e => (e.key === 'Enter') && e.stopPropagation()} {...props} />}
            {!forInput && <div style={{ fontSize: "12px" }}>{value}</div>}
        </Drawer>
    );
}

export const CustomEstadoSearch = ({ value, onClick, ...props }) => {
    return (
        <Status b={{ estado: value }} onClick={onClick} {...props} />
    );
}

export const DestinoEditor = ({ p, onChange, forInput, forInputTroca, onConfirm, ...props }) => {
    const classes = useEditorStyles();
    const [visible, setVisible] = useState(true);
    const [value, setvalue] = useState();
    const [form] = Form.useForm();
    const [fieldStatus, setFieldStatus] = useState({});
    const [formStatus, setFormStatus] = useState({ error: [], warning: [], info: [], success: [] });
    const submitting = useSubmitting(false);
    const schemaEditor = (options = {}) => { return getSchema({}, options).unknown(true); }
    const oldEstadoRef = React.useRef({ value: p.row.estado });
    const [isLegacy, setIsLegacy] = useState(false);

    useEffect(() => {
        const d = json(p.row.destinos);
        const _isLegacy = !p.row.destinos && p.row.destino;
        form.setFieldsValue({
            estado: d?.estado ? d.estado : { value: p.row.estado },
            destinos: d?.destinos ? json(d.destinos) : [],
            obs: p.row.obs,
            prop_obs: p.row.prop_obs,
            regranular: d?.regranular ? d.regranular : 0,
            ...(_isLegacy) && { destino: p.row.destino }
        });
        setIsLegacy(_isLegacy);
    }, []);

    const onFinish = async (e) => {
        if (e.type === "click" || (e.type === "keydown" && e.key === 'Enter')) {
            submitting.trigger();
            let { obs, prop_obs, destino, troca_etiqueta, ...values } = form.getFieldsValue(true);
            let destinoTxt = "";
            if (!isLegacy) {
                const destinos = values.destinos.filter((a, i) => values.destinos.findIndex((s) => JSON.stringify(a) === JSON.stringify(s)) === i);
                //destinos.hash = await sha1(JSON.stringify(destinos));
                destinoTxt = "";
                destinos.forEach(v => {
                    destinoTxt = `${destinoTxt} ${destinoTxt && "//"} ${v.cliente.BPCNAM_0} ${v.largura}`;
                });
                destinoTxt = `${destinoTxt} ${BOBINE_ESTADOS.find(v => v.value === values.estado.value).label}`;
                values.destinos = destinos;
            } else {
                destinoTxt = destino;
                values = null;
            }
            await onConfirm(p, values, destinoTxt, obs, prop_obs,troca_etiqueta, props.loadData);
            submitting.end();
        }
    }

    const onValuesChange = (changedValues, values) => {
        const oldEstado = oldEstadoRef.current;
        if ("regranular" in changedValues) {

            if (changedValues.regranular) {
                Modal.confirm({
                    content: "Ao regranular, as linhas de destino serão eliminadas! Deseja continuar?",
                    onOk: () => {
                        form.setFieldsValue({ estado: { value: "R" }, destinos: [] });
                        oldEstadoRef.current = { value: "R" };
                    },
                    onCancel: () => form.setFieldValue("regranular", 0)
                });
            }
        }
        if ("estado" in changedValues) {
            if (form.getFieldValue("regranular")) {
                form.setFieldsValue({ estado: { value: "R" }, destinos: [] });
                oldEstadoRef.current = { value: "R" };
            } else if (form.getFieldValue("estado")?.value === "R") {
                Modal.confirm({
                    content: "Ao alterar o estado para Rejeitado, as linhas de destino serão eliminadas! Deseja continuar?",
                    onOk: () => form.setFieldsValue({ destinos: [] }),
                    onCancel: () => form.setFieldsValue({ regranular: 0, estado: oldEstado })
                });
            } else {
                oldEstadoRef.current = changedValues.estado;
            }
        }
    };
    const onCancel = () => {
        p.onClose();
        setVisible(false);
    };

    return (
        <>

            <Drawer maskClosable={!forInput}
                title={<div>Destinos <span style={{ fontWeight: 900 }}>{p.row.nome}</span></div>} open={visible} destroyOnClose onClose={onCancel} width="550px"
                extra={<Space>{(forInput || forInputTroca) && <><Button disabled={submitting.state} onClick={onCancel}>Cancelar</Button><Button disabled={submitting.state} onClick={onFinish} type="primary">Registar</Button></>}</Space>}
            >
                <YScroll>
                    <Form form={form} name={`f-destinos`} onValuesChange={onValuesChange} initialValues={{}}>
                        <AlertsContainer /* id="el-external" */ mask /* fieldStatus={fieldStatus} */ formStatus={formStatus} portal={false} />
                        <FormContainer id="FRM-Destinos" fluid forInput={forInput} loading={submitting.state} wrapForm={false} form={form} fieldStatus={fieldStatus} setFieldStatus={setFieldStatus} style={{ marginTop: "5px", padding: "0px" }} schema={schemaRange} wrapFormItem={true} alert={{ tooltip: true, pos: "none" }}>
                            <Col width={120}>
                                <Field wrapFormItem={true} forInput={forInputTroca} name="troca_etiqueta" label={{ enabled: false, text: "Trocar Etiqueta" }}>
                                    <SwitchField checkedChildren="Trocar Etiqueta" unCheckedChildren="Trocar Etiqueta" />
                                </Field>
                            </Col>
                            {(isLegacy) &&
                                <>
                                    <Row style={{ marginBottom: "15px" }} gutterWidth={1}>
                                        <Col>
                                            <Field wrapFormItem={true} name="destino" label={{ enabled: true, text: "Destino (legacy)" }}>
                                                <TextArea onKeyDown={(e) => (e.key == 'Enter') && e.stopPropagation()} autoSize={{ minRows: 2, maxRows: 16 }} style={{ width: "100%" }} />
                                            </Field>
                                        </Col>
                                    </Row>
                                    <Row style={{ marginBottom: "15px" }} gutterWidth={1}>
                                        <Col>
                                            <Field wrapFormItem={true} name="obs" label={{ enabled: true, text: "Observações" }}>
                                                <TextArea onKeyDown={(e) => (e.key == 'Enter') && e.stopPropagation()} autoSize={{ minRows: 2, maxRows: 16 }} style={{ width: "100%" }} />
                                            </Field>
                                        </Col>
                                    </Row>
                                    <Row style={{ marginBottom: "15px" }} gutterWidth={1}>
                                        <Col>
                                            <Field wrapFormItem={true} name="prop_obs" label={{ enabled: true, text: "Propriedades Observações" }}>
                                                <TextArea onKeyDown={(e) => (e.key == 'Enter') && e.stopPropagation()} autoSize={{ minRows: 2, maxRows: 16 }} style={{ width: "100%" }} />
                                            </Field>
                                        </Col>
                                    </Row>
                                </>
                            }
                            {!isLegacy &&
                                <>
                                    <Row style={{ marginBottom: "2px" }} gutterWidth={5}>


                                        <Col width={120}>
                                            <Field wrapFormItem={true} name="regranular" label={{ enabled: false, text: "Regranular" }}>
                                                <SwitchField checkedChildren="Regranular" unCheckedChildren="Regranular" />
                                            </Field>
                                        </Col>
                                        <Col></Col>
                                        <Col width={50}><Field wrapFormItem={true} name="estado" label={{ enabled: false, text: "Estado" }}>
                                            <Selector
                                                size="small"
                                                toolbar={false}
                                                title="Estados"
                                                popupWidth={130}
                                                params={{ payload: { data: { rows: BOBINE_ESTADOS }, pagination: { limit: 20 } } }}
                                                keyField={["value"]}
                                                textField="value"
                                                rowHeight={28}
                                                columns={[
                                                    { key: 'value', name: 'Estado', formatter: p => <Status b={{ estado: p.row.value }} /> }
                                                ]}
                                                customSearch={<CustomEstadoSearch />}
                                            />
                                        </Field></Col>
                                    </Row>
                                    <Row style={{ marginBottom: "15px" }} gutterWidth={1}>
                                        <Col>
                                            <Field wrapFormItem={true} name="obs" label={{ enabled: true, text: "Observações" }}>
                                                <TextArea onKeyDown={(e) => (e.key == 'Enter') && e.stopPropagation()} autoSize={{ minRows: 2, maxRows: 16 }} style={{ width: "100%" }} />
                                            </Field>
                                        </Col>
                                    </Row>
                                    <Row style={{ marginBottom: "15px" }} gutterWidth={1}>
                                        <Col>
                                            <Field wrapFormItem={true} name="prop_obs" label={{ enabled: true, text: "Propriedades Observações" }}>
                                                <TextArea onKeyDown={(e) => (e.key == 'Enter') && e.stopPropagation()} autoSize={{ minRows: 2, maxRows: 16 }} style={{ width: "100%" }} />
                                            </Field>
                                        </Col>
                                    </Row>
                                    <Form.List name="destinos">
                                        {(fields, { add, remove, move }) => {
                                            const addRow = (fields, duplicate = false) => {
                                                //if (fields.length === 0) {
                                                if (duplicate) {
                                                    add(form.getFieldValue(["destinos", duplicate.name]));
                                                } else {
                                                    add({ cliente: null, largura: p.row.lar, obs: null });
                                                }
                                                //} else {
                                                //    add({ [`min`]: null, [`max`]: null, "unit": unit, ...(type == "ff" && { "type": "Desbobinagem" }) });
                                                //}
                                            }
                                            const removeRow = (fieldName, field) => {
                                                remove(fieldName);
                                            }
                                            const moveRow = (from, to) => {
                                                //move(from, to);
                                            }
                                            return (
                                                <>
                                                    <div style={{}}>
                                                        <YScroll>
                                                            {fields.length > 0 &&
                                                                <Row nogutter>
                                                                    <Col width={30} style={{ fontWeight: 700, fontSize: "15px" }}></Col>
                                                                    <Col><Label text="Cliente" /></Col>
                                                                    <Col width={100}><Label text="Largura" /></Col>
                                                                    <Col width={30}></Col>
                                                                </Row>
                                                            }
                                                            {fields.map((field, index) => (
                                                                <Row key={field.key} nogutter style={{ padding: "10px", marginBottom: "10px", borderRadius: "3px", border: "1px solid rgba(5, 5, 5,0.1)" /* background: index % 2 ? "#d9eaff" : "#e9f3ff" */ }}>
                                                                    <Col width={30} style={{ display: "flex", flexDirection: "column", alignItems: "center", fontWeight: 700, fontSize: "15px" }}><div>{index + 1}</div>{forInput && <Button onClick={() => addRow(fields, field)} size="small" icon={<CopyOutlined />} />}</Col>
                                                                    <Col>
                                                                        <Row gutterWidth={1}>
                                                                            <Col>
                                                                                <Field wrapFormItem={true} forViewBackground={false} name={[field.name, `cliente`]} label={{ enabled: false, text: "Cliente" }}>
                                                                                    <Selector
                                                                                        size="small"
                                                                                        title="Clientes"
                                                                                        params={{ payload: { url: `${API_URL}/sellcustomerslookup/`, parameters: {}, pagination: { enabled: true, limit: 15 }, filter: {}, sort: [] } }}
                                                                                        keyField={["BPCNUM_0"]}
                                                                                        textField="BPCNAM_0"
                                                                                        detailText={r => r?.ITMDES1_0}
                                                                                        style={{ fontWeight: 700 }}
                                                                                        columns={[
                                                                                            { key: 'BPCNUM_0', name: 'Cód', width: 160 },
                                                                                            { key: 'BPCNAM_0', name: 'Nome' }
                                                                                        ]}
                                                                                        filters={{ fmulti_customer: { type: "any", width: 150, text: "Cliente", autoFocus: true } }}
                                                                                        moreFilters={{}}
                                                                                    />
                                                                                </Field>
                                                                            </Col>
                                                                            <Col width={100}><Field name={[field.name, `largura`]} forViewBackground={false} label={{ enabled: false, text: "Largura" }}><InputNumber size="small" style={{ width: "100%", textAlign: "right" }} controls={false} addonAfter={<b>mm</b>} min={10} max={500} /></Field></Col>
                                                                        </Row>
                                                                        <Row>
                                                                            <Col>
                                                                                <Field wrapFormItem={true} forViewBackground={false} name={[field.name, `obs`]} label={{ enabled: false }}>
                                                                                    <TextArea onKeyDown={(e) => (e.key == 'Enter') && e.stopPropagation()} autoSize={{ minRows: 1, maxRows: 3 }} style={{ width: "100%" }} />
                                                                                </Field>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                    <Col width={30}>{forInput && <div className={classNames(classes.center)}><IconButton onClick={() => removeRow(field.name, field)} style={{ alignSelf: "center" }}><CgCloseO /></IconButton></div>}</Col>
                                                                    {/* <Col><Field name={[field.name, `min`]} label={{ enabled: false }}><InputNumber autoFocus size="small" style={{ width: "100%", textAlign: "right" }} controls={false} addonAfter={<b>{unit}</b>} min={0} max={p.row.comp} /></Field></Col>
                                                    <Col><Field name={[field.name, `max`]} label={{ enabled: false }} includeKeyRules={['min']} allValues={{ min: form.getFieldValue(['items', index, 'min']) }}><InputNumber size="small" style={{ width: "100%", textAlign: "right" }} controls={false} addonAfter={<b>{unit}</b>} min={0} max={p.row.comp_actual} /></Field></Col>
                                                    {type === "ff" && <Col xs="content"><Field name={[field.name, `type`]} label={{ enabled: false }}><Select size="small" style={{ width: "100%", textAlign: "right" }} options={[{ value: "Bobinagem" }, { value: "Desbobinagem" }]} /></Field></Col>}
                                                    <Col xs={2}>{forInput && <div className={classNames(classes.center)}><IconButton onClick={() => removeRow(field.name, field)} style={{ alignSelf: "center" }}><CgCloseO /></IconButton></div>}</Col> */}
                                                                </Row>
                                                            ))}

                                                        </YScroll>
                                                    </div>
                                                    {(forInput && form.getFieldValue("regranular") == 0 && form.getFieldValue("estado")?.value !== "R") && <Row style={{ marginTop: "5px" }}><Col><Button disabled={!forInput} type="default" onClick={() => addRow(fields)} style={{ width: "100%" }}><PlusOutlined />Adicionar</Button></Col></Row>}
                                                </>
                                            )
                                        }
                                        }
                                    </Form.List>
                                </>
                            }
                        </FormContainer>
                    </Form>
                </YScroll>
            </Drawer>

        </>
    );
}

export const DestinoPaleteEditor = ({ p, onChange, forInput, onConfirm, ...props }) => {
    const classes = useEditorStyles();
    const [visible, setVisible] = useState(true);
    const [value, setvalue] = useState();
    const [form] = Form.useForm();
    const [fieldStatus, setFieldStatus] = useState({});
    const [formStatus, setFormStatus] = useState({ error: [], warning: [], info: [], success: [] });
    const submitting = useSubmitting(false);
    const schemaEditor = (options = {}) => { return getSchema({}, options).unknown(true); }
    const oldEstadoRef = React.useRef({ value: p.row.estado });
    const [isLegacy, setIsLegacy] = useState(null);

    useEffect(() => {
        const d = json(p.row.destinos);
        const _isLegacy = ((!p.row.destinos && p.row.destino) || !Array.isArray(d)) ? true : false;
        // form.setFieldsValue({
        //     estado: d?.estado ? d.estado : { value: p.row.estado },
        //     destinos: d?.destinos ? json(d.destinos) : [],
        //     obs: p.row.obs,
        //     prop_obs: p.row.prop_obs,
        //     regranular: d?.regranular ? d.regranular : 0,
        //     ...(_isLegacy) && { destino: p.row.destino }
        // });
        setIsLegacy(_isLegacy);
    }, []);

    const onFinish = async (e) => { }

    const onValuesChange = (changedValues, values) => { };
    const onCancel = () => {
        p.onClose();
        setVisible(false);
    };

    return (
        <>

            <Drawer maskClosable={!forInput}
                title={<div>Destinos <span style={{ fontWeight: 900 }}>{p.row.nome}</span></div>} open={visible} destroyOnClose onClose={onCancel} width="550px"
                extra={<Space>{forInput && <><Button disabled={submitting.state} onClick={onCancel}>Cancelar</Button><Button disabled={submitting.state} onClick={onFinish} type="primary">Registar</Button></>}</Space>}
            >
                <YScroll>
                    <Form name={`f-paldestinos`} initialValues={{}}>
                        {isLegacy === true && <Row>
                            <Col>
                                {p.row?.destino && <Field forInput={false} wrapFormItem={false} label={{ enabled: false }}>
                                    <TextArea value={p.row.destino.replace(/\/\//g, "\n").replaceAll("^\s+|\h+$", "")} autoSize={{ minRows: 2, maxRows: 16 }} style={{ width: "100%", whiteSpace: "pre" }} />
                                </Field>}
                            </Col>
                        </Row>}
                        {isLegacy === false && json(p.row.destinos).map((v, i) => <Row key={`d-${i}`}>
                            <Col>

                                <Row style={{ marginBottom: "2px" }} gutterWidth={5}>


                                    <Col width={120}>
                                        {v.regranular === 1 && <Field wrapFormItem={false} forInput={false} name="regranular" label={{ enabled: false, text: "Regranular" }}>
                                            <SwitchField value={v.regranular} checkedChildren="Regranular" unCheckedChildren="Regranular" />
                                        </Field>}
                                    </Col>
                                    <Col></Col>
                                    <Col width={50}><Field forInput={false} wrapFormItem={false} name="estado" label={{ enabled: false, text: "Estado" }}>
                                        <Selector
                                            value={v.estado}
                                            size="small"
                                            toolbar={false}
                                            title="Estados"
                                            popupWidth={130}
                                            params={{ payload: { data: { rows: BOBINE_ESTADOS }, pagination: { limit: 20 } } }}
                                            keyField={["value"]}
                                            textField="value"
                                            rowHeight={28}
                                            columns={[
                                                { key: 'value', name: 'Estado', formatter: p => <Status b={{ estado: p.row.value }} /> }
                                            ]}
                                            customSearch={<CustomEstadoSearch />}
                                        />
                                    </Field></Col>
                                </Row>
                                {v.destinos.length > 0 &&
                                    <Row nogutter>
                                        <Col width={30} style={{ fontWeight: 700, fontSize: "15px" }}></Col>
                                        <Col><Label text="Cliente" /></Col>
                                        <Col width={100}><Label text="Largura" /></Col>
                                        <Col width={30}></Col>
                                    </Row>
                                }
                                {v.destinos.map((x, j) =>
                                    <Row key={`dd-${i}-${j}`} nogutter style={{ padding: "10px", marginBottom: "10px", borderRadius: "3px", border: "1px solid rgba(5, 5, 5,0.1)" }}>
                                        <Col width={30} style={{ display: "flex", flexDirection: "column", alignItems: "center", fontWeight: 700, fontSize: "15px" }}><div>{j + 1}</div></Col>
                                        <Col>
                                            <Row gutterWidth={1}>
                                                <Col>
                                                    <Field wrapFormItem={false} label={{ enabled: false, text: "Cliente" }}>
                                                        <Selector
                                                            forInput={false}
                                                            value={x.cliente}
                                                            size="small"
                                                            title="Clientes"
                                                            params={{ payload: { url: `${API_URL}/sellcustomerslookup/`, parameters: {}, pagination: { enabled: true, limit: 15 }, filter: {}, sort: [] } }}
                                                            keyField={["BPCNUM_0"]}
                                                            textField="BPCNAM_0"
                                                            detailText={r => r?.ITMDES1_0}
                                                            style={{ fontWeight: 700 }}
                                                            columns={[
                                                                { key: 'BPCNUM_0', name: 'Cód', width: 160 },
                                                                { key: 'BPCNAM_0', name: 'Nome' }
                                                            ]}
                                                            filters={{ fmulti_customer: { type: "any", width: 150, text: "Cliente" } }}
                                                            moreFilters={{}}
                                                        />
                                                    </Field>
                                                </Col>
                                                <Col width={100}><Field wrapFormItem={false} forInput={false} label={{ enabled: false, text: "Largura" }}><InputNumber value={x.largura} size="small" style={{ width: "100%", textAlign: "right" }} controls={false} addonAfter={<b>mm</b>} min={10} max={500} /></Field></Col>
                                            </Row>
                                            <Row>
                                                <Col>
                                                    {x.obs && <Field wrapFormItem={false} label={{ enabled: false }}>
                                                        <TextArea value={x.obs} onKeyDown={(e) => (e.key == 'Enter') && e.stopPropagation()} autoSize={{ minRows: 1, maxRows: 3 }} style={{ width: "100%" }} />
                                                    </Field>}
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col width={30}></Col>
                                    </Row>
                                )}

                            </Col>
                        </Row>)}
                    </Form>
                </YScroll>
            </Drawer>

        </>
    );
}

export const FieldEstadoEditor = ({ p, forInput, column = "estado" }) => {
    const onChange = (v) => {
        console.log("ch--", p.row, v)
        p.onRowChange({ ...p.row, [column]: v, notValid: v !== p.row[column] ? 1 : 0 }, true)
    };
    return (
        <>
            {forInput ?
                <SelectField defaultOpen={true} bordered={false} style={{ width: "100%" }} value={p.row.estado} ref={focus} onChange={onChange} size="small" keyField="value" textField="label" data={BOBINE_ESTADOS} />
                :
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}><Status b={p.row} /></div>
            }
        </>
    );
}
export const FieldDefeitosEditor = ({ p, column = "defeitos" }) => {
    const onChange = (v) => {
        const _value1 = json(v, []).map(x => orderObjectKeys(x));
        const _value2 = json(p.row[column], null);
        const notValid = JSON.stringify(_value1) !== JSON.stringify(_value2 ? _value2.map(v => orderObjectKeys(v)) : _value2) ? 1 : 0;
        p.onRowChange({ ...p.row, [column]: _value1, notValid: (p.row?.notValid ? p.row?.notValid : notValid) }, true);
    };
    return (
        <SelectMultiField autoFocus defaultOpen={true} bordered={false} style={{ width: "100%" }} value={p.row.defeitos} /* ref={focus}  */ onChange={onChange} allowClear size="small" data={BOBINE_DEFEITOS.filter(v => v.value !== 'furos' && v.value !== 'buraco' && v.value !== 'rugas' && v.value !== 'ff' && v.value !== 'fc')} />
    );
}

// function sleep({ fn, ms, signal }) {
//     if (signal?.aborted) {
//         return Promise.reject(new DOMException("Aborted", "AbortError"));
//     }
//     return new Promise((resolve, reject) => {
//         console.log("Promise Started");
//         let timeout;
//         const abortHandler = () => {
//             clearTimeout(timeout);
//             reject(new DOMException("Aborted", "AbortError"));
//         }
//         // start async operation
//         timeout = setTimeout(() => {
//             fn();
//             resolve("Promise Resolved");
//             signal?.removeEventListener("abort", abortHandler);
//         }, ms);
//         signal?.addEventListener("abort", abortHandler);
//     });
// }

// let controller;
// export const MultiLine = ({ children, isCellSelected, value }) => {
//     const [showTooltip, setShowTooltip] = useState(false);
//     useEffect(() => {
//         if (isCellSelected) {
//             controller?.abort();
//             controller = new AbortController();
//             sleep({ fn: () => { if (children) { setShowTooltip(true) } }, ms: 1000, signal: controller.signal });
//         } else {
//             setShowTooltip(false);
//         }
//     }, [isCellSelected]);
//     return (
//         <>{value && <Tooltip style={{ maxWidth: "350px" }} placement="left" open={showTooltip} title={children} mouseEnterDelay={5}>{children}</Tooltip>}</>
//     );
// }


export const MultiLine = ({ children, value }) => {
    return (
        <>{value && children}</>
    );
}