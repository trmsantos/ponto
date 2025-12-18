import React from 'react';
import styled from 'styled-components';

export default styled.div`
    scrollbar-color:rgba(105,112,125,.5) transparent;
    scrollbar-width:thin;
    height:100%;
    overflow-y:auto;
    overflow-x:hidden;
    -webkit-mask-image:linear-gradient(180deg,rgba(255,0,0,.1) 0 7.5px calc(100%-7.5px),rgba(255,0,0,.1));
    mask-image:linear-gradient(180deg,rgba(255,0,0,.1) 0 7.5px calc(100%-7.5px),rgba(255,0,0,.1));
    &::-webkit-scrollbar {
      width:16px;
      height:16px;
    }
    &::-webkit-scrollbar-thumb{
      background-color:rgba(105,112,125,.5);
      background-clip:content-box;
      border-radius:16px;
      border:6px solid transparent;
    }
    &::-webkit-scrollbar-corner{
      background-color:transparent;
    }
    &:focus {
        outline: none;
    }
    &:focus:focus-visible{
      outline-style:auto;
    }    
`;