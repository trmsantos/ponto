import React, { useState, useEffect } from 'react';
import { Form, Tooltip, Drawer, Modal, Button, Row, Col, Input, Tag, AutoComplete, Select, Switch } from "antd";
const { Option } = AutoComplete;
import styled from "styled-components";
import classNames from "classnames";
import { createUseStyles } from 'react-jss';
import * as R from "ramda";
import AlertMessages from "./alertMessages";
import { ConditionalWrapper } from './conditionalWrapper';
import RangeDate from "./RangeDate";
import { DATE_FORMAT } from 'config';
import { FilterOutlined, CloseCircleOutlined, SearchOutlined, PlusOutlined, EditOutlined, MinusCircleOutlined } from '@ant-design/icons';

const useStyles = createUseStyles({
    select: {
        "flex-grow": 1,
        '& .ant-select': {
            padding: "0px !important"
        },
        '& input': {
            padding: "2px !important"
        },
        '& .ant-select-selector': {
            height: "26px !important",
            '& .ant-select-selection-item': {
                lineHeight: "24px !important"
            }
        }
    },
    autocomplete: {
        "flex-grow": 1,
        '& .ant-select': {
            padding: "0px !important"
        },
        '& input': {
        },
        '& .ant-select-selector': {
            height: "26px !important",
            '& .ant-select-selection-item': {
                lineHeight: "24px !important"
            }
        }
    }
})


const FormItemxxx = ({ validation, name, required = false, formMessages, inline = false, messageLayout = "right", layout = "vertical", span = 16, gutter = 16, fieldCol, ...rest }) => {
    //messageLayout: left, below, above
    //layout: vertical, horizontal
    const { children } = rest;
    const { rulesSchema } = validation;
    const status = validation.type(name, formMessages.fieldStatus);
    const messages = validation.fieldMessages(name, formMessages.fieldStatus);
    const label = rulesSchema().$_mapLabels([name]);
    const cnLabelRequired = classNames({ 'ant-form-item-required': required });
    const cnFieldStatus = classNames({ [`ui ${status} field`]: status !== undefined });
    fieldCol = (fieldCol === undefined) ? ((layout === "vertical") ? 24 : 18) : fieldCol;
    const labelCol = (layout === "vertical") ? 24 : (24 - fieldCol);
    const msgSpan = (messageLayout === "right") ? (24 - span) : 24;

    return (
        <Row gutter={gutter} style={{ backgroundColor: "red", border: "solid 2px green" }}>
            <Col span={span}>
                {status !== undefined && messageLayout == "top" &&
                    <Row style={{ marginBottom: "8px", backgroundColor: "red", border: "solid 2px orange" }}>
                        <Col span={msgSpan} style={{ alignSelf: "flex-end" }}>
                            <div className={`ui pointing below prompt label ${status}`} role="alert" aria-atomic="true">{<FieldMessages fieldMessages={messages} />}</div>
                        </Col>
                    </Row>
                }
                <Row style={{ backgroundColor: "blue", border: "solid 2px orange" }}>
                    <Col span={labelCol}>
                        <div className="ant-form-item-label"><label htmlFor={name} className={cnLabelRequired} title={label}>
                            {<FieldLabel label={label} />}</label>
                        </div>
                    </Col>
                    <Col span={fieldCol}>
                        <Form.Item
                            noStyle
                            name={name}
                        /* required={required} */
                        /*  validateStatus={validation.type(name, formMessages.fieldStatus)}
                         help={<FieldMessages fieldMessages={validation.fieldMessages(name, formMessages.fieldStatus)} />} */
                        >
                            {React.cloneElement(children, { className: cnFieldStatus })}

                            {/* <Input className="ui error field" /> */}

                        </Form.Item>
                        {/*  <div className="ui left pointing prompt label" role="alert" aria-atomic="true">Please enter your last name</div> */}
                    </Col>
                </Row>
                {status !== undefined && messageLayout == "bottom" &&
                    <Row style={{ marginTop: "8px", backgroundColor: "blue", border: "solid 2px orange" }}>
                        <Col span={msgSpan} style={{ alignSelf: "flex-end" }}>
                            <div className={`ui pointing above prompt label ${status}`} role="alert" aria-atomic="true">{<FieldMessages fieldMessages={messages} />}</div>
                        </Col>
                    </Row>
                }
            </Col>
            {status !== undefined && messageLayout == "right" &&
                <Col span={msgSpan} style={{ alignSelf: "flex-end", backgroundColor: "blue", border: "solid 2px orange" }}>
                    <div className={`ui left pointing prompt label ${status}`} role="alert" aria-atomic="true">{<FieldMessages fieldMessages={messages} />}</div>
                </Col>
            }
        </Row>
    );
}

