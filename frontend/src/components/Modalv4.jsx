import React, { useEffect, useState, useRef, memo } from 'react';
import { Space, Button } from "antd";
import YScroll from "components/YScroll";
import ResponsiveModal from "components/ResponsiveModal";

const TitleWnd = ({ title, externalTitle }) => {
    const getTitle = () => {
        if (title) {
            return title;
        }
        return (externalTitle === null || externalTitle.title === '') ? null : externalTitle.title;
    }

    return (
        <div style={{ display: "flex", flexDirection: "row", gap: "10px", alignItems: "center",minHeight: "12px" }}>
            <div style={{ fontSize: "14px", display: "flex", flexDirection: "row", alignItems: "center" }}>
                <Space>
                    <div><b style={{ textTransform: "capitalize" }}></b>{getTitle()}</div>
                </Space>
            </div>
        </div>
    );
}

const Footer = ({ handleOk, handleCancel, iref }) => {
    return <div ref={iref} style={{ textAlign: 'right' }}>
        <Button onClick={handleCancel} size="small">Cancelar</Button>,
        <Button type="primary" onClick={handleOk} size="small">Confirmar</Button>
    </div>;
}

const Modalv4 = memo(
    (props) => {
        const [visible, setVisible] = useState(false);
        const [externalTitle, setExternalTitle] = useState(null);
        const payloadRef = useRef({});
        const iref = useRef();
        const propsToChild = payloadRef?.current?.propsToChild ? payloadRef?.current?.propsToChild : false;

        useEffect(() => {
            const lastShow = Modalv4.show;
            Modalv4.show = (payload) => {
                setVisible(true);
                payloadRef.current = payload;
            };
            return () => (Modalv4.show = lastShow);
        }, []);

        const wrapWithClose = (method) => () => {
            setVisible(false);
            setExternalTitle(null);
            method && method();
        };

        return (
            <ResponsiveModal
                title={<TitleWnd title={payloadRef?.current?.title} externalTitle={externalTitle} />}
                visible={visible}
                centered
                responsive
                onCancel={wrapWithClose(payloadRef?.current?.onCancel)}
                maskClosable={true}
                destroyOnClose={true}
                fullWidthDevice={payloadRef?.current?.fullWidthDevice}
                width={payloadRef?.current?.width}
                height={payloadRef?.current?.height}
                bodyStyle={{ /* backgroundColor: "#f0f0f0" */ }}
                footer={(payloadRef?.current?.footer) ? payloadRef?.current?.footer : (payloadRef?.current?.defaultFooter) ? <Footer handleOk={wrapWithClose(payloadRef?.current?.onOk)} handleCancel={wrapWithClose(payloadRef?.current?.onCancel)} iref={iref} />  : <div ref={iref} style={{ textAlign: 'right' }}></div>}
            >
                <YScroll>
                    {payloadRef?.current?.content && React.cloneElement(payloadRef.current.content, { ...payloadRef.current.content.props, ...propsToChild && { wndRef: iref, parentRef: iref, setFormTitle: setExternalTitle } })}
                </YScroll>
            </ResponsiveModal>
        );
    },
    () => true
);
Modalv4.show = (payload) => console.log("Modalv4 is not mounted.");

export default Modalv4;