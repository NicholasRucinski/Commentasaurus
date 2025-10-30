const isLocal = true;
export const API_URL = isLocal
  ? "http://localhost:8080"
  : "https://server-image-639487598928.us-east4.run.app";

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
