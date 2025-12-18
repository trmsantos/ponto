import React, { useEffect } from "react";
import classNames from "classnames";
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
    progress: {
        height: "8px",
        width:"100%",
        overflow: "hidden",
        marginTop:"10px",
        backgroundColor: "#f5f5f5",
        borderRadius: "2px",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
        '& span': {
            position: "absolute",
            display: "block",
            width: "100%",
            color: "black"
        },
        '& .progress-bar': {
            float: "left",
            width: "0",
            height: "100%",
            color: "#fff",
            textAlign: "center",
            backgroundColor: "#91d5ff",
            boxShadow: "inset 0 -5px 0 rgb(0 0 0 / 15%)",
            //transition: "width .6s ease",
            '& .show': {
                fontSize:"11px",
                marginTop:"-16px",
                display: "block!important"
            }
        },
        '& .progress-bar-success': {
            boxShadow: "inset 0 -5px 0 rgb(0 0 0 / 15%)",
            backgroundColor: "#389e0d"
        }
    }
});


export default ({ value, min = 0, max, r }) => {
    const classes = useStyles();
    const percent = ((value * 100) / max);


    const css = classNames({ "progress-bar": true, "progress-bar-success": (value >= max) });
    return (
        <div className={classes.progress}>
            <div className={css} style={{ width: `${percent}%` }}>
                <span className="show">{value}/{max}</span>
            </div>
        </div>
    );
};