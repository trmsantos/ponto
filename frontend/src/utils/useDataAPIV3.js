import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { fetchPost } from "./fetch";
import { Modal } from 'antd';
import { deepEqual, pickAll } from 'utils';
import { useImmer } from "use-immer";

export const getLocalStorage = (id, useStorage) => {
    if (useStorage && id) {
        return JSON.parse(localStorage.getItem(`dapi-${id}`));
    }
    return {};
}


export const useDataAPI = ({ payload, id, useStorage = true, fnPostProcess } = {}) => {
    const [isLoading, setIsLoading] = useState(false);
    const action = useRef([]);
    const [state, updateState] = useImmer({
        pagination: payload?.pagination || { enabled: false, pageSize: 10 },
        filter: payload?.filter || {},
        defaultSort: payload?.sort || [],
        sort: payload?.sort || [],
        parameters: payload?.parameters || {},
        data: (payload?.data) ? payload.data : {},
        withCredentials: payload?.withCredentials || null,
        url: payload?.url,
        ...getLocalStorage(id, useStorage)
    });
    const ref = useRef({
        pagination: payload?.pagination ? { ...payload.pagination } : { enabled: false, pageSize: 10 },
        filter: payload?.filter ? { ...payload.filter } : {},
        defaultSort: payload?.sort || [],
        sort: payload?.sort ? [...payload.sort] : [],
        parameters: payload?.parameters ? { ...payload.parameters } : {},
        withCredentials: payload?.withCredentials || null,
        url: payload?.url,
        ...getLocalStorage(id, useStorage)
    });

    const addAction = (type) => {
        if (!action.current.includes(type))
            action.current.push(type);
    }
    const isAction = (type) => {
        return action.current.includes(type);
    }


    const first = (updateStateData = false) => {
        addAction('nav');
        ref.current.pagination = { ...ref.current.pagination, page: 1 };
        if (updateStateData) {
            updateState(draft => {
                draft.pagination = ref.current.pagination;
            });
        }
    }
    const previous = (updateStateData = false) => {
        addAction('nav');
        ref.current.pagination = { ...ref.current.pagination, page: ((ref.current.pagination.page <= 1) ? 1 : (ref.current.pagination.page - 1)) };
        if (updateStateData) {
            updateState(draft => {
                draft.pagination = ref.current.pagination;
            });
        }
    }
    const next = (updateStateData = false) => {
        addAction('nav');
        ref.current.pagination = { ...ref.current.pagination, page: (ref.current.pagination.page + 1) };
        if (updateStateData) {
            updateState(draft => {
                draft.pagination = ref.current.pagination;
            });
        }
    }
    const last = (updateStateData = false) => {
        addAction('nav');
        ref.current.pagination = { ...ref.current.pagination, page: -1 };
        if (updateStateData) {
            updateState(draft => {
                draft.pagination = ref.current.pagination;
            });
        }
    }
    const currentPage = (page = 1, updateStateData = false) => {
        addAction('nav');
        ref.current.pagination = { ...ref.current.pagination, page: ((page <= 1) ? 1 : page) };
        if (updateStateData) {
            updateState(draft => {
                draft.pagination = ref.current.pagination;
            });
        }
    }
    const pageSize = (size = 10, updateStateData = false) => {
        addAction('pageSize');
        ref.current.pagination = { ...ref.current.pagination, pageSize: size }
        if (updateStateData) {
            updateState(draft => {
                draft.pagination = ref.current.pagination;
            });
        }
    }


    const setSort = (obj, defaultObj = [], updateStateData = false) => {
        addAction('sort');
        const _s = (obj && obj.length > 0) ? obj : defaultObj;
        ref.current.sort = _s.map(v => ({
            ...v,
            ...(v?.id) && {
                column: v.id,
                direction: (v.dir === 1) ? "ASC" : "DESC"
            },
            ...(v?.column) && {
                id: v.column,
                dir: (v.direction === "ASC") ? 1 : -1,
                name: v.column
            }
        }));
        if (updateStateData) {
            updateState(draft => {
                draft.sort = ref.current.sort;
            });
        }
    };
    const getSort = (fromState = false) => {
        if (fromState) {
            return [...state.sort];
        } else {
            return [...ref.current.sort];
        }
    }
    const sortOrder = (columnkey) => {
        if (ref.current.sort) {
            let item = ref.current.sort.find(v => (v.column === columnkey));
            return (item) ? item.order : false;
        }
        return false;
    };
    const clearSort = (updateStateData = false) => {
        addAction('sort');
        ref.current.sort = [];
        if (updateStateData) {
            updateState(draft => {
                draft.sort = ref.current.sort;
            });
        }
    }
    const resetSort = (updateStateData = false) => {
        addAction('sort');
        ref.current.sort = [...ref.current.defaultSort];
        if (updateStateData) {
            updateState(draft => {
                draft.sort = ref.current.defaultSort;
            });
        }
    }

    const _addSort = ({ columnKey, field, name, id, order, ...rest }) => {
        const column = (columnKey) ? columnKey : (name) ? name : (id) ? id : field;
        const direction = (order == "ascend" || order == "ASC" || order == 1) ? "ASC" : "DESC";
        let idx = ref.current.sort.findIndex(v => (v.column === column));
        if (idx >= 0) {
            const array = [...ref.current.sort];
            array[idx] = { column, name: column, id: column, dir: direction === "ASC" ? 1 : -1, direction, order, table: rest.column.table };
            ref.current.sort = array;
        } else {
            ref.current.sort = [...ref.current.sort, { column, name: column, id: column, dir: direction === "ASC" ? 1 : -1, direction, order, table: rest.column.table }];
        }
    }
    const addSort = (obj, updateStateData = false) => {
        addAction('sort');
        //_sort.current = [];
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
        if (updateStateData) {
            updateState(draft => {
                draft.sort = ref.current.sort;
            });
        }
    };

    const addFilters = (obj, assign = true, updateStateData = false) => {
        addAction('filter');
        if (assign) {
            ref.current.filter = obj;
        } else {
            ref.current.filter = { ...ref.current.filter, ...obj };
        }
        if (updateStateData) {
            updateState(draft => {
                draft.filter = ref.current.filter;
            });
        }
    }
    const setFilters = (obj, updateStateData = false) => {
        addAction('filter');
        ref.current.filter = obj;
        if (updateStateData) {
            updateState(draft => {
                draft.filter = ref.current.filter;
            });
        }
    }

    const addParameters = (obj, assign = true, updateStateData = false) => {
        addAction('parameters');
        if (assign) {
            ref.current.parameters = obj;
        } else {
            ref.current.parameters = { ...ref.current.parameters, ...obj };
        }
        if (updateStateData) {
            updateState(draft => {
                draft.parameters = ref.current.parameters;
            });
        }
    }

    const getPayload = (fromState = false) => {
        if (fromState) {
            const { data, ...rest } = state;
            return rest;
        } else {
            return ref.current;
        }
    }
    const getPagination = (fromState = false) => {
        if (fromState) {
            return { ...state.pagination };
        } else {
            return { ...ref.current.pagination };
        }
    };
    const getPageSize = (fromState = false) => {
        if (fromState) {
            return state.pagination.pageSize;
        } else {
            return ref.current.pagination.pageSize;
        }
    };

    const getFilter = (fromState = false) => {
        if (fromState) {
            return { ...state.filter };
        } else {
            return { ...ref.current.filter };
        }
    }
    const getAllFilter = () => {
        return { ...state.filter, ...ref.current.filter };
    }
    const getParameters = () => {
        return { ...state.parameters, ...ref.current.parameters };
    }

    const removeEmpty = (obj) => {
        return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== null && v !== '' && v !== undefined));
    }

    const update = (payload = {}) => {
        updateState(draft => {

            draft.pagination = ref.current.pagination;
            draft.filter = ref.current.filter;
            draft.sort = ref.current.sort;
            draft.parameters = ref.current.parameters;
            draft.tstamp = ref.current.tstamp;
            draft.withCredentials = ref.current.withCredentials;
            draft.url = ref.current.url;

            if (payload?.pagination) { draft.pagination = payload?.pagination; }
            if (payload?.filter) { draft.filter = payload?.filter; }
            if (payload?.sort) { draft.sort = payload?.sort; }
            if (payload?.parameters) { draft.parameters = payload?.parameters; }
            if (payload?.tstamp) { draft.tstamp = payload?.tstamp; }
            if (payload?.withCredentials) { draft.withCredentials = payload?.withCredentials; }
            if (payload?.url) { draft.url = payload?.url; }

        });
        action.current = [];
    }

    const setData = (data, payload) => {
        updateState(draft => {
            draft.data = { ...data };

            draft.pagination = ref.current.pagination;
            draft.filter = ref.current.filter;
            draft.sort = ref.current.sort;
            draft.parameters = ref.current.parameters;
            draft.tstamp = ref.current.tstamp;
            draft.withCredentials = ref.current.withCredentials;
            draft.url = ref.current.url;


            if (payload?.pagination) { draft.pagination = payload?.pagination; }
            if (payload?.filter) { draft.filter = payload?.filter; }
            if (payload?.sort) { draft.sort = payload?.sort; }
            if (payload?.parameters) { draft.parameters = payload?.parameters; }
            if (payload?.tstamp) { draft.tstamp = payload?.tstamp; }
            if (payload?.withCredentials) { draft.withCredentials = payload?.withCredentials; }
            if (payload?.url) { draft.url = payload?.url; }
        });
        action.current = [];
    }
    const addRow = (row, keys = null, at = null) => {
        const r = pickAll(keys, row);
        const _rows = state.data.rows;
        if (_rows && _rows.length > 0) {
            const exists = (keys === null) ? false : _rows.some(v => deepEqual(pickAll(keys, v), r));
            if (!exists) {
                if (at !== null) {
                    _rows.splice(at, 0, row);
                } else {
                    _rows.push(row);
                }
                updateState(draft => {
                    draft.tstamp = Date.now();
                    draft.data = { rows: [..._rows], total: state.data.total + 1 };
                });
            }
        } else {
            updateState(draft => {
                draft.tstamp = Date.now();
                draft.data = { rows: [{ ...row }], total: 1 };
            });
        }
    }
    const setRows = (rows, total = null) => {
        updateState(draft => {
            draft.tstamp = Date.now();
            draft.data = { rows: [...rows], total: (total === null) ? state?.data?.total : total };
        });
    }
    const deleteRow = (data, keys) => {
        const _rows = state.data.rows;
        if (_rows) {
            const idx = _rows.findIndex(v => deepEqual(pickAll(keys, v), data));
            if (idx >= 0) {
                _rows.splice(idx, 1);
                updateState(draft => {
                    draft.tstamp = Date.now();
                    draft.data = { rows: [..._rows], total: state.data.total - 1 }
                });
            }
        }
    }
    const clearData = () => {
        updateState(draft => {
            draft.tstamp = Date.now();
            draft.data = {};
        });
    }
    const getData = () => {
        return { ...state.data };
    }
    const _fetchPost = ({ url, withCredentials = null, token, signal, rowFn, fromSate = false } = {}) => {
        let _url = (url) ? url : ref.current.url;
        let _withCredentials = (withCredentials !== null) ? withCredentials : ref.current.withCredentials;
        const payload = getPayload(fromSate);
        payload.tstamp = Date.now();
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
    const getPostRequest = ({ url, fromState = false } = {}) => {
        return { url: (url) ? url : ref.current.url, ...getPayload(fromState) };
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
    const url = (fromState = false) => {
        if (fromState) {
            return state.url;
        }
        else {
            return ref.current.url;
        }
    }

    const printState = (print = false) => {
        const { data, ...rest } = state;
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
        return state.tstamp;
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
        hasData: () => (state.data.rows !== undefined),
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
        setIsLoading,
        update,
        removeEmpty,
        setFilters
    }
}