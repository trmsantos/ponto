import React, { useEffect, useState, Suspense, lazy, useContext } from 'react';
//import ReactDOM from "react-dom";
import * as ReactDOM from 'react-dom/client';
import 'react-data-grid/lib/styles.css';
import { Route, Routes, useRoutes, BrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spin, Input, Modal } from 'antd';
import { useMediaQuery } from 'react-responsive';
import './app.css';
import { json } from "utils/object";
//import 'antd/dist/antd.compact.less';
import { SOCKET } from 'config';
import useWebSocket from 'react-use-websocket';
import { useImmer } from "use-immer";
import useMedia from 'utils/useMedia';
import { ModalProvider } from "react-modal-hook";
import { useSubmitting } from "utils";
import YScroll from "components/YScroll";
import { fetch, fetchPost } from "utils/fetch";
import { API_URL, ROOT_URL } from "config";
import GridLayout from './GridLayout';
import axios from 'axios';

const NotFound = lazy(() => import('./404'));
const Main = lazy(() => import('./Main'));
const Login = lazy(() => import('./Login'));
const RegistosRH = lazy(() => import('./RegistosRH'));
const RegistosRHv3 = lazy(() => import('./RegistosRHv3'));
const PlanRH = lazy(() => import('./PlanRH'));
const Teste = lazy(() => import('./Teste'));
const Turnos = lazy (() => import('./TesteTurnos'));


export const MediaContext = React.createContext({});
export const SocketContext = React.createContext({});
export const AppContext = React.createContext({});


const MainLayout = () => {
    return (<>{(localStorage.getItem("auth")===null) ? <Suspense fallback={<Spin />}><Login /></Suspense> : <GridLayout />}</>);
}

const RenderRouter = () => {
    let element = useRoutes([
        {
            path: '/app',
            element: <MainLayout />,
            children: [
                { path: "login", element: <Suspense fallback={<Spin />}><Login /></Suspense> },
                /* { path: "layout", element: <Suspense fallback={<Spin />}><GridLayout /></Suspense> }, */
                { path: "rh/registos", element: <Suspense fallback={<Spin />}><RegistosRH key="lst-rp-rh" id="lst-rp-rh" /></Suspense> },
                { path: "rh/registosv3", element: <Suspense fallback={<Spin />}><RegistosRHv3 key="lst-rp-rh3" id="lst-rp-rh3" /></Suspense> },
                { path: "rh/plan", element: <Suspense fallback={<Spin />}><PlanRH key="lst-pl-rh" id="lst-pl-rh" /></Suspense> },
                { path: "rh/registospessoal", element: <Suspense fallback={<Spin />}><RegistosRH key="lst-rp-pri" id ="lst-rp-pri" /></Suspense> },
                { path: "rh/planpessoal", element: <Suspense fallback={<Spin />}><PlanRH  key="lst-pl-pri" id="lst-pl-pri" /></Suspense> },
                { path: "rh/teste", element: <Suspense fallback={<Spin />}><Teste /></Suspense> },
                { path: "rh/turnos", element: <Suspense fallback={<Spin />}><Turnos /></Suspense>},
            ]
        },
        {
            path: '/',
            element: <Main />,
            children: []
        },
        { path: "*", element: <Suspense fallback={<Spin />}><NotFound /></Suspense> }
    ]);
    return element;
};


const App = () => {
    const [width] = useMedia();
    const submitting = useSubmitting(true);
    const [auth, setAuth] = useState({ isAuthenticated: false, });

    useEffect(() => {
        const _auth = json(localStorage.getItem('auth'));
        if (_auth) {
            if (_auth.access_token) {
                axios.defaults.headers.common.Authorization = `Bearer ${_auth.access_token}`;
                setAuth({ isAuthenticated: true, ..._auth });
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('auth');
        axios.defaults.headers.common.Authorization = null;
        setAuth({ isAuthenticated: false });
        window.location.href = '/app/login';

    };

    useEffect(() => {
        const controller = new AbortController();
        loadData({ signal: controller.signal });
        return (() => controller.abort());
    }, []);

    const loadData = async ({ signal }) => {
        submitting.end();
    }

    return (
        <BrowserRouter>
            <MediaContext.Provider value={width}>
                <AppContext.Provider value={{ auth, setAuth, handleLogout }}>
                    <SocketContext.Provider value={{}}>
                        <ModalProvider>
                            <RenderRouter />
                        </ModalProvider>
                    </SocketContext.Provider>
                </AppContext.Provider>
            </MediaContext.Provider>
        </BrowserRouter>
    );
}



export default App;
const container = document.getElementById("app");
const root = ReactDOM.createRoot(container);
root.render(<App />);