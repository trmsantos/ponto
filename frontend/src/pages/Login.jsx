// Login.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button, Alert, Modal, Input, Space, Checkbox, Form } from "antd";
import { Container, Row, Col } from 'react-grid-system';
import { getSchema, pick, getStatus, validateMessages } from "utils/schemaValidator";
import styled from 'styled-components';
import YScroll from "components/YScroll";
import { useSubmitting } from "utils";
import { API_URL } from "config";
import { fetchPost } from "utils/fetch";
import Logo from 'assets/logo.svg';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { AppContext } from './App';
import { Field, Container as FormContainer, AlertsContainer } from 'components/FormFields';
import jwt_decode from 'jwt-decode';



const schema = (options = {}) => {
    return getSchema({}, options).unknown(true);
}



export default () => {
    const navigate = useNavigate();
    const submitting = useSubmitting(true);
    const [form] = Form.useForm();
    const { auth, setAuth, handleLogout } = useContext(AppContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [fieldStatus, setFieldStatus] = useState({});
    const [formStatus, setFormStatus] = useState({ error: [], warning: [], info: [], success: [] });

    useEffect(() => {
        const controller = new AbortController();
        loadData({ signal: controller.signal });
        return (() => { controller.abort(); });
    }, []);

    const loadData = async ({ signal }) => {
        submitting.end();
    }

    const handleSubmit = async (e) => {
        if (e) { e.preventDefault();e.stopPropagation(); }
        try {
            localStorage.removeItem('auth');
            const response = await axios.post('/api/token/', { username, password, remember }, { /* headers: { 'Content-Type': 'application/json' }, */ withCredentials: true });
            const decodedToken = jwt_decode(response.data.access);
            const _auth = {
                access_token: response.data.access,
                refresh_token: response.data.refresh,
                username: username,
                first_name: decodedToken.first_name,
                last_name: decodedToken.last_name,
                num: decodedToken.num,
                email: decodedToken.email,
                groups:decodedToken.groups,
                isAdmin:decodedToken.isAdmin,
                isRH:decodedToken.isRH,
                items:decodedToken.items
            };
            localStorage.setItem('auth', JSON.stringify(_auth));
            setAuth({ isAuthenticated: true, ..._auth });
            window.location.href = '/app';
        } catch (e) {
            let { errors, warnings, value, ...status } = getStatus({});
            status.formStatus.error.push({ message: <div>Ocorreu um erro ao efetuar o login!<br />Por favor, verifique se o <b>utilizador e/ou password</b> estão corretos.</div> })
            setFormStatus({ ...status.formStatus });
        }


    };

    const clear = () => {
        setUsername('');
        setPassword('');
        setRemember(false);
    }

    const onValuesChange = (v, all) => {

    }

    return (
        <Modal open width={400} height={280} closable={false} footer={null} >


            {/*             {auth.isAuthenticated && <div style={{ display: "flex", justifyItems: "center", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontWeight: 800, fontSize: "24px", textAlign: "center", marginBottom: "10px" }}>Logout</div>
                <div style={{ fontSize: "18px", marginBottom: "20px" }}>{auth?.first_name} {auth?.last_name}</div>
                <Space><Button type="primary" size='large' style={{ width: "150px" }} onClick={handleLogout}>Sim</Button><Button style={{ width: "150px" }} size='large'>Não</Button></Space>
            </div>} */}
            <AlertsContainer mask formStatus={formStatus} portal={false} style={{ marginBottom: "10px" }} />
            <FormContainer tabIndex={0} onKeyUp={(e) => (e.key === "Enter") && handleSubmit(e)} id="LOGIN" fluid style={{ padding: "0px", outline: "0px" }} loading={submitting.state} wrapForm={true} form={form} onValuesChange={onValuesChange} schema={schema} wrapFormItem={true} forInput={true} alert={{ tooltip: true, pos: "none" }}>
                <Row style={{}} gutterWidth={10}>

                    <Col style={{}}>

                        <Row style={{}} gutterWidth={10}><Col>
                            <div style={{ fontWeight: 600 }}>Login</div>
                        </Col></Row>
                        <Row style={{}} gutterWidth={10}><Col>
                            <Input autoFocus placeholder="Login" value={username} onChange={(e) => setUsername(e.target.value)} />
                        </Col></Row>
                        <Row style={{}} gutterWidth={10}><Col>
                            <div style={{ fontWeight: 600 }}>Password</div>
                        </Col></Row>
                        <Row style={{}} gutterWidth={10}><Col>
                            <Input.Password
                                value={password}
                                placeholder="Password"
                                onChange={(e) => setPassword(e.target.value)}
                                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            />
                        </Col></Row>

                    </Col>




                    <Col style={{ alignSelf: "center", display: "flex", justifyContent: "center" }}><Logo style={{ fontSize: "140px", height: "50px" }} /></Col>

                </Row>
                <Row style={{ marginTop: "15px" }} gutterWidth={10}><Col>
                    <Checkbox checked={remember} onChange={(v) => setRemember(!remember)}>Lembrar-me neste dispositivo</Checkbox>
                </Col></Row>


                <Row gutterWidth={10} style={{ display: "flex", marginTop: "20px" }}>
                    <Col>
                        <Button block onClick={handleSubmit} size='large' type="primary">Entrar</Button>
                    </Col></Row>
            </FormContainer>
        </Modal>



    );
};