import React, { useEffect } from "react";
import ReactDOM from "react-dom";


export default ({ children, elId }) => {
	const el = (typeof elId === 'string') ? document.getElementById(elId) : elId;
	return <>{el && ReactDOM.createPortal(children, el)}</>
};