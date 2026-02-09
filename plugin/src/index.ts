import { LoadContext, Plugin } from "@docusaurus/types";
import path from "path";
import { CommentasaurusConfig, CommentPermission } from "./types/index.js";

export type { CommentasaurusConfig, CommentPermission } from "./types/index.js";

const __dirname = path.dirname(__filename);

export default function commentasaurusPlugin(
  _context: LoadContext,
  options: CommentasaurusConfig,
): Plugin<CommentasaurusConfig> {
  const defaults: Required<CommentasaurusConfig> = {
    apiUrl: "http://localhost:8080",
    autoShowComments: true,
    commentPermission: CommentPermission.Anonymous,
    repoName: "",
    repoOwner: "",
    repoID: "",
    repoCategoryId: "",
    deleteOnResolve: false,
  };

  const finalConfig = { ...defaults, ...options };

  return {
    name: "commentasaurus",
    getClientModules() {
      return [];
    },
    async loadContent() {
      return finalConfig;
    },
    async contentLoaded({ content, actions }) {
      actions.setGlobalData(content);
    },
    getThemePath() {
      return path.resolve(__dirname, "theme");
    },
  };
}
