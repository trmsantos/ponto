import React from "react";
export const IfElse = ({ condition, otherwise, children }) => condition ? children : otherwise;