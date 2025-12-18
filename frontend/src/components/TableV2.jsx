import React, { useEffect, useState, useCallback, useRef, useContext, forwardRef } from 'react';
import { createUseStyles } from 'react-jss';
import styled, { css } from 'styled-components';
import Joi from 'joi';
import { fetch, fetchPost, cancelToken } from "utils/fetch";
import { getSchema } from "utils/schemaValidator";
import { API_URL } from "config";
import { useDataAPI } from "utils/useDataAPI";
import { pickAll } from "utils";
//import { WrapperForm, TitleForm, FormLayout, Field, FieldSet, Label, LabelField, FieldItem, AlertsContainer, Item, SelectField, InputAddon, VerticalSpace, HorizontalRule, SelectDebounceField } from "components/formLayout";
import Toolbar from "components/toolbar";
import Portal from "components/portal";
import { Button, Form, Space, Input, InputNumber, Tooltip, Popover, Dropdown, Menu, Divider, Select, Checkbox, Empty } from "antd";
import Icon, { LoadingOutlined, EditOutlined, CompassOutlined, InfoCircleOutlined, ReloadOutlined, EllipsisOutlined, FilterOutlined, SettingOutlined, SearchOutlined, FileFilled } from '@ant-design/icons';
import ClearSort from 'assets/clearsort.svg';
import MoreFilters from 'assets/morefilters.svg'
import ResultMessage from 'components/resultMessage';
import { Report } from "components/DownloadReports";
import Pagination from 'components/Paginator';
import Spin from "./Spin";
import { DATE_FORMAT, DATETIME_FORMAT, TIPOEMENDA_OPTIONS } from 'config';
import DataGrid, { Row as TableRow, SelectColumn } from 'react-data-grid';
import { Container, Row, Col, Visible, Hidden } from 'react-grid-system';
import { Field, Container as FormContainer, FilterDrawer } from 'components/FormFields';

const Table = styled(DataGrid).withConfig({
    shouldForwardProp: (prop) =>
        !['height', 'pagination', 'minHeight','userSelect'].includes(prop)
})`

    
    user-select:${({ userSelect }) => (userSelect) ? 'text' : "none"};
    scrollbar-color:rgba(105,112,125,.5) transparent;
    scrollbar-width:thin;
    -webkit-mask-image:linear-gradient(180deg,rgba(255,0,0,.1) 0 7.5px calc(100%-7.5px),rgba(255,0,0,.1));
    mask-image:linear-gradient(180deg,rgba(255,0,0,.1) 0 7.5px calc(100%-7.5px),rgba(255,0,0,.1));
    &::-webkit-scrollbar {
      width:16px;
      height:16px;
    }
    &::-webkit-scrollbar-thumb{
      background-color:rgba(105,112,125,.5);
      background-clip:content-box;
      border-radius:16px;
      border:6px solid transparent;
    }
    &::-webkit-scrollbar-corner{
      background-color:transparent;
    }
    &:focus {
        outline: none;
    }
    &:focus:focus-visible{
      outline-style:auto;
    } 


    .ant-btn-icon-only{
        vertical-align:0px;
    }

     .r104f42s7-0-0-beta-26{
        block-size:300px !important;
        height:300px !important;
        background-color:red;
    }
/*     .rdg.fill-grid {
        block-size: 50%;
    } */
    .rdg-header-row{
        ${({ headerStyle }) => (headerStyle) ? css`${headerStyle}` : css`
            color: #fff!important;
            background-color: #262626!important;
            font-size:12px;
            position:sticky;
            inset-block-start: 0;
            z-index: 1;
            `
    }
    }
    .rdg-row{
        ${({ rowStyle }) => (rowStyle) ? css`${rowStyle}` : css`
            font-size:12px;`
    }
    }
`;

const Action = ({ dataAPI, content, ...props }) => {
    const [clickPopover, setClickPopover] = useState(false);

    const handleClickPopover = (visible) => {
        setClickPopover(visible);
    };

    const hide = () => {
        setClickPopover(false);
    };

    return (
        <>
            <Popover
                open={clickPopover}
                onOpenChange={handleClickPopover}
                placement="bottomRight"
                title=""
                content={React.cloneElement(content, { ...content.props, hide, row: props.row })}
                trigger="click"
            >
                <Button size="small" icon={<EllipsisOutlined />} />
            </Popover>
        </>
    )
}



