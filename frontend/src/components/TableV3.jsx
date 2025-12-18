import React, { useEffect, useState, useCallback, useRef, useContext, forwardRef, useLayoutEffect } from 'react';
import { createUseStyles } from 'react-jss';
import styled, { css } from 'styled-components';
import Joi from 'joi';
import { fetch, fetchPost, cancelToken } from "utils/fetch";
import { getSchema } from "utils/schemaValidator";
import { API_URL } from "config";
import { useDataAPI } from "utils/useDataAPIV3";
import { pickAll, useSizeMe } from "utils";
import sizeMe from 'react-sizeme';
//import { WrapperForm, TitleForm, FormLayout, Field, FieldSet, Label, LabelField, FieldItem, AlertsContainer, Item, SelectField, InputAddon, VerticalSpace, HorizontalRule, SelectDebounceField } from "components/formLayout";
import Toolbar from "components/toolbar";
import Portal from "components/portal";
import { Button, Form, Space, Input, InputNumber, Tooltip, Popover, Dropdown, Menu, Divider, Select, Checkbox, Empty, Tag, Badge } from "antd";
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
import { fixRangeDates } from "utils/loadInit";


import ReactDataGrid from '@inovua/reactdatagrid-enterprise';
import PaginationToolbar from '@inovua/reactdatagrid-community/packages/PaginationToolbar';
import '@inovua/reactdatagrid-enterprise/index.css';
import { props } from 'ramda';


const Table = styled(ReactDataGrid)`
    .InovuaReactDataGrid__header{
        background-color:#000;
        color:#fff;
    }
    .InovuaReactDataGrid__cell{
        color:#000;
    }
    .inovua-react-pagination-toolbar{
        position:relative !important;
        border-top:none !important;
    }
`;

export const TypeRelation = () => <Select size='small' options={[{ value: "e" }, { value: "ou" }, { value: "!e" }, { value: "!ou" }]} />;



// const Table = styled(DataGrid).withConfig({
//     shouldForwardProp: (prop) =>
//         !['height', 'pagination', 'minHeight','userSelect'].includes(prop)
// })`


//     user-select:${({ userSelect }) => (userSelect) ? 'text' : "none"};
//     scrollbar-color:rgba(105,112,125,.5) transparent;
//     scrollbar-width:thin;
//     -webkit-mask-image:linear-gradient(180deg,rgba(255,0,0,.1) 0 7.5px calc(100%-7.5px),rgba(255,0,0,.1));
//     mask-image:linear-gradient(180deg,rgba(255,0,0,.1) 0 7.5px calc(100%-7.5px),rgba(255,0,0,.1));
//     &::-webkit-scrollbar {
//       width:16px;
//       height:16px;
//     }
//     &::-webkit-scrollbar-thumb{
//       background-color:rgba(105,112,125,.5);
//       background-clip:content-box;
//       border-radius:16px;
//       border:6px solid transparent;
//     }
//     &::-webkit-scrollbar-corner{
//       background-color:transparent;
//     }
//     &:focus {
//         outline: none;
//     }
//     &:focus:focus-visible{
//       outline-style:auto;
//     } 


//     .ant-btn-icon-only{
//         vertical-align:0px;
//     }

//      .r104f42s7-0-0-beta-26{
//         block-size:300px !important;
//         height:300px !important;
//         background-color:red;
//     }
// /*     .rdg.fill-grid {
//         block-size: 50%;
//     } */
//     .rdg-header-row{
//         ${({ headerStyle }) => (headerStyle) ? css`${headerStyle}` : css`
//             color: #fff!important;
//             background-color: #262626!important;
//             font-size:12px;
//             position:sticky;
//             inset-block-start: 0;
//             z-index: 1;
//             `
//     }
//     }
//     .rdg-row{
//         ${({ rowStyle }) => (rowStyle) ? css`${rowStyle}` : css`
//             font-size:12px;`
//     }
//     }
// `;

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



