import { LoadContext, Plugin } from "@docusaurus/types";
import path from "path";

module.exports = function commentasaurusPlugin(
  context: LoadContext,
  options: any
): Plugin<any> {
  return {
    name: "commentasaurus",
    getThemePath() {
      return path.resolve(__dirname, "./theme");
    },
  };
};
