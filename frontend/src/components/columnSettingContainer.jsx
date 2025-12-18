import useMergedState from 'rc-util/lib/hooks/useMergedState';
import React,{ useCallback, useEffect, useMemo, useRef, useState } from 'react';

/*CONATINER*/
const EMPTY = Symbol();
const createContainer = (useHook) => {
    let Context = React.createContext(EMPTY);

    function Provider(props) {
        let value = useHook(props.initialState);
        return <Context.Provider value={value}>{props.children}</Context.Provider>
    }

    function useContainer() {
        let value = React.useContext(Context)
        if (value === EMPTY) {
            throw new Error("Component must be wrapped with <Container.Provider>");
        }
        return value;
    }

    return { Provider, useContainer };
}

const genColumnKey = (key, index) => {
    if (key) {
        return Array.isArray(key) ? key.join('-') : key.toString();
    }
    return `${index}`;
};


const useContainer = (props) => {
    const actionRef = useRef();
    const rootDomRef = useRef(null);
    const prefixNameRef = useRef();

    const propsRef = useRef();
    const editableFormRef = useRef();
    const [keyWords, setKeyWords] = useState('');
    const sortKeyColumns = useRef([]);

    const [tableSize, setTableSize] = useMergedState(
        () => props.size || props.defaultSize || 'middle',
        {
            value: props.size,
            onChange: props.onSizeChange,
        },
    );

    const defaultColumnKeyMap = useMemo(() => {
        const columnKeyMap = {};
        props.columns?.forEach(({ key, dataIndex, fixed, disable }, index) => {
            const columnKey = genColumnKey(key ?? (dataIndex), index);
            if (columnKey) {
                columnKeyMap[columnKey] = {
                    show: true,
                    fixed,
                    disable,
                };
            }
        });
        return columnKeyMap;
    }, [props.columns]);

    const [columnsMap, setColumnsMap] = useMergedState(
        () => {
            const { persistenceType, persistenceKey } = props.columnsState || {};

            if (persistenceKey && persistenceType && typeof window !== 'undefined') {
                const storage = window[persistenceType];
                try {
                    const storageValue = storage?.getItem(persistenceKey);
                    if (storageValue) {
                        return JSON.parse(storageValue);
                    }
                } catch (error) {
                    console.warn(error);
                }
            }

            return (
                props.columnsStateMap ||
                props.columnsState?.value ||
                props.columnsState?.defaultValue ||
                defaultColumnKeyMap
            );
        },
        {
            value: props.columnsState?.value || props.columnsStateMap,
            onChange: props.columnsState?.onChange || props.onColumnsStateChange,
        },
    );

    const clearPersistenceStorage = useCallback(() => {
        const { persistenceType, persistenceKey } = props.columnsState || {};
        if (!persistenceKey || !persistenceType || typeof window === 'undefined') return;
        const storage = window[persistenceType];
        try {
            storage?.removeItem(persistenceKey);
        } catch (error) {
            console.error(error);
        }
    }, [props.columnsState]);

    useEffect(() => {
        if (!props.columnsState?.persistenceKey || !props.columnsState?.persistenceType) {
            return;
        }
        if (typeof window === 'undefined') return;
        const { persistenceType, persistenceKey } = props.columnsState;
        const storage = window[persistenceType];
        try {
            storage?.setItem(persistenceKey, JSON.stringify(columnsMap));
        } catch (error) {
            console.error(error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.columnsState?.persistenceKey, columnsMap, props.columnsState?.persistenceType]);

    
    const renderValue = {
        action: actionRef.current,
        setAction: (newAction) => {
            actionRef.current = newAction;
        },
        sortKeyColumns: sortKeyColumns.current,
        setSortKeyColumns: (keys) => {
            sortKeyColumns.current = keys;
        },
        propsRef,
        columnsMap,
        keyWords,
        setKeyWords: (k) => setKeyWords(k),
        setTableSize,
        tableSize,
        prefixName: prefixNameRef.current,
        setPrefixName: (name) => {
            prefixNameRef.current = name;
        },
        setEditorTableForm: (form) => {
            editableFormRef.current = form;
        },
        editableForm: editableFormRef.current,
        setColumnsMap,
        columns: props.columns,
        rootDomRef,
        clearPersistenceStorage,
    };

    Object.defineProperty(renderValue, 'prefixName', {
        get: () => prefixNameRef.current,
    });

    Object.defineProperty(renderValue, 'sortKeyColumns', {
        get: () => sortKeyColumns.current,
    });

    Object.defineProperty(renderValue, 'action', {
        get: () => actionRef.current,
    });

    Object.defineProperty(renderValue, 'editableForm', {
        get: () => editableFormRef.current,
    });

    return renderValue;
}

const Container = createContainer(useContainer);

export { useContainer };

export default Container;