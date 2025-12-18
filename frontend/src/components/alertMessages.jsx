import React, { useState, useEffect } from 'react';
import { Alert, Button, Tag } from "antd";
import { CheckOutlined } from '@ant-design/icons';

export default ({ formStatus, tags = true }) => {
    const [errorVisible, setErrorVisible] = useState({ status: true, tag: false });
    const [warningVisible, setWarningVisible] = useState({ status: true, tag: false });
    const [infoVisible, setInfoVisible] = useState({ status: true, tag: false });
    const [successVisible, setSuccessVisible] = useState({ status: true, tag: false });

    useEffect(() => {
        setErrorVisible(prev => ({ ...prev, status: tags ? prev.status : true }));
        setSuccessVisible(prev => ({ ...prev, status: tags ? prev.status : true }));
        setWarningVisible(prev => ({ ...prev, status: tags ? prev.status : true }));
        setInfoVisible(prev => ({ ...prev, status: tags ? prev.status : true }));
    }, [formStatus]);

    const handleErrorVisible = () => {
        setErrorVisible(prev => ({ status: !prev.status, tag: prev.status }));
    };
    const handleSuccessVisible = () => {
        setSuccessVisible(prev => ({ status: !prev.status, tag: prev.status }));
    };
    const handleWarningVisible = () => {
        setWarningVisible(prev => ({ status: !prev.status, tag: prev.status }));
    };
    const handleInfoVisible = () => {
        setInfoVisible(prev => ({ status: !prev.status, tag: prev.status }));
    };
    /* 
        const warns = [...new Set(warning.map((v) => v.message))];
        const errors = [...new Set(error.map((v) => v.message))];
        const infos = [...new Set(info.map((v) => v.message))];
        const successes = [...new Set(success.map((v) => v.message))]; */

    return (<>

        {/*  <Space size={20}>
            {
                error.length > 0 && <Badge count={error.length}>
                    <Tag color="error">Erros</Tag>
                </Badge>
            }
            {
                warning.length > 0 && <Badge count={warning.length}>
                    <Tag color="warning">Avisos</Tag>
                </Badge>
            }
            {
                info.length > 0 && <Badge count={info.length}>
                    <Tag color="processing">Informações</Tag>
                </Badge>
            }
        </Space>
 */}
        {formStatus !== undefined &&
            <>
                {tags && <div style={{marginBottom:"5px"}}>
                    {!errorVisible.status && errorVisible.tag && formStatus.error?.length > 0 && <Tag style={{ cursor: "pointer" }} onClick={handleErrorVisible} color="error">{formStatus.error.length} Erro(s)</Tag>}
                    {!warningVisible.status && warningVisible.tag && formStatus.warning?.length > 0 && <Tag style={{ cursor: "pointer" }} onClick={handleWarningVisible} color="warning">{formStatus.warning.length} Aviso(s)</Tag>}
                    {!successVisible.status && successVisible.tag && formStatus.success?.length > 0 && <Tag color="success" style={{ cursor: "pointer" }} onClick={handleSuccessVisible}>{formStatus.success.length} <CheckOutlined /></Tag>}
                    {!infoVisible.status && infoVisible.tag && formStatus.info?.length > 0 && <Tag style={{ cursor: "pointer" }} onClick={handleInfoVisible} color="info">{formStatus.info.length} Info(s)</Tag>}
                </div>
                }
                {
                    (errorVisible.status && formStatus.error?.length > 0) && <Alert type="error" action={<Button type="text" onClick={handleErrorVisible}>X</Button>} message="Erros no Formulário" showIcon={true} description={
                        formStatus.error.map((v, i) => <div key={`w-${i}`}>{v.message}</div>)
                    } style={{ marginBottom: "8px" }} />
                }
                {
                    (warningVisible.status && formStatus.warning?.length > 0) && <Alert type="warning" action={<Button type="text" onClick={handleWarningVisible}>X</Button>} message="Avisos no Formulário" showIcon={true} description={
                        formStatus.warning.map((v, i) => <div key={`w-${i}`}>{v.message}</div>)
                    } style={{ marginBottom: "8px" }} />
                }
                {
                    (infoVisible.status && formStatus.info?.length > 0) && <Alert type="info" action={<Button type="text" onClick={handleInfoVisible}>X</Button>} message="Informações no Formulário" showIcon={true} description={
                        formStatus.info.map((v, i) => <div key={`i-${i}`}>{v.message}</div>)
                    } style={{ marginBottom: "8px" }} />
                }
                {
                    (successVisible.status && formStatus.success?.length > 0) && <Alert type="success" action={<Button type="text" onClick={handleSuccessVisible}>X</Button>} message="" showIcon={true} description={
                        formStatus.success.map((v, i) => <div key={`i-${i}`}>{v.message}</div>)
                    } style={{ marginBottom: "8px" }} />
                }
            </>
        }
    </>);
}