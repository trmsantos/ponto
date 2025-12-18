import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import styled from 'styled-components';
import { Button, Breadcrumb, Drawer } from "antd";
import { HomeOutlined, MenuOutlined } from '@ant-design/icons';
import { Row, Col } from 'react-grid-system';
import { Container as FormContainer } from 'components/FormFields';
import MainMenu from '../pages/currentline/dashboard/MainMenu';
import LogoWhite from 'assets/logowhite.svg';
import { getSchema } from "utils/schemaValidator";

const schema = (options = {}) => { return getSchema({}, options).unknown(true); };


const StyledDrawer = styled(Drawer)`
    .ant-drawer-content{
        background:#2a3142;
    }
    .ant-drawer-header{
        border-bottom:none;
    }

`;

export default ({ title, right, history = [], details }) => {
    const navigate = useNavigate();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const onShowDrawer = () => {
        setDrawerVisible(true);
    };

    const onCloseDrawer = () => {
        setDrawerVisible(false);
    };

    return (
        <>
            <StyledDrawer
                title={
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                        <LogoWhite style={{ width: "100px", height: "24px", paddingRight: "10px" }} />
                    </div>
                }
                placement="left"
                closable={false}
                onClose={onCloseDrawer}
                visible={drawerVisible}
            >
                <MainMenu dark />
            </StyledDrawer>
            <FormContainer id="frm-title" /* form={form} */ wrapForm={false} wrapFormItem={false} schema={schema} label={{ enabled: false }} fluid style={{ margin: "0px" }}>
                <Row style={{ marginBottom: "10px" }}>
                    <Col>
                        <Row align='center' nogutter>
                            <Col xs="content">
                                <Button type='link' icon={<MenuOutlined />} onClick={onShowDrawer} />
                            </Col>
                            <Col>
                                <Breadcrumb>
                                    {history.length === 0 ?
                                        <Breadcrumb.Item style={{ cursor: "pointer", display: "flex", alignItems: "center" }} onClick={() => navigate(-1)}>
                                            <HomeOutlined />
                                            <span>Dashboard</span>
                                        </Breadcrumb.Item>
                                        : ['Dashboard', ...history].map((v, i) => {
                                            return (<React.Fragment key={`hst-${i}`}>
                                                {i > 0 ? <Breadcrumb.Item style={{ cursor: "pointer" }} onClick={() => navigate(((history.length + 1) - i) * -1)}>
                                                    <span>{v}</span>
                                                </Breadcrumb.Item>
                                                    : <Breadcrumb.Item style={{ cursor: "pointer" }} onClick={() => navigate(((history.length + 1) - i) * -1)}>
                                                        <HomeOutlined />
                                                        <span>Dashboard</span>
                                                    </Breadcrumb.Item>}
                                            </React.Fragment>
                                            )
                                        })
                                    }
                                </Breadcrumb>
                            </Col>
                        </Row>
                        {title && <Row style={{ alignItems: "center" }} gutterWidth={5}>
                            {title}
                        </Row>}
                    </Col>
                    {right && <Col style={{ alignItems: "center" }}>
                        <Row gutterWidth={2} justify='end'>
                            {right}
                        </Row>
                    </Col>}
                </Row>
                {details && <Row>
                    <Col>
                        {details}
                    </Col>
                </Row>}
            </FormContainer>

        </>
    );
}