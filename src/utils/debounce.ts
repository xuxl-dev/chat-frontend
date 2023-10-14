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

const debounceMap = new Map<string, (id: string, ...args: any[]) => void>();

export function advancedDebounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number,
  maxWait: number
) {
  let timerId: ReturnType<typeof setTimeout> | null;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | null;

  const invokeFunction = () => {
    if (lastArgs) {
      func(...lastArgs);
      lastArgs = null;
      lastInvokeTime = Date.now();
    }
  };

  const cancel = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const debounced = (id: string, ...args: Parameters<T>) => {
    if (!lastInvokeTime) {
      lastInvokeTime = Date.now();
    }

    if (lastArgs) {
      lastArgs = args;
      return;
    }

    lastArgs = args;

    if (!debounceMap.has(id)) {
      debounceMap.set(id, debounced as (id: string, ...args: any[]) => void);
    }

    if (debounceMap.get(id) === debounced) {
      if (maxWait && Date.now() - lastInvokeTime >= maxWait) {
        invokeFunction();
      } else {
        cancel();
        timerId = setTimeout(invokeFunction, delay);
      }
    }
  };

  return debounced;
}

