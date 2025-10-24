export type SelectionInfo =
  | {
      type: "TEXT";
      text: string;
      range: Range;
      x: number;
      y: number;
    }
  | {
      type: "IMAGE";
      node: HTMLImageElement;
      text: string;
      x: number;
      y: number;
    }
  | null;

export type BaseComment = {
  id: string;
  comment: string;
  text: string;
  y: number;
  page: string;
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
