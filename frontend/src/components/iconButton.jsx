import React from 'react';
import classNames from "classnames";
import { createUseStyles } from 'react-jss';
import { IconContext } from "react-icons";

const useStyles = createUseStyles({
    svg: {
        cursor: "pointer",
        verticalAlign: 'middle',
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

export default ({ className, children, ...rest }) => {
    const classes = useStyles();
    const css = classNames(className, classes.tag);
    return (
        <IconContext.Provider value={{ className: classes.svg }}>
            {React.cloneElement(children, {...children.props, ...rest })}
        </IconContext.Provider>
    );
}