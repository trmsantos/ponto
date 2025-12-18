import React from 'react';
import styled from "styled-components";
import { CloseOutlined, FullscreenOutlined } from "@ant-design/icons";
import { Space, Button } from 'antd';

const Container = ({ children }) => {
    return (<div>{children}</div>);
}

const StyledHeader = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    color: rgba(0, 0, 0, 0.85);
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    border-radius: 2px 2px 0 0;
`;

Container.Header = ({ icon, left, right, close = true, fullScreen = true, setStatus }) => {
    
    const onClose = ()=>{
        setStatus(prev=>({
            ...prev,
            visible:false
        }));
    }

    const onFullscreen = ()=>{
        setStatus(prev=>({
            ...prev,
            fullscreen:!prev.fullscreen
        }));
    }


    return (
        <StyledHeader>
            <Space>{icon && icon}{left && left}</Space>
            <Space>
                {right && right}               
                {fullScreen && <Button icon={<FullscreenOutlined />}  onClick={onFullscreen}/>}
                {close && <Button icon={<CloseOutlined />} onClick={onClose} />}
            </Space>

        </StyledHeader>
    );
}

Container.Body = styled.div`
    flex-grow: 1;
    padding: 24px;
    overflow: auto;
    font-size: 14px;
    line-height: 1.5715;
    word-wrap: break-word;
`;

Container.Footer = ({ left, right }) => {
    return (
        <StyledFooter>
            <div>{left && left}</div>
            <div>{right && right}</div>
        </StyledFooter>
    );
}

const StyledFooter = styled.div`
    flex-shrink: 0;
    display: flex;
    align-items: center;
    background: #f8f9fa;
    justify-content: space-between;
    padding: 10px 16px;
    border-top: 1px solid #f0f0f0;
`;

export default Container;