import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TimePicker } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons'
import { TIME_FORMAT } from 'config';

const TimeRange = ({ value = {}, onChange, startProps, endProps, format = TIME_FORMAT, ...rest }) => {
    const [endOpen, setEndOpen] = useState(false);

    const disabledStartTime = startValue => {
        const { endValue } = value;
        if (!startValue || !endValue) {
            return false;
        }
        return startValue.valueOf() > endValue.valueOf();
    };

    const disabledEndTime = endValue => {
        const { startValue } = value;
        if (!endValue || !startValue) {
            return false;
        }
        return endValue.valueOf() <= startValue.valueOf();
    };

    const onStartChange = val => {
        onChange('startValue', val);
    };

    const onEndChange = val => {
        onChange('endValue', val);
    };

    const handleStartOpenChange = open => {
        if (!open) {
            setEndOpen(true);
        }
    };

    const handleEndOpenChange = open => {
        setEndOpen(open);
    };

    return (<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <TimePicker
            disabledTime={disabledStartTime}
            format={format}
            value={value?.startValue}
            placeholder="Início"
            onChange={onStartChange}
            onOpenChange={handleStartOpenChange}
            style={{ marginRight: "1px" }}
            suffixIcon={<></>}
            {...rest}
            {...startProps}
        />
        <TimePicker
            disabledTime={disabledEndTime}
            format={format}
            value={value?.endValue}
            placeholder="Fim"
            onChange={onEndChange}
            open={endOpen}
            onOpenChange={handleEndOpenChange}
            suffixIcon={<></>}
            {...rest}
            {...endProps}
        />
        <ClockCircleOutlined style={{ marginLeft: "1px", color: 'rgba(0,0,0,.25)' }} />
    </div>);
}

export default TimeRange;