const optionsAutoCompleteRender = ({ item, keyField, valueField, labelField }) => ({ key: item[keyField], label: (typeof labelField === 'function') ? labelField(item, valueField, keyField) : item[labelField], value: item[valueField] });
export const AutoCompleteField = ({ onChange, value, keyField, valueField, labelField, handleSearch, optionsRender = optionsAutoCompleteRender, ...rest }) => {
    const classes = useStyles();
    const [result, setResult] = useState([]);
    valueField = (!valueField) ? labelField : valueField;
    labelField = (!labelField) ? valueField : labelField;

    const onSearch = async (value) => {
        const r = await handleSearch(value);
        setResult(r);
    }

    const options = (ds) => {
        const opts = ds.map((item) => {
            return optionsRender({ item, keyField, valueField, labelField });
        });
        return opts;
    }

    const onFieldChange = (v, option) => {
        console.log("aaaaaaaa --> ", (Object.entries(option) == 0) ? { key: v, label: v, value: v } : { ...option });
        onChange?.((Object.entries(option) == 0) ? { key: v, label: v, value: v } : { ...option }, option);
    }

    return (
        <div className={classes.autocomplete}>
            <AutoComplete
                value={value?.label == undefined ? value?.valueField : value?.label}
                /* value={value?.valueField} */
                onSearch={onSearch}
                onChange={onFieldChange}
                options={options(result)}
                {...rest}
            >
                <Input />
            </AutoComplete>
        </div>
    );
};

const optionsSelectRender = ({ ds, keyField, valueField }) => ds?.map(d => <Option key={d[keyField]}>{d[valueField]}</Option>);
export const SelectField = ({ onChange, value, data, keyField = "value", valueField = "label", handleSearch, optionsRender = optionsSelectRender, showSearch = false, ...rest }) => {
    const classes = useStyles();
    const [result, setResult] = useState([]);

    const onSearch = async (value) => {
        const r = await handleSearch(value);
        setResult(r);
    }

    /*     const options = (ds) => {
            const opts = ds.map((item) => {
                return optionsRender({ item, keyField, valueField });
            });
            return opts;
        } */

    const onSelect = (v, option) => {
        if (v !== undefined) {
            onChange?.(("key" in option) ? option.key : option[keyField]);
        }
    }

    const onClear = () => {
        onChange?.(undefined);

    }

    return (
        <div className={classes.select}>
            <Select
                showSearch={showSearch}
                value={value}
                defaultActiveFirstOption={false}
                showArrow={true}
                filterOption={false}
                {...(showSearch && { onSearch })}
                onChange={onSelect}
                onClear={onClear}
                notFoundContent={null}
                {...rest}
            >
                {optionsRender({ ds: ((showSearch) ? result : data), keyField, valueField })}
            </Select>
        </div>
    );
};

export const SwitchField = ({ onChange, value, checkedValue = 1, uncheckedValue = 0, ...rest }) => {
    const classes = useStyles();

    const parseToBool = (v) => {
        return (v === checkedValue) ? true : false;
    }
    const parseFromBool = (v) => {
        return (v === true) ? checkedValue : uncheckedValue;
    }

    const onSwitch = (checked) => {
        onChange?.(parseFromBool(checked));
    }

    return (
        <div>
            <Switch
                checked={parseToBool(value)}
                onChange={onSwitch}
                {...rest}
            />
        </div>
    );
};


export const RangeDateField = ({ onChange, value, format = DATE_FORMAT, ...rest }) => {
    const onRangeDateChange = (field, v) => {
        const { formatted = {} } = (value === undefined) ? {} : value;
        onChange?.({
            ...value,
            [field]: v,
            formatted: {
                ...formatted,
                [field]: v?.format(format)
            }
        });
    }

    return (<RangeDate value={value} onChange={onRangeDateChange} {...rest} />);
};



const validateMessages = {
    'any.required': 'Campo {{#label}} é obrigatório.'
};

