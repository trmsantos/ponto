import React from 'react';
import styled from 'styled-components';

const StyledSubLayout = styled.div`
    display: flex;
    flex-direction: row;
`;

const SubLayout = ({ flyoutStatus = { visible: false, fullscreen: false }, flyoutWidth = "300px", children, ...rest }) => {
    
    return (
        <StyledSubLayout {...rest}>
            {React.Children.map(children, (child, i) => {
                if (child.type == SubLayout.flyout && flyoutStatus.visible) {
                    return React.cloneElement(child, { width: flyoutWidth, fullScreen: flyoutStatus.fullscreen });
                } else if (child.type == SubLayout.content) {
                    return React.cloneElement(child, { width: (flyoutStatus.visible) ? `calc(100% - ${flyoutWidth})` : '100%' });
                }
            })}
        </StyledSubLayout>
    );
}

const StyledContent = styled.div`
    transition: width .2s ease-in-out;
    ${(props) => props.width && `
        width:${props.width};
    `}
`;

const StyledFlyout = styled.div`
    ${(props) => props.width && !props.fullScreen && `
        width:${props.width};
    `}
    ${(props) => props.fullScreen && `
        z-index: 9999; 
        width: 100%; 
        height: 100%; 
        position: fixed; 
        top: 0; 
        left: 0; 
    `}
    background:#ffffff;
    flex-grow: 1;
    display: flex;
    flex-direction:column;
    border-left: 1px solid #f0f0f0;
    margin-left:5px;
    box-shadow: 0px 0px 2px 1px #f0f0f0;

`;

SubLayout.content = ({ children, ...rest }) => {
    return (<StyledContent {...rest}>{children}</StyledContent>);
}

SubLayout.flyout = ({ children, ...rest }) => {
    return (<StyledFlyout {...rest}>{children}</StyledFlyout>);
}

export default SubLayout;