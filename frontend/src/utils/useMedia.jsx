import React, { useEffect, useState, Suspense, lazy, useContext, useMemo } from 'react';
import { useMediaQuery } from 'react-responsive';
import useWindowDimensions from 'utils/useWindowDimensions';
import { debounce } from 'utils';


export const baseBreakpoint = 'lg';
export const staticBreakpoints=['sm','xs','xxs'];
export const breakpoints = { lg: 1200, md: 992, sm: 768, xs: 480, xxs: 0 }; //ATENTITION ORDERED!!!
export const cols = { lg: 12, md: 4, sm: 2, xs: 1, xxs: 1 }; //ATENTION key names must match breakpoints!!!!

export default () => {
    const isBigScreen = useMediaQuery({ minWidth: 1824 });
    const isDesktop = useMediaQuery({ minWidth: 992 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 991 });
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isPortrait = useMediaQuery({ orientation: 'portrait' });
    const windowDimension = useWindowDimensions();
    const [width, setWidth] = useState();

    const verify = useMemo(
        () => debounce((iP, iD, iT, iM, iB, wD) => {
            const orientation = (iP) ? "portrait" : "landscape";
            let breakpoint = 'lg';
            for(let v in breakpoints){
                if (wD.width>=breakpoints[v]){
                    breakpoint = v;
                    break;
                }
            }
            if (iB) {
                setWidth({ width: 900, unit: "px", maxWidth: 80, maxUnit: "%", device: "bigscreen", deviceW: 4, orientation, minWidthQuery: 1824, windowDimension: wD, breakpoint });
            } else if (iD) {
                setWidth({ width: 800, unit: "px", maxWidth: 80, maxUnit: "%", device: "desktop", orientation, deviceW: 3, minWidthQuery: 992, windowDimension: wD, breakpoint });
            } else if (iT) {
                setWidth({ width: 100, unit: "%", maxWidth: 100, maxUnit: "%", device: "tablet", orientation, deviceW: 2, minWidthQuery: 768, maxWidthQuery: 991, windowDimension: wD, breakpoint });
            } else {
                setWidth({ width: 100, unit: "%", maxWidth: 100, maxUnit: "%", device: "mobile", orientation, maxWidthQuery: 767, deviceW: 1, windowDimension: wD, breakpoint });
            }
        }, 200),
        []
    );

    useEffect(() => {
        verify(isPortrait, isDesktop, isTablet, isMobile, isBigScreen, windowDimension);
    }, [isPortrait, isDesktop, isTablet, isMobile, isBigScreen, windowDimension]);

    return [width];
};