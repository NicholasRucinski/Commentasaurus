import { usePluginData } from "@docusaurus/useGlobalData";
import { CommentasaurusConfig } from "..";

export function useCommentasaurusConfig(): Required<CommentasaurusConfig> {
  const config = usePluginData("commentasaurus") as CommentasaurusConfig;
  if (!config) {
    throw new Error("[Commentasaurus] Config not found");
  }
  return config as Required<CommentasaurusConfig>;
}