const ContentSettings = ({ setIsDirty, onClick, dataAPI, columns/*  pageSize, setPageSize */, reportTitle: _reportTitle, moreFilters, clearSort, reports }) => {
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
            {/* {dataAPI.getPagination(true).enabled && <div style={{ display: "flex", flexDirection: "row" }}>
                <Select value={pageSize} onChange={(v) => { setIsDirty(true); setPageSize(v); }} size="small" options={[{ value: 10, label: "10" }, { value: 15, label: "15" }, { value: 20, label: "20" }, { value: 30, label: "30" }, { value: 50, label: "50" }, { value: 100, label: "100" }]} />
                <div style={{ marginLeft: "5px" }}>Registos/Página</div>
            </div>} */}
            {reports && <>
                <Divider orientation="left" orientationMargin="0" style={{ margin: "8px 0" }}>Relatórios</Divider>
                <Input value={reportTitle} onChange={updateReportTitle} size="small" maxLength={200} />
                <Report dataAPI={dataAPI} columns={columns} hide={onClick} title={reportTitle} />
            </>}
        </div>
    );
}




const RenderChildren = sizeMe({ monitorHeight: true, noPlaceholder: true, refreshRate: 500 })(({ children, setChildrenSize, ...props }) => {
    const { width, height } = props.size;
    useEffect(() => {
        setChildrenSize({ width, height });
    }, [width, height]);
    return (
        <>
            {children}
        </>
    )
})

const MeasuredParent = sizeMe({ monitorHeight: true, noPlaceholder: true, refreshRate: 500 })(({ id, containerProps = {}, children, maxHeight, setIsOverflow, isOverflow, checkHeight, ...props }) => {
    const { width, height } = props.size;
    const [childrenSize, setChildrenSize] = useState({ width: null, height: null });

    const _overflow = () => {
        if (checkHeight) {
            return (childrenSize.width > width || childrenSize.height > height);
        } else {
            return (childrenSize.width > width);
        }
    }

    useEffect(() => {
        if (checkHeight) {
            setIsOverflow(_overflow());
        } else {
            setIsOverflow(_overflow());
        }
    }, [width, height, childrenSize.width, childrenSize.height]);

    return (
        <Col {...containerProps} style={{ maxHeight: `${maxHeight}px`, overflow: "hidden", ...containerProps?.style }}>
            <Row nogutter style={{ ...(_overflow() || isOverflow === null) && { visibility: "hidden", ...(!checkHeight) && { maxHeight: "1px" } } }}>
                <Col style={{ display: "flex" }}>
                    <RenderChildren setChildrenSize={setChildrenSize} containerWidth={width} containerHeight={height}>
                        {React.cloneElement(children, { ...children.props, style: { ...children.props?.style, /* ...childrenSize?.width && {width: `${childrenSize.width}px`} */ } })}
                    </RenderChildren>
                </Col>
            </Row>
        </Col>
    )
})




const ResponsiveItem = ({ id, containerProps, children, maxHeight = 24, colWidth = 25, rowProps, colProps = {}, popover, defaultCol, checkHeight = true }) => {
    const [isOverflow, setIsOverflow] = useState(null);
    return (
        <Col>
            <Row nogutter {...rowProps} style={{ ...rowProps?.style }} wrap="nowrap">
                <MeasuredParent id={id} containerProps={containerProps} maxHeight={maxHeight} setIsOverflow={setIsOverflow} isOverflow={isOverflow} checkHeight={checkHeight}>

                    {children}

                </MeasuredParent>
                <Col width={`${colWidth}px`} {...colProps} style={{ ...colProps?.style }}>
                    {(isOverflow === true && popover) && React.cloneElement(popover, { ...popover.props, content: [children, popover.props?.content] })}
                    {(isOverflow === false && defaultCol) && defaultCol}
                </Col>
            </Row>
        </Col>
    );
}

