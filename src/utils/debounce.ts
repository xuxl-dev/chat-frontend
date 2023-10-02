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
