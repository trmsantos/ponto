import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Table, Pagination, Row, Col, Space } from "antd";
import styled from 'styled-components';
import { createUseStyles } from 'react-jss';
import classNames from "classnames";
import { ConditionalWrapper } from './conditionalWrapper';
import ColumnChooser from './columnChooser';
import ButtonIcon from './buttonIcon';
import Toolbar from './toolbar';
import Icon, { ReloadOutlined, SwapOutlined } from '@ant-design/icons';
import ClearSort from 'assets/clearsort.svg';
import Container from 'components/columnSettingContainer';
import { useDeepCompareEffectDebounce } from 'utils/useDeepCompareEffect';


const useStyles = createUseStyles({
    stripRows: {
        '& tr:nth-child(even)': {
            backgroundColor: "#fafafa"
        }
    },
    darkHeader: {
        '& thead > tr > th': {
            backgroundColor: "#262626!important",
            color: "#fff!important",
            borderRight: "solid 1px #f5f5f5!important"
        }
    }
});

/* const StyledTable = styled(Table)`
  .ant-table-body::-webkit-scrollbar {
    width:10px;
    height:16px;
  }
  .ant-table-body::-webkit-scrollbar-thumb{
      background-color:rgba(105,112,125,.5);
      background-clip:content-box;
      border-radius:16px;
      border:2px solid transparent;
    }
    .ant-table-body::-webkit-scrollbar-corner{
      background-color:transparent;
    }
    .ant-table-body:focus {
        outline: none;
    }
    .ant-table-body:focus:focus-visible{
      outline-style:auto;
    }
    .ant-table-body::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 2px;
    }
    .ant-table-body{
        scrollbar-color:rgba(105,112,125,.5) transparent;
        scrollbar-width:thin;
        overflow-y:auto;
        overflow-x:hidden;
        -webkit-mask-image:linear-gradient(180deg,rgba(255,0,0,.1) 0 7.5px calc(100%-7.5px),rgba(255,0,0,.1));
        mask-image:linear-gradient(180deg,rgba(255,0,0,.1) 0 7.5px calc(100%-7.5px),rgba(255,0,0,.1));
    }
    .ant-table-row {        
        ${(props) => (props.selectionEnabled === true) && `
        cursor:pointer;
    `}
    }
    .ant-table-cell {
        padding: 1px 3px !important;
    }
`; */


const StyledTable = styled(Table)`
    && tbody > tr:hover > td {
        ${({ rowHover }) => !rowHover && `
            background-color: unset;
        `}
    }
    .ant-table-cell {
        padding: 1px 3px !important;
    }

    && tbody {
        scrollbar-color: rgba(105, 112, 125, .5) transparent;
        scrollbar-width: thin;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
    }
    
    && tbody ::-webkit-scrollbar {
        width: 16px;
        height: 16px;
    }
    
    && tbody ::-webkit-scrollbar-thumb {
        background-color: rgba(105, 112, 125, .5);
        background-clip: content-box;
        border-radius: 16px;
        border: 6px solid transparent;
    }
    
    && tbody ::-webkit-scrollbar-corner {
        background-color: transparent;
    }
`;


/* const StyledTable = styled(Table)`
    .ant-table-body {
        overflow-y: auto !important;
        overflows-x: hidden !important;
    }
    .ant-table-row {        
        ${(props) => (props.selectionEnabled === true) && `
        cursor:pointer;
    `}
    }
`; */

