import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { createUseStyles } from 'react-jss';
import styled from 'styled-components';

export const isRH = (auth, num=null) => {
    return (auth?.isRH || auth?.isAdmin) && !num;
}

export const isAdmin = (auth, num=null) => {
    return (auth?.isAdmin) && !num;
}

export const isPrivate = (auth, num) => {
    return num;
}

export const LeftUserItem = ({ auth }) => {
    return (<div style={{fontSize:"14px"}}>
      <div>{auth?.num}</div>
      <div style={{fontWeight:700}}>{auth?.first_name} {auth?.last_name}</div>
    </div>);
  }