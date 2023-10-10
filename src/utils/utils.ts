export function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * if the function is not resolved within the given time, it will be rejected
 * @param funcFactory 
 * @param ms 
 */
export async function timeout<T>(funcFactory: () => (...args: any[]) => T | PromiseLike<T>, ms: number) {
  return new Promise<T>(async (resolve, reject) => {
    setTimeout(() => {
      reject(new Error('timeout'));
    }, ms);
    try {
      const func = funcFactory();
      const result = await func();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * if the function is rejected, it will be retried for the given number of times
 * @param funcFactory 
 * @param ms 
 * @param retries 
 * @returns 
 */
export async function retry<T>(funcFactory: () => (...args: any[]) => T | PromiseLike<T>, ms: number = 0, retries: number = 3) {
  return new Promise<T>(async (resolve, reject) => {
    const retry = async (n: number) => {
      try {
        const func = funcFactory();
        const result = await func();
        resolve(result);
      } catch (error) {
        if (n > 0) {
          setTimeout(() => {
            retry(n - 1);
          }, ms);
        } else {
          reject(error);
        }
      }
    }
    retry(retries);
  });
}