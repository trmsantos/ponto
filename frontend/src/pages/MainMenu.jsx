import React, { useEffect, useState, useCallback, useRef, Suspense, useContext, useLayoutEffect } from 'react';
import { createUseStyles } from 'react-jss';
import styled from 'styled-components';
import { useNavigate, useLocation } from "react-router-dom";
import dayjs from 'dayjs';
import { json } from "utils/object";
import Joi from 'joi';
import { fetch, fetchPost, cancelToken } from "utils/fetch";
import { API_URL, ROOT_URL } from "config";
// import { useModal } from "react-modal-hook";
import YScroll from "components/YScroll";
import { Button, Select, Typography, Card, Collapse, Space, Modal } from "antd";
const { Panel } = Collapse;
import { LogoutOutlined } from '@ant-design/icons';
import { isRH, isPrivate, isAdmin } from "./commons";
// import ResponsiveModal from 'components/Modal';
// import { usePermission, Permissions } from "utils/usePermission";

const StyledCollapse = styled(Collapse)`
    height:100%;
    display:flex;
    flex-direction:column;
    .ant-collapse-content-box{
        padding:0px 0px !important;
        display:flex;
        flex-direction:column;
        align-items:start;
    }
    .ant-collapse-header-text{
        color:#fff;
        font-size:14px;
    }
    .ant-collapse-expand-icon{
        color:#fff;
    }
    .ant-btn-link{
        color:#d9d9d9;
        &:hover{
            background:#91d5ff;
            color:#000;
        }
    }
    .ant-collapse-header{
        padding:0px 0px !important;
    }
`

const getLocalStorage = (id) => {
    if (id) {
        const selItems = json(localStorage.getItem(id));
        return (selItems) ? selItems : ['1', '2', '3'];
    }
    return ['1', '2', '3'];
}
const idMenu = "rponto-menu-01";
const selectedItems = getLocalStorage(idMenu);

export default ({ dark = false, onToggleDrawer, handleLogout, auth }) => {
    const navigate = useNavigate();

    // const permission = usePermission({ name: "mainmenu" });
    // const [modalParameters, setModalParameters] = useState({});
    // const [showModal, hideModal] = useModal(({ in: open, onExited }) => (
    //     <ResponsiveModal footer="ref" onCancel={hideModal} width={800} height={400}>
    //         <div></div>
    //     </ResponsiveModal>
    // ), [modalParameters]);
    // const onEdit = () => {
    //     setModalParameters({ ...record });
    //     showModal();
    // }
    // const [showFrameModal, hideFrameModal] = useModal(({ in: open, onExited }) => (
    //     <ResponsiveModal title={modalParameters.title} lazy={true} footer="ref" onCancel={hideFrameModal} width={5000} height={5000}><IFrame src={modalParameters.src} /></ResponsiveModal>
    // ), [modalParameters]);

    const onMenuChange = (v) => {
        localStorage.setItem(idMenu, JSON.stringify(v));

    }

    // const onClickItemFrame = (src, title) => {
    //     setModalParameters({ src, title });
    //     showFrameModal();
    // }

    const logout = () => {
        Modal.confirm({
            icon: false, onOk: handleLogout, okText: "Sim", cancelText: "Não", okButtonProps: { size: "large" }, cancelButtonProps: { size: "large" }, centered: false,
            content: <div style={{ display: "flex", justifyItems: "center", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: "16px", textAlign: "center", marginBottom: "10px" }}>Logout?</div>
                <div style={{ fontSize: "14px" }}>{auth?.first_name} {auth?.last_name}</div>
                {/* <Space><Button type="primary" size='large' style={{ width: "150px" }} onClick={handleLogout}>Sim</Button><Button style={{ width: "150px" }} size='large'>Não</Button></Space> */}
            </div>
        });
    }

    return (
        <YScroll>
            <StyledCollapse size="large" defaultActiveKey={selectedItems} ghost={true} expandIconPosition="end" onChange={onMenuChange}>
                <Panel header={<b>Área Pessoal</b>} key="1" style={{ marginBottom: "5px" }}>
                    <Button block style={{ textAlign: "left" }} size='large' type="link" onClick={() => { navigate('/app/rh/registospessoal', { state: { num: auth.num, tstamp: Date.now() }, replace: true }); onToggleDrawer(); }}>Registo de Picagens</Button>
                    <Button block style={{ textAlign: "left" }} size='large' type="link" onClick={() => { navigate('/app/rh/planpessoal', { state: { num: auth.num, tstamp: Date.now() }, replace: true }); onToggleDrawer(); }}>Plano de Horários</Button>
                    <Button block style={{ textAlign: "left" }} size='large' type="link" onClick={() => { navigate('/app/rh/depart', { state: { num: auth.num, tstamp: Date.now() }, replace: true }); onToggleDrawer(); }}>Gestão de Departamento</Button>
                </Panel>
                {isRH(auth) && <Panel header={<b>Recursos Humanos</b>} key="2" style={{ marginBottom: "5px" }}>
                    <Button block style={{ textAlign: "left" }} size='large' type="link" onClick={() => { window.location.assign(ROOT_URL); }}>Aplicação de Registo de Ponto</Button>
                    <Button block style={{ textAlign: "left" }} size='large' type="link" onClick={() => { navigate('/app/rh/registos', { replace: true, state: { num: null, tstamp: Date.now() } }); onToggleDrawer(); }}>Registo de Picagens</Button>
                    {isRH(auth) && <Button block style={{ textAlign: "left" }} size='large' type="link" onClick={() => { navigate('/app/rh/registosv3', { replace: true, state: { num: null, tstamp: Date.now() } }); onToggleDrawer(); }}>Registo de Picagens V3</Button>}
                    <Button block style={{ textAlign: "left" }} size='large' type="link" onClick={() => { navigate('/app/rh/plan', { replace: true, state: { num: null, tstamp: Date.now() } }); onToggleDrawer(); }}>Plano de Horários</Button>
                </Panel>
                }
                <Panel collapsible='disabled' key="3" showArrow={false} style={{ marginTop: "auto" }}>
                    <Button block style={{ textAlign: "left" }} size='large' type="link" onClick={logout} icon={<LogoutOutlined style={{ marginRight: "10px" }} />}>Terminar Sessão</Button>
                </Panel>
            </StyledCollapse>
        </YScroll>
    );

}