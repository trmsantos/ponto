import React from 'react';
import { createRoot } from 'react-dom/client';
import { Modal } from "antd";
import ResponsiveModal from './ResponsiveModal';




let defaultRootPrefixCls = '';
let destroyFns = [];

function getRootPrefixCls() {
    return defaultRootPrefixCls;
}

export default (config={}) => {
    const container = document.createDocumentFragment();
    const root = createRoot(container);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    let currentConfig = { ...config, close, visible: true };

    const destroy = (...args) => {
        const triggerCancel = args.some(param => param && param.triggerCancel);
        if (config?.onCancel && triggerCancel) {
            config.onCancel(...args);
        }
        for (let i = 0; i < destroyFns.length; i++) {
            const fn = destroyFns[i];
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            if (fn === close) {
                destroyFns.splice(i, 1);
                break;
            }
        }
        root.unmount(container);
    }

    function render({ okText, cancelText, prefixCls: customizePrefixCls, ...props }) {
        /**
         * https://github.com/ant-design/ant-design/issues/23623
         *
         * Sync render blocks React event. Let's make this async.
         */
        setTimeout(() => {
            const { content, ...rest } = props;
            root.render(
                <ResponsiveModal {...rest} noContext={true}>{content}</ResponsiveModal>
            );
        });
    }

    function close(...args) {
        currentConfig = {
            ...currentConfig,
            visible: false,
            afterClose: () => {
                if (typeof config?.afterClose === 'function') {
                    config.afterClose();
                }

                destroy.apply(this, args);
            },
        };
        render(currentConfig);
    }

    function update(configUpdate) {
        if (typeof configUpdate === 'function') {
            currentConfig = configUpdate(currentConfig);
        } else {
            currentConfig = {
                ...currentConfig,
                ...configUpdate,
            };
        }
        render(currentConfig);
    }

    render(currentConfig);

    destroyFns.push(close);

    return {
        destroy: close,
        update,
    };
}