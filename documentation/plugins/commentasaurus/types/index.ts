export type SelectionInfo =
  | {
      type: "TEXT";
      contextBefore: string;
      text: string;
      contextAfter: string;
      range: Range;
      x: number;
      y: number;
    }
  | {
      type: "IMAGE";
      node: HTMLImageElement;
      contextBefore: string;
      text: string;
      contextAfter: string;
      x: number;
      y: number;
    }
  | null;

export type BaseComment = {
  id: string;
  page: string;
  comment: string;
  y: number;
  contextBefore: string;
  text: string;
  contextAfter: string;
  resolved: boolean;
  user: string;
  createdAt: string;
};

export type ImageComment = BaseComment & {
  type: "IMAGE";
  src: string;
};

export type TextComment = BaseComment & {
  type: "TEXT";
};

export type Comment = ImageComment | TextComment;

export interface PositionedComment extends BaseComment {
  top: number;
}

export type User = {
  id: number;
  name: string;
  email: string;
  avatar_url: string;
};
