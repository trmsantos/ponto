import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import styled from "styled-components";
import classNames from "classnames";
import { createUseStyles } from 'react-jss';
import * as R from "ramda";
import { ConditionalWrapper } from './conditionalWrapper';
import Portal from "./portal";
import { Alert } from 'antd';
import "./css/label.css"

const pointer = (pos) => {
    switch (pos) {
        case "left": return "right";
        case "right": return "left";
        case "top": return "bottom";
    }
    return "";
}

const StyledAlert = styled(Alert)`
    padding: 0px 0px;
    background-color: transparent;
    &.ant-alert-warning > .ant-alert-content > .ant-alert-message{
        color: #d46b08;
    }
    &.ant-alert-error > .ant-alert-content > .ant-alert-message{
        color: #cf1322;
    }
`;


export default ({ alert = true, status = "error", position = "bottom", text }) => {
    const css = classNames("ui", "mini", `${pointer(position)}`, "pointing", { "red": status == "error" }, { "orange": status == "warning" }, "basic", "label");
    return (
        <>
            {!alert && <div className={css}>
                {text}
            </div>
            }
             {alert && <StyledAlert banner message={text} type={status} />
            }
        </>
    );
}