import React, { useEffect, useState, useContext } from 'react';
import { Route, Routes, useRoutes, BrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Breadcrumb, Layout, Menu, theme, Drawer, notification } from 'antd';
import Logo from 'assets/logowhite.svg';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import MainMenu from './MainMenu';
import { AppContext } from './App';
const { Header, Content, Footer } = Layout;

export const LayoutContext = React.createContext({});

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
	//   const {
	//     token: { colorBgContainer },
	//   } = theme.useToken();


// 	useEffect(() => {
// 		if (localStorage.getItem('access_token') === null) {
// 			navigate('/app/login');
// 			//window.location.href = '/app/login';
// 		}
// 		else {
// /* 			(async () => {
// 				try {
// 					const { data } = await axios.get(
// 						'http://localhost:8000/home/', {
// 						headers: {
// 							'Content-Type': 'application/json'
// 						}
// 					}
// 					);
// 					setMessage(data.message);
// 				} catch (e) {
// 					console.log('not auth')
// 				}
// 			})() */
// 		};
// 	}, []);

	/* useEffect(()=>{
		if (localStorage.getItem("auth") === null) {
			//window.location.href = '/app/login';
		}
	},[]); */


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
					{/* <Breadcrumb style={{ margin: '16px 0' }}>
					<Breadcrumb.Item>Home</Breadcrumb.Item>
					<Breadcrumb.Item>List</Breadcrumb.Item>
					<Breadcrumb.Item>App</Breadcrumb.Item>
				</Breadcrumb> */}
					{/* <div className="site-layout-content" style={{ background: colorBgContainer }}>
					Content
				</div> */}
				</Content>
				{/* <Footer style={{ textAlign: 'center' }}>Ant Design ©2023 Created by Ant UED</Footer> */}
			</Layout>
		</LayoutContext.Provider>
	);
};
