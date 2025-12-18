import { useCallback, useEffect, useRef } from 'react';
import useRefFunction from './useRefFunction';

function useDebounceFn(fn, wait) {
  const callback = useRefFunction(fn);

  const timer = useRef();

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const run = useCallback(
    async (...args) => {
      if (wait === 0 || wait === undefined) {
        return callback(...args);
      }
      cancel();
      return new Promise((resolve) => {
        timer.current = setTimeout(async () => {
          resolve(await callback(...args));
        }, wait);
      });
    },
    [callback, cancel, wait],
  );

  useEffect(() => {
    return cancel;
  }, [cancel]);

  return {
    run,
    cancel,
  };
}

export default useDebounceFn;
