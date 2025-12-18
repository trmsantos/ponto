import React, { useEffect, useState, useRef } from 'react';
import * as R from 'ramda';
import { SizeMe } from 'react-sizeme';
import { render } from 'less';

// export const useSizeMe = (render, options) => {
//     const [currentSize, setSize] = useState({ width: null, height: null });
//     return [
//       <SizeMe {...options}>
//         {({ size }) => {
//           if (
//             size.width !== currentSize.width ||
//             size.height !== currentSize.height
//           ) {
//             setSize(size);
//           }
//           return render({ ...size });
//         }}
//       </SizeMe>,
//       currentSize.width,
//       currentSize.height,
//     ];
//   }

const Body = (options) => {
    console.log("optionssss",options);
    return render({ ...size });
}

export function useSizeMe(render, options) {
    const [currentSize, setSize] = useState({ width: null, height: null });
    return [
      <SizeMe {...options}>
        <Body/>
      </SizeMe>,
      currentSize.width,
      currentSize.height,
    ];
  }

export const useSubmitting = (val = false) => {
    const [state, setState] = useState(val);
    const currentState = useRef(val);

    const trigger = () => {
        setState(true);
    }

    const init = () => {
        let ret = false;
        if (!currentState.current) {
            ret = true;
            currentState.current = true;
        }
        return ret;
    }

    const end = () => {
        currentState.current = false;
        setState(false);
    }

    const initiated = () => {
        return currentState.current
    }

    return { trigger, init, end, initiated, state };

}

export const getFilterRangeValues = (data) => {
    var ret = [];
    if (!data?.startValue && !data?.endValue) {
        return undefined;
    }
    if (data?.startValue) {
        ret.push(`>=${data.startValue}`);
    } else {
        ret.push(null);
    }
    if (data?.endValue) {
        ret.push(`<=${data.endValue}`);
    } else {
        ret.push(null);
    }
    return ret;
}

export const getFilterForceRangeValues = (data) => {
    var ret = [];
    if (!data?.startValue && !data?.endValue) {
        return undefined;
    }
    if (data?.startValue) {
        ret.push(`>=${data.startValue}`);
    } else {
        ret.push(`>=${data.endValue}`);
    }
    if (data?.endValue) {
        ret.push(`<=${data.endValue}`);
    } else {
        ret.push(`<=${data.startValue}`);
    }
    return ret;
}

//type = any | start | end | exact
export const getFilterValue = (v, type = 'exact',caseLetter=false) => {
    let val = (v === undefined) ? v : (v?.value === undefined) ? v : v.value;
    val = (val===undefined || val===null) ? val : `${val}`;
    if (val !== '' && val !== undefined) {
        const re = new RegExp('(^==|^=|^!==|^!=|^>=|^<=|^>|^<|^between:|^in:|^!between:|^!in:|isnull|!isnull)(.*)', 'i');
        const matches = val.toString().match(re);
        if (matches !== null && matches.length > 0) {
            return `${val}`;
        } else {
            switch (type) {
                case 'any': return `%${val.replaceAll('%%', ' ').replaceAll('%', '').replaceAll(' ', '%%')}%`;
                case 'start': return `${val.replaceAll('%%', ' ').replaceAll(' ', '%%')}%`;
                case 'end': return `%${val.replaceAll('%%', ' ').replaceAll(' ', '%%')}`;
                case '==': return `==${val.replaceAll('==', '')}`;
                case '<': return `<${val.replaceAll('==', '')}`;
                case '>': return `>${val.replaceAll('==', '')}`;
                case '<=': return `<=${val.replaceAll('==', '')}`;
                case '>=': return `>=${val.replaceAll('==', '')}`;
                case 'exact': return `${val}`;
                default: return `==${val.replaceAll('==', '').replaceAll('%%', ' ').replaceAll('%', '').replaceAll(' ', '%%')}%`;
            }
        }
    }
    return undefined;
}

export const isValue = (value, compare, ret = '') => {
    if (value === compare) {
        return ret;
    }
    return value;
}

export const hasValue = (value, compare, ret = '') => {
    if (value === compare) {
        return ret;
    }
    return value;
}

export const noValue = (value, ret = '') => {
    if (!value) {
        return ret;
    }
    return value;
}

export const deepMerge = (a, b) => {
    return (R.is(Object, a) && R.is(Object, b)) ? R.mergeWith(deepMerge, a, b) : b;
}

export const debounce = (fn, time) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(() => {
            timeoutId = null
            fn(...args)
        }, time)
    }
}

export const gtinCheckdigit = (input) => {
    let array = input.split('').reverse();
    let total = 0;
    let i = 1;
    array.forEach(number => {
        number = parseInt(number);
        if (i % 2 === 0) {
            total = total + number;
        }
        else {
            total = total + (number * 3);
        }
        i++;
    });

    return (Math.ceil(total / 10) * 10) - total;
}

export const groupBy = (xs, key) => {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};



export const pickAll = (names, obj) => {
    var result = {};
    var idx = 0;
    var len = names.length;
    while (idx < len) {
        var name = names[idx];
        result[name] = obj[name];
        idx += 1;
    }
    return result;
};

export const deepEqual = (object1, object2) => {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (const key of keys1) {
        const val1 = object1[key];
        const val2 = object2[key];
        const areObjects = isObject(val1) && isObject(val2);
        if (areObjects && !deepEqual(val1, val2) || !areObjects && val1 !== val2) {
            return false;
        }
    }
    return true;
}

export const isObject = (object) => {
    return object != null && typeof object === 'object';
}

export const secondstoDay = (n) => {
    let day = parseInt(n / (24 * 3600));
    n = n % (24 * 3600);
    let hour = parseInt(n / 3600);
    n %= 3600;
    let minutes = n / 60;
    n %= 60;
    let seconds = n;
    return ((day > 0) ? day + "d " : '') + ((hour > 0) ? hour + "h " : '') + ((minutes.toFixed() > 0) ? minutes.toFixed() + "m" : '');
}