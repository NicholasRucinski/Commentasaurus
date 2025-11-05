import { LoadContext, Plugin } from "@docusaurus/types";
import path from "path";

export enum CommentPermission {
  Anonymous = "anon",
  Authenticated = "auth",
  Team = "team",
}

export interface CommentasaurusConfig {
  apiUrl: string;
  autoShowComments: boolean;
  commentPermission: CommentPermission;
  repoName: string;
  repoOwner?: string;
  repoID?: string;
  repoCategoryId?: string;
  deleteOnResolve?: boolean;
}

module.exports = function commentasaurusPlugin(
  context: LoadContext,
  options: CommentasaurusConfig
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
      return path.resolve(__dirname, "./theme");
    },
  };
};
