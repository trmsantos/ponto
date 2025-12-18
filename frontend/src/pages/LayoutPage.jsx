import React, { useEffect, useState, useCallback, useRef, Suspense, memo } from 'react';
import { createUseStyles } from 'react-jss';
import styled from 'styled-components';
import { PAGE_TOOLBAR_HEIGHT, ROOT_URL } from "config"
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button, Spin, Tag, List, Typography, Form, InputNumber, Input, Card, Collapse, DatePicker, Space, Alert, Modal } from "antd";
import YScroll from "components/YScroll";
import ResponsiveModal from "components/ResponsiveModal";
import Modalv4 from "components/Modalv4";
import { Layout, Menu, Breadcrumb, Popover } from 'antd';
const { Header, Content, Footer } = Layout;
import Icon, { HomeOutlined, MenuOutlined } from "@ant-design/icons";


const FormLotes = React.lazy(() => import('./currentline/FormLotes'));
const OFabricoShortList = React.lazy(() => import('./OFabricoShortList'));
const FormMenuActions = React.lazy(() => import('./currentline/FormMenuActions'));

const TitleWnd = ({ title }) => {
    return (
        <div style={{ display: "flex", flexDirection: "row", gap: "10px", alignItems: "center" }}>
            <div style={{ fontSize: "14px", display: "flex", flexDirection: "row", alignItems: "center" }}>
                <Space>
                    <div><b style={{ textTransform: "capitalize" }}></b>{title}</div>
                </Space>
            </div>
        </div>
    );
}


const Wnd = ({ parameters, setVisible }) => {
    return (
        <ResponsiveModal
            title={<TitleWnd title={parameters.title} />}
            visible={parameters.visible}
            centered
            responsive
            onCancel={setVisible}
            maskClosable={true}
            destroyOnClose={true}
            fullWidthDevice={parameters.fullWidthDevice}
            width={parameters?.width}
            height={parameters?.height}
            bodyStyle={{ /* backgroundColor: "#f0f0f0" */ }}
        >
            <YScroll>
                {parameters.type === "lotesmp" && <Suspense fallback={<></>}><FormLotes /></Suspense>}
                {parameters.type === "ofabricoshortlist" && <Suspense fallback={<></>}><OFabricoShortList feature={parameters.data.feature} /></Suspense>}
            </YScroll>
        </ResponsiveModal>
    );

}

const useStyles = createUseStyles({
    popover: {
        '& .ant-popover-arrow-content:before': {
            background: '#001529 !important',
            display: "none"
        },
        '& .ant-popover-arrow-content:before': {
            background: '#001529 !important',
            display: "none"
        },
        '& .ant-popover-inner': {
            background: '#001529 !important'
        }
    }
});

const MenuColumn = styled.div`
    padding:5px 5px 5px 15px;
    flex:1;
    border-right:solid 1px rgba(255, 255, 255, 0.30);
`;

const TitleMenu = styled.h4`
        margin-bottom: 0.5em;
        color: rgba(255, 255, 255, 0.65);
        font-weight: 600;
        font-size: 18px;
        line-height: 1.4;
`;

const ItemMenu = styled.div`
    padding: .15rem .15rem .15rem .45rem;
    display: block;
    color:rgba(255, 255, 255, 1);
    font-weight:300;
    font-size: 14px;
    cursor:pointer;
    &:hover{
        background-color:#40a9ff;
        color:#fff;
    }
`;