export const FieldMessages = ({ fieldMessages }) => {
    return (
        <>
            {fieldMessages !== undefined && <>{
                fieldMessages.message.map(
                    (m, i) => <div key={`fm-${i}`}>{m}</div>
                )}
            </>}
        </>
    );
}

export const FilterTags = ({ form, filters, schema, rules }) => {
    //const values = form.getFieldsValue(true);
    //console.log("FILTERTAGS -->", values, schema({}));
    const getLabel = (col) => {
        const lens = R.lensPath([col, "label"]);
        for (let item of schema({})) {
            let value = R.view(lens, item);
            if (value !== undefined) {
                return value;
            }
        }
        return rules.$_mapLabels([col]);
    }
    const ignore = (col, v) => {
        const lens = R.lensPath([col, "ignoreFilterTag"]);
        for (let item of schema({})) {
            let value = R.view(lens, item);
            if (value !== undefined) {
                if (typeof value === 'function') {
                    return value(v);
                } else {
                    return value;
                }
            }
        }
        return false;
    }


    const showFilterTag = () => {
        let values = filters;
        return Object.keys(values).map(k => {
            let value = values[k];
            var v;
            if (Array.isArray(values[k])){
                v = JSON.stringify(values[k]);
            }else if (typeof values[k] === 'object'){
                v=values[k].label;
            }else{
                v=values[k];
            }

            if (ignore(k, value) || value === undefined || value === "") {
            } else {
                let label = getLabel(k);
                return <Tag color="geekblue" closable onClose={() => onClose(k)} key={`t${k}`}>{label}{/*  : <b> {v} </b> */}</Tag>
            }
        });
    }


    const onClose = (k) => {
        form.resetFields([k]);
        form.submit();
    }

    return (
        <div>
            {showFilterTag()}
        </div>
    );
}

export const FilterDrawer = ({ schema, filterRules, width = 400, showFilter, setShowFilter, form, mask = false }) => {
    return (
        <>
            <Drawer
                title="Filtros"
                width={width}
                mask={false}
                /* style={{ top: "48px" }} */
                onClose={() => setShowFilter(false)}
                open={showFilter}
                bodyStyle={{ paddingBottom: 80 }}
                footer={
                    <div style={{ textAlign: 'right' }}>
                        <Button onClick={() => form.resetFields()} style={{ marginRight: 8 }}>Limpar</Button>
                        <Button onClick={() => form.submit()} type="primary">Aplicar</Button>
                    </div>
                }
            >
                <Form form={form} name="search-form" layout="vertical" hideRequiredMark>
                    {schema.map((line, ridx) => (
                        <Row key={`rf-${ridx}`} gutter={16}>
                            {Object.keys(line).map((col, cidx) => {
                                const span = ("span" in line[col]) ? line[col].span : 24;
                                const itemWidth = ("itemWidth" in line[col]) ? { width: line[col].itemWidth } : {};
                                const label = ("label" in line[col]) ? line[col].label : filterRules.$_mapLabels([col]);
                                const field = ("field" in line[col]) ? line[col].field : { type: "input" };
                                const initialValue = ("initialValue" in line[col]) ? line[col].initialValue : undefined;
                                return (
                                    <Col key={`cf-${cidx}`} span={span}>
                                        <Form.Item key={`fd-${col}`} name={`${col}`} label={label} {...(initialValue!==undefined && {initialValue: initialValue})} >
                                            {(typeof field === 'function') ? field() :
                                                {
                                                    autocomplete: <AutoCompleteField allowClear {...field} />,
                                                    rangedate: <RangeDateField allowClear {...field} />
                                                }[field?.type] || <Input style={{ ...itemWidth }} allowClear {...field} />
                                            }

                                        </Form.Item>
                                    </Col>
                                );
                            })}
                        </Row>
                    ))}
                </Form>
            </Drawer>
        </>
    );
};

export const WrapperForm = props => {
    const { type = 'modal', visible = false, setVisible, children, ...rest } = props;
    return (
        <>
            {type == 'modal' ? (
                <Modal
                    {...rest}
                    centered
                    open={visible}
                    onCancel={() => setVisible(false)}
                >
                    {children}
                </Modal>
            ) : (
                <Drawer {...rest} open={visible} onClose={() => setVisible(false)}>
                    {children}
                </Drawer>
            )}
        </>
    );
};