export const setColumns = ({ uuid, dataAPI, data, include = [], exclude = [] } = {}) => {
    if (!uuid) {
        throw new Error('uuid is required')
    }
    const ret = { all: [], notOptional: [], report: {}, width: 0, uuid };
    if (!data) return;
    var keys = []
    if (Array.isArray(include) && include.length > 0) {
        keys = include;
    } else if (typeof include === 'object') {
        keys = Object.keys(include);
    } else if (data.length > 0) {
        keys = Object.keys(data[0])
    }

    for (const [i, v] of keys.entries()) {
        if (exclude.includes(v)) continue;
        let { sort = true, optional = true, ...rOptions } = (include[v] == undefined) ? {} : include[v];
        const c = {
            title: v,
            dataIndex: v,
            key: v,
            sorter: sort && { multiple: i },
            sortOrder: sort && dataAPI.sortOrder(v),
            optional,
            ellipsis: true,
            ...rOptions
        }

        if (c.editable) {
            c["onCell"] = (record) => ({
                record,
                editable: c.editable,
                dataIndex: c.dataIndex,
                title: c.title,
                input: c?.input
                //handleSave: this.handleSave,
            });
        }

        if (!c.optional) {
            ret.notOptional.push(c);
        }
        ret.width += (c?.width) ? c.width : 0;
        if (c?.reportVisible !== false) {
            ret.report[c.dataIndex] = { ...(c.width && { width: c.width }), title: (c?.reportTitle) ? c.reportTitle : c.title };
        }
        ret.all.push(c);
    }
    return ret;
}


const TableOptions = ({ columnChooser, reload, clearSort, checkedColumns, setCheckedColumns, dataAPI, columns, onFetch, toolbar }) => {
    return (
        <>
            <Space align='end'>
                {React.isValidElement(toolbar) && toolbar}
                {clearSort && typeof onFetch === 'function' && <ButtonIcon onClick={() => { dataAPI.resetSort(); onFetch(); }}><Icon component={ClearSort} /></ButtonIcon>}
                {reload && typeof onFetch === 'function' && <ButtonIcon onClick={() => onFetch()}><ReloadOutlined /></ButtonIcon>}
                {dataAPI?.hasData() && columnChooser && <ColumnChooser columns={columns} checkedColumns={checkedColumns} setCheckedColumns={setCheckedColumns} />}
            </Space>
        </>);
}


const columnSort = (columnsMap) => (a, b) => {
    const { fixed: aFixed, index: aIndex } = a;
    const { fixed: bFixed, index: bIndex } = b;
    if ((aFixed === 'left' && bFixed !== 'left') || (bFixed === 'right' && aFixed !== 'right')) {
        return -2;
    }
    if ((bFixed === 'left' && aFixed !== 'left') || (aFixed === 'right' && bFixed !== 'right')) {
        return 2;
    }
    const aKey = a.key || `${aIndex}`;
    const bKey = b.key || `${bIndex}`;
    if (columnsMap[aKey]?.order || columnsMap[bKey]?.order) {
        return (columnsMap[aKey]?.order || 0) - (columnsMap[bKey]?.order || 0);
    }
    return (a.index || 0) - (b.index || 0);
};

const genColumnKey = (key, index) => {
    if (key) {
        return Array.isArray(key) ? key.join('-') : key.toString();
    }
    return `${index}`;
};


