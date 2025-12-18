import React, { useEffect, useState, useCallback, useRef } from 'react';
import { DatePicker } from 'antd';
import { CalendarOutlined } from '@ant-design/icons'
import { DATE_FORMAT } from 'config';

const DateRange = ({ value = {}, onChange, startProps, endProps, format = DATE_FORMAT, ...rest }) => {
    const [endOpen, setEndOpen] = useState(false);

    const disabledStartDate = startValue => {
        const { endValue } = value;
        if (!startValue || !endValue) {
            return false;
        }
        return startValue.valueOf() > endValue.valueOf();
    };

    const disabledEndDate = endValue => {
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
        <DatePicker
            disabledDate={disabledStartDate}
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
        <DatePicker
            disabledDate={disabledEndDate}
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
        <CalendarOutlined style={{ marginLeft: "1px", color: 'rgba(0,0,0,.25)' }} />
    </div>);
}

export default DateRange;