import { exec } from "child_process";
import { createOra } from "../ora";
import { execAsync, sleep } from "../util";
import chalk from "chalk";

const nowBranchReg = /\*\s/;

export const useGitter = () => {
  let allBranch: string[] = [],
    nowBranch = "",
    remote = "";

  const fetchRemote = async () => {
    const res = await execAsync("git remote", { encoding: "utf-8" });
    remote = res.split("\n")[0];
    console.log("当前仓库为:" + chalk.green(` ${remote}`));
  };

  const pullBranches = async () => {
    const sp = createOra("正在拉取最新分支");
    return new Promise<void>((resolve, reject) => {
      exec("git pull", async (error) => {
        if (error) {
          console.log("拉取失败");
          reject(error);
          return;
        }
        sp.text = "拉取完成";
        sp.color = "green";
        await sleep(1000);
        sp.stop();
        resolve();
      });
    });
  };
  const fetchBranches = async () => {
    const data = await execAsync("git branch -a", { encoding: "utf-8" });
    allBranch = data
      .toString()
      .split("\n")
      .map((v) => {
        let name = v.trim();
        if (nowBranchReg.test(name)) {
          name = nowBranch = name.replace(nowBranchReg, "");
        }
        return name;
      })
      .filter((v) => !!v);
  };

  const getBranches = () => allBranch;
  const getNowBranch = () => nowBranch;
  const getRemote = () => remote;

  const checkoutBranch = async (branchName: string) => {
    const sp = createOra(`正在切换至${branchName}`);
    if (nowBranch !== branchName) {
      try {
        await execAsync(`git checkout ${branchName}`);
      } catch (error) {
        const str = chalk.red('切换失败,请检查是否有未提交的代码')
        console.log(`${str}`, '错误信息为:', chalk.redBright(error));
        return Promise.reject(error)
      }
    }
    sp.text = `已切换到${branchName}`;
    await sleep(1000);
    sp.stop();
  };

  const pullCode = async () => {
    const sp = createOra(`正在拉取${nowBranch}的代码`)
    try {
      await execAsync(`git pull ${remote} ${nowBranch}`)
    } catch (error) {
      const str = chalk.red('拉取失败')
      console.log(str)
      return Promise.reject(error)
    }
    sp.text = '拉取完成'
    await sleep(1000)
    sp.stop()
  }

  return {
    fetchBranches,
    pullBranches,
    fetchRemote,
    checkoutBranch,
    getBranches,
    getNowBranch,
    getRemote,
    pullCode,
  };
};
