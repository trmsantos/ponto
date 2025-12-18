import { Button, Result } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <Result status="404"
      title="404"
      subTitle="A página que tentou aceder está indisponível ou não existe!"
      extra={<Button type="primary" onClick={() => navigate('/app')}>Ir para a página inicial</Button>}>
    </Result>);
};
export default NotFoundPage;