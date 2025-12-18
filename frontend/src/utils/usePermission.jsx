import React, { useEffect, useState, useCallback, useRef, useMemo, useContext } from 'react';
import { fetch, fetchPost } from "utils/fetch";
import { useLocation } from 'react-router-dom';
import { API_URL } from "config";
import { json } from "./object";
import { ConditionalWrapper } from "components/conditionalWrapper";
import { AppContext } from '../pages/App';

/**
 * Objecto React que em caso de ter ou não permissão faz o render
 * example.1  <Permissions permissions={permission} action="teste"><SampleObject/></Permissions>
 * O atributo permission é o objeto iniciado por -> const permission = usePermission({});
 */
export const Permissions = ({ permissions, action = null, item = null, forInput = null, onPlace = null, clone, children, ...props }) => {
    return (
        <ConditionalWrapper
            condition={!permissions.isOk({ action, item, forInput, onPlace })}
            wrapper={children => <></>}
        >

            {!clone && children}
            {clone && React.cloneElement(children,{...children.props,...props})}

        </ConditionalWrapper>
    );
}

const loadPermissions = async ({ name, module }) => {
    const { data: { rows } } = await fetchPost({ url: `${API_URL}/permissions/sql/`, pagination: { limit: 1 }, filter: { name, module }, parameters: { method: "PermissionsLookup" } });
    if (rows?.length > 0) {
        return rows[0];
    }
    return {};
}

export const usePermission = ({ allowed = {}, name, module = 'main' } = {}) => {
    const [permissions, setPermissions] = useState();
    const { auth } = useContext(AppContext);
    const userKeys = Object.keys(auth.permissions);
    const loc = useLocation();
    const allowedKeys = Object.keys(allowed); //deprecated
    const permissionKeys = Object.keys(auth.permissions); //deprecated

    useEffect(() => {
        const controller = new AbortController();
        loadData({ signal: controller.signal });
        return (() => controller.abort());
    }, []);

    const loadData = async ({ signal } = {}) => {
        console.log("isAdmin is commented, uncomment")
        console.log("Permissions Location/Name:",name ? name : loc.pathname, " module:", module)
        const _perm = await loadPermissions({ name: name ? name : loc.pathname, module });
        setPermissions(json(_perm?.permissions));
    }

    const isOk = ({ action = null, item = null, forInput = null, onPlace = null }) => {
        //onPlace - indica as permissões mínimas para ter acesso, sobrepõe-se às "permissions" definidas em app_permissions 
        //example.1 {createRecord: {rolename: 200}} | Gives permission to "rolename" to action ("createRecord") if level is at least 200
        //example.2 {formA: { createRecord: {rolename: 200}}} | Gives permission to "rolename" to action ("createRecord") if level is at least 200 on item ("formA")
        if (Array.isArray(forInput)) {
            if (forInput.includes(false)) {
                return false;
            }
        }
        if (forInput === false || !auth.isAuthenticated) {
            return false;
        }
        if (auth.isAdmin) {
            //return true;
        }
        if (!permissions) {
            return false;
        }
        let min = null;
        let value = -1;
        //console.log("isOKKKKKK")
        //console.log(action,item)
        //console.log(permissions)
        //console.log(json(permissions)[action])
        let p = (onPlace) ? json(onPlace) : (item) ? permissions[item][action] : permissions[action];
        if (!p){
            p = (item) ? ((permissions[item]["default"]) ? permissions[item]["default"] : permissions["default"]) : permissions["default"];
        }
        if (!p){
            return false;
        }
        const pKeys = Object.keys(p);
        for (const k of userKeys) {
            if (pKeys.includes(k)) {
                min = (min === null || min > p[k]) ? p[k] : min;
                value = (value < auth.permissions[k]) ? auth.permissions[k] : value;
            }
        }
        if (min <= value) {
            return true;
        }
        return false;
    }


    //deprecated
    const allow = (_allowed = null, forInput = null) => {
        if (Array.isArray(forInput)) {
            if (forInput.includes(false)) {
                return false;
            }
        }
        if (forInput === false || !auth.isAuthenticated) {
            return false;
        }
        if (auth.isAdmin) {
            return true;
        }
        let min = null;
        let value = -1;
        const aKeys = (_allowed) ? Object.keys(_allowed) : allowedKeys;
        const a = (_allowed) ? _allowed : allowed;
        for (const k of permissionKeys) {
            if (aKeys.includes(k)) {
                min = (min > a[k] || min === null) ? a[k] : min;
                value = (value < auth.permissions[k]) ? auth.permissions[k] : value;
            }
        }
        if (min <= value) {
            return true;
        }
        return false;
    }

    return { auth, allow, permissions, name: name ? name : loc.pathname, module, isOk };
}