export const useMessages = () => {
    const [formMessages, setFormMessages] = useState({});
    const [containerMessages, setContainerMessages] = useState({});

    const clear = () => {
        setFormMessages({});
        setContainerMessages({});
    }

    const formStatus = () => formMessages.formStatus;

    const addContainerMessages = (eId, msgs) => {
        setContainerMessages(prevObj => {
            let a = prevObj[eId]?.message || [];
            let b = msgs?.message || [];
            let mObj = { [eId]: { message: [...a, ...(msgs?.message || [])] } };
            return { ...prevObj, ...mObj };
        });
    }

    const getContainerMessages = (eId) => {
        return containerMessages[eId];
    }


    return {
        formMessages,
        setFormMessages,
        containerMessages,
        setContainerMessages,
        clear,
        formStatus,
        addContainerMessages,
        getContainerMessages
    };

}

export const validateForm = (rules, messages) => {

    const rulesSchema = rules;
    var fieldStatus = { error: {}, info: {}, warning: {} };
    var formStatus = { error: [], info: [], warning: [], success: [] };
    var values = {};

    const addMessage = (type, txt, key) => {
        if (key !== undefined) {
            if (key in fieldStatus[type]) {
                fieldStatus[type][key]["message"].push(txt);
            } else {
                fieldStatus[type][key] = { message: [txt] };
            }
        } else {
            formStatus[type].push({ message: txt });
        }
    }

    const validate = async (data) => {
        try {
            const v = await rules.validateAsync(data, { abortEarly: false, messages: messages || validateMessages, warnings: true });
            fieldStatus = { error: {}, info: {}, warning: {} };
            values = v.value;

        } catch (error) {
            fieldStatus = { error: {}, info: {}, warning: {} };
            for (let { context, message } of error.details) {
                addMessage("error", message, context.key);
            }
            values = {};
        }

    }

    const type = (key, status = {}) => {
        const { error = {}, info = {}, warning = {} } = status;
        if (key in error) {
            return "error";
        } else if (key in warning) {
            return "warning";
        } else if (key in info) {
            return "info";
        }
        return undefined;
    }
    const fieldMessages = (key, status = {}) => {
        const { error = {}, info = {}, warning = {} } = status;
        if (key in error) {
            return error[key];
        } else if (key in warning) {
            return warning[key];
        } else if (key in info) {
            return info[key];
        }
        return undefined;
    }

    const status = () => ({ fieldStatus, formStatus });

    const errors = () => {
        return Object.keys(status().fieldStatus.error).length + Object.keys(status().formStatus.error).length;
    }
    const warnings = () => {
        return Object.keys(status().fieldStatus.warning).length + Object.keys(status().formStatus.warning).length;
    }

    return {
        validate,
        rulesSchema: () => rulesSchema,
        fieldStatus: () => fieldStatus,
        addWarning: (txt, key) => addMessage("warning", txt, key),
        addError: (txt, key) => addMessage("error", txt, key),
        addInfo: (txt, key) => addMessage("info", txt, key),
        addMsg: (type, txt, key) => addMessage(type, txt, key),
        values: () => values,
        /* errors: () => byType("error", messages),
        warnings: () => byType("warning", messages),
        info: () => byType("info", messages), */
        /* messages: (formStatus) => { return { error: byType("error", formStatus), warning: byType("warning", formStatus), info: byType("info", formStatus) } },
        errors: (formStatus) => byType("error", formStatus),
        warnings: (formStatus) => byType("warning", formStatus),
        info: (formStatus) => byType("info", formStatus), */
        type: (key, status) => type(key, status),
        fieldMessages: (key, status) => fieldMessages(key, status),
        status,
        errors,
        warnings
    };
}

