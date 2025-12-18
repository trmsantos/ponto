import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { Form, Tooltip, Drawer, Modal, Button, Input, Tag, AutoComplete, Select, Switch, Alert, Checkbox, Spin, DatePicker, InputNumber, TimePicker } from "antd";
const { Search } = Input;
import { useModal } from "react-modal-hook";
import ResponsiveModal from 'components/Modal';
import { useSubmitting } from "utils";
import { getFilterRangeValues, getFilterValue, secondstoDay } from "utils";
import styled, { css } from "styled-components";
import classNames from "classnames";
import { createUseStyles } from 'react-jss';
import YScroll from "../YScroll";
import { useDataAPI } from "utils/useDataAPI";
import Table from 'components/TableV2';
import { Container, Row, Col, Visible, Hidden } from 'react-grid-system';
import { Field, Container as FormContainer, SelectField, AlertsContainer, RangeDateField, SelectDebounceField, CheckboxField } from 'components/FormFields';
import { fetch, fetchPost, cancelToken } from "utils/fetch";
import { getSchema, pick, getStatus, validateMessages } from "utils/schemaValidator";


import { Context } from "./formFields";

const schema = (options = {}) => {
    return getSchema({}, options).unknown(true);
}

const Filters = ({ filters }) => {
    const autoFocusRef = useRef(null);
    useEffect(() => {
        if (autoFocusRef.current) {
            autoFocusRef.current.focus();
        }
      }, []);
    return (<>
        {Object.keys(filters).map(k => {
            return (
                <Col key={k} xs='content'><Field name={k} label={{ enabled: true, text: filters[k]?.text, pos: "top", padding: "0px" }}>
                    <Input size='small' allowClear width={filters[k]?.width ? filters[k]?.width : 100} ref={filters[k]?.autoFocus && autoFocusRef} />
                </Field></Col>
            );
        })}
    </>)
}

const Popup = ({ params, keyField, columns, filters, moreFilters, onSelect, closeSelf, toolbar = true,rowHeight=24 }) => {
    const [visible, setVisible] = useState({ drawer: { open: false } });
    const dataAPI = useDataAPI(params);
    const submitting = useSubmitting(true);
    const [formFilter] = Form.useForm();
    const defaultParameters = {};
    const defaultFilters = {};
    const defaultSort = [];
    const primaryKeys = keyField;
    useEffect(() => {
        const controller = new AbortController();
        loadData({ init: true, signal: controller.signal });
        return (() => controller.abort());
    }, []);
    const loadData = ({ init = false, signal }) => {
        if (init) {
            if (!params?.payload?.data) {
                //const { ...initFilters } = loadInit({ ...defaultFilters, ...defaultParameters }, { ...dataAPI.getAllFilter(), tstamp: dataAPI.getTimeStamp() }, {}, location?.state, [...Object.keys(location?.state ? location?.state : {}), ...Object.keys(dataAPI.getAllFilter())]);
                //let { filterValues, fieldValues } = fixRangeDates([], initFilters);
                //formFilter.setFieldsValue({ ...fieldValues });
                //dataAPI.addFilters(filterValues, true, false);
                //dataAPI.setSort(defaultSort);
                //dataAPI.addParameters({}, true, false);
                //console.log(fieldValues,filterValues,"#######");
                dataAPI.fetchPost({ signal });
            }
        }
        submitting.end();
    }
    const onOpen = (component, data) => {
        setVisible(prev => ({ ...prev, [component]: { ...data, title: <div>Bobine <span style={{ fontWeight: 900 }}>{data.nome}</span></div>, open: true } }));
    }
    const onClose = (component) => {
        setVisible(prev => ({ ...prev, [component]: { open: false } }));
    }
    const onRowClick = (row, col) => {
        onSelect(row.row);
        closeSelf();
    }
    const onFilterFinish = (type, values) => {
        switch (type) {
            case "filter":
                //remove empty values
                const { typelist, ...vals } = Object.fromEntries(Object.entries({ ...defaultFilters, ...values }).filter(([_, v]) => v !== null && v !== ''));
                const _values = {
                    ...vals,
                    ...(Object.keys(filters).reduce((accumulator, value) => {
                        return { ...accumulator, [value]: getFilterValue(vals[value], filters[value].type) };
                    }, {}))
                };
                dataAPI.addFilters(_values, true);
                dataAPI.first();
                dataAPI.fetchPost();
                break;
        }
    };
    const onFilterChange = (changedValues, values) => {
    };

    return (<YScroll>
        <Table
            onCellClick={onRowClick}
            rowStyle={`cursor:pointer;font-size:12px;`}
            headerStyle={`background-color:#f0f0f0;font-size:10px;`}
            loadOnInit={false}
            columns={columns}
            rowHeight={rowHeight}
            dataAPI={dataAPI}
            toolbar={toolbar}
            search={true}
            moreFilters={false}
            rowSelection={false}
            primaryKeys={primaryKeys}
            editable={false}
            toolbarFilters={{
                filters: <Filters filters={filters} />,
                form: formFilter, schema, wrapFormItem: true,
                onFinish: onFilterFinish, onValuesChange: onFilterChange
            }}
        //rowHeight={28}
        />
    </YScroll>);
}

