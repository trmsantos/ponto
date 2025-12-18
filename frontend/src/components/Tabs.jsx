import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createUseStyles } from 'react-jss';
import styled from 'styled-components';
import classNames from "classnames";
import { Tabs } from "antd";

const useStyles = createUseStyles({
    dark1: {
        '& > .ant-tabs-nav': {
            backgroundColor: "#f0f0f0!important"
        },
        '& .ant-tabs-tab': {
            backgroundColor: "#d9d9d9!important"
        },
        '& .ant-tabs-tab-active':{
            backgroundColor: "#fff!important"
        }

    }
});

export const { TabPane } = Tabs;

export default ({ children, className, dark = 0, ...rest }) => {
    const classes = useStyles();
    const css = classNames(className, { [classes.dark1]: dark === 1 });
    return (
        <Tabs className={css} {...rest}>
            {children}
        </Tabs>
    );
}