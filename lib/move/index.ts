import chalk from "chalk";
import { writeFileSync } from "fs";
import path from "path";
import rc from "rc";
import shelljs from "shelljs";
import { NAME } from "../const";
import os from 'os'
const userHome = os.homedir();

export const getConfig = () => {
  const config = rc("vb", {
    movePath: "",
    uploadPath: "",
    dist: "./dist/",
  });
  return config;
};

const npmrcFilePath = path.join(userHome!, ".vbrc");

export const saveConfig = (config: Record<string, string>) => {
  const oldConfig = getConfig();
  const configString = Object.entries({ ...oldConfig, ...config })
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  writeFileSync(npmrcFilePath, configString, "utf-8");
  console.log(chalk.green("设置成功"));
};

export const moveFiles = async () => {
  const config = getConfig();
  const { movePath, dist } = config;
  if (movePath === "") {
    console.log(
      chalk.red("未设置移动路径，请使用") +
        chalk.yellow(`${NAME} config set movePath <path>`) +
        "进行设置"
    );
    return Promise.reject();
  }
  startMove(movePath, dist);
};

const startMove = (targetPath: string, distPath: string) => {
  const list = shelljs.ls(targetPath);
  const excludesFiles = ["config.js"];
  shelljs.rm(
    "-rf",
    list
      .filter((v) => !excludesFiles.includes(v))
      .map((v) => path.join(targetPath, v))
  );

  shelljs.cp(
    "-R",
    path.join(process.cwd(), distPath + "/*"),
    path.join(targetPath)
  );
  console.log(
    chalk.green(
      `成功将${path.join(process.cwd(), distPath)}下的文件移动到${targetPath}下`
    )
  );
};

export const checkMovePath = () => {
  return !!getConfig().movePath;
};

export const checkUploadPath = () => {
  return !!getConfig().uploadPath;
};
