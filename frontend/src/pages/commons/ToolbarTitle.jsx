import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import styled from 'styled-components';
import { Button, Breadcrumb, Drawer } from "antd";
import { HomeOutlined, MenuOutlined } from '@ant-design/icons';
import { Row, Col } from 'react-grid-system';
import { Container as FormContainer } from 'components/FormFields';

const StyledDrawer = styled(Drawer)`
    .ant-drawer-content{
        background:#2a3142;
    }
    .ant-drawer-header{
        border-bottom:none;
    }

`;

export default ({ title, right, details }) => {
    const navigate = useNavigate();
    return (
        <>
            <FormContainer id="frm-title" /* form={form} */ wrapForm={false} wrapFormItem={false} label={{ enabled: false }} fluid style={{ margin: "0px" }}>
                <Row style={{ marginBottom: "10px" }}>
                    <Col>
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