const ContentSettings = ({ setIsDirty, onClick, dataAPI, columns, pageSize, setPageSize, reportTitle: _reportTitle, moreFilters, clearSort, reports }) => {
    const [reportTitle, setReportTitle] = useState(_reportTitle);
    const updateReportTitle = (e) => {
        console.log(e.target)
        setReportTitle(e.target.value);
    }
    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <Menu onClick={(v) => onClick(v)} items={[
                { label: 'Atualizar', key: 'refresh', icon: <ReloadOutlined />, data: {} },
                (clearSort) && { label: 'Limpar Ordenação', key: 'cleansort', icon: <Icon component={ClearSort} />, data: {} },
                (moreFilters) && { label: 'Mais Filtros', key: 'morefilters', icon: <Icon component={MoreFilters} />, data: {} }
            ]}></Menu>
            <Divider style={{ margin: "8px 0" }} />
            {dataAPI.getPagination(true).enabled && <div style={{ display: "flex", flexDirection: "row" }}>
                <Select value={pageSize} onChange={(v) => { setIsDirty(true); setPageSize(v); }} size="small" options={[{ value: 10, label: "10" }, { value: 15, label: "15" }, { value: 20, label: "20" }, { value: 30, label: "30" }, { value: 50, label: "50" }, { value: 100, label: "100" }]} />
                <div style={{ marginLeft: "5px" }}>Registos/Página</div>
            </div>}
            {reports && <>
                <Divider orientation="left" orientationMargin="0" style={{ margin: "8px 0" }}>Relatórios</Divider>
                <Input value={reportTitle} onChange={updateReportTitle} size="small" maxLength={200} />
                <Report dataAPI={dataAPI} columns={columns} hide={onClick} title={reportTitle} />
            </>}
        </div>
    );
}

const ToolbarFilters = ({ form, dataAPI, schema, onFinish, onValuesChange, initialValues, filters, content }) => {
    return (
        <Form form={form} name={`f-ltf`} onFinish={(values) => {onFinish("filter", values);}}  onValuesChange={onValuesChange} onKeyDown={(e) => {e.stopPropagation(); if (e.key === "Enter") { onFinish("filter", form.getFieldsValue(true)); } }} initialValues={initialValues}>

            <FormContainer id="LAY-TOOLBAR-FILTERS" wrapForm={false} form={form} onFinish={onFinish} onValuesChange={onValuesChange} schema={schema} wrapFormItem={true} forInput={true} fluid>
                <Row style={{ justifyContent: "end" }} gutterWidth={2}>
                    {filters}
                    {content}
                </Row>
            </FormContainer>
        </Form>
    )
}

//const CheckboxFormatter = forwardRef(
    function checkboxFormatter({ disabled, onChange, ...props }, ref) {
        function handleChange(e) {
            onChange(e.target.checked, (e.nativeEvent).shiftKey);
        }
        return <Checkbox ref={ref} {...props} onChange={handleChange} />;
    }
//);