const Alert = ({ className, messages, alert = { position: "bottom", visible: true } }) => {
    const css = classNames('ui', { left: alert?.position === "right" }, 'pointing', { above: alert?.position === "bottom" }, 'prompt', 'label', 'error', className);
    return (<>{messages !== undefined && messages.message.length > 0 && <div className={css} role="alert" aria-atomic="true">
        <>{
            messages.message.map(
                (m, i) => <div key={`fm-${i}`}>{m}</div>
            )}
        </>
    </div>}</>);
}
const AlertPointing = styled(Alert)`
    ${(props) => props.alert?.position === "bottom" && `margin-top:1em !important; align-self: flex-start;`}
    ${(props) => props.alert?.position === "right" && `margin-left:1em !important; align-self: flex-end;`}
`;
const getWidth = (props) => {
    if (props.wide) {
        return `${props.wide * 6.25}%`;
    } else if (props.split) {
        return `${100 / props.split}%`;
    }
    return '100%';
}
const injectProps = (child, childIdx, { validation, formMessages, field, fieldSet, formData, ...rest }) => {

    const getWide = (wide, idx) => {
        if (Number.isInteger(wide)) {
            return wide;
        } else if (Array.isArray(wide)) {
            if (wide[idx] === "*") {
                let sum = wide.reduce((sum, x) => (x === '*') ? sum : sum + x);
                return 16 - sum;
            } else {
                return wide[idx];
            }
        }
    }

    const getData = (local = {}, parent = {}) => {
        if (!("wide" in local) && ("split" in local)) {
            const { wide: w, ...data } = parent;
            return { ...data, ...local };
        } else if (("wide" in local) && !("split" in local)) {
            const { split: s, ...data } = parent;
            return { ...data, ...local };
        } else {
            return { ...parent, ...local };
        }
    }

    if (child.type == Field || child.type == FieldItem) {
        const { wide, ...data } = getData(child.props, field);
        return React.cloneElement(child, { formData, validation, formMessages, ...data, ...(wide && { wide: getWide(wide, childIdx) }), ...rest });
    } else if (child.type == FieldSet) {
        const { wide, field: f, ...data } = { ...fieldSet, ...child.props };
        return React.cloneElement(child, { formData, validation, formMessages, field: { ...getData(f, field) }, ...data, wide: getWide(wide, childIdx), ...rest })
    }
    return child;
}

const FormManager = styled(Form)`
    display: flex;
    flex-direction:${(props) => props.layout == "horizontal" ? 'row' : 'column'};
    row-gap: ${(props) => props.rowGap ? props.rowGap : '10px'};
    flex-wrap:nowrap;
    .ant-input-number {
        width: 100%;
    }
    .ant-select{
        width: 100%;
    }
`;

export default ({ children, formMessages, messages, field, fieldSet, onFinish, onClear, rowGap, form, formData, visible = true, noStyle = false, spread=true, formTag=true, ...rest }) => {
    const { validation } = rest;
    /* const [containerMessages, setContainerMessages] = useState({}); */

    const onSubmit = async (v) => {
        /*         console.log("entrei -onsubmit", v);
                setContainerMessages({}); */
        await onFinish(v);
    }



    useEffect(() => {
        console.log("INIT-<", formData);
    }, []);

    useEffect(() => {
        console.log(")))))", formData);
        if (!R.isNil(formData) && !R.isEmpty(formData)) {
            form.setFieldsValue(formData);
        }
    }, [formData]);

    const innerForm = () => (
        <>
            <AlertMessages formStatus={messages?.formStatus()} />
            {
                React.Children.map(children, (child, i) => (
                    <>
                        {(React.isValidElement(child)) ? injectProps(child, i, {
                            wrappedForm: true,
                            getContainerMessages: () => messages?.getContainerMessages(`c${i}`),
                            addContainerMessages: (msg) => messages?.addContainerMessages(`c${i}`, msg),
                            validation, formMessages: messages?.formMessages, field, fieldSet, hasContainer: false, formData
                        })
                            : child
                        }
                    </>
                ))
            }
        </>
    );

    return (
        <>
             {visible && !formTag &&
                <>{innerForm()}</>
            }
            {visible && !spread && formTag &&
                <FormManager onFinish={onSubmit} form={form} {...rest}>
                    {children}
                </FormManager>
            }
            {visible && !noStyle && spread && formTag &&
                <FormManager onFinish={onSubmit} form={form} {...rest}>
                    {innerForm}
                </FormManager>
            }
            {visible && noStyle && spread && formTag &&
                <Form onFinish={onSubmit} form={form} {...rest}>
                    {innerForm}
                </Form>
            }
        </>
    );
}

