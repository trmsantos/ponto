import React from 'react';
import { Tag } from "antd";
import classNames from "classnames";
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
    tag: {
        cursor: "pointer",
        '&:active': {
            transform: "scale(0.9)",
            boxShadow: "1px 1px 5px rgba(0, 0, 0, 0.24)"
        },
        '&:hover': {
            opacity:.8
        }
    }
})

export default ({className, children, ...rest}) => {
    const classes = useStyles();
    const css = classNames(className, classes.tag);
    return (
        <Tag className={css} {...rest}>{children}</Tag>
    );
}