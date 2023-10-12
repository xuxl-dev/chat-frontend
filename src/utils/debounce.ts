type DebouncedFunction<T extends (...args: any[]) => void> = (
  ...args: Parameters<T>
) => void

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