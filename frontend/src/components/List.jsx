import React, { useEffect, useState, Suspense } from 'react';
import { Empty } from 'antd';
import { createUseStyles } from 'react-jss';
import styled from 'styled-components';

const StyledList = styled.div`
    display = flex;
    flex-direction = column;
    flex = 1;
`;

const StyledListItem = styled.div`
    display = flex;
    flex-direction = column;
    flex = 1;
`;

const ListItem = ({ item, idx, render, style }) => {
    return (<StyledListItem style={style}>{render(item, idx)}</StyledListItem>);
}

const List = ({ dataSource, onRemove, onUpdate, render, style, listItemStyle }) => {

    return (
        <StyledList style={style}>
            {dataSource.length === 0 &&
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sem Dados" />
            }
            {dataSource.map((item, idx) => (
                <ListItem key={`li-${idx}`} item={item} idx={idx} render={render} style={listItemStyle} />
            ))}
        </StyledList>
    );
}


List.ItemHeader = ({ left = <></>, right = <></>, leftStyle = {}, rightStyle = {} }) => {
    return (
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
            <div style={leftStyle}>{left}</div>
            <div style={rightStyle}>{right}</div>
        </div>
    );
}

List.ItemContent = ({ children }) => {
    return (
        <div>
            {children}
        </div>
    );
}

List.ItemFooter = ({ left = <></>, right = <></> }) => {
    return (
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
            <div>{left}</div>
            <div>{right}</div>
        </div>
    );
}

export default List;