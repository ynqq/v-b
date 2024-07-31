import chalk from "chalk";
import { spawn } from "child_process";
import { kill } from "process";

export const runBuild = () => {
  return new Promise<void>((resolve, reject) => {
    const sp = spawn("npm", ["run", "build:prod"], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    sp.on("error", (error) => {
      kill(process.pid)
      console.log(chalk.red("打包出错"));
      reject(error);
    });
    sp.on("close", (code) => {
      if(code !== 0){
        console.log(chalk.red("打包出错"));
        reject()
        kill(process.pid)
        return
      }
      console.log(chalk.green("打包完成"));
      resolve();
    });
  });
};
