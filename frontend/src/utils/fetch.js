import axios, { CancelToken } from 'axios';
import { features } from './fetchModel';
import { mergeDeepRight } from "ramda";
import dayjs from 'dayjs';
import { DATETIME_FORMAT } from 'config';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
//axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

const paramType = (method) => (method == "get") ? "params" : "data";

export const cancelToken = () => CancelToken.source();

const dateTransformer = (data, dates, key) => {
  if (key && dates && dates.length > 0) {
    const f = dates.find(v => v.key === key);
    if (f) {
      return dayjs(data).format(f.format);
    }
  }
  if (Array.isArray(data)) {
    return data.map((v) => dateTransformer(v, dates));
  }
  if (typeof data === 'object' && data !== null) {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, dateTransformer(value, dates, key)]));
  }
  return data
}

const serverRequest = async (request, fetch = true) => {
  const { url = "", responseType = "json", method = "get", filter = {}, sort = [], pagination = {}, timeout = 20000, parameters = {}, cancelToken, signal, dates = [], withCredentials } = request;
  //let source = CancelToken.source();
  const params = (fetch) ? { method, responseType, [paramType(method)]: { sort, filter, pagination, parameters } } : { method, responseType, [paramType(method)]: { ...parameters } };
  if (cancelToken) {
    setTimeout(() => { cancelToken.cancel('Request Timeout.'); }, timeout);
  }

  return axios({
    url: url,
    ...(dates.length > 0 && { transformRequest: [(data) => dateTransformer(data, dates), ...(axios.defaults.transformRequest)] }),
    ...params,
    ...(cancelToken && { cancelToken: cancelToken.token }),
    ...(signal && { signal: signal }),
    ...(withCredentials && { withCredentials })
  });
};


const fetch = async ({ url = "", responseType = "json", method = "get", filter = {}, sort = [], pagination = {}, timeout = 10000, parameters = {}, cancelToken, signal, dates = [], withCredentials } = {}, f = true) => {
  return await serverRequest({ url, responseType, method, filter, sort, pagination, timeout, parameters, cancelToken, signal, dates, withCredentials }, f);

  /*     const req ={
          options:{},
          parameters:{},
          sort:ds.sort,
          filters:ds.filters,
          pagination:ds.pagination
      } */

}
export default fetch;

export const fetchReducers = (builder, thunk) => {
  builder.addCase(thunk.pending, (state, action) => {
    state.loading = true;
    state.status = 0;
  });
  builder.addCase(thunk.fulfilled, (state, action) => {
    state.data = action.payload.data;
    state.total = action.payload.total;
    state.pagination = action.payload.pagination;
    state.sort = action.payload.sort;
    state.filter = action.payload.filter;
    state.loading = false;
    state.status = 1;
    state.timestamp = Date.now();
    state.requests++;
  });
  builder.addCase(thunk.rejected, (state, action) => {
    state.data = [];
    state.total = 0;
    state.loading = false;
    state.status = -1;
    state.error = action.error;
    state.timestamp = Date.now();
    state.requests++;
  });
};

export const fetchPostTest = async ({ url = "", filter = {}, sort = [], pagination = {}, timeout = 10000, parameters = {}, withCredentials } = {}) => {
  return (async () => {
    return await fetch({ url, method: "post", filter, sort, pagination, timeout, parameters, withCredentials });
  })();
}


export const fetchPost = async ({ url = "", filter = {}, sort = [], pagination = {}, timeout = 10000, parameters = {}, cancelToken, signal, dates = [], withCredentials } = {}) => {
  return await fetch({ url, method: "post", filter, sort, pagination, timeout, parameters, cancelToken, signal, dates, withCredentials });
}

export const fetchPostBlob = async ({ url = "", filter = {}, sort = [], pagination = {}, timeout = 10000, parameters = {}, cancelToken, signal, dates = [], withCredentials } = {}, f = true) => {
  return await fetch({ url, responseType: "blob", method: "post", filter, sort, pagination, timeout, parameters, cancelToken, signal, dates, withCredentials }, f);
}

export const fetchPostStream = async ({ url = "", filter = {}, sort = [], pagination = {}, timeout = 10000, parameters = {}, cancelToken, dates = [], withCredentials } = {}) => {
  return await fetch({ url, responseType: "stream", method: "post", filter, sort, pagination, timeout, parameters, cancelToken, dates, withCredentials });
}

export const fetchPostBuffer = async ({ url = "", filter = {}, sort = [], pagination = {}, timeout = 10000, parameters = {}, cancelToken, dates, withCredentials } = {}) => {
  return await fetch({ url, responseType: "arraybuffer", method: "post", filter, sort, pagination, timeout, parameters, cancelToken, dates, withCredentials });
}

export const serverPost = async ({ url = "", responseType = "json", method = "post", timeout = 10000, parameters = {}, headers = {}, cancelToken, withCredentials } = {}) => {
  const params = { method, responseType, [paramType(method)]: parameters, headers };
  if (cancelToken) {
    setTimeout(() => { cancelToken.cancel('Request Timeout.'); }, timeout);
  }
  return axios({
    url: url,
    ...params,
    ...(cancelToken && { cancelToken: cancelToken.token }),
    ...(withCredentials && { withCredentials })
  });


  //return await serverRequest({ url, method: "post", timeout, parameters, cancelToken }, false);
};

export const loadFromFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => resolve(new Uint8Array(reader.result));
  reader.onerror = (event) => {
    switch (event.target.error.code) {
      case event.target.error.NOT_FOUND_ERR:
        return reject(new Error('Error while reading a file: File not found.'));
      case event.target.error.NOT_READABLE_ERR:
        return reject(new Error('Error while reading a file: File not readable.'));
      case event.target.error.SECURITY_ERR:
        return reject(new Error('Error while reading a file: Security error.'));
      case event.target.error.ABORT_ERR:
        return reject(new Error('Error while reading a file: Aborted.'));
      default:
        return reject(new Error('Error while reading a file.'));
    }
  };
  reader.readAsArrayBuffer(file);

  return null;
});

/* const readFileAsync = (file) => {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })
  } */

export const getBlobData = async (file) => {
  const response = await axios({
    method: "get",
    url: file,
    responseType: "blob"
  });
  const data = await loadFromFile(response.data);
  //const data = Buffer.from(response.data, 'binary').toString('base64');
  //const data = await readFileAsync(response.data);
  //console.log("################",data.substring(23));
  return data;
}



/* export const serverRequest = (url, options = { method: 'get' }, timeout = 10000) => {
    let source = CancelToken.source();
    setTimeout(() => { source.cancel('Request Timeout.'); }, timeout);
    return axios({
        url: url,
        ...options,
        cancelToken: source.token
    });
};

export const serverPost = (url, options = {}, timeout = 10000) => {
   return serverRequest(url, {...options,method:'post'}, timeout);
};

export const serverGet = (url, options = {}, timeout = 10000) => {
    return serverRequest(url, {...options,method:'get'}, timeout);
};

export const getTotalPages = (pageSize,totalRows)=>{
    return Math.ceil(totalRows / pageSize);
}; */