const IFieldSet = styled.div`
  display: flex;
  flex-direction: ${(props) => props.items.layout == "vertical" ? 'column' : 'row'};
  flex-grow: 0;
  flex-shrink: 0;
  flex-wrap: nowrap;
  overflow: ${(props) => (props.items.overflow ? "visible" : "hidden")};
  ${(props) => props.items.gap && `
        padding-left:${props.items.gap};
        padding-right:${props.items.gap};
    `}
    ${(props) => {
        let width = getWidth(props.items);
        return (props.items.grow) ?
            `min-width:${width}` : `
          min-width:${width};
          max-width:${width};
        `
    }};
`;
export const FieldSet = ({ children, addContainerMessages, getContainerMessages, field, fieldSet, validation, formMessages, formData, alert = {}, hasContainer = false, style, className, wrappedForm = false, ...rest }) => {
    const { position: alertPosition = "bottom", visible: alertVisible = true } = alert;

    return (
        <ConditionalWrapper condition={alertPosition === "right" && alertVisible && !hasContainer} wrapper={children => <div style={{ display: "flex", flexDirection: "row" }}>{children}</div>}>
            <IFieldSet items={{ grow: true, ...rest }} {...(style && { style })}  {...(className && { className })}>
                {
                    React.Children.map(children, (child, i) => (
                        <>
                            {(React.isValidElement(child)) ? injectProps(child, i, { wrappedForm, validation, addContainerMessages, getContainerMessages, formMessages, field, fieldSet, formData, alert: { position: alertPosition, visible: alertVisible }, hasContainer: true }) : child}
                        </>
                    ))
                }
            </IFieldSet>
            {(alert.position === "right" && alertVisible && !hasContainer) && <AlertPointing messages={getContainerMessages()} alert={{ position: alertPosition, visible: alertVisible }} />}
        </ConditionalWrapper>
    );
}


export const Field = ({ alert, overflow, noStyle = false, ...rest }) => {
    const { validation, hasContainer, formMessages, name } = rest;
    const { position: alertPosition = "bottom", visible: alertVisible = ((validation) ? true : false) } = alert = {};
    const status = (validation) && validation.type(name, formMessages.fieldStatus);
    const messages = (validation) && validation.fieldMessages(name, formMessages.fieldStatus);
    const wrapper = (alertVisible && status && (!hasContainer || (alertPosition === "bottom"))) ? true : false;
    return (
        <ConditionalWrapper condition={(wrapper && hasContainer) || (!hasContainer)} wrapper={children => <AlertLayout hasContainer={hasContainer} alert={{ position: alertPosition, visible: alertVisible }} {...rest}>{children}</AlertLayout>}>
            {noStyle ?
                <FormItem alert={alert} wrapped={wrapper && hasContainer} overflow={overflow} noStyle={noStyle} {...rest} />
                :
                <StyledFormItem alert={alert} wrapped={wrapper && hasContainer} overflow={overflow} noStyle={noStyle} {...rest} />
            }
            {(wrapper) && <AlertPointing messages={messages} alert={{ position: alertPosition, visible: alertVisible }} />}
        </ConditionalWrapper>
    );
}
const FormItem = ({ className, addContainerMessages, validation, formMessages, name, required = false, labelStyle, label, children, hasContainer = false, overflow, overflowLabel, formData, colon = true, before, after, noLabel = false, wrappedForm = false, noStyle = false, ...rest }) => {
    const classes = useStyles();
    const { rulesSchema } = validation || {};
    const status = (validation) && validation.type(name, formMessages.fieldStatus);
    const messages = (validation) && validation.fieldMessages(name, formMessages.fieldStatus);
    const labelTxt = (label) ? label : ((validation) && rulesSchema().$_mapLabels([name]));
    const cssFieldStatus = classNames({ [`ui ${status} field`]: status !== undefined, [`ui field`]: status === undefined });

    useEffect(() => {
        if (typeof addContainerMessages === "function") {
            addContainerMessages(messages);
        }
    }, [messages]);

    return (
        <>
            <div className={className}>
                {!noLabel && <FieldLabel label={labelTxt} required={required} htmlfor={name} style={labelStyle} status={status} colon={colon} overflowLabel={overflowLabel} />}
                <ConditionalWrapper 
                condition={React.isValidElement(before) || React.isValidElement(after)} 
                wrapper={children => <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>{children}</div>}>
                    {before}
                    <ConditionalWrapper condition={wrappedForm === true} wrapper={children => <Form.Item name={name} /* {...(formData[name]) && { initialValue: "dsasdas" }} */ {...rest} noStyle>{children}</Form.Item>}>
                        {React.cloneElement(children, { className: cssFieldStatus })}
                    </ConditionalWrapper>
                    {after}
                </ConditionalWrapper>
            </div>
        </>
    );
}
const StyledFormItem = styled(FormItem)`
  display: flex;
  flex-direction: ${(props) => (props.layout === "horizontal" ? "row" : "column")};
  flex-grow: 0;
  flex-shrink: 0;
  flex-wrap: nowrap; 
  overflow: ${(props) => (props.overflow || props.overflowLabel ? "visible" : "hidden")};
  ${(props) => {
        if (!props.wrapped) {
            //if ((props.hasContainer && props.alert?.position !== "right") || (!props.hasContainer || props.alert?.position === "right")) {
            let width = getWidth(props);
            return (props.grow) ?
                `min-width:${width}` : `
      min-width:${width};
      max-width:${width};
    `
        }
    }};
    ${(props) => props.gap && `
        padding-left:${props.gap};
        padding-right:${props.gap};
    `}
    
`;