export default ({ className, dataAPI, onFetch, columns, selection = {}, columnChooser = true, reload = true, rowHover = true, clearSort = true, title, toolbar, header = true, paginationProps = {}, darkHeader = false, stripRows = false, ...rest }) => {
    const classes = useStyles();
    /*     const counter = Container.useContainer(); */
    const { rowKey, onSelection, enabled: selectionEnabled = false, multiple = false, selectedRows, setSelectedRows } = selection;
    /*     const [selectedRows, setSelectedRows] = useState([]); */
    const [checkedColumns, setCheckedColumns] = useState([]);

    //const columnKeys = tableColumn.map((item) => genColumnKey(item.key, item.index));

    /*  const tableColumn = useMemo(() => {
         return () => {
             const _columns = [];
             for (let v of counter.columns) {
                 if (counter.columnsMap[v.key].show) {
                     _columns.push(v);
                 }
             }
             return _columns;
         }
     }, [
         counter?.sortKeyColumns,
         counter?.columnsMap,
         counter?.columns
     ]);
  */

    // const getColumns = () => {
    //     const _columns = [];
    //     /* console.log("GETCOLUMNS......",counter.columns) */
    //     for (let v of counter.columns) {
    //         if (counter.columnsMap[v.key].show) {
    //             _columns.push(v);
    //         }
    //     }
    //     return _columns;
    // }

    // useDeepCompareEffectDebounce(
    //     () => {
    //         if (getColumns() && getColumns().length > 0) {
    //             // 重新生成key的字符串用于排序
    //             const columnKeys = getColumns().map((item) => genColumnKey(item.key, item.index));
    //             console.log("DEBOUNCE......",columnKeys)
    //             counter.setSortKeyColumns(columnKeys);

    //             console.log("aaaGETCOLUMNSaaaaaa", columnKeys);
    //         }
    //     },
    //     [getColumns()],
    //     ['render', 'renderFormItem'],
    //     100,
    // );


    const css = classNames(className, { [classes.stripRows]: stripRows, [classes.darkHeader]: darkHeader });
    const onTableChange = (pagination, filters, sorter, { action }) => {
        switch (action) {
            case "sort":
                dataAPI.addSort(sorter);
                onFetch();
                break;
            case "paginate": break;
            case "filter": break;
        }
    }

    const onPageSize = (current, size) => {
        dataAPI.pageSize(size);
        dataAPI.first();
        onFetch();
    }

    const onRowClick = (record, index, rowKey) => {
        let _row;
        if (typeof rowKey === 'function') {
            _row = rowKey(record);
        } else {
            _row = [record[rowKey]];
        }
        if (multiple) {
            let newRows = [];
            if (selectedRows.includes(_row[0])) {
                newRows = selectedRows.filter(item => item !== _row[0]);
                setSelectedRows(newRows);
                if (onSelection) {
                    onSelection(newRows, record);
                }
                /*                 onSelection(newRows); */
            } else {
                newRows = [...selectedRows];
                newRows.push(..._row);
                setSelectedRows(newRows);
                if (onSelection) {
                    onSelection(newRows, record);
                }
                /*                 onSelection(newRows); */
            }
        } else {
            setSelectedRows(_row);
            if (onSelection) {
                onSelection(_row, record);
            }
            /*             onSelection([_row]); */
        }
    }

    const onChange = (keyValue, value) => {
        setSelectedRows(keyValue);
        if (onSelection) {
            onSelection(keyValue, value);
        }
    }



    /*   const tableColumn = useMemo(() => {
        return genProColumnToColumn({
          columns,
          counter,
          columnEmptyText,
          type,
          editableUtils,
          rowKey,
          childrenColumnName,
        }).sort(columnSort(counter.columnsMap));
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [
        propsColumns,
        counter?.sortKeyColumns,
        counter?.columnsMap,
        columnEmptyText,
        type,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        editableUtils.editableKeys && editableUtils.editableKeys.join(','),
      ]); */


    return (
        <>
            {header && <Toolbar clean left={title} right={<TableOptions dataAPI={dataAPI} onFetch={onFetch} toolbar={toolbar} columns={columns} columnChooser={columnChooser} reload={reload} clearSort={clearSort} checkedColumns={checkedColumns} setCheckedColumns={setCheckedColumns} />} />}
            {dataAPI?.hasData() &&
                <StyledTable
                    selectionEnabled={selectionEnabled}
                    showSorterTooltip={false}
                    rowKey={rowKey}
                    className={css}
                    bordered
                    rowHover={rowHover}
                    {...selectionEnabled && {
                        onRow: (record, rowIndex) => { return { onClick: () => onRowClick(record, rowIndex, rowKey) } },
                        rowSelection: { selectedRowKeys: selectedRows, onChange/* , columnWidth: 0, renderCell: () => "" */ }
                    }}
                    //columns={counter.columns}
                    columns={(columnChooser) ? [...columns.notOptional, ...checkedColumns] : columns.all}
                    dataSource={dataAPI.getData().rows}
                    onChange={onTableChange}
                    pagination={false} {...rest} />
            }
            <Toolbar clean left={<div id="filter-tags"></div>} right={dataAPI?.hasData() && dataAPI.getPagination(true).enabled && <Pagination {...paginationProps} showLessItems={true} current={dataAPI.getPagination(true).page} onChange={(page) => { !dataAPI.isActionPageSize() && dataAPI.nav({ page, onFetch }); }} total={dataAPI.getData().total} pageSize={dataAPI.getPageSize(true)} onShowSizeChange={onPageSize} />} />
        </>
    );

}