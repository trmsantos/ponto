import React from 'react';
import { Button } from "antd";



export default ({children, ...rest})=>{
    return(
        <Button shape="circle" style={{ border: "none", boxShadow: "none" }} {...rest}>
            {children}
        </Button>
    );
}