const ToolbarFilters = ({ form, dataAPI, schema, onFinish, onValuesChange, initialValues, filters, content }) => {
    const countFilters = Object.keys(dataAPI.removeEmpty(dataAPI.getFilter(true))).length;
    return (
        <Form style={{}} form={form} name={`f-ltf`} onFinish={(values) => { onFinish("filter", values); }} onValuesChange={onValuesChange} onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") { onFinish("filter", form.getFieldsValue(true)); } }} initialValues={initialValues}>
            <FormContainer style={{ paddingRight: "0px" }} id="LAY-TOOLBAR-FILTERS" wrapForm={false} form={form} onFinish={onFinish} onValuesChange={onValuesChange} schema={schema} wrapFormItem={true} forInput={true} fluid>
                <Row gutterWidth={2} style={{}} >
                    <ResponsiveItem
                        checkHeight={false}

                        containerProps={{ style: { maxHeight: "56px", display: "flex", justifyContent: "end" } }}
                        colWidth={25}
                        rowProps={{ style: { display: "flex" } }}
                        colProps={{ style: { alignSelf: "end", marginBottom: "4px", marginTop: "7px" } }}
                        defaultCol={
                            <Badge count={countFilters} size="small"><Button onClick={() => (form) && onFinish("filter", form.getFieldsValue(true))} size="small" icon={<SearchOutlined />} /></Badge>
                        }
                        popover={

                            <Popover trigger="click" content={
                                <div style={{ textAlign: "center" }}><Button type="primary" onClick={() => (form) && onFinish("filter", form.getFieldsValue(true))} size="small">Aplicar</Button></div>
                            }>
                                <Badge size='small' count={countFilters}>
                                    <Button onClick={() => (form) && onFinish("filter", form.getFieldsValue(true))} size="small" icon={<SearchOutlined />} />
                                </Badge>
                            </Popover>

                        }
                    >
                        <Row nogutter style={{ display: "flex", justifyContent: "end", paddingRight: "3px" }} wrap="nowrap">
                            {filters}
                            {content}
                        </Row>
                    </ResponsiveItem>
                </Row>
            </FormContainer>
        </Form >
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

// export default ({ dataAPI, loadOnInit = false, loading,onPageChange, columns: cols, userSelect=true, headerStyle, rowStyle, actionColumn, frozenActionColumn = false, paginationPos = 'bottom', leftToolbar, primaryKeys, rowSelection = false, title, reportTitle, settings = true, moreFilters = true, clearSort = true, reports = true, toolbar = true, search = true, toolbarFilters, content, maxPage=true, ...props }) => {
//     const [columns, setColumns] = useState([]);
//     /* const [rows, setRows] = useState([]); */

//     const [isSettingsDirty, setSettingsIsDirty] = useState(false);
//     const [clickSettings, setClickSettings] = useState(false);
//     const [showMoreFilters, setShowMoreFilters] = useState(false);


//     const rowKeyGetter = (row) => {
//         return Object.values(pickAll(primaryKeys, row)).join("#");
//     }

//     const updatePageSize = (size) => {
//         dataAPI.pageSize(size);
//         dataAPI.fetchPost();
//     }

//     const hideSettings = () => {
//         setClickSettings(false);
//     };

//     const handleSettingsClick = (visible) => {
//         setClickSettings(visible);
//     };

//     const onSettingsClick = async (type) => {
//         if (type?.key) {
//             switch (type.key) {
//                 case 'refresh': dataAPI.fetchPost(); break;
//                 case 'cleansort': dataAPI.clearSort(); dataAPI.fetchPost(); break;
//                 case 'morefilters': setShowMoreFilters(prev => !prev); break;
//                 default: break;
//             }
//         }
//         hideSettings();
//     }

//     useEffect(() => {
//         if (!dataAPI.isLoading()) {
//             if (dataAPI.hasData()) {
//                 /* setRows(dataAPI.getData().rows); */
//             } else {
//                 /*  if (React.isValidElement(actionColumn)) {
//                      setColumns([
//                          rowSelection && SelectColumn,
//                          {
//                              key: 'action', name: '', minWidth: 40, width: 40, sortable: false, resizable: false,
//                              formatter: (props) => <Action {...props} dataAPI={dataAPI} content={actionColumn} />
//                          }, ...cols]);
//                  } else {
//                      setColumns([rowSelection && SelectColumn, ...cols]);
//                  } */
//                 if (loadOnInit) {
//                     dataAPI.fetchPost({});
//                 }
//             }
//         }
//         if (React.isValidElement(actionColumn)) {
//             setColumns([
//                 ...rowSelection ? [SelectColumn] : [],
//                 {
//                     key: 'action', name: '', frozen: frozenActionColumn, minWidth: 40, width: 40, sortable: false, resizable: false,
//                     formatter: (props) => <Action {...props} dataAPI={dataAPI} content={actionColumn} />
//                 }, ...cols.filter(v=>!v?.hidden===true)]);
//         } else {
//             setColumns([...rowSelection ? [SelectColumn] : [], ...cols.filter(v=>!v?.hidden===true)]);
//         }
//     }, [dataAPI.getTimeStamp(),cols]);

//     const onColumnResize = (idx, width) => {
//         console.log("column resize->", idx, "-", width);
//     }

//     const onSortColumnsChange = (columns) => {
//         let _columns = columns.map(item => ({
//             column: item.columnKey,
//             direction: item.direction
//         }));
//         dataAPI.setSort(_columns,[], true);
//         dataAPI.fetchPost();
//     }

//     const sortColumns = () => {
//         return dataAPI.getSort(true).map(item => ({
//             columnKey: item.column,
//             direction: item.direction
//         }));
//     }

//     const onPaging = (page) => {
//         dataAPI.currentPage(page, true);
//         if (typeof onPageChange === "function"){
//             onPageChange();
//         }else{
//             dataAPI.fetchPost();
//         }
//     }

//     /*     const selectCell = useMemo(() => {
//             console.log("row-->",columns.length,props.selectedCellIdx)
//             if (columns.length > 0 && props.selectedCellIdx !== undefined) {
//                 return columns[props.selectedCellIdx].key === "action" ? undefined : props.selectedCellIdx;
//             }
//             return props.selectedCellIdx;
//         }, [columns, props.selectedCellIdx]); */

//     const selectCell = (cols, selIdx) => {
//         if (cols.length > 0 && selIdx !== undefined) {
//             return cols[selIdx].key === "action" ? undefined : selIdx;
//         }
//         return selIdx;
//     }

//     const GridRow = (key, props) => {
//         return <TableRow key={key} {...props} selectedCellIdx={selectCell(columns, props.selectedCellIdx)} />;
//     }

//     const handleCopy = ({ sourceRow, sourceColumnKey }) => {
//         if (window.isSecureContext) {
//             navigator.clipboard.writeText(sourceRow[sourceColumnKey]);
//         }
//     }

//     return (
//         <Spin loading={dataAPI.isLoading() || loading}>
//             {(moreFilters && toolbarFilters?.moreFilters) && <FilterDrawer mask={toolbarFilters.moreFilters?.mask} schema={toolbarFilters.moreFilters.schema({ form: toolbarFilters?.form })} filterRules={toolbarFilters.moreFilters.rules()} onFinish={toolbarFilters?.onFinish} form={toolbarFilters?.form} width={toolbarFilters.moreFilters?.width} setShowFilter={setShowMoreFilters} showFilter={showMoreFilters} dataAPI={dataAPI} />}
//             {(!toolbar && title) &&
//                 <Container fluid style={{ background: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "3px", padding: "5px" }}>
//                     <Row align='start' wrap="nowrap" gutterWidth={2}>
//                         <Col>{title}</Col>
//                         <Col xs="content"><Button onClick={() => dataAPI.fetchPost()} size="small"><ReloadOutlined /></Button></Col>
//                     </Row>
//                 </Container>
//             }
//             {toolbar && <Container fluid style={{ background: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "3px", padding: "5px" }}>
//                 <Row align='start' wrap="nowrap" gutterWidth={2}>
//                     {title && <Col xs="content">
//                         <Row><Col>{title}</Col></Row>
//                         <Row><Col>{leftToolbar && leftToolbar}</Col></Row>
//                     </Col>
//                     }
//                     {!title && <Col xs="content" style={{ alignSelf: "end" }}>{leftToolbar && leftToolbar}</Col>}
//                     <Col>
//                         <div /*  style={{display:"flex",flexDirection:"row", justifyContent:"right"}} */>
//                             {toolbarFilters && <ToolbarFilters dataAPI={dataAPI} {...toolbarFilters} />}
//                         </div>
//                     </Col>
//                     {search && <Col xs="content" style={{ padding: "0px", alignSelf: "center" }}><Button onClick={() => (toolbarFilters?.form) && toolbarFilters.onFinish("filter", toolbarFilters.form.getFieldsValue(true))} size="small" icon={<SearchOutlined />} /></Col>}
//                     {settings && <Col xs="content" style={{ alignSelf: "center" }}>

//                         <Popover
//                             open={clickSettings}
//                             onOpenChange={handleSettingsClick}
//                             placement="bottomRight" title="Opções"
//                             content={
//                                 <ContentSettings setIsDirty={setSettingsIsDirty} onClick={onSettingsClick}
//                                     dataAPI={dataAPI} columns={columns} pageSize={dataAPI.getPageSize(true)} setPageSize={updatePageSize} reportTitle={reportTitle}
//                                     moreFilters={moreFilters} reports={reports} clearSort={clearSort}
//                                 />
//                             } trigger="click">
//                             <Button size="small" icon={<SettingOutlined />} />
//                         </Popover>

//                     </Col>}
//                 </Row>
//             </Container>}
//             <Container fluid style={{ padding: "0px", ...(toolbar && { marginTop: "5px" }) }}>
//                 <Row align='center' wrap="nowrap" nogutter>
//                     <Col></Col>
//                     <Col xs='content'>
//                         <div style={{ display: "flex", flexDirection: "row" }}>
//                             {(dataAPI.getPagination(true).enabled && paginationPos !== 'bottom') && <Pagination
//                                 maxPage={maxPage}
//                                 currentPage={dataAPI.getPagination(true).page}
//                                 totalCount={dataAPI?.hasData() ? dataAPI.getData().total : 0}
//                                 pageSize={dataAPI.getPageSize(true)}
//                                 onPageChange={onPaging}
//                                 isLoading={dataAPI.isLoading()}
//                             />}
//                         </div>
//                     </Col>
//                 </Row>
//             </Container>
//             {content && <>{content}</>}
//             <Table
//                 headerStyle={headerStyle}
//                 rowStyle={rowStyle}
//                 sortColumns={sortColumns()}
//                 rows={dataAPI.hasData() ? dataAPI.getData().rows : []}
//                 rowHeight={React.isValidElement(actionColumn) ? 26 : 24}
//                 headerRowHeight={24}
//                 //style={{height:"100%"}}
//                 style={{ /* contain: "none", */ height: !dataAPI.hasData() || dataAPI.getData().rows === 0 ? 28 : (dataAPI.getData().rows.length + 1) * 28 }}
//                 defaultColumnOptions={{ sortable: true, resizable: true }}
//                 onColumnResize={onColumnResize}
//                 onSortColumnsChange={onSortColumnsChange}
//                 pagination={dataAPI.getPagination(true).enabled}
//                 paginationPos={paginationPos}
// /*                 height="100%" */
//                 userSelect={userSelect}
//                 columns={columns}
//                 onCopy={handleCopy}
//                 rowKeyGetter={(primaryKeys && primaryKeys.length > 0) && rowKeyGetter}
//                 onRowsChange={dataAPI.setRows}
//                 //onPaste={handlePaste}
//                 renderers={{ rowRenderer: GridRow, checkboxFormatter: checkboxFormatter, noRowsFallback: <Empty style={{ gridColumn: '1/-1' }} image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span>Sem dados</span>} /> }}
//                 {...props}
//             />
//             <Container fluid style={{ background: "#f8f9fa", padding: "0px" }}>
//                 <Row align='center' nogutter wrap="nowrap">
//                     <Col xs="content">
//                         <Hidden xs><div id="filter-tags"></div></Hidden>
//                         <Visible xs><Dropdown trigger={['click']} overlay={<div id="filter-tags"></div>}><Button icon={<FilterOutlined />} size="small" /></Dropdown></Visible>
//                     </Col>
//                     <Col></Col>
//                     <Col xs='content'>
//                         <div style={{ display: "flex", flexDirection: "row" }}>
//                             {(dataAPI.getPagination(true).enabled && paginationPos !== 'top') && <Pagination
//                                 maxPage={maxPage}
//                                 currentPage={dataAPI.getPagination(true).page}
//                                 totalCount={dataAPI?.hasData() ? dataAPI.getData().total : 0}
//                                 pageSize={dataAPI.getPageSize(true)}
//                                 onPageChange={onPaging}
//                                 isLoading={dataAPI.isLoading()}
//                             />}
//                         </div>
//                     </Col>
//                 </Row>
//             </Container>
//         </Spin >
//     );
// }

const paginationI18n = {
    pageText: 'Página ',
    ofText: ' de ',
    perPageText: 'Resultados por página',
    showingText: 'Mostrar '
}
const i18n = {
    ...ReactDataGrid.defaultProps.i18n,
    pagination: paginationI18n, ...{
        ...paginationI18n,
        showingText: 'Mostrar ',
        clearAll: 'Limpar tudo',
        clear: 'Limpar',
        showFilteringRow: 'Mostrar linha filtrada',
        hideFilteringRow: 'Esconder linha filtrada',
        dragHeaderToGroup: 'Arrastar cabeçalho para o grupo',
        disable: 'Inativar',
        enable: 'Ativar',
        sortAsc: 'Ordenação ascendente',
        sortDesc: 'Ordenação descendente',
        unsort: 'Limparar ordenação',
        group: 'Agrupar',
        ungroup: 'Desagrupar',
        lockStart: 'Fixar no íncio',
        lockEnd: 'Fixar no fim',
        unlock: 'Desfixar',
        columns: 'Colunas',
        contains: 'Contém',
        startsWith: 'Começa por',
        endsWith: 'Termina com',
        notContains: 'Não contém',
        neq: 'Dieferente',
        eq: 'Igual',
        notEmpty: 'Não vazio',
        empty: 'Vazio',
        lt: 'Menor que',
        lte: 'Menor ou igual que',
        gt: 'Maior que',
        gte: 'Maior ou igual que',
        autoresizeThisColumn: "Dimensionar auto. esta coluna",
        autoresizeAllColumns: "Dimensionar auto. todas as colunas",
        autoSizeToFit: "Dimensionar ao tamanho",
        calendar: {
            ...ReactDataGrid.defaultProps.i18n.calendar, ...{
                todayButtonText: 'Hoje',
                clearButtonText: 'Limpar',
                okButtonText: 'OK',
                cancelButtonText: 'Cancelar'
            }
        }
    }
};
const DEFAULT_ACTIVE_CELL = [0, 0];
const schema = (options = {}) => {
    return getSchema({}, options).unknown(true);
}



const defaultMoreFilters = () => ({
    width: "500px",
    mask: true,
    filterRules: ((keys) => { return getSchema({}, { keys }).unknown(true); })()
});

const FilterTags = ({ dataAPI, removeFilter, style }) => {
    return (
        <div style={{ ...style }}>
            {dataAPI.getFilter(true) && Object.keys(dataAPI.removeEmpty(dataAPI.getFilter(true))).map(v =>
                <Tag key={`ftag-${v}`} color="blue" closable onClose={() => removeFilter(v)}>{dataAPI.getFilter(true)[v]}</Tag>
            )}
        </div>
    );
}


export default ({ dataAPI, columns, modeEdit, loadOnInit = false, onPageChange, formFilter, toolbarFilters, moreFilters = false, title, leftToolbar, toolbar = true, settings = true, clearSort = true, reports = true, reportTitle, ...props }) => {
    const gridStyle = { minHeight: '100%', fontSize: "12px" };
    const [showMoreFilters, setShowMoreFilters] = useState(false);
    const [isSettingsDirty, setSettingsIsDirty] = useState(false);
    const [clickSettings, setClickSettings] = useState(false);
    const [initLoaded, setInitLoaded] = useState(false); //Indica se a datagrid já fez o load inicial
    const [gridRef, setGridRef] = useState(null);
    const action = useRef(null);

    const dataSource = useCallback(async ({ skip, limit, sortInfo, ...rest }) => {
        let dt = { data: [], count: 0 };
        console.log("datasourrrrrceeeeee", rest, action)
        if (["page", "pagesize"].includes(action?.current)) {
            dataAPI.pageSize(limit);
            dataAPI.currentPage((skip / limit) + 1);
            const _v = await dataAPI.fetchPost();
            dt = { data: _v?.rows ? _v?.rows : [], count: _v?.total ? _v?.total : 0 };
        } else if (["sort"].includes(action?.current)) {
            const _v = await dataAPI.fetchPost();
            dt = { data: _v?.rows ? _v?.rows : [], count: _v?.total ? _v?.total : 0 };
        } else {
            if (loadOnInit && !initLoaded) {
                setInitLoaded(true);
                const _v = await dataAPI.fetchPost();
                dt = { data: _v?.rows ? _v?.rows : [], count: _v?.total ? _v?.total : 0 };
            } else {
                dt = { data: dataAPI.hasData() ? dataAPI.getData()?.rows : [], count: dataAPI.hasData() ? dataAPI.getData()?.total : 0 };
            }
        }
        action.current = null;
        return dt;
    }, []);
    const renderPaginationToolbar = //useCallback(
        (paginationProps) => {

            const removeFilter = (k) => {
                const { fieldValues, filterValues } = fixRangeDates(null, { ...dataAPI.getFilter(true), [k]: undefined });
                dataAPI.setFilters(filterValues);
                toolbarFilters?.form.setFieldsValue(fieldValues);
                dataAPI.update();
            }
            return <Container fluid style={{ padding: "0px 5px" }}>
                <Row wrap="nowrap" nogutter style={{ borderTop: "1px solid #e4e3e2", display: "flex", flex: 1, alignItems: "center" }}>


                    <ResponsiveItem
                        maxHeight={24}
                        containerProps={{ style: {} }}
                        colWidth={65}
                        rowProps={{ style: { display: "flex" } }}
                        colProps={{ style: { alignSelf: "end", marginBottom: "4px" } }}
                        popover={

                            <Popover trigger="click">
                                <Badge size='small' count={Object.keys(dataAPI.removeEmpty(dataAPI.getFilter(true))).length}>
                                    <Button size="small">Filtros</Button>
                                </Badge>
                            </Popover>

                        }
                    >
                        <FilterTags dataAPI={dataAPI} removeFilter={removeFilter} />
                    </ResponsiveItem>





                    {/* <ResponsiveItem maxHeight={24} id="pag" button={<Button size="small">Filtros</Button>} containerProps={{ xs: 2, md: 6 }} n={Object.keys(dataAPI.removeEmpty(dataAPI.getFilter(true))).length}><FilterTags dataAPI={dataAPI} removeFilter={removeFilter} /></ResponsiveItem> */}
                    <Col xs={10} md={6}><PaginationToolbar {...paginationProps} {...paginationI18n} bordered={false} /></Col>
                </Row>
            </Container>
        }//, [dataAPI.getTimeStamp()])

    const onKeyDown = (event) => {
        if (modeEdit) {
            return
        }
        const grid = gridRef.current
        let [rowIndex, colIndex] = grid.computedActiveCell

        if (event.key === ' ' || event.key === 'Enter') {
            const column = grid.getColumnBy(colIndex)
            grid.startEdit({ columnId: column.name, rowIndex })
            event.preventDefault()
            return
        }
        if (event.key !== 'Tab') {
            return
        }
        event.preventDefault()
        event.stopPropagation()

        const direction = event.shiftKey ? -1 : 1

        const columns = grid.visibleColumns
        const rowCount = grid.count

        colIndex += direction
        if (colIndex === -1) {
            colIndex = columns.length - 1
            rowIndex -= 1
        }
        if (colIndex === columns.length) {
            rowIndex += 1
            colIndex = 0
        }
        if (rowIndex < 0 || rowIndex === rowCount) {
            return
        }

        grid.setActiveCell([rowIndex, colIndex])
    }
    const onSkipChange = (skip) => {
        action.current = "page";
        dataAPI.currentPage(skip / dataAPI.getPageSize(), true);
    }
    const onLimitChange = (limit) => {
        action.current = "pagesize";
        dataAPI.pageSize(limit, true);
    }
    const onSortChange = (sortInfo) => {
        action.current = "sort";
        dataAPI.setSort(Array.isArray(sortInfo) ? sortInfo : [sortInfo], [], true);
    }
    const onFilterValueChange = (filterValue) => {
        action.current = "filter";
        console.log("filter", filterValue);
    }

    const hideSettings = () => {
        setClickSettings(false);
    }
    const handleSettingsClick = (visible) => {
        setClickSettings(visible);
    }
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

    return (<>
        {/*         <Form form={formFilter} style={{ height: "80%" }}> */}
        {(moreFilters && toolbarFilters?.moreFilters) &&
            <FilterDrawer
                setShowFilter={setShowMoreFilters} showFilter={showMoreFilters} dataAPI={dataAPI}
                {...defaultMoreFilters()}
                {...toolbarFilters?.onFinish && { onFinish: toolbarFilters.onFinish }}
                {...toolbarFilters?.form && { form: toolbarFilters.form }}
                {...toolbarFilters.moreFilters?.width && { width: toolbarFilters.moreFilters.width }}
                {...toolbarFilters.moreFilters?.rules && { filterRules: toolbarFilters.moreFilters.rules() }}
                {...toolbarFilters.moreFilters?.schema && { schema: toolbarFilters.moreFilters.schema({ form: toolbarFilters?.form }) }}
                {...toolbarFilters.moreFilters?.mask && { mask: toolbarFilters.moreFilters?.mask }}
            />}
        {toolbar && <Container fluid style={{ background: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "3px", padding: "5px" }}>
            <Row align='start' wrap="nowrap" gutterWidth={15}>
                {title && <Col xs="content">
                    <Row><Col>{title}</Col></Row>
                    <Row><Col>{leftToolbar && leftToolbar}</Col></Row>
                </Col>
                }
                {!title && <Col xs="content" style={{ alignSelf: "end" }}>{leftToolbar && leftToolbar}</Col>}
                <Col style={{ overflow: "hidden" }}>{toolbarFilters && <ToolbarFilters dataAPI={dataAPI} {...toolbarFilters} />}</Col>
                {/* {search && <Col xs="content" style={{ padding: "0px", alignSelf: "end", marginBottom: "4px" }}><Badge count={Object.keys(dataAPI.removeEmpty(dataAPI.getFilter(true))).length} size="small"><Button onClick={() => (toolbarFilters?.form) && toolbarFilters.onFinish("filter", toolbarFilters.form.getFieldsValue(true))} size="small" icon={<SearchOutlined />} /></Badge></Col>} */}
                {settings && <Col xs="content" style={{ alignSelf: "end", marginBottom: "4px" }}>

                    <Popover
                        open={clickSettings}
                        onOpenChange={handleSettingsClick}
                        placement="bottomRight" title="Opções"
                        content={
                            <ContentSettings setIsDirty={setSettingsIsDirty} onClick={onSettingsClick}
                                dataAPI={dataAPI} columns={columns} pageSize={dataAPI.getPageSize(true)} /* setPageSize={updatePageSize} */ reportTitle={reportTitle}
                                moreFilters={moreFilters} reports={reports} clearSort={clearSort}
                            />
                        } trigger="click">
                        <Button size="small" icon={<SettingOutlined />} />
                    </Popover>

                </Col>}
            </Row>
        </Container>}


        <div style={{ height: "80%" }}>
            <Table
                i18n={i18n}
                renderPaginationToolbar={renderPaginationToolbar}
                filterRowHeight={40}
                headerHeight={40}
                handle={setGridRef}
                idProperty="id"
                columns={columns}
                rowHeight={30}
                dataSource={dataSource}
                style={gridStyle}
                defaultActiveCell={DEFAULT_ACTIVE_CELL}
                onKeyDown={onKeyDown}
                onSkipChange={onSkipChange}
                onLimitChange={onLimitChange}
                onSortInfoChange={onSortChange}
                onFilterValueChange={onFilterValueChange}
                limit={dataAPI.getPageSize(true)}
                sortInfo={dataAPI.getSort(true)}
                enableFiltering={false}
                {...props}
            />
        </div>
        {/*         </Form> */}
    </>
    );
}
