#!/usr/bin/env node
import { program, Command } from "commander";
import * as inquirer from "inquirer";
import { exec, spawn } from "child_process";
import ora from "ora";
import chalk from "chalk";
import { writeFileSync } from "fs";
import path from "path";
import rc from "rc";
import shelljs from "shelljs";
import os from "os";
import { kill } from "process";
const createOra = (text, color = "yellow") => {
  const spinner = ora(text).start();
  spinner.color = color;
  return spinner;
};
const sleep = (time = 300) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};
const execAsync = (commond, options) => {
  return new Promise((resolve, reject) => {
    const ex = exec(commond, options, (error, stdout) => {
      if (error) {
        reject(error);
        ex.kill();
      }
      resolve(stdout);
    });
  });
};
const nowBranchReg = /\*\s/;
const useGitter = () => {
  let allBranch = [], nowBranch = "", remote = "";
  const fetchRemote = async () => {
    const res = await execAsync("git remote", { encoding: "utf-8" });
    remote = res.split("\n")[0];
    console.log("当前仓库为:" + chalk.green(` ${remote}`));
  };
  const pullBranches = async () => {
    const sp = createOra("正在拉取最新分支");
    return new Promise((resolve, reject) => {
      exec("git pull", async (error) => {
        if (error) {
          console.log("拉取失败");
          reject(error);
          return;
        }
        sp.text = "拉取完成";
        sp.color = "green";
        await sleep(1e3);
        sp.stop();
        resolve();
      });
    });
  };
  const fetchBranches = async () => {
    const data = await execAsync("git branch -a", { encoding: "utf-8" });
    allBranch = data.toString().split("\n").map((v) => {
      let name = v.trim();
      if (nowBranchReg.test(name)) {
        name = nowBranch = name.replace(nowBranchReg, "");
      }
      return name;
    }).filter((v) => !!v);
  };
  const getBranches = () => allBranch;
  const getNowBranch = () => nowBranch;
  const getRemote = () => remote;
  const checkoutBranch = async (branchName) => {
    const sp = createOra(`正在切换至${branchName}`);
    if (nowBranch !== branchName) {
      try {
        await execAsync(`git checkout ${branchName}`);
      } catch (error) {
        const str = chalk.red("切换失败,请检查是否有未提交的代码");
        console.log(`${str}`, "错误信息为:", chalk.redBright(error));
        return Promise.reject(error);
      }
    }
    sp.text = `已切换到${branchName}`;
    await sleep(1e3);
    sp.stop();
  };
  const pullCode = async () => {
    const sp = createOra(`正在拉取${nowBranch}的代码`);
    try {
      await execAsync(`git pull ${remote} ${nowBranch}`);
    } catch (error) {
      const str = chalk.red("拉取失败");
      console.log(str);
      return Promise.reject(error);
    }
    sp.text = "拉取完成";
    await sleep(1e3);
    sp.stop();
  };
  return {
    fetchBranches,
    pullBranches,
    fetchRemote,
    checkoutBranch,
    getBranches,
    getNowBranch,
    getRemote,
    pullCode
  };
};
const NAME = "hd-vb";
const userHome = os.homedir();
const getConfig = () => {
  const config = rc("vb", {
    movePath: "",
    uploadPath: "",
    dist: "./dist/",
    buildCommand: "build:prod"
  });
  return config;
};
const npmrcFilePath = path.join(userHome, ".vbrc");
const saveConfig = (config) => {
  const oldConfig = getConfig();
  const configString = Object.entries({ ...oldConfig, ...config }).map(([key, value]) => `${key}=${value}`).join("\n");
  writeFileSync(npmrcFilePath, configString, "utf-8");
  console.log(chalk.green("设置成功"));
};
const moveFiles = async () => {
  const config = getConfig();
  const { movePath, dist } = config;
  if (movePath === "") {
    console.log(
      chalk.red("未设置移动路径，请使用") + chalk.yellow(`${NAME} config set movePath <path>`) + "进行设置"
    );
    return Promise.reject();
  }
  startMove(movePath, dist);
};
const startMove = (targetPath, distPath) => {
  const list = shelljs.ls(targetPath);
  const excludesFiles = ["config.js"];
  shelljs.rm(
    "-rf",
    list.filter((v) => !excludesFiles.includes(v)).map((v) => path.join(targetPath, v))
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
const checkMovePath = () => {
  return !!getConfig().movePath;
};
const checkUploadPath = () => {
  return !!getConfig().uploadPath;
};
const useCommond = ({ prompt: prompt2, getBranches }) => {
  const pullNewInfo = async () => {
    const res = await prompt2({
      type: "list",
      name: "isPull",
      message: "是否拉取最新的分支?",
      choices: [
        { name: "是", value: true },
        { name: "否", value: false }
      ]
    });
    return res.isPull;
  };
  const filterBranch = async () => {
    const res = await prompt2({
      type: "input",
      name: "branchName",
      message: "检索分支(空使用当前分支)"
    });
    return res.branchName;
  };
  const selectBranch = async (branchName) => {
    const allBranch = getBranches();
    const list = allBranch.filter((v) => v.includes(branchName)).map((v) => ({
      name: v,
      value: v
    }));
    if (list.length) {
      const res = await prompt2({
        type: "list",
        message: "请选择分支",
        name: "selectBranch",
        choices: list
      });
      return res.selectBranch;
    }
    return null;
  };
  const moveDist = async (type) => {
    if (!type) {
      const { moveOrUpload } = await prompt2({
        type: "list",
        name: "moveOrUpload",
        message: "请选择移动或者上传",
        choices: [
          { name: "移动", value: "move" },
          {
            name: "上传",
            value: "upload"
          }
        ]
      });
      type = moveOrUpload;
    }
    if (type === "move") {
      await moveFiles();
    } else if (type === "upload") {
      console.log(chalk.yellow("这得请叶大佬上手了"));
    }
  };
  return {
    pullNewInfo,
    filterBranch,
    selectBranch,
    moveDist
  };
};
const runBuild = () => {
  return new Promise((resolve, reject) => {
    const buildCommond = getConfig().buildCommand;
    const sp = spawn("npm", ["run", buildCommond], {
      stdio: "inherit",
      shell: true,
      env: process.env
    });
    sp.on("error", (error) => {
      kill(process.pid);
      console.log(chalk.red("打包出错"));
      reject(error);
    });
    sp.on("close", (code) => {
      if (code !== 0) {
        console.log(chalk.red("打包出错"));
        reject();
        kill(process.pid);
        return;
      }
      console.log(chalk.green("打包完成"));
      resolve();
    });
  });
};
const version = "1.1.0";
const pkg = {
  version
};
const { createPromptModule } = inquirer.default;
const prompt = createPromptModule();
program.command("build").option("--move", "打包完成后进行移动").option("--upload", "打包完成后进行上传").action(async ({ move, upload }) => {
  const pass = move || upload;
  if (move) {
    if (!checkMovePath()) {
      console.log(
        chalk.red("未设置移动路径，请使用") + chalk.yellow(`${NAME} config set movePath <path>`) + "进行设置"
      );
      kill(process.pid);
      return;
    }
  }
  if (upload) {
    if (!checkUploadPath()) {
      console.log(
        chalk.red("未设置上传路径，请使用") + chalk.yellow(`${NAME} config set uploadPath <path>`) + "进行设置"
      );
      kill(process.pid);
      return;
    }
  }
  const {
    fetchBranches,
    pullBranches,
    getBranches,
    checkoutBranch,
    fetchRemote,
    getNowBranch,
    pullCode
  } = useGitter();
  const { pullNewInfo, filterBranch, selectBranch, moveDist } = useCommond({
    prompt,
    getBranches
  });
  await fetchRemote();
  if (!pass) {
    const isPull = await pullNewInfo();
    if (isPull) {
      await pullBranches();
    }
    await fetchBranches();
    const branchName = await filterBranch();
    let selectBranchItem = getNowBranch();
    if (branchName !== "") {
      selectBranchItem = await selectBranch(branchName);
      await checkoutBranch(selectBranchItem);
    }
    await pullCode();
  }
  await runBuild();
  await moveDist(move ? "move" : upload ? "upload" : void 0);
});
program.version(pkg.version, "-v, --version");
const Config = new Command("config");
Config.command("ls").action(() => {
  console.log(getConfig());
});
Config.command("set").argument("<key>").argument("<value>").action((key, val) => {
  saveConfig({ [key]: val });
});
program.addCommand(Config);
program.parse(process.argv);
