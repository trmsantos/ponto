import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { fetchPost } from "./fetch";
import { Modal } from 'antd';
import { deepEqual, pickAll } from 'utils';

export const getLocalStorage = (id, useStorage) => {
    if (useStorage && id) {
        return JSON.parse(localStorage.getItem(`dapi-${id}`));
    }
    return {};
}


export const useDataAPI = ({ payload, id, useStorage = true, fnPostProcess } = {}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [dataState, setDataState] = useState({
        pagination: payload?.pagination || { enabled: false, pageSize: 10 },
        filter: payload?.filter || {},
        sort: payload?.sort || [],
        parameters: payload?.parameters || {},
        data: (payload?.data) ? payload.data : {},
        withCredentials: payload?.withCredentials || null,
        url: payload?.url,
        ...getLocalStorage(id, useStorage)
    });


    const action = useRef([]);
    const _sort = useRef([]);
    const local_filter = useRef(payload?.filter);
    var _filter = payload?.filter;
    var _pagination = payload?.pagination;
    var _parameters = payload?.parameters;

    const addAction = (type) => {
        if (!action.current.includes(type))
            action.current.push(type);
    }

    const isAction = (type) => {
        return action.current.includes(type);
    }

    const first = (applyState = false) => {
        var _p = (isAction('nav') || isAction('pageSize')) ? _pagination : {};
        addAction('nav');
        _pagination = { ...dataState.pagination, ..._p, page: 1 };
        if (applyState) {
            setDataState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
        }
    }
    const previous = (applyState = false) => {
        addAction('nav');
        _pagination = { ...dataState.pagination, page: ((dataState.pagination.page <= 1) ? 1 : (dataState.pagination.page - 1)) }
        if (applyState) {
            setDataState(prev => ({ ...prev, pagination: { ...prev.pagination, page: ((prev.page <= 1) ? 1 : (prev.page - 1)) } }));
        }
    }
    const next = (applyState = false) => {
        addAction('nav');
        _pagination = { ...dataState.pagination, page: (dataState.pagination.page + 1) };
        if (applyState) {
            setDataState(prev => ({ ...prev, pagination: { ...prev.pagination, page: (prev.page + 1) } }));
        }
    }
    const last = (applyState = false) => {
        addAction('nav');
        _pagination = { ...dataState.pagination, page: -1 };
        if (applyState) {
            setDataState(prev => ({ ...prev, pagination: { ...prev.pagination, page: -1 } }));
        }
    }
    const currentPage = (page = 1, applyState = false) => {
        addAction('nav');
        _pagination = { ...dataState.pagination, page: ((page <= 1) ? 1 : page) };
        if (applyState) {
            setDataState(prev => ({ ...prev, pagination: { ...prev.pagination, page: ((page <= 1) ? 1 : page) } }));
        }
    }
    const pageSize = (size = 10, applyState = false) => {
        addAction('pageSize');
        _pagination = { ...dataState.pagination, pageSize: size };
        if (applyState) {
            setDataState(prev => ({ ...prev, pagination: { ...prev.pagination, pageSize: size } }));
        }
    }
    const _addSort = ({ columnKey, field, order, ...rest }) => {
        const column = (columnKey) ? columnKey : field;
        const direction = (order == "ascend") ? "ASC" : "DESC";
        let idx = _sort.current.findIndex(v => (v.column === column));
        if (idx >= 0) {
            const array = [..._sort.current];
            array[idx] = { column, direction, order, table: rest.column.table };
            _sort.current = array;
        } else {
            _sort.current = [..._sort.current, { column, direction, order, table: rest.column.table }];
        }
    }

    const addSort = (obj, applyState = false) => {
        addAction('sort');
        _sort.current = [];
        if (Array.isArray(obj)) {
            for (let s of obj) {
                if (!s.order) {
                    continue;
                }
                _addSort(s);
            }
        } else {
            if (obj.order) {
                _addSort(obj);
            }
        }
        if (applyState) {
            setDataState(prev => ({ ...prev, sort: _sort.current }));
        }
    };

    const setSort = (obj, applyState = false) => {
        addAction('sort');
        _sort.current = obj;
        if (applyState) {
            setDataState(prev => ({ ...prev, sort: _sort.current }));
        }
    };


    const resetSort = (applyState = false) => {
        addAction('sort');
        _sort.current = [...payload.sort];
        if (applyState) {
            setDataState(prev => ({ ...prev, sort: _sort.current }));
        }
    }

    const clearSort = (applyState = false) => {
        addAction('sort');
        _sort.current = [];
        if (applyState) {
            setDataState(prev => ({ ...prev, sort: _sort.current }));
        }
    }

    const addFilters = (obj, assign = true, applyState = false) => {
        addAction('filter');
        if (assign) {
            local_filter.current = obj;
            if (applyState) {
                setDataState(prev => ({ ...prev, filter: { ...obj } }));
            }
        } else {
            local_filter.current = { ...dataState.filter, ...local_filter.current, ...obj };
            if (applyState) {
                setDataState(prev => ({ ...prev, filter: { ...local_filter.current } }));
            }

        }
    }

    const addParameters = (obj, assign = true, applyState = false) => {
        addAction('parameters');
        if (assign) {
            _parameters = obj;
            if (applyState) {
                setDataState(prev => ({ ...prev, parameters: { ...obj } }));
            }
        } else {
            throw ("TODO----FILTER SPREAD...");
        }
    }

    const getPayload = (fromState = false) => {
        if (fromState) {
            return {
                pagination: { ...dataState.pagination },
                filter: { ...dataState.filter },
                sort: [...dataState.sort],
                parameters: { ...dataState.parameters }
            }
        } else {
            return {
                pagination: { ...((isAction('nav') || isAction('pageSize'))) ? _pagination : dataState.pagination },
                filter: { ...(isAction('filter')) ? local_filter.current : dataState.filter },
                sort: [...(isAction('sort')) ? _sort.current : dataState.sort],
                parameters: { ...(isAction('parameters')) ? _parameters : dataState.parameters }
            }
        }
    }

    const getPagination = (fromState = false) => {
        if (fromState) {
            return { ...dataState.pagination };
        } else {
            return { ..._pagination };
        }
    };

    const getPageSize = (fromState = false) => {
        if (fromState) {
            return (dataState.pagination.pageSize !== undefined) ? dataState.pagination.pageSize : 10;
        } else {
            return (_pagination.pageSize !== undefined) ? _pagination.pageSize : 10;
        }
    };

    const getFilter = (fromState = false) => {
        if (fromState) {
            return { ...dataState.filter };
        } else {
            return { ...local_filter.current };
        }
    }

    const getAllFilter = () => {
        return { ...dataState.filter, ...local_filter.current };
    }

    const getParameters = () => {
        return { ...dataState.parameters, ..._parameters };
    }

    const sortOrder = (columnkey) => {
        if (dataState.sort) {
            let item = dataState.sort.find(v => (v.column === columnkey));
            return (item) ? item.order : false;
        }
        return false;
    };

    const getSort = (fromState = false) => {
        if (fromState) {
            return [...dataState.sort];
        } else {
            return [..._sort.current];
        }
    }

    const setData = (data, payload) => {
        setDataState(prev => ({
            ...prev,
            ...((isAction('nav') || isAction('pageSize')) && { pagination: { ...prev.pagination, ...payload.pagination } }),
            ...(isAction('filter') && { filter: { ...prev.filter, ...payload.filter } }),
            ...(isAction('sort') && { sort: [...payload.sort] }),
            ...(isAction('parameters') && { parameters: { ...prev.parameters, ...payload.parameters } }),
            ...(payload?.tstamp && { tstamp: payload.tstamp }),
            data: { ...data }
        }));
        action.current = [];
    }

    const addRow = (row, keys = null, at = null) => {
        const r = pickAll(keys, row);
        const _rows = dataState.data.rows;
        if (_rows) {
            const exists = (keys === null) ? false : _rows.some(v => deepEqual(pickAll(keys, v), r));
            if (!exists) {
                if (at !== null) {
                    _rows.splice(at, 0, row);
                } else {
                    _rows.push(row);
                }
                setDataState(prev => ({
                    ...prev,
                    ...{ tstamp: Date.now() },
                    data: { rows: [..._rows], total: dataState.data.total + 1 }
                }));
            }
        } else {
            setDataState(prev => ({
                ...prev,
                ... { tstamp: Date.now() },
                data: { rows: [{ ...row }], total: 1 }
            }));
        }
    }

    const setRows = (rows, total = null) => {
        setDataState(prev => ({
            ...prev,
            ... { tstamp: Date.now() },
            data: { rows: [...rows], total: (total === null) ? prev?.data?.total : total }
        }));
    }

    const deleteRow = (data, keys) => {
        const _rows = dataState.data.rows;
        if (_rows) {
            const idx = _rows.findIndex(v => deepEqual(pickAll(keys, v), data));
            if (idx >= 0) {
                _rows.splice(idx, 1);
                setDataState(prev => ({
                    ...prev,
                    data: { rows: [..._rows], total: dataState.data.total - 1 }
                }));
            }
        }
    }

    const clearData = () => {
        setDataState(prev => ({ ...prev, data: {} }));
    }

    const getData = () => {
        return { ...dataState.data };
    }

    const _fetchPost = ({ url, withCredentials = null, token, signal, rowFn, fromSate = false } = {}) => {
        let _url = (url) ? url : dataState.url;
        let _withCredentials = (withCredentials !== null) ? withCredentials : dataState.withCredentials;
        const payload = { ...getPayload(fromSate), tstamp: Date.now() };
        setIsLoading(true);
        return (async () => {
            let ret = null;
            //let ok = true;
            if (id && useStorage) {
                localStorage.setItem(`dapi-${id}`, JSON.stringify(payload));
            }
            try {
                const dt = (await fetchPost({ url: _url, ...(_withCredentials !== null && { withCredentials: _withCredentials }), ...payload, ...((signal) ? { signal } : { cancelToken: token }) })).data;
                if (typeof rowFn === "function") {
                    ret = await rowFn(dt);
                    setData(ret, payload);
                } else if (typeof fnPostProcess === "function") {
                    ret = await fnPostProcess(dt);
                    setData(ret, payload);
                } else {
                    ret = dt;
                    setData(ret, payload);
                }
            } catch (e) {
                Modal.error({ content: e.message });
                //ok = false;
                ret = null;
            }
            setIsLoading(false);
            return ret;
            //return ok;
        })();
    }

    const getPostRequest = ({ url } = {}) => {
        return { url: (url) ? url : dataState.url, ...getPayload() };
    }

    const nav = ({ action = "", page = 1, onFetch } = {}) => {
        addAction('nav');
        switch (action) {
            case "first": first(); break;
            case "previous": previous(); break;
            case "next": next(); break;
            case "last": last(); break;
            default: currentPage(page, true);
        }

        if (onFetch) {
            onFetch();
        }
    }

    const url = () => {
        return dataState.url;
    }

    const printState = (print = false) => {
        const { data, ...rest } = dataState;
        if (print) {
            console.log("STATE -> ", JSON.stringify(rest));
        } else {
            return JSON.stringify(rest);
        }
    }

    const _isLoading = () => {
        return isLoading;
    }

    const getTimeStamp = () => {
        return dataState.tstamp;
    }

    return {
        first,
        previous,
        next,
        last,
        currentPage,
        pageSize,
        setRows,
        addRow,
        deleteRow,
        setData,
        hasData: () => (dataState.data.rows !== undefined),
        setSort,
        addSort,
        clearSort,
        resetSort,
        clearData,
        addFilters,
        addParameters,
        getPayload,
        getFilter,
        getAllFilter,
        getTimeStamp,
        getPagination,
        getPageSize,
        getPostRequest,
        getParameters,
        getSort,
        getData,
        sortOrder,
        nav,
        url,
        isActionPageSize: () => isAction('pageSize'),
        fetchPost: _fetchPost,
        isLoading: () => _isLoading(),
        setIsLoading
    }
}