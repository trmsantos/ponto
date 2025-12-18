import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { TitleForm, WrapperForm } from "components/formLayout";


export default ({ showWrapper, setShowWrapper, parentReload, children, width, ...rest }) => {
    const [formTitle, setFormTitle] = useState({});
    const iref = useRef();
    const { record = {} } = showWrapper;
    const onVisible = () => {
        setShowWrapper(prev => ({ ...prev, show: !prev.show }));
    }
    return (
        <WrapperForm
            title={<TitleForm title={formTitle.title} subTitle={formTitle.subTitle} />}
            type="drawer"
            destroyOnClose={true}
            //width={width}
            mask={true}
            /* style={{ maginTop: "48px" }} */
            setVisible={onVisible}
            visible={showWrapper.show}
            width={width}
            bodyStyle={{ height: "450px" /*  paddingBottom: 80 *//* , overflowY: "auto", minHeight: "350px", maxHeight: "calc(100vh - 50px)" */ }}
            footer={<div ref={iref} id="form-wrapper" style={{ textAlign: 'right' }}></div>}
            {...rest}
        >
            {React.cloneElement(children, { ...children.props, setFormTitle, record, parentRef: iref, closeParent: onVisible, parentReload })}
        </WrapperForm>
    );
}