const StyledSearch = styled(Search)`
    button{
        vertical-align:0px !important;
    },
    input{
        cursor:pointer;
    }
`;

const ForView = ({ forViewBorder, minHeight, forViewBackground, style, onDoubleClick, value }) => {


    return (
        <div style={{ borderRadius: "3px", padding: "2px", ...forViewBorder && { border: "solid 1px #d9d9d9" }, display: "flex", alignItems: "center", minHeight, whiteSpace: "nowrap", ...forViewBackground && { background: "#f0f0f0" }, ...(style && style) }} {...onDoubleClick && { onDoubleClick }}>{value}</div>
    );

}

export default React.forwardRef(({ data, customSearch, rowHeight, forView, type = "modal", keyField, /* valueField, */textField, detailText, size = "middle", title, popupWidth = 600, popupHeight = 400, params, toolbar, filters = {}, moreFilters = {}, columns, onChange, onSelect, value, allowClear, ...rest }, ref) => {
    const [internalValue, setInternalValue] = useState();
    const [modalParameters, setModalParameters] = useState({});
    const ctx = useContext(Context);
    const [showModal, hideModal] = useModal(({ in: open, onExited }) => {
        const content = () => {
            return (<Popup {...modalParameters} />)
        }
        return (
            <ResponsiveModal type={modalParameters.type} responsive title={title} onCancel={hideModal} width={popupWidth} height={popupHeight} footer="ref" yScroll>
                {content()}
            </ResponsiveModal>
        );
    }, [modalParameters]);




    useEffect(() => {
        let _value = null;
        if (typeof value === "object") {
            _value = value;
        } else if (Array.isArray(params?.payload?.data?.rows)) {
            _value = params.payload.data.rows.find(v => {
                if (Array.isArray(keyField) && v[keyField[0]] === value) {
                    return v;
                } else {
                    if (v[keyField] === value) {
                        return v;
                    }
                }

            })
        }

        setInternalValue(_value);
    }, [value]);


    const onSelectRow = (row) => {
        if ("name" in rest) {
            ctx.updateFieldStatus(rest.name, {});
        }
        if (onSelect && typeof onSelect === 'function') {
            onSelect(row);
        }
        onChange(row);
    }

    const onPopup = () => {
        setModalParameters({ params, title, filters, moreFilters, columns, onSelect: onSelectRow, toolbar,rowHeight, type })
        showModal();
    }

    return (
        <div>
            {
                forView ?
                    <ForView value={(internalValue && textField in internalValue) && internalValue[textField]} size={size} {...rest} /> :
                    customSearch ? React.cloneElement(customSearch, { ...customSearch.props, value: (internalValue && textField in internalValue) && internalValue[textField], size, ...rest, onClick: onPopup }) : <StyledSearch allowClear={allowClear} value={(internalValue && textField in internalValue) && internalValue[textField]} size={size} ref={ref} {...rest} onSearch={onPopup} onClick={onPopup} readOnly />
            }
            <div style={{ fontSize: "11px" }}>{((value && typeof detailText === 'function')) && detailText(value)}</div>
        </div>
    );
});