import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { Form, Tooltip, Drawer, Modal, Button, Row, Col, Input, Tag, AutoComplete, Select, Switch, Alert, Checkbox, Spin, DatePicker, InputNumber, TimePicker } from "antd";
import styled, { css } from "styled-components";
import classNames from "classnames";
import { createUseStyles } from 'react-jss';
import { ConditionalWrapper } from '../conditionalWrapper';
import Portal from "../portal";
import YScroll from "../YScroll";
import PointingAlert from "../pointingAlert";
import { debounce } from "utils";
import { validate, getSchema, pick, getStatus } from "utils/schemaValidator";
import { LoadingOutlined } from '@ant-design/icons';
import { BiWindow } from "react-icons/bi";
import { BsBoxArrowInDownRight } from "react-icons/bs";
import { AiOutlineFullscreen } from "react-icons/ai";
import RangeDate from "../RangeDate";
import RangeTime from "../RangeTime";
import { DATE_FORMAT, DATETIME_FORMAT, TIME_FORMAT } from 'config';
import { Container as MainContainer } from 'react-grid-system';
import Selector from './Selector';


export const Context = createContext({});
export const SubContext = createContext({});

const useStyles = createUseStyles({
    noStyle: {
        marginBottom: "0px !important",
        verticalAlign: "unset !important"
    }
});


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
export const TitleForm = ({ title, subTitle, toogleMaximize, toogleFullScreen, setNormal }) => {
    return (
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Title>
                <h4>{title}</h4>
                {subTitle && <h5>{subTitle}</h5>}
            </Title>
            {/* <div><div onClick={toogleMaximize}><BiWindow /></div><div onClick={toogleFullScreen}><AiOutlineFullscreen /></div></div> */}
        </div>
    );
}

export const InputNumberField = styled(InputNumber)`
    input{
        text-align:right;
    }
`;


Number.prototype.pad = function (size) {
    var sign = Math.sign(this) === -1 ? '-' : '';
    return sign + new Array(size).concat([Math.abs(this)]).join('0').slice(-size);
}


const StyledHorizontalRule = styled('hr').withConfig({
    shouldForwardProp: (prop) =>
        ['className', 'style', 'children'].includes(prop)
})`
    border: none;
    height: 1px;
    background-color: #dcdddf;
    flex-shrink: 0;
    flex-grow: 0;
    width: 100%;
    margin: 0px;
`;

const StyledHRuleTitle = styled('div').withConfig({
    shouldForwardProp: (prop) =>
        ['className', 'style', 'children'].includes(prop)
})`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    /*background:#f3f3f3;*/

    .title{
        font-weight: 700;
        font-size:15px;
        margin: 0px;
        margin-right:5px;
    }

    .description{
        align-self: center;
        color:#595959;
    }

    
`;

