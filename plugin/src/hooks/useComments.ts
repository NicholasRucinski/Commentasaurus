import { useContext, createContext } from "react";
import { CommentsContextValue } from "../contexts/CommentContext";

export const CommentsContext = createContext<CommentsContextValue | null>(null);

export function useComments(): CommentsContextValue {
  const ctx = useContext(CommentsContext);

  if (!ctx) {
    throw new Error("useComments must be used inside <CommentsController>");
  }

  return ctx;
}
