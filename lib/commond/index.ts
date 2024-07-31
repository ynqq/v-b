import { ChoiceOptions, PromptModule } from "inquirer";
import { moveFiles } from "../move";
import chalk from "chalk";

interface Props {
  prompt: PromptModule;
  getBranches: () => string[];
}

export const useCommond = ({ prompt, getBranches }: Props) => {
  const pullNewInfo = async () => {
    const res = await prompt({
      type: "list",
      name: "isPull",
      message: "是否拉取最新的分支?",
      choices: [
        { name: "是", value: true },
        { name: "否", value: false },
      ],
    });
    return res.isPull;
  };

  const filterBranch = async () => {
    const res = await prompt({
      type: "input",
      name: "branchName",
      message: "检索分支(空使用当前分支)",
    });
    return res.branchName;
  };

  const selectBranch = async (branchName: string) => {
    const allBranch = getBranches();
    const list: ChoiceOptions[] = allBranch
      .filter((v) => v.includes(branchName))
      .map((v) => ({
        name: v,
        value: v,
      }));
    if (list.length) {
      const res = await prompt({
        type: "list",
        message: "请选择分支",
        name: "selectBranch",
        choices: list,
      });
      return res.selectBranch;
    }
    return null;
  };

  const moveDist = async (type?: 'move' | 'upload') => {
    if(!type){
      const { moveOrUpload } = await prompt({
        type: "list",
        name: "moveOrUpload",
        message: "请选择移动或者上传",
        choices: [
          { name: "移动", value: "move" },
          {
            name: "上传",
            value: "upload",
          },
        ],
      });
      type = moveOrUpload
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
    moveDist,
  };
};
