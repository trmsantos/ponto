import React, { useState } from 'react';
import customModal from './customModal';

export default () => {
    const [modal, setModal] = useState();
    let destroy;
    //const { responsive = false, width, height = "100vh", bodyStyle, destroyOnClose = true, maskClosable = true, centered = true, visible, title, onCancel, fullWidthDevice = 1, minFullHeight = 0, ...rest } = props;

    const show = (config = {}) => {
        let _modal = customModal();
        destroy = () => _modal.destroy();
        _modal.update(config)
        setModal(_modal);
    }

    const close = () => {
        destroy();
    }

    const update = (config) => {
        if (modal) {
            modal.update(config);
        }
    }

    return { show, close, update };

}