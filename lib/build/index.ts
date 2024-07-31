import chalk from "chalk";
import { spawn } from "child_process";

export const runBuild = () => {
  return new Promise<void>((resolve, reject) => {
    const sp = spawn("npm", ["run", "build:prod"], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    sp.on("error", (error) => {
      console.log(chalk.red("打包出错"));
      reject(error);
    });
    sp.on("close", () => {
      console.log(chalk.green("打包完成"));
      resolve();
    });
  });
};