export default () => {
    const [modalParameters, setModalParameters] = useState({ visible: false });
    const navigate = useNavigate();
    const location = useLocation();
    const classes = useStyles();

    useEffect(() => {
        console.log("....", location);
    }, [location]);

    const content = (
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: "space-evenly" }}>
            <MenuColumn>
                <ul style={{ listStyle: "none" }}>
                    <TitleMenu level={4}>Planeamento</TitleMenu>
                    <li><ItemMenu onClick={() => onClick({ key: 'i-ofs' })}>Ordens de Fabrico</ItemMenu></li>
                </ul>
            </MenuColumn>
            <MenuColumn>
                <ul style={{ listStyle: "none" }}>
                    <TitleMenu level={4}>Produção</TitleMenu>
                    <li><ItemMenu onClick={() => onClick({ key: 'i-validate-reelings' })}>Validar Bobinagens</ItemMenu></li>
                    <li><ItemMenu onClick={() => onClick({ key: 'i-change-doseadores' })}>Alterar Doseadores</ItemMenu></li>
                    <li><ItemMenu onClick={() => onClick({ key: 'i-change-formulacao' })}>Alterar Formulação</ItemMenu></li>
                </ul>
            </MenuColumn>
            <MenuColumn>
                <ul style={{ listStyle: "none" }}>
                    <TitleMenu level={4}>Matérias Primas</TitleMenu>
                    <li><ItemMenu onClick={() => onClick({ key: 'i-picar-granulado' })}>Picagem de Granulado</ItemMenu></li>
                </ul>
            </MenuColumn>
            <MenuColumn>
                <ul style={{ listStyle: "none" }}>
                    <TitleMenu level={4}>Stock Matérias Primas</TitleMenu>
                    <li><ItemMenu onClick={() => onClick({ key: 'i-realtime-form' })}>Formulação Ativa</ItemMenu></li>
                    <li><ItemMenu onClick={() => onClick({ key: 'i-stk-of' })}>Por Ordem de Fabrico</ItemMenu></li>
                </ul>
            </MenuColumn>
            <MenuColumn>
                <ul style={{ listStyle: "none" }}>
                    <TitleMenu level={4}>Listas/Relatórios</TitleMenu>
                    <li><ItemMenu onClick={() => onClick({ key: 'i-lineloglist' })}>Eventos da Linha</ItemMenu></li>
                    <li><ItemMenu onClick={() => onClick({ key: 'i-stockloglist' })}>Movimento de Lotes</ItemMenu></li>
                    <li><ItemMenu onClick={() => onClick({ key: 'i-bobinesoriginaislist' })}>Bobines Originais</ItemMenu></li>
                    <li><ItemMenu onClick={() => onClick({ key: 'i-fixlotes' })}>Erros de Consumos (Bobinagens)</ItemMenu></li>
                    <li onClick={() => Modalv4.show({
                        onOk: () => { }, onCancel: () => { }, title: "teste", width: "500px", height: "400px", fullWidthDevice: 2,
                        content:<div><Modalv4/><Button onClick={() => Modalv4.show({ onOk: () => { }, onCancel:()=>{},content:<div>ddddd</div> })}>teste</Button></div>
                    })}>
                        aaaa
                    </li>
                </ul>
            </MenuColumn>
        </div>
    );

    const items = [
        { key: 'i-home', icon: <Popover /* trigger="click" */ overlayClassName={classes.popover} content={content} overlayStyle={{ width: '100%' }} placement="bottomLeft" arrowPointAtCenter><MenuOutlined style={{ fontSize: '20px' }} /></Popover> },
        { key: 'i-app', label: "App" },
        { key: 'i-plan', label: "Planeamento", children: [{ key: 'i-ofs', label: 'Ordens de Fabrico' }] },
        {
            key: 'i-prod', label: "Produção", children: [
                { key: 'i-validate-reelings', label: 'Validar Bobinagens' },
                { key: 'i-change-doseadores', label: 'Alterar Doseadores' },
                { key: 'i-change-formulacao', label: 'Alterar Formulação' }
            ]
        }, {
            key: 'i-mp', label: "Matérias Primas", children: [
                { key: 'i-picar-granulado', label: 'Granulado' },
            ]
        },
        , {
            key: 'i-stk_mp', label: "Stock Matérias Primas", children: [
                { key: 'i-realtime-form', label: 'Formulação Ativa' },
                { key: 'i-stk-of', label: 'Por Ordem de Fabrico' },
            ]
        }, {
            key: 'i-reports', label: "Listas", children: [
                { key: 'i-lineloglist', label: 'Eventos da Linha' },
                { key: 'i-stockloglist', label: 'Movimento de Lotes' },
                { key: 'i-bobinesoriginaislist', label: 'Bobines Originais' },
                { key: 'i-fixlotes', label: 'Erros de Consumos (Bobinagens)' },
                {key: 'i-expedicoes-time', label: 'Relatório de Expedições Mensal' },
            ]
        }
    ];

    const onModalVisible = (e, type, feature) => {
        if (!type) {
            setModalParameters(prev => ({ visible: false }));
        } else {
            switch (type) {
                case "lotesmp": setModalParameters(prev => ({ visible: !prev.visible, type, fullWidthDevice: 100, title: "Lotes em Linha de Produção", data: {} })); break;
                case "ofabricoshortlist":
                    let title = (feature === "dosers_change") ? "Alteração de Doseadores" : "Alteração de Formulação";
                    setModalParameters(prev => ({ visible: !prev.visible, type, width: "500px", height: "400px", fullWidthDevice: 2, data: { feature }, title })); break;
            }
        }
    }

    const onClick = (v) => {
        switch (v.key) {
            //case 'i-home': window.location.href = ROOT_URL; break;
            case 'i-app': navigate('/app'); break;
            case 'i-ofs': navigate('/app/ofabricolist'); break;
            case 'i-validate-reelings': navigate('/app/validatereellings'); break;
            case 'i-change-doseadores': onModalVisible(null, 'ofabricoshortlist', "dosers_change"); break;
            case 'i-change-formulacao': onModalVisible(null, 'ofabricoshortlist', "formulation_change"); break;
            case 'i-picar-granulado': navigate('/app/pick');/* onModalVisible(null, 'lotesmp'); */ break;
            case 'i-realtime-form': navigate('/app/stocklist'); break;
            case 'i-stk-of': onModalVisible(null, 'ofabricoshortlist', "lotes_stock"); break;

            case 'i-lineloglist': navigate('/app/logslist/lineloglist'); break;
            case 'i-stockloglist': navigate('/app/logslist/stockloglist'); break;
            case 'i-bobinesoriginaislist': navigate('/app/bobines/bobinesoriginaislist'); break;
            case 'i-fixlotes': navigate('/app/bobinagens/fixlotes'); break;
            case 'i-expedicoes-time': navigate('/app/expedicoes/timearmazem'); break;

            

        }

    }

    return (

        <>
            <Wnd parameters={modalParameters} setVisible={onModalVisible} />
            <Modalv4 />

            <Layout className="layout">
                <Header style={{ height: "32px", lineHeight: "32px" }}>
                    <div className="logo" />
                    <Menu
                        onClick={onClick}
                        theme="dark"
                        mode="horizontal"
                        defaultSelectedKeys={['2']}
                        items={items}
                    />
                </Header>
                <Content style={{ padding: '0 5px' }}>
                    {/* <Breadcrumb style={{ margin: '16px 0' }}>
                    <Breadcrumb.Item>Home</Breadcrumb.Item>
                    <Breadcrumb.Item>List</Breadcrumb.Item>
                    <Breadcrumb.Item>App</Breadcrumb.Item>
                </Breadcrumb> */}
                    <div className="site-layout-content">{(location.pathname === "/app" || location.pathname === "/app/") && <FormMenuActions />}<Outlet /></div>
                </Content>
                {/*  <Footer style={{ textAlign: 'center' }}>Ant Design ©2018 Created by Ant UED</Footer> */}
            </Layout>


        </>






    );

}