export const FilterDrawer = ({ schema, filterRules, width = 400, showFilter, setShowFilter, form, onFinish, mask = false, dataAPI }) => {
    return (
        <>
            <Drawer
                title="Filtros"
                width={width}
                mask={mask}
                /* style={{ top: "48px" }} */
                onClose={() => setShowFilter(false)}
                open={showFilter}
                bodyStyle={{ paddingBottom: 80 }}
                footer={
                    <div style={{ textAlign: 'right' }}>
                        <Button onClick={() => { form.resetFields(); dataAPI.addFilters({}, true); }} style={{ marginRight: 8 }}>Limpar</Button>
                        <Button onClick={() => onFinish("filter", form.getFieldsValue(true))} type="primary">Aplicar</Button>
                    </div>
                }
            >
                <Form form={form} name="search-form" layout="vertical" hideRequiredMark onKeyPress={(e) => { if (e.key === "Enter") { onFinish("filter", form.getFieldsValue(true)); } }}>
                    {schema.map((line, ridx) => (
                        <Row key={`rf-${ridx}`} gutter={16}>
                            {Object.keys(line).map((col, cidx) => {
                                const span = ("span" in line[col]) ? line[col].span : 24;
                                const itemWidth = ("itemWidth" in line[col]) ? { width: line[col].itemWidth } : {};
                                const label = ("label" in line[col]) ? line[col].label : filterRules.$_mapLabels([col]);
                                const labelChk = ("labelChk" in line[col]) ? line[col].labelChk : filterRules.$_mapLabels([col]);
                                const field = ("field" in line[col]) ? line[col].field : { type: "input" };
                                const initialValue = ("initialValue" in line[col]) ? line[col].initialValue : undefined;
                                return (
                                    <Col key={`cf-${cidx}`} span={span} style={{ paddingLeft: "1px", paddingRight: "1px" }}>
                                        <Form.Item style={{ marginBottom: "0px" }} key={`fd-${col}`} name={`${col}`} label={label} {...(initialValue !== undefined && { initialValue: initialValue })} labelCol={{ style: { padding: "0px" } }}>
                                            {(typeof field === 'function') ? field() :
                                                {
                                                    autocomplete: <AutoCompleteField allowClear {...field} />,
                                                    rangedate: <RangeDateField allowClear {...field} />,
                                                    rangetime: <RangeTimeField allowClear {...field} />,
                                                    selectmulti: <SelectMultiField allowClear {...field} />,
                                                    inputnumber: <InputNumber {...field} />,
                                                    select: <SelectField allowClear {...field} />,
                                                    checkbox: <CheckboxField {...field}>{labelChk}</CheckboxField>
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

export const AddOn = styled.div`
margin: 2px;
background-color: #fafafa; 
border: 1px solid #d9d9d9;
border-radius: 2px;
align-self: center;
text-align: center; 
width: 45px; 
font-weight: 500;
font-size: 10px;
`;

export const HorizontalRule = ({ marginTop = "20px", marginBottom = "8px", padding = "1px", title, description,right, ...props }) => {
    //const parentProps = useContext(ParentContext);
    //const myProps = inheritSelf({ ...props, margin }, parentProps?.field);
    /* const classes = useFieldStyles(myProps); */
    //const { refMainAlertContainer } = parentProps;
    return (
        <>
            {title && <StyledHRuleTitle style={{ padding, marginTop,display:"flex",justifyContent:"space-between" }}><div><div className="title">{title}</div><div className="description">{description}</div></div><div>{right}</div></StyledHRuleTitle>}<StyledHorizontalRule style={{ marginBottom }} />
        </>
    );
}

const StyledVerticalSpace = styled('div').withConfig({
    shouldForwardProp: (prop) =>
        ['className', 'style', 'children'].includes(prop)
})`
    ${({ height }) => `height: ${height ? height : "12px"};`}
    width: 100%;
`;

export const VerticalSpace = ({ margin = "0px", height = "12px", props }) => {
    return (
        <StyledVerticalSpace height={height} {...props} />
    );
}


export const SwitchField = React.forwardRef(({ onChange, value, checkedValue = 1, uncheckedValue = 0, ...rest }, ref) => {
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
                ref={ref}
                checked={parseToBool(value)}
                onChange={onSwitch}
                {...rest}
            />
        </div>
    );
});

export const RangeTimeField = ({ onChange, value, format = TIME_FORMAT, ...rest }) => {
    const onRangeTimeChange = (field, v) => {
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

    return (<RangeTime value={value} onChange={onRangeTimeChange} {...rest} />);
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


export const CheckboxField = ({ onChange, value, checkedValue = 1, uncheckedValue = 0, ...rest }) => {
    const parseToBool = (v) => {
        return (v === checkedValue) ? true : false;
    }
    const parseFromBool = (v) => {
        return (v === true) ? checkedValue : uncheckedValue;
    }

    const onSwitch = (v) => {
        onChange?.(parseFromBool(v.target.checked));
    }

    return (
        <div>
            <Checkbox
                checked={parseToBool(value)}
                onChange={onSwitch}
                {...rest}
            />
        </div>
    );
};

export const AutoCompleteField = React.forwardRef(({ fetchOptions, debounceTimeout = 800, onChange, value, keyField, valueField, textField, optionsRender = false, size = "small", onPressEnter, ...rest }, ref) => {
    const [fetching, setFetching] = useState(false);
    const [options, setOptions] = useState([]);
    const fetchRef = useRef(0);
    keyField = (keyField) ? keyField : valueField;
    valueField = (valueField) ? valueField : keyField;
    const _optionsRender = (optionsRender) ? optionsRender : d => ({ label: d[textField], key: d[keyField], value: d[valueField] });

    const debounceFetcher = React.useMemo(() => {
        const loadOptions = (v) => {
            fetchRef.current += 1;
            const fetchId = fetchRef.current;
            setOptions([]);
            setFetching(true);
            fetchOptions(v).then((newOptions) => {
                if (fetchId !== fetchRef.current) {
                    // for fetch callback order
                    return;
                }
                const opts = newOptions.map(d => _optionsRender(d));
                setOptions(opts);
                setFetching(false);
            });
        };

        return debounce(loadOptions, debounceTimeout);
    }, [fetchOptions, debounceTimeout]);

    const onSelectChange = (v) => {
        onChange?.(v);
    }

    return (
        <AutoComplete
            dropdownMatchSelectWidth={false}
            ref={ref}
            value={value}
            onSearch={debounceFetcher}
            onChange={onSelectChange}
            options={options}
            {...rest}
        >
            <Input size={size} />
        </AutoComplete>
    );
});

export const SelectDebounceField = React.forwardRef(({ clearOptionsOnNull = true, fetchOptions, debounceTimeout = 800, onChange, value, keyField, valueField, textField, optionsRender = false, ...rest }, ref) => {
    const [fetching, setFetching] = useState(false);
    const [options, setOptions] = useState([]);
    const fetchRef = useRef(0);
    keyField = (keyField) ? keyField : valueField;
    valueField = (valueField) ? valueField : keyField;
    const _optionsRender = (optionsRender) ? optionsRender : d => ({ label: d[textField], key: d[keyField], value: d[valueField] });

    const debounceFetcher = React.useMemo(() => {
        const loadOptions = (v) => {
            fetchRef.current += 1;
            const fetchId = fetchRef.current;
            setOptions([]);
            setFetching(true);
            fetchOptions(v).then((newOptions) => {
                if (fetchId !== fetchRef.current) {
                    // for fetch callback order
                    return;
                }
                const opts = newOptions.map(d => _optionsRender(d));
                setOptions(opts);
                setFetching(false);
            });
        };

        return debounce(loadOptions, debounceTimeout);
    }, [fetchOptions, debounceTimeout]);

    const onSelectChange = (v) => {
        onChange?.(v);
    }

    useEffect(() => {
        if (value === null && clearOptionsOnNull === true) {
            setOptions([]);
        }
    }, [value]);

    return (
        <Select
            dropdownMatchSelectWidth={false}
            labelInValue
            filterOption={false}
            onSearch={debounceFetcher}
            value={value}

            onChange={onSelectChange}
            notFoundContent={fetching ? <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} size="small" /> : null}
            {...rest}
            options={options}
        />
    );
});

export const SelectField = React.forwardRef(({ data, keyField, /* valueField, */ textField, showSearch = false, optionsRender, ...rest }, ref) => {
    //const options = data.map((d,i) => <Option disabled={(i<5) ? true :false} key={d[keyField]} value={valueField ? d[valueField] : d[keyField]}>111{d[textField]}</Option>);
    const _optionsRender = (optionsRender) ? optionsRender : d => ({ label: d[textField], value: d[keyField] });
    const options = data ? data.map((d) => _optionsRender(d, keyField, textField)) : [];

    useEffect(() => {
        /*         console.log("sssssssssssssss")
                console.log(options,rest) */
    }, [])


    const onChange = (v, option) => {
        /*  if (v !== undefined) {
             onChange?.(("key" in option) ? option.key : option[keyField]);
         } */
    }

    return (
        <Select ref={ref} showSearch={showSearch} options={options} dropdownMatchSelectWidth={false} {...rest}>
            {/* {optionsRender({ data, keyField, valueField })} */}
        </Select>
    );
});

const _filterOptions = (arr1, arr2) => {
    let res = [];
    res = arr1.filter(el => {
        return !arr2.find(element => {
            return element.value === el.value;
        });
    });
    return res;
}

export const SelectMultiField = ({ value, data, options, keyField = 'value', textField = 'label', onChange, ...rest }) => {
    const [selectedItems, setSelectedItems] = useState(value || []);

    const onItemsChange = (v) => {
        setSelectedItems(v);
        onChange?.(v.length == 0 ? undefined : v);
    }

    return (
        <Select labelInValue mode="multiple" value={value} {...rest} onChange={onItemsChange}>

            {_filterOptions(data ? data : options, selectedItems).map(item => (
                <Select.Option key={item[keyField]} value={item[keyField]}>
                    {item[textField]}
                </Select.Option>
            ))}


            {/* {options.filter(o => !selectedItems.includes(Object.keys(o)[0])).map(item => (
                <Select.Option key={Object.keys(item)[0]} value={Object.keys(item)[0]}>
                    {item[Object.keys(item)[0]]}
                </Select.Option>
            ))} */}

        </Select>
    );
}




const StyledField = styled('div').withConfig({
    shouldForwardProp: (prop) =>
        ['className', 'style', 'children'].includes(prop)
})`
    
    ${({ grow = false, width }) => grow ? css`
        min-width: ${width};
    ` : css`
        min-width: ${width};
        max-width: ${width};
    `
    }
    ${({ guides }) => guides && css`border: 1px dashed blue;`}
    ${({ overflow }) => `overflow: ${overflow ? "visible" : "hidden"};`}

    &.padding, .padding{
        ${({ padding }) => padding && { "padding": padding }}
    }

    .margin{
        ${({ margin }) => margin && css`margin: ${margin};`}
        ${({ guides }) => guides && css`border: 1px solid red;`}
    }

    .error input{
        color: #9f3a38;
        background: #fff6f6;
        border-color: #e0b4b4;
    }
    .warning input{
        border-color: #c9ba9b;
        background: #fffaf3;
        color: #573a08;
    }
    .error .ant-input-number{
        color: #9f3a38;
        background: #fff6f6;
        border-color: #e0b4b4;
    }
    .error .ant-select-selector{
        color: #9f3a38!important;
        background: #fff6f6!important;
        border-color: #e0b4b4!important;
    }
    .warning .ant-input-number{
        border-color: #c9ba9b;
        background: #fffaf3;
        color: #573a08;
    }
    .ant-picker{
        width: 100%;
    }
    .ant-input-number{
        width: 100%;
    }
    .ant-select{
        width: 100%;
    }
`;

const FieldRowTop = styled('div').withConfig({
    shouldForwardProp: (prop) =>
        ['className', 'style', 'children', 'ref'].includes(prop)
})`
    ${({ guides }) => guides && css`
        margin: 2px;
        border: 1px solid green;
    `}
    ${({ layout = {} }) => css`${layout?.top}`} 
`;

const FieldRowMiddle = styled('div').withConfig({
    shouldForwardProp: (prop) =>
        ['className', 'style', 'children', 'ref'].includes(prop)
})`
    ${({ guides }) => guides && css`
    margin: 2px;
    border: 1px solid green;
    `}
    display: flex;
    flex-direction: row;
    flex-grow: 0;
    flex-shrink: 0;
    flex-wrap: nowrap;
    align-items: stretch;
    ${({ layout = {} }) => css`${layout?.middle}`} 
`;

const FieldLeft = styled('div').withConfig({
    shouldForwardProp: (prop) =>
        ['className', 'style', 'children', 'ref'].includes(prop)
})`
    ${({ guides }) => guides && css`
    margin: 2px;
    border: 1px solid blue;
    `}
    ${({ layout = {} }) => css`${layout?.left}`} 
`;

const FieldCenter = styled('div').withConfig({
    shouldForwardProp: (prop) =>
        ['className', 'style', 'children', 'ref'].includes(prop)
})`
    ${({ guides }) => guides && css`
    margin: 2px;
    border: 1px solid blue;
    `}
    flex: 1; 
    ${({ layout = {} }) => css`${layout?.center}`} 
`;

const FieldRight = styled('div').withConfig({
    shouldForwardProp: (prop) =>
        ['className', 'style', 'children', 'ref'].includes(prop)
})`
    ${({ guides }) => guides && css`
    margin: 2px;
    border: 1px solid blue;
    `}
    ${({ layout = {} }) => css`${layout?.right}`} 
`;

const FieldRowBottom = styled('div').withConfig({
    shouldForwardProp: (prop) =>
        ['className', 'style', 'children', 'ref'].includes(prop)
})`
    ${({ guides }) => guides && css`
    margin: 2px;
    border: 1px solid green;
    `}
    ${({ layout = {} }) => css`${layout?.bottom}`} 
`;

/**
 * 
 * @param {*} name Nome do campo
 * @param {*} wide Tamanho do Field, tipo de dados: {int entre 1 e 16 | array no formato [int,int,'*'] }  (Atenção! wide(default) e split são mutuamente exclusivos)
 * @param {*} split Tamanho do Field, divide o espaço (16) pelo número de vezes indicada (Atenção! wide(default) e split são mutuamente exclusivos)
 * 
 * @returns 
 */
export const Field = ({ children, forInput = null, forViewBorder = true, forViewBackground = true, wrapFormItem = null, alert, ...props }) => {
    const ctx = useContext(Context);
    const subCtx = useContext(SubContext);
    const _forInput = forInput === null ? (("forInput" in subCtx && subCtx?.forInput !== null) ? subCtx.forInput : ctx?.forInput) : forInput;
    const _wrapFormItem = wrapFormItem === null ? ctx?.wrapFormItem : wrapFormItem;
    const getAlert = () => alert ? alert : ctx.alert;
    return (
        <InnerField wrapFormItem={_wrapFormItem} alert={getAlert()} {...props}>
            {(() => {
                if (!children) {
                    return <>{children}</>
                } else if (_forInput) {
                    return children;
                } else if (children) {
                    return <ForView {...children?.props} forViewBackground={forViewBackground} forViewBorder={forViewBorder}>{children}</ForView>;
                }
            })()}
        </InnerField>
    );
}


const InnerField = ({ children, alert, ...props }) => {
    /* const classes = useFieldStyles(props); */
    const { fieldStatus = {} } = useContext(Context);
    const { name, alias, label, required, guides, forInput = true, wrapFormItem = false, rule, allValues, shouldUpdate, layout, includeKeyRules, addons } = props;
    const refs = {
        top: useRef(),
        left: useRef(),
        right: useRef(),
        bottom: useRef(),
        center: useRef()
    };
    const nameId = (!alias) ? name : alias;
    //const cssCenter = classNames({ "error": fieldStatus[nameId]?.status === "error" }, { "warning": fieldStatus[nameId]?.status === "warning" });
    const tooltipColor = (fieldStatus[nameId]?.status === "warning" ? "orange" : "red");

    return (
        <>
            <FieldRowTop ref={refs.top} guides={guides} layout={layout} className="row-top" />
            <FieldRowMiddle guides={guides} layout={layout} className="row-middle">
                <FieldLeft ref={refs.left} guides={guides} layout={layout} className="left" />
                <FieldCenter /* className={classNames(cssCenter, "center")} */ className='center' ref={refs.center} guides={guides} layout={layout}>
                    <Tooltip
                        title={(alert?.tooltip && (fieldStatus[nameId]?.status === "error" || fieldStatus[nameId]?.status === "warning")) && <InnerAlertFieldMessages nameId={nameId} messages={fieldStatus[nameId]?.messages} />}
                        color={tooltipColor}
                    >
                        <div>
                            <FormItemWrapper validator={props?.validator} validateTrigger={props?.validateTrigger} nameId={nameId} name={name} shouldUpdate={shouldUpdate} forInput={forInput} rule={rule} allValues={allValues} wrapFormItem={wrapFormItem} includeKeyRules={includeKeyRules}>{children}</FormItemWrapper>
                        </div>
                    </Tooltip>
                </FieldCenter>
                <FieldRight ref={refs.right} guides={guides} layout={layout} className="right" />
            </FieldRowMiddle>
            <FieldRowBottom ref={refs.bottom} guides={guides} layout={layout} className="row-bottom" />
            <LabelRef refs={refs} {...label} nameId={nameId} required={required} guides={guides} />
            <AlertField refs={refs} fieldStatus={fieldStatus[nameId]} /* fieldStatus={localStatus} */ nameId={nameId} alert={alert} />
        </>
    );
}

//            <AddOns refs={refs} addons={addons} />
//{alert?.container &&
//    <AlertField refs={refs} fieldStatus={localStatus} /* fieldStatus={localStatus} */ nameId={nameId} {...alert} />
//}



// const InnerField = ({ children, ...props }) => {
//     /* const classes = useFieldStyles(props); */
//     const { fieldStatus } = useContext(Context);
//     const { name, alias, label, alert, required, guides, forInput = true, wrapFormItem = false, rule, allValues, refMainAlertContainer, shouldUpdate, layout, addons } = props;
//     const refs = {
//         top: useRef(),
//         left: useRef(),
//         right: useRef(),
//         bottom: useRef(),
//         center: useRef(),
//         container: refMainAlertContainer
//     };
//     const nameId = (!alias) ? name : alias;
//     const localStatus = fieldStatus[nameId];
//     const cssCenter = classNames({ "error": localStatus?.status === "error" }, { "warning": localStatus?.status === "warning" });
//     const tooltipColor = (localStatus?.status === "warning" ? "orange" : "red");

//     return (
//         <>
//             <FieldRowTop ref={refs.top} guides={guides} layout={layout} className="row-top" />
//             <FieldRowMiddle guides={guides} layout={layout} className="row-middle">
//                 <FieldLeft ref={refs.left} guides={guides} layout={layout} className="left" />
//                 <FieldCenter className={classNames(cssCenter, "center")} ref={refs.center} guides={guides} layout={layout}>



//                     <Tooltip
//                         title={(alert?.tooltip && (localStatus?.status === "error" || localStatus?.status === "warning")) && <InnerAlertFieldMessages nameId={nameId} messages={localStatus?.messages} />}
//                         color={tooltipColor}
//                     >
//                         <div>
//                             <FormItemWrapper nameId={nameId} name={name} shouldUpdate={shouldUpdate} forInput={forInput} rule={rule} allValues={allValues} wrapFormItem={wrapFormItem}>{children}</FormItemWrapper>
//                         </div>
//                     </Tooltip>



//                 </FieldCenter>
//                 <FieldRight ref={refs.right} guides={guides} layout={layout} className="right" />
//             </FieldRowMiddle>
//             <FieldRowBottom ref={refs.bottom} guides={guides} layout={layout} className="row-bottom" />
//             <LabelRef refs={refs} {...label} nameId={nameId} required={required} guides={guides} />
//             <AddOns refs={refs} addons={addons} />
//             {alert?.container &&
//                 <AlertField refs={refs} fieldStatus={localStatus} /* fieldStatus={localStatus} */ nameId={nameId} {...alert} />
//             }
//         </>
//     );
// }



const validateMessages = {
    'any.required': 'Campo {{#label}} é obrigatório.'
};

export const validateForm = (rules, messages) => {
    var schema = rules;
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

    const validate = async (data, options = {}) => {
        try {
            const v = await schema.validateAsync(data, { abortEarly: false, messages: messages || validateMessages, warnings: true, ...options });
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
        rulesSchema: () => schema,
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

const FormItemWrapper = ({ children, validator, validateTrigger, wrapFormItem = false, name, nameId, shouldUpdate, rule, allValues = {}, includeKeyRules = [] }) => {
    const classes = useStyles();
    const { schema: sch, fieldStatus, updateFieldStatus } = useContext(Context);
    const { schema: subsch } = useContext(SubContext);
    const schema = (subsch) ? subsch : sch;

    const getChildren = () => {
        return React.cloneElement(children, { ...children.props, name: nameId ? nameId : name });
    }

    const defaultValidator = async (r, v) => {
        const _rule = (rule) ? rule : ((Array.isArray(name)) ? schema({ keys: [name[name.length - 1], ...includeKeyRules], wrapArray: false }) : schema({ keys: [name, ...includeKeyRules], wrapArray: false }));
        (async () => {
            try {
                const { value, warning } = await _rule.validateAsync({ ...allValues, [(Array.isArray(name)) ? name[name.length - 1] : name]: v }, { abortEarly: false, warnings: true, messages: validateMessages });
                updateFieldStatus(nameId, (warning === undefined) ? {} : { status: "warning", messages: [...warning.details] });
            } catch (e) {
                updateFieldStatus(nameId, { status: "error", messages: [...e.details] });
            }
        })();
    }
    return (
        <>
            <ConditionalWrapper
                condition={wrapFormItem}
                wrapper={children => <Form.Item className={classes.noStyle} rules={[{ validator: validator ? validator : defaultValidator }]} validateTrigger={validateTrigger ? validateTrigger : ["onBlur"]} validateStatus={fieldStatus[nameId]?.status} shouldUpdate={shouldUpdate} {...(nameId && { name: nameId })}>
                    {getChildren()}
                </Form.Item>}
            >
                {getChildren()}
            </ConditionalWrapper>
        </>
    );
}




const ForView = ({ children, data, keyField, textField, optionsRender, labelInValue, forViewBorder = true, forViewBackground = true, style, ...rest }) => {
    let type = null; //'any' //children.props.tpy;
    //console.log("zzzzzzz->", children.type, keyField, rest)
    if (!type || type === 'C') {
        if (children.type === DatePicker || children.type === TimePicker) {
            //console.log("FIELD-> PICKER");
            type = 'Picker';
        } else if (children.type === Input) {
            //console.log("FIELD-> INPUT");
            type = 'any';
        } else if (children.type === InputNumber) {
            type = 'InputNumber';
        } else if (children.type === InputNumberField) {
            type = 'InputNumber';
        } else if (children.type === CheckboxField) {
            //console.log("FIELD-> CHECKBOXFIELD");
            type = 'CheckboxField';
        } else if (children.type === SwitchField) {
            //console.log("FIELD-> SWITCHFIELD");
            type = 'SwitchField';
        } else if (children.type === SelectDebounceField) {
            //console.log("FIELD-> SELECTDEBOUNCEFIELD");
            type = 'SelectDebounceField';
        } else if (children.type === SelectField) {
            //console.log("FIELD-> SELECTFIELD");
            type = 'SelectField';
        } else if (keyField) {
            type = "Selector";
        } else {
            //console.log("FIELD-> OTHER", children.props);
            type = 'any';
        }
    }

    const height = (size) => {
        if (!size) {
            return "28px";
        } else if (size === "small") {
            return "22px";
        } else if (size === "default") {
            return "28px";
        } else if (size === "large") {
            return "32px";
        }
    }

    //console.log("zzzzzzz->",type)

    return (
        <>
            {"value" in rest ? <>
                {(() => {
                    const { value, onDoubleClick } = rest;
                    switch (type) {
                        case 'Input':
                            return (<div style={{ borderRadius: "3px", padding: "2px", ...forViewBorder && { border: "solid 1px #d9d9d9" }, display: "flex", alignItems: "center", minHeight: height(children?.props?.size), ...forViewBackground && { background: "#f0f0f0" }, ...(style && style) }} {...onDoubleClick && { onDoubleClick }}>{value}</div>);
                        case 'CheckboxField':
                            return (
                                <CheckboxField {...children.props} value={value} disabled={true} {...onDoubleClick && { onDoubleClick }} />
                            );
                        case 'SwitchField':
                            return (
                                <SwitchField {...children.props} value={value} disabled={true} {...onDoubleClick && { onDoubleClick }} />
                            );
                        case 'Selector':
                            return (<Selector forView={true} minHeight={height(children?.props?.size)} {...{ children, data, keyField, textField, optionsRender, labelInValue, forViewBorder, forViewBackground, style }} {...rest} />);
                        case 'SelectDebounceField':
                            /* const r = data.find(v => v[keyField] === value);
                            let text = "";
                            if (r !== undefined) {
                text = (typeof optionsRender === 'function') ? optionsRender(r, keyField, textField).label : r[textField];
                            }
            return (
            <div style={{ padding: "2px", border: "solid 1px #d9d9d9" }}>{text}</div>
            ) */
                            return (
                                <div style={{ borderRadius: "3px", padding: "2px", ...forViewBorder && { border: "solid 1px #d9d9d9" }, display: "flex", alignItems: "center", minHeight: height(children?.props?.size), ...forViewBackground && { background: "#f0f0f0" }, ...(style && style) }} {...onDoubleClick && { onDoubleClick }}>{value?.label}</div>
                            )
                        case 'Picker':
                            const format = (children.props?.format) ? children.props.format : DATETIME_FORMAT;
                            return (<div style={{ borderRadius: "3px", padding: "2px", ...forViewBorder && { border: "solid 1px #d9d9d9" }, display: "flex", alignItems: "center", minHeight: height(children?.props?.size), ...forViewBackground && { background: "#f0f0f0" }, ...(style && style) }} {...onDoubleClick && { onDoubleClick }}>{value ? value.format(format) : ''}</div>)
                        case 'SelectField':
                            let text = "";
                            if (labelInValue) {
                                text = value?.label;
                            } else {
                                const r = data.find(v => v[keyField] == value);
                                if (r !== undefined) {
                                    text = (typeof optionsRender === 'function') ? optionsRender(r, keyField, textField).label : r[textField];
                                }
                            }
                            return (
                                <div style={{ borderRadius: "3px", padding: "2px", ...forViewBorder && { border: "solid 1px #d9d9d9" }, display: "flex", alignItems: "center", minHeight: height(children?.props?.size), whiteSpace: "nowrap", ...forViewBackground && { background: "#f0f0f0" }, ...(style && style) }} {...onDoubleClick && { onDoubleClick }}>{text}</div>
                            )
                        case 'InputNumber':
                            if ("addonAfter" in children.props || "addonBefore" in children.props) {
                                return (<div style={{ borderRadius: "3px", padding: "2px", ...forViewBorder && { border: "solid 1px #d9d9d9" }, minHeight: height(children?.props?.size), display: "flex", flexDirection: "row", alignItems: "center", ...forViewBackground && { background: "#f0f0f0" }, ...(style && style) }} {...onDoubleClick && { onDoubleClick }}>
                                    {("addonBefore" in children.props) && <div style={{ marginRight: "2px" }}>{children.props.addonBefore}</div>}
                                    <div style={{ flex: 1 }}>{value}</div>
                                    {("addonAfter" in children.props) && <div style={{ marginLeft: "2px" }}>{children.props.addonAfter}</div>}
                                </div>)
                            }
                            return (<div style={{ borderRadius: "3px", padding: "2px", ...forViewBorder && { border: "solid 1px #d9d9d9" }, display: "flex", minHeight: height(children?.props?.size), alignItems: "center", justifyContent: "end", ...forViewBackground && { background: "#f0f0f0" }, ...(style && style) }} {...onDoubleClick && { onDoubleClick }}>{value}</div>);
                        default:

                            if ("addonAfter" in children.props || "addonBefore" in children.props) {
                                return (<div style={{ borderRadius: "3px", padding: "2px", ...forViewBorder && { border: "solid 1px #d9d9d9" }, minHeight: height(children?.props?.size), display: "flex", flexDirection: "row", alignItems: "center", ...forViewBackground && { background: "#f0f0f0" }, ...(style && style) }} {...onDoubleClick && { onDoubleClick }}>
                                    {("addonBefore" in children.props) && <div style={{ marginRight: "2px" }}>{children.props.addonBefore}</div>}
                                    <div style={{ flex: 1 }}>{value}</div>
                                    {("addonAfter" in children.props) && <div style={{ marginLeft: "2px" }}>{children.props.addonAfter}</div>}
                                </div>)
                            }

                            return (<div style={{ borderRadius: "3px", padding: "2px", ...forViewBorder && { border: "solid 1px #d9d9d9" }, display: "flex", minHeight: height(children?.props?.size), alignItems: "center", ...forViewBackground && { background: "#f0f0f0" }, ...(style && style) }} {...onDoubleClick && { onDoubleClick }}>{value}</div>);
                    }

                })()}

            </> : children
            }
        </>
    );
}




const AddOns = ({ refs, addons = {} }) => {
    const { top, right, left, bottom, center } = addons;
    const [domReady, setDomReady] = useState(false);
    React.useEffect(() => { setDomReady(true); }, []);
    return (
        <>
            {top && <Portal elId={refs["top"].current}>
                {top}
            </Portal>}
            {right && <Portal elId={refs["right"].current}>
                {right}
            </Portal>}
            {left && <Portal elId={refs["left"].current}>
                {left}
            </Portal>}
            {bottom && <Portal elId={refs["bottom"].current}>
                {bottom}
            </Portal>}
            {center && <Portal elId={refs["center"].current}>
                {center}
            </Portal>}
        </>
    );
}



const StyledAlertField = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    ${({ noWrap }) => (noWrap) && `white-space: nowrap;`}
`;

const InnerAlertFieldMessages = ({ nameId, messages }) => {
    return (
        <div>
            {messages.map((v, i) => <div key={`fmsg-${nameId}-${i}`}>
                {v.message}
            </div>)
            }

        </div>
    );
}

const AlertField = ({ fieldStatus, nameId, refs, alert }) => {
    /*     const classes = useAlertFieldStyles(props); */
    const [domReady, setDomReady] = useState(false);
    React.useEffect(() => { setDomReady(true); }, []);

    const getRef = () => {
        if (alert?.pos in refs) {
            return refs[alert?.pos]?.current;
        } else if (alert?.pos !== "none") {
            return alert?.pos;
        }
        return null;
    }
    return (
        <>
            {
                getRef() !== null && <Portal elId={getRef()}>
                    {(fieldStatus?.status === "error" || fieldStatus?.status === "warning") &&
                        <StyledAlertField noWrap={alert?.noWrap}>
                            <PointingAlert alert={alert?.pointing} status={fieldStatus?.status} text={<InnerAlertFieldMessages name={nameId} messages={fieldStatus?.messages} />} position={alert.pos} />
                        </StyledAlertField>
                    }
                </Portal>
            }
        </>
    );
}





// const AlertField = ({ fieldStatus, nameId, pos = "bottom", refs, container, ...props }) => {
//     /*     const classes = useAlertFieldStyles(props); */
//     const [domReady, setDomReady] = useState(false);
//     React.useEffect(() => { setDomReady(true); }, []);
//     const ref = (container === true) ? refs["container"].current : (container in refs) ? refs[pos].current : container;
//     return (
//         <Portal elId={ref}>
//             {(fieldStatus?.status === "error" || fieldStatus?.status === "warning") &&
//                 <>
//                     {pos !== "none" &&
//                         <StyledAlertField>
//                             <PointingLabel status={fieldStatus?.status} text={<InnerAlertFieldMessages name={nameId} messages={fieldStatus?.messages} />} position={pos} />
//                         </StyledAlertField>
//                     }
//                     {/* <StyledAlertField>
//                     <div className={classes.alert}>
//                     {pos === "list" ?
//                         <InnerAlertFieldMessages name={name} messages={fieldStatus?.messages} status={fieldStatus?.status} />
//                         :
//                         <PointingLabel status={fieldStatus?.status} text={<InnerAlertFieldMessages name={name} messages={fieldStatus?.messages} />} position={pos} />
//                     }

//                 </StyledAlertField> */}
//                 </>
//             }
//         </Portal>
//     );
// }







{/* <Portal elId={getRef()}>
{(fieldStatus?.status === "error" || fieldStatus?.status === "warning") &&
    <>
        {pos !== "none" &&
            <StyledAlertField>
                <PointingLabel status={fieldStatus?.status} text={<InnerAlertFieldMessages name={nameId} messages={fieldStatus?.messages} />} position={pos} />
            </StyledAlertField>
        }
        {/* <StyledAlertField>
        <div className={classes.alert}>
        {pos === "list" ?
            <InnerAlertFieldMessages name={name} messages={fieldStatus?.messages} status={fieldStatus?.status} />
            :
            <PointingLabel status={fieldStatus?.status} text={<InnerAlertFieldMessages name={name} messages={fieldStatus?.messages} />} position={pos} />
        }

    </StyledAlertField> */}
//   </>
//}
//</Portal> */}


export const AlertsContainer = ({ id, fieldStatus, formStatus, mask = false, portal = true, style, ...props }) => {
    const [alerts, setAlerts] = useState({ errors: [], warnings: [], infos: [], successes: [], showError: true, showWarning: true, showInfo: true, showSuccess: true });
    const ref = useRef();
    const getId = () => {
        return (id) ? id : "container";
    }


    const getAlerts = () => {
        const _alerts = { errors: [], warnings: [], infos: [], successes: [] };
        if (fieldStatus || formStatus) {

            if (fieldStatus) {
                for (let k in fieldStatus) {
                    if (fieldStatus[k].status === 'error') {
                        for (const [i, v] of fieldStatus[k].messages.entries()) {
                            _alerts.errors.push(<div key={`ef-${k}-${i}`}>{v.message}</div>);
                        }
                    } else if (fieldStatus[k].status === 'warning') {
                        for (const [i, v] of fieldStatus[k].messages.entries()) {
                            _alerts.warnings.push(<div key={`wf-${k}-${i}`}>{v.message}</div>);
                        }
                    }
                }
            }
            if (formStatus) {
                for (const [i, v] of formStatus.error.entries()) {
                    _alerts.errors.push(<div key={`es-${i}`}>{v.message}</div>);
                }
                for (const [i, v] of formStatus.warning.entries()) {
                    _alerts.warnings.push(<div key={`ws-${i}`}>{v.message}</div>);
                }
                for (const [i, v] of formStatus.success.entries()) {
                    _alerts.successes.push(<div key={`es-${i}`}>{v.message}</div>);
                }
                for (const [i, v] of formStatus.info.entries()) {
                    _alerts.infos.push(<div key={`is-${i}`}>{v.message}</div>);
                }
            }

        }
        return _alerts;
    };

    useEffect(() => {
        setAlerts(getAlerts());
    }, [fieldStatus, formStatus]);


    const [domReady, setDomReady] = useState(false);
    React.useEffect(() => { setDomReady(true); }, []);
    return (
        <div style={style}>
            {!mask && <div id={getId()} ref={ref} {...props}></div>}

            {(!portal && mask && alerts.errors.length > 0) && <Alert type="error" message={<YScroll><div style={{ maxHeight: "100px" }}>{alerts.errors}</div></YScroll>} />}
            {(!portal && mask && alerts.warnings.length > 0) && <Alert type="warning" message={<YScroll><div style={{ maxHeight: "100px" }}>{alerts.warnings}</div></YScroll>} />}
            {(!portal && mask && alerts.successes.length > 0) && <Alert type="success" message={<YScroll><div style={{ maxHeight: "100px" }}>{alerts.successes}</div></YScroll>} />}
            {(!portal && mask && alerts.infos.length > 0) && <Alert type="info" message={<YScroll><div style={{ maxHeight: "100px" }}>{alerts.infos}</div></YScroll>} />}


            {/*            {(mask) && <Alert type={status} message={<div id={getId()} ref={ref} {...props}></div>} />} */}
        </div>
    );
}



const StyledLabel = styled('div').withConfig({
    shouldForwardProp: (prop) =>
        ['className', 'style', 'children'].includes(prop)
})`
            ${({ width, align = "start", vAlign = "start", padding = "5px" }) => css`
            display: flex;
            flex-direction: row;
            align-items: ${vAlign};
            justify-content: ${align};
            padding: ${padding};
            width: ${width};
            height: 100%;
            font-weight: 600;
            font-size: 12px;
            line-height: 20px;
        `
    }
            ${({ guides }) => guides && css`
        margin: 2px;
        border: 1px dotted orange;
    `}

            ${({ pos, required, colon }) => (pos == "right") ? css`
        &:before{
            ${colon && css`
                content: ":";
                display: inline-block;
                margin-left: 1px;
            `}   
        }    
        &:after{
            ${required && css`
                content: "*";
                display: inline-block;
                color: red;
                margin-right: 4px;
            `}   
        }
    ` : css`
        &:before{
            ${required && css`
                content: "*";
                display: inline-block;
                color: red;
                margin-right: 4px;
            `}   
        }    
        &:after{
            ${colon && css`
                content: ":";
                display: inline-block;
                margin-left: 1px;
            `}   
        }
    `};

            label{
                ${({ wrap, ellipsis }) => ((!wrap && !ellipsis) && css`white-space: nowrap;`)}
            ${({ overflow, ellipsis }) => (!ellipsis) && `overflow: ${overflow ? "visible" : "hidden"};`}
            ${({ ellipsis }) => (ellipsis && css`
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `)}
    }


`;
const LabelRef = ({ refs, ...props }) => {
    const { pos = "top", enabled = true } = props;
    const [domReady, setDomReady] = useState(false);
    React.useEffect(() => { setDomReady(true); }, []);
    return (
        <>
            {enabled &&
                <Portal elId={refs[pos].current}>
                    <Label {...props} />
                </Portal>
            }
        </>
    );
}
export const Label = ({ ...props }) => {
    const { pos = "top", text = "", enabled = true, colon = true, required = false, className, style, container = {}, nameId } = props;
    const { width = ((pos === "left" || pos === "right") && "100px") } = props;
    return (
        <StyledLabel {...props} width={width} ellipsis={false} overflow={true}>
            <label htmlFor={nameId} title={text}>
                {text}
            </label>
        </StyledLabel>
    );
}





export const Container = ({ loading = false, schema, children, id, wrapForm = false, form, initialValues, onFinish, label, onValuesChange, fieldStatus: _fieldStatus, setFieldStatus: _setFieldStatus, forInput = true, wrapFormItem = false, alert = { pos: "bottom", noWrap: true, pointing: false }, ...props }) => {
    if (!id) { throw new Error(`Container (id) is Required!`) }
    const [fieldStatus, setFieldStatus] = (_fieldStatus && _setFieldStatus) ? [_fieldStatus, _setFieldStatus] : useState({});
    const updateFieldStatus = (field, status) => {
        const { ...fs } = fieldStatus;
        delete fs[field];
        setFieldStatus(prev => ({ ...fs, ...(status !== null && Object.keys(status).length > 0) && { [field]: status } }))
    };

    const fSchema = (options = {}) => {
        return getSchema({}, options).unknown(true);
    }

    const clearFieldStatus = () => { setFieldStatus({}); }
    const dataContext = { schema: (schema ? schema : fSchema), form, wrapForm, wrapFormItem, forInput, containerId: id, fieldStatus, updateFieldStatus, clearFieldStatus, alert, label };
    useEffect(() => {
        if (_fieldStatus && !_setFieldStatus) {
            setFieldStatus(_fieldStatus);
        }
    }, [_fieldStatus]);
    return (
        <Spin spinning={loading} indicator={<></>}>
            <Context.Provider value={dataContext}>
                <ConditionalWrapper
                    condition={wrapForm}
                    wrapper={children => <Form name={`frm-${id}`} form={form} onFinish={onFinish} onValuesChange={onValuesChange} initialValues={initialValues}><MainContainer {...props}>{children}</MainContainer></Form>}
                >
                    <MainContainer {...props}>{children}</MainContainer>
                </ConditionalWrapper>
            </Context.Provider>
        </Spin>
    );
}


export const SubContainer = ({ loading = false, children, forInput = true, schema, ...props }) => {
    const dataContext = { forInput, schema };
    return (
        <Spin spinning={loading} indicator={<></>}>
            <SubContext.Provider value={dataContext}>
                <MainContainer {...props}>{children}</MainContainer>
            </SubContext.Provider>
        </Spin>
    );
}




/* export const InputAddon = styled(Input)`
    .ant-input{
        text-align: right;
    }
    .ant-input-group-addon{
        background: #f5f5f5;
    }
 `; */