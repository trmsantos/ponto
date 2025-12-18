import {
    ConsoleSqlOutlined,
    SettingOutlined,
    VerticalAlignBottomOutlined,
    VerticalAlignMiddleOutlined,
    VerticalAlignTopOutlined,
} from '@ant-design/icons';
import { Checkbox, ConfigProvider, Popover, Space, Tooltip, Tree } from 'antd';
import classNames from 'classnames';
import omit from 'omit.js';
import React, { useContext, useEffect, useMemo, useRef, useCallback } from 'react';
import Container from './columnSettingContainer';
import useRefFunction from 'utils/useRefFunction';

const genColumnKey = (key, index) => {
    if (key) {
        return Array.isArray(key) ? key.join('-') : key.toString();
    }
    return `${index}`;
};

const runFunction = (valueEnum, ...rest) => {
    if (typeof valueEnum === 'function') {
        return valueEnum(...rest);
    }
    return valueEnum;
}

const ToolTipIcon = ({ title, show, children, columnKey, fixed }) => {
    const { columnsMap, setColumnsMap } = Container.useContainer();
    if (!show) {
        return null;
    }
    return (
        <Tooltip title={title}>
            <span
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const config = columnsMap[columnKey] || {};
                    const disableIcon = typeof config.disable === 'boolean' && config.disable;
                    if (disableIcon) return;
                    const columnKeyMap = {
                        ...columnsMap,
                        [columnKey]: { ...config, fixed },
                    };
                    setColumnsMap(columnKeyMap);
                }}
            >
                {children}
            </span>
        </Tooltip>
    );
};

const CheckboxListItem = ({ columnKey, isLeaf, title, className, fixed }) => {
    const dom = (
        <span>
            <ToolTipIcon
                columnKey={columnKey}
                fixed="left"
                title="Fixar à Esquerda"
                show={fixed !== 'left'}
            >
                <VerticalAlignTopOutlined />
            </ToolTipIcon>
            <ToolTipIcon
                columnKey={columnKey}
                fixed={undefined}
                title="Não Fixar"
                show={!!fixed}
            >
                <VerticalAlignMiddleOutlined />
            </ToolTipIcon>
            <ToolTipIcon
                columnKey={columnKey}
                fixed="right"
                title="Fixar à Direita"
                show={fixed !== 'right'}
            >
                <VerticalAlignBottomOutlined />
            </ToolTipIcon>
        </span>
    );
    return (
        <span key={columnKey}>
            <div>{title}</div>
            {!isLeaf ? dom : null}
        </span>
    );
};

const CheckboxList = ({
    list,
    draggable,
    checkable,
    className,
    showTitle = true,
    title: listTitle,
    listHeight = 280,
}) => {
    const { columnsMap, setColumnsMap, sortKeyColumns, setSortKeyColumns } = Container.useContainer();
    const show = list && list.length > 0;
    const treeDataConfig = useMemo(() => {
        if (!show) return {};
        const checkedKeys = [];

        const loopData = (data, parentConfig) =>
            data.map(({ key, dataIndex, children, ...rest }) => {
                const columnKey = genColumnKey(key, rest.index);
                const config = columnsMap[columnKey || 'null'] || { show: true };
                if (config.show !== false && parentConfig?.show !== false && !children) {
                    checkedKeys.push(columnKey);
                }
                const item = {
                    key: columnKey,
                    ...omit(rest, ['className']),
                    selectable: false,
                    disabled: config.disable === true,
                    disableCheckbox:
                        typeof config.disable === 'boolean' ? config.disable : config.disable?.checkbox,
                    isLeaf: parentConfig ? true : undefined,
                };
                if (children) {
                    item.children = loopData(children, config);
                }
                return item;
            });
        return { list: loopData(list), keys: checkedKeys };
    }, [columnsMap, list, show]);

    const move = useRefFunction((id, targetId, dropPosition) => {
        const newMap = { ...columnsMap };
        const newColumns = [...sortKeyColumns];
        const findIndex = newColumns.findIndex((columnKey) => columnKey === id);
        const targetIndex = newColumns.findIndex((columnKey) => columnKey === targetId);
        const isDownWord = dropPosition > targetIndex;
        if (findIndex < 0) return;
        const targetItem = newColumns[findIndex];
        newColumns.splice(findIndex, 1);
        
        if (dropPosition === 0) {
            newColumns.unshift(targetItem);
        } else {
            newColumns.splice(isDownWord ? targetIndex : targetIndex + 1, 0, targetItem);
        }
        newColumns.forEach((key, order) => {
            newMap[key] = { ...(newMap[key] || {}), order };
        });
        setColumnsMap(newMap);
        setSortKeyColumns(newColumns);
        console.log("entreiiiiiii-move",newColumns,newMap)
    });

    const onCheckTree = useRefFunction((e) => {
        const columnKey = e.node.key;
        const newSetting = { ...columnsMap[columnKey] };

        newSetting.show = e.checked;

        setColumnsMap({
            ...columnsMap,
            [columnKey]: newSetting,
        });
    });

    if (!show) {
        return null;
    }

    const listDom = (
        <Tree
            itemHeight={24}
            draggable={draggable && !!treeDataConfig.list?.length && treeDataConfig.list?.length > 1}
            checkable={checkable}
            onDrop={(info) => {
                const dropKey = info.node.key;
                const dragKey = info.dragNode.key;
                const { dropPosition, dropToGap } = info;
                const position = dropPosition === -1 || !dropToGap ? dropPosition + 1 : dropPosition;
                move(dragKey, dropKey, position);
            }}
            blockNode
            onCheck={(_, e) => onCheckTree(e)}
            checkedKeys={treeDataConfig.keys}
            showLine={false}
            titleRender={(_node) => {
                const node = { ..._node, children: undefined };
                return (
                    <CheckboxListItem
                        className={className}
                        {...node}
                        title={runFunction(node.title, node)}
                        columnKey={node.key}
                    />
                );
            }}
            height={listHeight}
            treeData={treeDataConfig.list}
        />
    );
    return (
        <>
            {showTitle && <span className={`${className}-list-title`}>{listTitle}</span>}
            {listDom}
        </>
    );
};

