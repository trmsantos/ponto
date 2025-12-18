import Joi from 'joi';
import dayjs from 'dayjs';

export const validateMessages = {
    'any.required': 'Campo {{#label}} é obrigatório.',
    'number.base': 'Campo {{#label}} tem de ser um valor numérico.',
    'number.greater':'Campo {{#label}} tem de ser maior ou igual que {{:#limit}}.',
    'string.base': 'Campo {{#label}} tem de ser um valor de texto.',
    'string.empty': 'Campo {{#label}} tem de indicar o motivo.',
};


/* DEPRECATED?? */
export const validate = (schema, onlyExistingValues = [], mapper = {}, parameters = {}) => {
    return async (req, res, next) => {
        const itemKey = (req.method == "POST") ? "body" : "query";
        let ret = {};
        let err = [];
        for (const key in schema) {
            try {
                let value;
                const datakey = (key in mapper) ? mapper[key] : key;
                const data = (datakey in req[itemKey]) ? req[itemKey][datakey] : {};
                if (typeof schema[key] === "function") {
                    if (onlyExistingValues.includes(key)) {
                        value = await schema[key](Object.keys(data), parameters).validateAsync(data);
                    } else {
                        value = await schema[key](undefined, parameters).validateAsync(data);
                    }
                } else {
                    value = await schema[key].validateAsync(data);
                }
                ret = { ...ret, ...{ [datakey]: value } };
            } catch (error) {
                err = [...err, ...error.details.map(x => x.message)];
            }
        }
        if (err.length == 0) {
            req.body = { ...req.body, ...ret };
            next();
        } else {
            next(`Validation error: ${err.join(', ')}`);
        }
    }
}

export const pick = (keys, obj, exclude = []) => {
    var result = {};
    var idx = 0;
    let ks = (!keys || keys.length === 0) ? Object.keys(obj) : keys;
    while (idx < ks.length) {
        if (ks[idx] in obj) {
            if (!exclude.includes(ks[idx])) {
                result[ks[idx]] = obj[ks[idx]];
            }
        }
        idx += 1;
    }
    return result;
};

export const getSchema = (rules, keys = [], excludeKeys = [], wrapArray = false,forceversion1=false) => {
    if (keys !== null && !Array.isArray(keys) && !forceversion1) {
        return getSchemav2(rules, keys);
    }
    if (keys.length == 0 && excludeKeys.length == 0) {
        return (wrapArray) ? Joi.array().items(Joi.object(rules)) : Joi.object(rules);
    } else {
        return (wrapArray) ? Joi.array().items(Joi.object(pick(keys, rules, excludeKeys))) : Joi.object(pick(keys, rules, excludeKeys));
    }
}

export const getSchemav2 = (rules, { keys = [], excludeKeys = [], wrapArray = false, unknown = false, wrapObject = true } = {}) => {
    if (!wrapObject) {
        return (wrapArray) ? Joi.array().items(rules) : rules;
    } else {
        if (keys.length == 0 && excludeKeys.length == 0) {
            const obj = (unknown) ? Joi.object(rules).unknown(true) : Joi.object(rules);
            return (wrapArray) ? Joi.array().items(obj) : obj;
        } else {
            const obj = (unknown) ? Joi.object(pick(keys, rules, excludeKeys)).unknown(true) : Joi.object(pick(keys, rules, excludeKeys));
            return (wrapArray) ? Joi.array().items(obj) : obj;
        }
    }
}

export const getStatus = (vObject, { formStatus = { error: [], warning: [], info: [], success: [] }, fieldStatus = {} } = {}) => {
    const ret = { errors: 0, warnings: 0, formStatus: { ...formStatus }, fieldStatus: { ...fieldStatus } };
    ret.value = vObject?.value;
    if (vObject?.error) {
        for (const itm of vObject.error?.details) {
            ret.errors++;
            if (itm.path.length > 0) {
                ret.fieldStatus[[...itm.path]] = { status: "error", messages: [{ message: itm.message }] }
            } else {
                ret.formStatus.error.push({ message: itm.message });
            }
        }
    }
    if (vObject?.warning) {
        for (const itm of vObject.warning?.details) {
            ret.warnings++;
            if (itm.path.length > 0) {
                ret.fieldStatus[[...itm.path]] = { status: "warning", messages: [{ message: itm.message }] }
            } else {
                ret.formStatus.warning.push({ message: itm.message });
            }
        }
    }
    return ret;
}

export const getRules = (rules, keys = null) => {
    if (!keys) {
        return rules;
    } else {
        return pick(keys, rules);
    }
}

/* export const dateTimeDiffValidator = (start_date, start_hour, end_date, end_hour) => {
    const start = dayjs(`${start_date?.format('YYYY-MM-DD')} ${start_hour?.format('HH:mm')}`);
    const end = dayjs(`${end_date?.format('YYYY-MM-DD')} ${end_hour?.format('HH:mm')}`);
    if (!start.isValid()) {
        let status = { status: "error", messages: [{ message: `` }] };
        return ({ errors: true, fields: { start_date: status } });
    } else if (!end.isValid()) {
        let status = { status: "error", messages: [{ message: `` }] };
        return ({ errors: true, fields: { end_date: status } });
    } else {
        const diff = end.diff(start);
        if (diff < 0) {
            let status = { status: "error", messages: [{ message: `` }] };
            return ({ errors: true, fields: { start_date: status, end_date: status } });
        } else {
            return ({ errors: false, fields: { start_date: {}, end_date: {} } });
        }
    }
}; */

export const dateTimeDiffValidator = (start_date, end_date) => {
    const start = dayjs(`${start_date?.format('YYYY-MM-DD HH:mm:ss')}`);
    const end = dayjs(`${end_date?.format('YYYY-MM-DD HH:mm:ss')}`);
    if (!start.isValid()) {
        let status = { status: "error", messages: [{ message: `` }] };
        return ({ errors: true, fields: { start_date: status } });
    } else if (!end.isValid()) {
        let status = { status: "error", messages: [{ message: `` }] };
        return ({ errors: true, fields: { end_date: status } });
    } else {
        const diff = end.diff(start);
        if (diff < 0) {
            let status = { status: "error", messages: [{ message: `` }] };
            return ({ errors: true, fields: { start_date: status, end_date: status } });
        } else {
            return ({ errors: false, fields: { start_date: {}, end_date: {} } });
        }
    }
};