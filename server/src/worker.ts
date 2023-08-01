export const multiplyWithTimeout = async (a: number, b: number) => {
  return new Promise<number>((res, rej) => {
    setTimeout(() => {
      res(a * b);
    }, 5000);
  });
};