const GroupCheckboxList = ({ localColumns, className, draggable, checkable, listsHeight }) => {
    const rightList = [];
    const leftList = [];
    const list = [];
    localColumns.forEach((item) => {
        if (item.hideInSetting) {
            return;
        }
        const { fixed } = item;
        if (fixed === 'left') {
            leftList.push(item);
            return;
        }
        if (fixed === 'right') {
            rightList.push(item);
            return;
        }
        list.push(item);
    });

    const showRight = rightList && rightList.length > 0;
    const showLeft = leftList && leftList.length > 0;
    return (
        <div
        /*  className={classNames(`${className}-list`, {
             [`${className}-list-group`]: showRight || showLeft,
         })} */
        >
            <CheckboxList
                //title={intl.getMessage('tableToolBar.leftFixedTitle', '固定在左侧')}
                list={leftList}
                draggable={draggable}
                checkable={checkable}
                className={className}
                listHeight={listsHeight}
            />
            {/* 如果没有任何固定，不需要显示title */}
            <CheckboxList
                list={list}
                draggable={draggable}
                checkable={checkable}
                //title={intl.getMessage('tableToolBar.noFixedTitle', '不固定')}
                showTitle={showLeft || showRight}
                className={className}
                listHeight={listsHeight}
            />
            <CheckboxList
                //title={intl.getMessage('tableToolBar.rightFixedTitle', '固定在右侧')}
                list={rightList}
                draggable={draggable}
                checkable={checkable}
                className={className}
                listHeight={listsHeight}
            />
        </div>
    );
};

export default (props) => {
    const columnRef = useRef({});
    const counter = Container.useContainer();
    const localColumns = props.columns;
    const { checkedReset = true } = props;
    const { columnsMap, setColumnsMap, clearPersistenceStorage } = counter;

    useEffect(() => {
        
        if (counter.propsRef.current?.columnsState?.value) {
            columnRef.current = JSON.parse(JSON.stringify(counter.propsRef.current?.columnsState?.value || {}));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Set Selecionar tudo e deselecionar tudo
     *
     * @param show
     */
    const setAllSelectAction = useRefFunction((show = true) => {
        const columnKeyMap = {};
        const loopColumns = (columns) => {
            columns.forEach(({ key, fixed, index, children }) => {
                const columnKey = genColumnKey(key, index);
                if (columnKey) {
                    columnKeyMap[columnKey] = { show, fixed };
                }
                if (children) {
                    loopColumns(children);
                }
            });
        };
        loopColumns(localColumns);
        setColumnsMap(columnKeyMap);
    });

    /** Selecionar tudo e Deselecionar */
    const checkedAll = useRefFunction((e) => {
        if (e.target.checked) {
            setAllSelectAction();
        } else {
            setAllSelectAction(false);
        }
    });

    /** Reset Item */
    const clearClick = useRefFunction(() => {
        clearPersistenceStorage?.();
        setColumnsMap(columnRef.current);
    });

    // Chaves não Selecionadas
    const unCheckedKeys = Object.values(columnsMap).filter((value) => !value || value.show === false);

    // Chaves indeterminadas
    const indeterminate = unCheckedKeys.length > 0 && unCheckedKeys.length !== localColumns.length;

    return (
        <Popover
            arrowPointAtCenter
            title={
                <div>
                    <Checkbox
                        indeterminate={indeterminate}
                        checked={unCheckedKeys.length === 0 && unCheckedKeys.length !== localColumns.length}
                        onChange={(e) => checkedAll(e)}
                    >
                        Exibir a coluna
                    </Checkbox>
                    {checkedReset ? (
                        <a onClick={clearClick}>
                            Reset
                        </a>
                    ) : null}
                    {props?.extra ? (
                        <Space size={12} align="center">
                            {props.extra}
                        </Space>
                    ) : null}
                </div>
            }
            trigger="click"
            placement="bottomRight"
            content={
                <GroupCheckboxList
                    checkable={props.checkable ?? true}
                    draggable={props.draggable ?? true}
                    //className={className}
                    localColumns={localColumns}
                    listsHeight={props.listsHeight}
                />
            }
        >
            {props.children || (
                <Tooltip title="Definições das Colunas">
                    <SettingOutlined />
                </Tooltip>
            )}
        </Popover>
    );
}

