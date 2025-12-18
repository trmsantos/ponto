import React, { useEffect, useState, Suspense } from 'react';
import { Result } from "antd";

export default ({result, successButtonOK, successButtonClose, errorButtonOK, errorButtonClose, children}) => {

    return (
        <>
            {result.status === "none" && children}
            {result.status === "success" &&
                <Result
                    status={result.status}
                    title={result.title}
                    subTitle={result.subTitle}
                    extra={[successButtonOK,successButtonClose]}
                />
            }
            {result.status === "error" &&
                <Result
                    status={result.status}
                    title={result.title}
                    subTitle={result.subTitle}
                    extra={[errorButtonOK,errorButtonClose]}
                />
            }
        </>
    );
}