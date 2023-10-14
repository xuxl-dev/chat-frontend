type DebouncedFunction<T extends (...args: any[]) => void> = (...args: Parameters<T>) => void;


export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): DebouncedFunction<T> {
  let timerId: ReturnType<typeof setTimeout> | null

  return (...args: Parameters<T>) => {
    if (timerId) {
      clearTimeout(timerId)
    }

    timerId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}


import { customRef, type Ref, type UnwrapRef } from 'vue';

export function debouncedRef<T>(value: T, delay = 500): Ref<T> {
  let timeout;
  let debouncedValue = value;

  return customRef<T>((track, trigger) => ({
    get() {
      // 添加追踪，以便在值发生变化时触发更新
      track();
      return debouncedValue;
    },
    set(newValue: T) {
      // 清除之前的定时器
      clearTimeout(timeout);

      // 设置一个新的定时器，延迟更新值
      timeout = setTimeout(() => {
        debouncedValue = newValue;
        // 触发更新
        trigger();
      }, delay);
    },
  }));
}

export function advancedDebounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number,
  maxWait: number
) {
  let timerId: ReturnType<typeof setTimeout> | null;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | null;
  let lastId: string | null;

  const invokeFunction = () => {
    if (lastArgs && lastId) {
      func(...lastArgs);
      lastArgs = null;
      lastId = null;
      lastInvokeTime = Date.now();
    }
  };

  const cancel = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return (id: string, ...args: Parameters<T>) => {
    if (!lastInvokeTime) {
      lastInvokeTime = Date.now();
    }

    if (lastId !== id) {
      // Different ID, cancel the previous timer and set the new ID and arguments
      cancel();
      lastArgs = args;
      lastId = id;
      lastInvokeTime = Date.now();

      // If there is a maximum wait time and it has passed, invoke the function immediately
      if (maxWait && lastInvokeTime - lastInvokeTime >= maxWait) {
        invokeFunction();
      } else {
        // Otherwise, set a timer to invoke the function after the specified delay
        timerId = setTimeout(invokeFunction, delay);
      }
    } else {
      // Same ID, just update the arguments
      lastArgs = args;
    }
  };
}
