import React from "react";
import { Comment, PositionedComment, SelectionInfo } from "../types";

export interface CommentsContextValue {
  contentRef: React.RefObject<HTMLDivElement>;

  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;

  draftComment: PositionedComment | null;
  setDraftComment: React.Dispatch<
    React.SetStateAction<PositionedComment | null>
  >;

  canComment: boolean;
  canSeeComments: boolean;

  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;

  selectionInfo: SelectionInfo | null;
  clearSelection: () => void;
}
