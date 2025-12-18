import React from "react";
export const ConditionalWrapper = ({ condition, wrapper, children }) => condition ? wrapper(children) : children;