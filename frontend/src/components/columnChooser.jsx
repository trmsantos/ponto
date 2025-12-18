import React, { useEffect, useState } from 'react';
import { Checkbox, Popover } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import ButtonIcon from './buttonIcon';

const CheckboxGropup = ({ uuid, allColumns, checkedColumns, setCheckedColumns }) => {
    const [indeterminate, setIndeterminate] = useState(true);
    const [checkAll, setCheckAll] = useState(false);

    const onChange = e => {
        const newCheckedColumns = !e.target.checked ? checkedColumns.filter(v => v.dataIndex !== e.target.value) : [...checkedColumns, allColumns.find(v => v.dataIndex == e.target.value)];
        setCheckedColumns(newCheckedColumns);
        localStorage.setItem(`${uuid}-checkedColumns`, JSON.stringify(newCheckedColumns));
        setIndeterminate(!!newCheckedColumns.length && newCheckedColumns.length < allColumns.length);
        setCheckAll(newCheckedColumns.length === allColumns.length);
    };

    const onCheckAllChange = e => {
        var allCols = e.target.checked ? [...allColumns] : [];
        setCheckedColumns(allCols);
        localStorage.setItem(`${uuid}-checkedColumns`, JSON.stringify(allCols));
        setIndeterminate(false);
        setCheckAll(e.target.checked);
    };

    return (
        <>
            <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>Selecionar Todas</Checkbox>
            <div style={{ margin: '8px' }}></div>
            <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
                {allColumns.map(v => {
                    return (<div style={{ paddingLeft: "12px" }} key={v.dataIndex}><Checkbox value={v.dataIndex} checked={checkedColumns.some(c => c.dataIndex == v.dataIndex) && v.dataIndex} onChange={onChange}>{v.title}</Checkbox></div>);
                })}
            </div>
        </>
    );
}



export default ({ columns, checkedColumns, setCheckedColumns }) => {
    const [allColumns, setAllColumns] = useState(columns.all.filter(v => v.optional));
    useEffect(() => {
        var ls = localStorage.getItem(`${columns.uuid}-checkedColumns`);
        const storedCols = [];
        if (ls !== null) {
            for (let col of JSON.parse(ls)) {

                storedCols.push(columns.all.find(v => v.dataIndex === col.dataIndex));
            }
        }
        console.log(columns.all);
        setCheckedColumns(ls ? storedCols : columns.all.filter(v => v?.visible));
    }, []);
    return (
        <Popover placement="bottomRight" title="Gestão de Colunas" content={<CheckboxGropup uuid={columns.uuid} allColumns={allColumns} checkedColumns={checkedColumns} setCheckedColumns={setCheckedColumns} />} trigger="click">
            <ButtonIcon><SettingOutlined /></ButtonIcon>
        </Popover>
    );
}