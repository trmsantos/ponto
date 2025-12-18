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
import { SearchOutlined } from '@ant-design/icons';

const schema = (options = {}) => {
    return getSchema({}, options).unknown(true);
}

const Filters = ({ filters }) => {
    return (<>
        {Object.keys(filters).map(k => {
            return (
                <Col key={k} xs='content'><Field name={k} label={{ enabled: true, text: filters[k]?.text, pos: "top", padding: "0px" }}>
                    <Input size='small' allowClear width={filters[k]?.width ? filters[k]?.width : 100} />
                </Field></Col>
            );
        })}
    </>)
}

const Popup = ({ params, keyField, columns, filters, moreFilters, onSelect, closeSelf, toolbar = true }) => {
    const [visible, setVisible] = useState({ drawer: { open: false } });
    const dataAPI = useDataAPI(params);
    const submitting = useSubmitting(true);
    const [formFilter] = Form.useForm();
    const defaultParameters = {};
    const defaultFilters = {};
    const defaultSort = [];
    const primaryKeys = keyField;
    const [selectedRows, setSelectedRows] = useState(() => new Set());

    useEffect(() => {
        const controller = new AbortController();
        loadData({ init: true, signal: controller.signal });
        return (() => controller.abort());
    }, []);
    const loadData = ({ init = false, signal }) => {
        console.log("initttt---->",params)
        if (init) {
            if (!params?.payload?.data) {
                //const { ...initFilters } = loadInit({ ...defaultFilters, ...defaultParameters }, { ...dataAPI.getAllFilter(), tstamp: dataAPI.getTimeStamp() }, {}, location?.state, [...Object.keys(location?.state ? location?.state : {}), ...Object.keys(dataAPI.getAllFilter())]);
                //let { filterValues, fieldValues } = fixRangeDates([], initFilters);
                //formFilter.setFieldsValue({ ...fieldValues });
                //dataAPI.addFilters(filterValues, true, false);
                //dataAPI.setSort(defaultSort);
                //dataAPI.addParameters({}, true, false);
                //console.log(fieldValues,filterValues,"#######");
                console.log("FETCHHHHHHHH-",dataAPI.getPagination(true))
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
        onSelect(row);
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
            onRowClick={onRowClick}
            rowStyle={`cursor:pointer;font-size:12px;`}
            headerStyle={`background-color:#f0f0f0;font-size:10px;`}
            loadOnInit={false}
            columns={columns}
            dataAPI={dataAPI}
            toolbar={toolbar}
            search={true}
            primaryKeys={primaryKeys}
            moreFilters={false}
            rowSelection={true}
            selectedRows={selectedRows}
            paginationPos="top"
            onSelectedRowsChange={setSelectedRows}
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
    }
`;

export default React.forwardRef(({ data, type = "modal", label, keyField, /* valueField, */ textField, size = "middle", title, popupWidth = 600, popupHeight = 400, params, toolbar, filters = {}, moreFilters = {}, columns, onSelect, value, ...rest }, ref) => {
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

    const onSelectRow = (row) => {
       /*  if ("name" in rest) {
            ctx.updateFieldStatus(rest.name, {});
        }*/
        if (onSelect && typeof onSelect === 'function') {
            onSelect(row);
        }
    }

    const onPopup = () => {
        setModalParameters({ params, title, filters, moreFilters, columns, onSelect: onSelectRow, toolbar, type, keyField })
        showModal();
    }

    return (
        <div>
            <Button icon={<SearchOutlined />} size={size} ref={ref} {...rest} onClick={onPopup}>{label}</Button>
        </div>
    );
});