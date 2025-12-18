import React, { useEffect, useLayoutEffect, useState, useCallback, useRef, useContext } from 'react';
import styled from 'styled-components';
import { Space, Popconfirm, Popover, Button, Modal } from 'antd';
import YScroll from './YScroll';
import { MediaContext } from '../pages/App';
import useMedia from 'utils/useMedia';

import { BrowserRouter } from 'react-router-dom';

const computeHeight = (height, footer) => {
    if (footer) {
        return `calc(${height} - 120px)`;
    }
    return `calc(${height} - 60px)`;
}


const Hoc = ({ children, noContext }) => {
    return (
        <>
            {noContext && <BrowserRouter>{children}</BrowserRouter>}
            {!noContext && children}
        </>
    )
}

const TitleWnd = ({ title, externalTitle }) => {
    const getTitle = () => {
        if (title) {
            return title;
        }
        return (externalTitle === null || externalTitle.title === '') ? null : externalTitle.title;
    }

    return (
        <div style={{ display: "flex", flexDirection: "row", gap: "10px", alignItems: "center", minHeight: "12px" }}>
            <div style={{ fontSize: "14px", display: "flex", flexDirection: "row", alignItems: "center" }}>
                <Space>
                    <div><b style={{ textTransform: "capitalize" }}></b>{getTitle()}</div>
                </Space>
            </div>
        </div>
    );
}

export default ({ children, footer = false, noContext, propsToChild, ...props }) => {
    const [wctx] = (noContext) ? useMedia() : [];
    const ctx = (!noContext) ? useContext(MediaContext) : wctx;
    const { responsive = false, buttons = ["cancel", "ok"], width, height = "200px", bodyStyle, destroyOnClose = true, maskClosable = true, centered = true, visible, title, onCancel, onOk, fullWidthDevice = 1, minFullHeight = 0, ...rest } = props;
    const [respWidth, setRespWidth] = useState(width);
    const [respHeight, setRespHeight] = useState(height);
    const [externalTitle, setExternalTitle] = useState(null);
    const iref = useRef();
    const [v, setV] = useState(visible);

    useLayoutEffect(() => {
        if (responsive) {
            if (ctx?.deviceW <= fullWidthDevice) {
                setRespWidth("100%");
            } else {
                setRespWidth(width);
            }
            if (ctx?.windowDimension?.height <= minFullHeight) {
                setRespHeight(computeHeight("100vh", footer));
            } else {
                setRespHeight(computeHeight(height, footer));
            }
        }
    }/* , [ctx.deviceW, ctx.windowDimension,width,height,fullWidthDevice,minFullHeight] */);

    const wrapWithClose = (method) => async () => {
        method && await method();
        setV(false);
    };

    useEffect(() => {}, [v]);
    useEffect(() => {setV(visible);}, [visible]);

    const footerButtons = () => {
        if (footer === false) {
            return <>
                {buttons.includes("cancel") && <Button onClick={wrapWithClose(onCancel)}>Cancelar</Button>}
                {buttons.includes("ok") && <Button onClick={wrapWithClose(onOk)} type="primary">Confirmar</Button>}
            </>
        } else if (footer === "ref") {
            return <div ref={iref} style={{ textAlign: 'right' }}></div>;
        } else {
            return footer;
        }
    }

    return (
        <Hoc noContext={noContext}>
            <Modal
                title={<TitleWnd title={title} externalTitle={externalTitle} />}
                open={v}
                centered={centered}
                onCancel={wrapWithClose(onCancel)}
                onOk={wrapWithClose(onOk)}
                maskClosable={maskClosable}
                confirmLoading={true}
                footer={footerButtons()}
                destroyOnClose={destroyOnClose}
                bodyStyle={bodyStyle ? ({ height: respHeight, ...bodyStyle }) : ({ height: respHeight })}
                width={respWidth}
                okText="Confirmar"
                cancelText="Cancelar"
                {...rest}
            >
                <YScroll>
                    {children && React.cloneElement(children, { ...children.props, ...propsToChild && { wndRef: iref, parentRef: iref, setFormTitle: setExternalTitle, closeSelf: wrapWithClose(onCancel),closeParent: wrapWithClose(onCancel) } })}
                </YScroll>
            </Modal>
        </Hoc>
    );
}