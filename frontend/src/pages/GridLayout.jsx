import React, { useEffect, useState, useContext } from 'react';
import { Route, Routes, useRoutes, BrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Breadcrumb, Layout, Menu, theme, Drawer, notification, Typography } from 'antd';
import Logo from 'assets/logowhite.svg';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import MainMenu from './MainMenu';
import { AppContext } from './App';
import { Type } from 'lucide-react';
const { Header, Content, Footer } = Layout;

export const LayoutContext = React.createContext({});

const { Text } = Typography;


const StyledDrawer = styled(Drawer)`
    .ant-drawer-wrapper-body{
        background:#2a3142 !important;
    }
    .ant-drawer-header{
        border-bottom:none;
    }

`;


export default () => {
	const [api, contextHolder] = notification.useNotification();
	const { auth, setAuth, handleLogout } = useContext(AppContext);
	const colorBgContainer = "#fff";
	const [isDrawerVisible, setIsDrawerVisible] = useState(false);
	const navigate = useNavigate();


	const onToggleDrawer = () => {
		setIsDrawerVisible(!isDrawerVisible);
	}

	const openNotification = (status, placement, message, description) => {
		if (status === "error") {
			api.error({
				message: message ? message : `Notificação`,
				description: description,
				placement
			});
		} else if (status === "success") {
			api.success({
				message: message ? message : `Notificação`,
				description: description,
				placement
			});
		} else {
			api.info({
				message: message ? message : `Notificação`,
				description: description,
				placement
			});
		}
	};

	return (
		<LayoutContext.Provider value={{ openNotification }}>
			<Layout className="layout">
				{contextHolder}
				<StyledDrawer
					title={
						<div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
							<Logo style={{ width: "100px", height: "24px" }} />
						</div>
					}
					placement="left"
					closable={false}
					onClose={onToggleDrawer}
					open={isDrawerVisible}
				>
					<MainMenu dark onToggleDrawer={onToggleDrawer} auth={auth} handleLogout={handleLogout} />
				</StyledDrawer>
				<Header style={{ lineHeight: "32px", height: "32px", display: "flex", alignItems: "center", padding: "0px 10px" }}>
					<Logo style={{ width: "100px", height: "24px", cursor: "pointer" }} onClick={onToggleDrawer} />
					<Menu
						theme="dark"
						mode="horizontal"
						defaultSelectedKeys={['2']}
						items={[]}
					/>
				</Header>
				<Content style={{ padding: '0 5px', height: "calc(100vh - 32px)" }}>
					<Outlet />

				</Content>
			</Layout>
		</LayoutContext.Provider>
	);
};