const Item = ({ className, children, hasContainer = false, overflow, outerStyle, outerClassName, ...rest }) => {
    const classes = useStyles();
    const cssField = classNames({ [`ui field`]: true });
    return (
        <>
            <ConditionalWrapper condition={!hasContainer} wrapper={children => <AlertLayout hasContainer={hasContainer} {...rest}>{children}</AlertLayout>}>
                <div {...(outerStyle && { style: outerStyle })} className={classNames(className, outerClassName)}>
                    <Form.Item {...rest} noStyle>
                        {React.cloneElement(children, { className: cssField })}
                    </Form.Item>
                </div>
            </ConditionalWrapper>
        </>
    );
}
export const FieldItem = styled(Item)`
  display: flex;
  flex-direction: ${(props) => (props.layout === "horizontal" ? "row" : "column")};
  flex-grow: 0;
  flex-shrink: 0;
  flex-wrap: nowrap; 
  overflow: ${(props) => (props.overflow ? "visible" : "hidden")};
  ${(props) => {
        //if ((props.hasContainer && props.alert?.position !== "right") || (!props.hasContainer || props.alert?.position === "right")) {
        let width = getWidth(props);
        return (props.grow) ?
            `min-width:${width}` : `
      min-width:${width};
      max-width:${width};
    `
    }};
    ${(props) => props.gap && `
        padding-left:${props.gap};
        padding-right:${props.gap};
    `}
`;

const AlertLayout = styled.div`
    ${({ alert }) => alert?.position == "right" ? `
        display:flex;
        flex-direction:row;` : `
        display:flex;
        flex-direction:column;
        `
    }

    ${(props) => {
        if (props.alert?.position == "bottom" && props.hasContainer) {
            let width = getWidth(props);
            return (props.grow) ?
                `min-width:${width}` : `
       min-width:${width};
       max-width:${width};
     `
        }
    }};


`;



const ILabel = ({ className, htmlfor, label, required = false, status, colon }) => {
    const cssLabel = classNames({ 'ant-form-item-label': true, [className]: className, error: status === "error" });
    const cssLabelTag = classNames({ 'ant-form-item-required': required, 'ant-form-item-no-colon': (!colon || !label) });
    return (
        <div className={cssLabel}>
            <label htmlFor={htmlfor} className={cssLabelTag} title={label} style={{ whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {label}
            </label>
        </div>
    );
}
export const FieldLabel = styled(ILabel)`
    overflow: ${(props) => (props.overflowLabel && 'visible')};
    min-width: ${(props) => (props.style?.width && props.style.width)};    
    max-width: ${(props) => (props.style?.width && props.style.width)};
    text-align: ${(props) => (props.style?.align && `${props.style.align} !important`)};
    padding-right: ${(props) => (props.style?.gap && `${props.style.gap} !important`)};
`

const Title = styled.div`
    h4{
        color: rgba(0, 0, 0, 0.85);
        font-weight: 700;
        font-size: 18px;
        line-height: 1.4;
        margin-bottom:0;
    }
    h5{

    }

`;

export const TitleForm = ({ title, subTitle }) => {
    return (
        <Title>
            <h4>{title}</h4>
            {subTitle && <h5>{subTitle}</h5>}
        </Title>
    );
}