export default ({ dataAPI, loadOnInit = false, loading,onPageChange, columns: cols, userSelect=true, headerStyle, rowStyle, actionColumn, frozenActionColumn = false, paginationPos = 'bottom', leftToolbar, primaryKeys, rowSelection = false, title, reportTitle, settings = true, moreFilters = true, clearSort = true, reports = true, toolbar = true, search = true, toolbarFilters, content, maxPage=true, ...props }) => {
    const [columns, setColumns] = useState([]);
    /* const [rows, setRows] = useState([]); */

    const [isSettingsDirty, setSettingsIsDirty] = useState(false);
    const [clickSettings, setClickSettings] = useState(false);
    const [showMoreFilters, setShowMoreFilters] = useState(false);


    const rowKeyGetter = (row) => {
        return Object.values(pickAll(primaryKeys, row)).join("#");
    }

    const updatePageSize = (size) => {
        dataAPI.pageSize(size);
        dataAPI.fetchPost();
    }

    const hideSettings = () => {
        setClickSettings(false);
    };

    const handleSettingsClick = (visible) => {
        setClickSettings(visible);
    };

    const onSettingsClick = async (type) => {
        if (type?.key) {
            switch (type.key) {
                case 'refresh': dataAPI.fetchPost(); break;
                case 'cleansort': dataAPI.clearSort(); dataAPI.fetchPost(); break;
                case 'morefilters': setShowMoreFilters(prev => !prev); break;
                default: break;
            }
        }
        hideSettings();
    }

    useEffect(() => {
        if (!dataAPI.isLoading()) {
            if (dataAPI.hasData()) {
                /* setRows(dataAPI.getData().rows); */
            } else {
                /*  if (React.isValidElement(actionColumn)) {
                     setColumns([
                         rowSelection && SelectColumn,
                         {
                             key: 'action', name: '', minWidth: 40, width: 40, sortable: false, resizable: false,
                             formatter: (props) => <Action {...props} dataAPI={dataAPI} content={actionColumn} />
                         }, ...cols]);
                 } else {
                     setColumns([rowSelection && SelectColumn, ...cols]);
                 } */
                if (loadOnInit) {
                    dataAPI.fetchPost({});
                }
            }
        }
        if (React.isValidElement(actionColumn)) {
            setColumns([
                ...rowSelection ? [SelectColumn] : [],
                {
                    key: 'action', name: '', frozen: frozenActionColumn, minWidth: 40, width: 40, sortable: false, resizable: false,
                    formatter: (props) => <Action {...props} dataAPI={dataAPI} content={actionColumn} />
                }, ...cols.filter(v=>!v?.hidden===true)]);
        } else {
            setColumns([...rowSelection ? [SelectColumn] : [], ...cols.filter(v=>!v?.hidden===true)]);
        }
    }, [dataAPI.getTimeStamp(),cols]);

    const onColumnResize = (idx, width) => {
        console.log("column resize->", idx, "-", width);
    }

    const onSortColumnsChange = (columns) => {
        let _columns = columns.map(item => ({
            column: item.columnKey,
            direction: item.direction
        }));
        dataAPI.setSort(_columns, true);
        dataAPI.fetchPost();
    }

    const sortColumns = () => {
        return dataAPI.getSort(true).map(item => ({
            columnKey: item.column,
            direction: item.direction
        }));
    }

    const onPaging = (page) => {
        dataAPI.currentPage(page, true);
        if (typeof onPageChange === "function"){
            onPageChange();
        }else{
            dataAPI.fetchPost();
        }
    }

    /*     const selectCell = useMemo(() => {
            console.log("row-->",columns.length,props.selectedCellIdx)
            if (columns.length > 0 && props.selectedCellIdx !== undefined) {
                return columns[props.selectedCellIdx].key === "action" ? undefined : props.selectedCellIdx;
            }
            return props.selectedCellIdx;
        }, [columns, props.selectedCellIdx]); */

    const selectCell = (cols, selIdx) => {
        if (cols.length > 0 && selIdx !== undefined) {
            return cols[selIdx].key === "action" ? undefined : selIdx;
        }
        return selIdx;
    }

    const GridRow = (key, props) => {
        return <TableRow key={key} {...props} selectedCellIdx={selectCell(columns, props.selectedCellIdx)} />;
    }

    const handleCopy = ({ sourceRow, sourceColumnKey }) => {
        if (window.isSecureContext) {
            navigator.clipboard.writeText(sourceRow[sourceColumnKey]);
        }
    }

    return (
        <Spin loading={dataAPI.isLoading() || loading}>
            {(moreFilters && toolbarFilters?.moreFilters) && <FilterDrawer mask={toolbarFilters.moreFilters?.mask} schema={toolbarFilters.moreFilters.schema({ form: toolbarFilters?.form })} filterRules={toolbarFilters.moreFilters.rules()} onFinish={toolbarFilters?.onFinish} form={toolbarFilters?.form} width={toolbarFilters.moreFilters?.width} setShowFilter={setShowMoreFilters} showFilter={showMoreFilters} dataAPI={dataAPI} />}
            {(!toolbar && title) &&
                <Container fluid style={{ background: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "3px", padding: "5px" }}>
                    <Row align='start' wrap="nowrap" gutterWidth={2}>
                        <Col>{title}</Col>
                        <Col xs="content"><Button onClick={() => dataAPI.fetchPost()} size="small"><ReloadOutlined /></Button></Col>
                    </Row>
                </Container>
            }
            {toolbar && <Container fluid style={{ background: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "3px", padding: "5px" }}>
                <Row align='start' wrap="nowrap" gutterWidth={2}>
                    {title && <Col xs="content">
                        <Row><Col>{title}</Col></Row>
                        <Row><Col>{leftToolbar && leftToolbar}</Col></Row>
                    </Col>
                    }
                    {!title && <Col xs="content" style={{ alignSelf: "end" }}>{leftToolbar && leftToolbar}</Col>}
                    <Col>
                        <div /*  style={{display:"flex",flexDirection:"row", justifyContent:"right"}} */>
                            {toolbarFilters && <ToolbarFilters dataAPI={dataAPI} {...toolbarFilters} />}
                        </div>
                    </Col>
                    {search && <Col xs="content" style={{ padding: "0px", alignSelf: "center" }}><Button onClick={() => (toolbarFilters?.form) && toolbarFilters.onFinish("filter", toolbarFilters.form.getFieldsValue(true))} size="small" icon={<SearchOutlined />} /></Col>}
                    {settings && <Col xs="content" style={{ alignSelf: "center" }}>

                        <Popover
                            open={clickSettings}
                            onOpenChange={handleSettingsClick}
                            placement="bottomRight" title="Opções"
                            content={
                                <ContentSettings setIsDirty={setSettingsIsDirty} onClick={onSettingsClick}
                                    dataAPI={dataAPI} columns={columns} pageSize={dataAPI.getPageSize(true)} setPageSize={updatePageSize} reportTitle={reportTitle}
                                    moreFilters={moreFilters} reports={reports} clearSort={clearSort}
                                />
                            } trigger="click">
                            <Button size="small" icon={<SettingOutlined />} />
                        </Popover>

                    </Col>}
                </Row>
            </Container>}
            <Container fluid style={{ padding: "0px", ...(toolbar && { marginTop: "5px" }) }}>
                <Row align='center' wrap="nowrap" nogutter>
                    <Col></Col>
                    <Col xs='content'>
                        <div style={{ display: "flex", flexDirection: "row" }}>
                            {(dataAPI.getPagination(true).enabled && paginationPos !== 'bottom') && <Pagination
                                maxPage={maxPage}
                                currentPage={dataAPI.getPagination(true).page}
                                totalCount={dataAPI?.hasData() ? dataAPI.getData().total : 0}
                                pageSize={dataAPI.getPageSize(true)}
                                onPageChange={onPaging}
                                isLoading={dataAPI.isLoading()}
                            />}
                        </div>
                    </Col>
                </Row>
            </Container>
            {content && <>{content}</>}
            <Table
                headerStyle={headerStyle}
                rowStyle={rowStyle}
                sortColumns={sortColumns()}
                rows={dataAPI.hasData() ? dataAPI.getData().rows : []}
                rowHeight={React.isValidElement(actionColumn) ? 26 : 24}
                headerRowHeight={24}
                //style={{height:"100%"}}
                style={{ /* contain: "none", */ height: !dataAPI.hasData() || dataAPI.getData().rows === 0 ? 28 : (dataAPI.getData().rows.length + 1) * 28 }}
                defaultColumnOptions={{ sortable: true, resizable: true }}
                onColumnResize={onColumnResize}
                onSortColumnsChange={onSortColumnsChange}
                pagination={dataAPI.getPagination(true).enabled}
                paginationPos={paginationPos}
/*                 height="100%" */
                userSelect={userSelect}
                columns={columns}
                onCopy={handleCopy}
                rowKeyGetter={(primaryKeys && primaryKeys.length > 0) && rowKeyGetter}
                onRowsChange={dataAPI.setRows}
                //onPaste={handlePaste}
                renderers={{ rowRenderer: GridRow, checkboxFormatter: checkboxFormatter, noRowsFallback: <Empty style={{ gridColumn: '1/-1' }} image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span>Sem dados</span>} /> }}
                {...props}
            />
            <Container fluid style={{ background: "#f8f9fa", padding: "0px" }}>
                <Row align='center' nogutter wrap="nowrap">
                    <Col xs="content">
                        <Hidden xs><div id="filter-tags"></div></Hidden>
                        <Visible xs><Dropdown trigger={['click']} overlay={<div id="filter-tags"></div>}><Button icon={<FilterOutlined />} size="small" /></Dropdown></Visible>
                    </Col>
                    <Col></Col>
                    <Col xs='content'>
                        <div style={{ display: "flex", flexDirection: "row" }}>
                            {(dataAPI.getPagination(true).enabled && paginationPos !== 'top') && <Pagination
                                maxPage={maxPage}
                                currentPage={dataAPI.getPagination(true).page}
                                totalCount={dataAPI?.hasData() ? dataAPI.getData().total : 0}
                                pageSize={dataAPI.getPageSize(true)}
                                onPageChange={onPaging}
                                isLoading={dataAPI.isLoading()}
                            />}
                        </div>
                    </Col>
                </Row>
            </Container>
        </Spin >
    );
}