// Login.js
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Button, Alert, Input, Checkbox, Form, Typography, Divider, Space } from "antd";
import { UserOutlined, LockOutlined, ClockCircleOutlined, TeamOutlined, BarChartOutlined } from '@ant-design/icons';
import { AppContext } from './App';
import Logo from 'assets/logo.svg';
import jwt_decode from 'jwt-decode';

const { Title, Text } = Typography;

export default () => {
    const [form] = Form.useForm();
    const { setAuth } = useContext(AppContext);
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState(false);

    const handleSubmit = async (values) => {
        setLoading(true);
        setLoginError(false);
        try {
            localStorage.removeItem('auth');
            const response = await axios.post('/api/token/', { username: values.username, password: values.password, remember }, { withCredentials: true });
            const decodedToken = jwt_decode(response.data.access);
            const _auth = {
                access_token: response.data.access,
                refresh_token: response.data.refresh,
                username: values.username,
                first_name: decodedToken.first_name,
                last_name: decodedToken.last_name,
                num: decodedToken.num,
                email: decodedToken.email,
                groups: decodedToken.groups,
                isAdmin: decodedToken.isAdmin,
                isRH: decodedToken.isRH,
                items: decodedToken.items
            };
            localStorage.setItem('auth', JSON.stringify(_auth));
            setAuth({ isAuthenticated: true, ..._auth });
            window.location.href = '/app';
        } catch (e) {
            setLoginError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2027 50%, #203a43 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                display: 'flex',
                width: '100%',
                maxWidth: '900px',
                minHeight: '500px',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}>
                {/* Left branding panel - hidden on small screens */}
                <div className="login-branding-panel" style={{
                    flex: 1,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    padding: '48px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#fff'
                }}>
                    <Logo style={{ height: '80px', marginBottom: '32px', filter: 'brightness(0) invert(1)' }} />
                    <Title level={2} style={{ color: '#fff', textAlign: 'center', marginBottom: '8px' }}>
                        Sistema de Gestão de RH
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: '14px', marginBottom: '40px' }}>
                        Registo e gestão de ponto simplificados
                    </Text>
                    <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '0 0 32px 0' }} />
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.85)' }}>
                            <ClockCircleOutlined style={{ fontSize: '20px', color: '#4fc3f7' }} />
                            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Registo de ponto em tempo real</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.85)' }}>
                            <TeamOutlined style={{ fontSize: '20px', color: '#4fc3f7' }} />
                            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Gestão de equipas e turnos</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.85)' }}>
                            <BarChartOutlined style={{ fontSize: '20px', color: '#4fc3f7' }} />
                            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Relatórios e análises detalhadas</Text>
                        </div>
                    </Space>
                </div>

                {/* Right form panel */}
                <div style={{
                    flex: 1,
                    background: '#fff',
                    padding: '48px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <Logo style={{ height: '48px', marginBottom: '16px' }} />
                        <Title level={3} style={{ margin: 0, color: '#1e3a5f' }}>Bem-vindo</Title>
                        <Text type="secondary">Introduza as suas credenciais para aceder</Text>
                    </div>

                    {loginError && (
                        <Alert
                            message={<span>Ocorreu um erro ao efetuar o login!<br />Por favor, verifique se o <b>utilizador e/ou password</b> estão corretos.</span>}
                            type="error"
                            showIcon
                            closable
                            onClose={() => setLoginError(false)}
                            style={{ marginBottom: '20px', borderRadius: '8px' }}
                        />
                    )}

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        size="large"
                        requiredMark={false}
                    >
                        <Form.Item
                            name="username"
                            label="Utilizador"
                            rules={[{ required: true, message: 'Por favor introduza o utilizador.' }]}
                        >
                            <Input
                                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                                placeholder="Utilizador"
                                autoFocus
                                autoComplete="username"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true, message: 'Por favor introduza a password.' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                                placeholder="Password"
                                autoComplete="current-password"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: '20px' }}>
                            <Checkbox checked={remember} onChange={() => setRemember(!remember)}>
                                Lembrar-me neste dispositivo
                            </Checkbox>
                        </Form.Item>

                        <Form.Item style={{ marginBottom: '8px' }}>
                            <Button
                                block
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                style={{
                                    height: '48px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #1e3a5f, #2d6a9f)',
                                    border: 'none',
                                    fontSize: '16px',
                                    fontWeight: 600
                                }}
                            >
                                Entrar
                            </Button>
                        </Form.Item>
                    </Form>

                    <Divider style={{ margin: '24px 0 16px' }} />
                    <Text type="secondary" style={{ textAlign: 'center', display: 'block', fontSize: '12px' }}>
                        Sistema de Registo de Ponto © {new Date().getFullYear()}
                    </Text>
                </div>
            </div>
        </div>
    );
};