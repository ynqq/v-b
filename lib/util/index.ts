import { exec } from "child_process";

export const sleep = (time: number = 300) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

export const execAsync = <
  R extends string | Buffer = string,
  T extends Parameters<typeof exec> = Parameters<typeof exec>
>(
  commond: T[0],
  options?: T[1]
) => {
  return new Promise<R>((resolve, reject) => {
   const ex = exec(commond, options, (error, stdout) => {
      if (error) {
        reject(error);
        ex.kill()
      }
      resolve(stdout as R);
    });
  });
};
