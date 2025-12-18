import React, { useEffect, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { Space, Popconfirm, Popover, Button } from 'antd';

const StyledToolbar = styled.div`
    display: flex;

    .left{
        display: flex;
        justify-content: flex-start;
        align-items: center;
        flex: 1;
        white-space: nowrap;
    }
    .center{
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 1;
        white-space: nowrap;
    }
    .right{
        display: flex;
        justify-content: flex-end;
        align-items: center;
        flex: 1;
        white-space: nowrap;
    }

    ${(props) => {
        return (!props?.clean) ? `
            padding:5px;
            margin-bottom: .2rem!important;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 3px;
        ` : `
            padding-top: 1px;
            padding-bottom: 1px;
            padding-left: 1px;
            padding-right: 1px;            
        `
    }};


    
`;

export default ({ left, right, center, clean = false, ...props }) => {
    //children.displayName || this.props.children.type.name
    return (
        <StyledToolbar clean={clean} {...props}>
            <div className="left">{left}</div>
            {center && <div className="center">{center}</div>}
{/*             <div className='right'>
            <Popover placement="bottom" content={right} trigger="click">
                <Button>...</Button>
            </Popover>
            </div> */}
            <div className="right">{right}</div>
        </StyledToolbar>
    );
}

/* display: -ms-flexbox;
    display: flex;
    -ms-flex-align: center;
    align-items: center; */