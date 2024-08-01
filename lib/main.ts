#!/usr/bin/env node
import { Command, program } from "commander";
import * as inquirer from "inquirer";
import { useGitter } from "./git";
import { useCommond } from "./commond";
import { runBuild } from "./build";
import { checkMovePath, checkUploadPath, getConfig, saveConfig } from "./move";
import chalk from "chalk";
import { kill } from "process";
import { NAME } from "./const";
const { createPromptModule } = inquirer.default;

const prompt = createPromptModule();

program
  .command("build")
  .option("--move", "打包完成后进行移动")
  .option("--upload", "打包完成后进行上传")
  .action(async ({ move, upload }) => {
    const pass = move || upload;
    if (move) {
      if (!checkMovePath()) {
        console.log(
          chalk.red("未设置移动路径，请使用") +
            chalk.yellow(`${NAME} config set movePath <path>`) +
            "进行设置"
        );
        kill(process.pid);
        return;
      }
    }
    if (upload) {
      if (!checkUploadPath()) {
        console.log(
          chalk.red("未设置上传路径，请使用") +
            chalk.yellow(`${NAME} config set uploadPath <path>`) +
            "进行设置"
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
      pullCode,
    } = useGitter();
    const { pullNewInfo, filterBranch, selectBranch, moveDist } = useCommond({
      prompt,
      getBranches,
    });

    // 获取remote
    await fetchRemote();
    if (!pass) {
      // 是否拉取最新仓库
      const isPull = await pullNewInfo();
      if (isPull) {
        await pullBranches();
      }

      // 获取所有的分支
      await fetchBranches();
      // 检索分支
      const branchName = await filterBranch();
      let selectBranchItem = getNowBranch();
      if (branchName !== "") {
        // 不是空 切换到选择的分支 为空 使用当前分支
        selectBranchItem = await selectBranch(branchName);
        await checkoutBranch(selectBranchItem);
      }
      // 拉取分支最新代码
      await pullCode();
    }

    // 执行打包
    await runBuild();
    // 选择移动或者上传
    await moveDist(move ? "move" : upload ? "upload" : undefined);
  });

const Config = new Command("config");
Config.command("ls").action(() => {
  console.log(getConfig());
});

Config.command("set")
  .argument("<key>")
  .argument("<value>")
  .action((key, val) => {
    saveConfig({ [key]: val });
  });
program.addCommand(Config);

program.parse(process.argv);
