import axios from "axios";
import { API_URL, ROOT_URL } from "config";
import { json } from "utils/object";



let refresh = false;
axios.interceptors.response.use(resp => resp, async error => {
  const _auth = json(localStorage.getItem('auth'));
  const originalConfig = error.config;
  if (error.response) {
    // Access Token was expired
    if (error.response.status === 401 && !originalConfig._retry) {
      localStorage.removeItem('auth');
      if (originalConfig.url === "/api/token/") {
        return Promise.reject(error);
      } else {
        window.location.href = '/app/login';
      }
      // originalConfig._retry = true;

      // try {
      //   const response = await axios.post(`${API_URL}/token/refresh/`, { refresh: _auth.refresh_token }/* , { withCredentials: true } */);
      //   if (response.status === 200) {
      //     axios.defaults.headers.common['Authorization'] = `Bearer 
      //     ${response.data['access']}`;
      //     _auth.access_token = response.data.access;
      //     _auth.access_token = response.data.refresh;
      //     localStorage.setItem('auth', JSON.stringify(_auth));
      //     console.log("-----refreshh-------", originalConfig);
      //     let xx = axios.create({
      //       baseURL: "http://localhost:8000",
      //       headers: {
      //         "Content-Type": "application/json",
      //       },
      //     });
      //     return xx(originalConfig);
      //   }




      //   // const rs = await refreshToken();
      //   // const { accessToken } = rs.data;
      //   // window.localStorage.setItem("accessToken", accessToken);
      //   // instance.defaults.headers.common["x-access-token"] = accessToken;

      //   // return instance(originalConfig);
      // } catch (_error) {
      //   if (_error.response && _error.response.data) {
      //     return Promise.reject(_error.response.data);
      //   }

      //   return Promise.reject(_error);
      // }

    }
    if (error.response.status === 403 && error.response.data) {
      return Promise.reject(error.response.data);
    }
  }
  return Promise.reject(error);


  //   if (error.response.status === 401 && !_auth?.refresh_token){
  //     window.location.href = '/app/login';
  //   }
  //   if (error.response.status === 401 && !refresh && _auth?.refresh_token) {
  //      refresh = true;
  //      const response = await axios.post(`${API_URL}/token/refresh/`, {refresh:_auth.refresh_token}, {withCredentials: true});
  //     if (response.status === 200) {
  //        axios.defaults.headers.common['Authorization'] = `Bearer 
  //        ${response.data['access']}`;
  //        _auth.access_token=response.data.access;
  //        _auth.access_token=response.data.refresh;
  //        localStorage.setItem('auth',JSON.stringify(_auth));
  //        return axios(error.config);
  //     }
  //   }
  // refresh = false;
  // return error;
});