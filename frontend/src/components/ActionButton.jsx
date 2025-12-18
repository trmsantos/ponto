import React from 'react';
import {
    EuiButtonIcon,
    EuiFlexItem,
    EuiFlexGroup
} from '@elastic/eui';
import { Popover, Dropdown } from "antd";
import { IconContext } from "react-icons";
import { GrApps } from "react-icons/gr";
import { FaBeer } from 'react-icons/fa';
import { Button } from "antd";
import classNames from "classnames";
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
    svg: {
        cursor: "pointer",
        verticalAlign: 'middle',
        '& path': {
            stroke: "#0050b3",
            strokeWidth: "2px"
        },
        '&:active': {
            transform: "scale(0.8)",
            boxShadow: "1px 1px 5px rgba(0, 0, 0, 0.24)"
        },
        '&:hover': {
            '& path': {
                stroke: "#1890ff",
                strokeWidth: "2px"
            }
        }
    }
})







export default ({ content, trigger = ["click"], ...rest }) => {
    const classes = useStyles();
    return (

        <Dropdown overlay={content} placement="bottomLeft" trigger={trigger}>
            <div>
                <IconContext.Provider value={{ className: classes.svg }}>
                    <GrApps />
                </IconContext.Provider>
            </div>
        </Dropdown>


    );
}