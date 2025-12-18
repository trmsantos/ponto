import React, { useEffect, useState, useCallback, useRef, Suspense, useContext, useLayoutEffect } from 'react';
import { createUseStyles } from 'react-jss';
import styled from 'styled-components';
import YScroll from "components/YScroll";
import { Modal, Drawer } from "antd";
import { ConditionalWrapper } from './conditionalWrapper';

import { MediaContext } from '../pages/App';


const TitleModal = ({ title, eTitle }) => {
    const getTitle = () => {
        if (title) {
            return title;
        }
        return (eTitle === null || eTitle.title === '') ? '' : eTitle.title;
    }

    return (
        <div><span style={{ textTransform: "capitalize", fontWeight: 900, fontSize: "18px" }}>{getTitle()}</span></div>
    );
}



export default ({ type = "modal", id, push = true, responsive = true, width = 800, height = 300, children, footer,extra, title: iTitle, lazy = false, onCancel, yScroll = false, ...props }) => {
    const [size, setSize] = useState({ width, height, fullscreen: false, computed: false });
    const [title, setTitle] = useState(null);
    const ctx = useContext(MediaContext);
    const footerRef = useRef();
    const extraRef = useRef();

    useLayoutEffect(() => {
        if (responsive) {
            const _size = size;
            if (ctx.windowDimension.width <= width) {
                _size.width = "100vw";
                _size.height = "calc(100vh - 90px)";
                _size.fullscreen = true;
                _size.computed = true;
            } else {
                _size.width = width;
                _size.height = height;
                _size.fullscreen = false;
                _size.computed = true;
            }
            setSize({ ..._size });
        }
    }, [ctx.windowDimension]);


    const footerButtons = () => {
        if (footer === "ref") {
            return <div {...{...id && {id}}} ref={footerRef} style={{ textAlign: 'right' }}></div>;
        } else if (footer === "none") {
            return null;
        } else {
            return footer;
        }
    }
    const extraButtons = () => {
        if (extra === "ref") {
            return <div ref={extraRef} style={{ textAlign: 'right' }}></div>;
        } else if (extra === "none") {
            return null;
        } else {
            return extra;
        }
    }

    const wrapWithClose = (method) => async () => {
        method && await method();
        if (onCancel) {
            onCancel();
        }
    };

    return (
        <>
            {(size.computed && type === "modal") &&
                <Modal
                    title={<TitleModal title={iTitle} eTitle={title} />}
                    open={true}
                    centered={size.fullscreen ? false : true}
                    maskClosable={true}
                    destroyOnClose={true}
                    okText="Confirmar"
                    cancelText="Cancelar"
                    width={size.width}
                    onCancel={onCancel}
                    {...(footer && { footer: footerButtons() })}
                    bodyStyle={{ height: size.height }}
                    style={{ ...(size.fullscreen && { top: "0px", margin: "0px", maxWidth: size.width, paddingBottom: "0px" }) }}
                    {...props}
                >
                    <ConditionalWrapper
                        condition={yScroll}
                        wrapper={children => <YScroll>{children}</YScroll>}
                    >
                        {(children && lazy) && <Suspense fallback={<></>}>{React.cloneElement(children, { ...{ wndRef: footerRef, parentRef: footerRef, setFormTitle: setTitle, setTitle: setTitle, closeSelf: wrapWithClose(onCancel), closeParent: wrapWithClose(onCancel) }, ...children.props })}</Suspense>}
                        {(children && !lazy) && React.cloneElement(children, { ...{ wndRef: footerRef, parentRef: footerRef, setFormTitle: setTitle, setTitle: setTitle, closeSelf: wrapWithClose(onCancel), closeParent: wrapWithClose(onCancel) }, ...children.props })}
                    </ConditionalWrapper>
                </Modal>
            }
            {(size.computed && type === "drawer") &&
                <Drawer
                    title={<TitleModal title={iTitle} eTitle={title} />}
                    open={true}
                    //centered={size.fullscreen ? false : true}
                    maskClosable={true}
                    destroyOnClose={true}
                    okText="Confirmar"
                    cancelText="Cancelar"
                    width={size.width}
                    onClose={onCancel}
                    push={push}
                    {...(footer && { footer: footerButtons() })}
                    {...(extra && { extra: extraButtons() })}
                    //bodyStyle={{ height: size.height }}
                    style={{ ...(size.fullscreen && { top: "0px", margin: "0px", maxWidth: size.width, paddingBottom: "0px" }) }}
                    {...props}
                >
                    {(children && lazy) && <Suspense fallback={<></>}>{React.cloneElement(children, { ...{ wndRef: footerRef, parentRef: footerRef,extraRef: extraRef, setFormTitle: setTitle, setTitle: setTitle, closeSelf: wrapWithClose(props?.onCancel), closeParent: wrapWithClose(props?.onCancel) }, ...children.props })}</Suspense>}
                    {(children && !lazy) && React.cloneElement(children, { ...{ wndRef: footerRef, parentRef: footerRef,extraRef: extraRef, setFormTitle: setTitle, setTitle: setTitle, closeSelf: wrapWithClose(props?.onCancel), closeParent: wrapWithClose(props?.onCancel) }, ...children.props })}
                </Drawer>
            }
        </>
    );
}