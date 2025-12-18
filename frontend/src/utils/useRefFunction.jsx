import { useCallback, useRef } from 'react';

export default (reFunction) => {
    const ref = useRef(null);
    ref.current = reFunction;
    return useCallback((...rest) => {
      return ref.current?.(...(rest));
    }, []);
  };