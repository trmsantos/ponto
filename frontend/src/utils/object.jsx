export const json = (obj,ret) => {
    try {
        let json = JSON.parse(obj);
        if (!json && ret){
            return ret;
        }
        return json;
    } catch (e) {
        return (!obj && ret) ? ret : obj;
    }
}

export const excludeObjectKeys = (value = {}, exclude = []) => {
    const _exclude = v => exclude.some(x => {
        if (x.startsWith('%') && x.endsWith('%')) {
            return v.includes(x.replace(/^\%*|\%*$/g, ''));
        } else if (x.startsWith('%')) {
            return v.endsWith(x.replace(/^\%*/g, ''));
        } else if (x.endsWith('%')) {
            return v.startsWith(x.replace(/\%*$/g, ''));
        } else {
            return v === x;
        }
    });
    //let exclude = new Set(exclude);
    return Object.fromEntries(Object.entries(value).filter(e => !_exclude(e[0])));
}

export const includeObjectKeys = (value = {}, include = []) => {
    const _include = v => include.some(x => {
        if (x.startsWith('%') && x.endsWith('%')) {
            return v.includes(x.replace(/^\%*|\%*$/g, ''));
        } else if (x.startsWith('%')) {
            return v.endsWith(x.replace(/^\%*/g, ''));
        } else if (x.endsWith('%')) {
            return v.startsWith(x.replace(/\%*$/g, ''));
        } else {
            return v === x;
        }
    });
    return Object.fromEntries(Object.entries(value).filter(e => _include(e[0])));
}
export const filterObjectKeys = (value = {}, except = []) => {
    const _exclude = v => except.some(x => {
        if (x.startsWith('%') && x.endsWith('%')) {
            return v.includes(x.replace(/^\%*|\%*$/g, ''));
        } else if (x.startsWith('%')) {
            console.log(x.replace(/^\%*/g, ''))
            return v.endsWith(x.replace(/^\%*/g, ''));
        } else if (x.endsWith('%')) {
            return v.startsWith(x.replace(/\%*$/g, ''));
        } else {
            return v === x;
        }
    });
    //let exclude = new Set(except);
    return Object.fromEntries(Object.entries(value).filter(e => !_exclude(e[0])));
}


export const orderObjectKeys = o => Object.keys(json(o)).sort().reduce((r, k) => (r[k] = o[k], r), {});
