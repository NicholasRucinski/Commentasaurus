import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./styles.module.css";
import { BaseComment, Comment, PositionedComment } from "../types";
import DraftComment from "./DraftComment";
import CommentCard from "./CommentCard";
import { useSelection } from "./hooks/useSelection";
import { restoreHighlights } from "./utils/highlights";
import { saveComments } from "./utils/storage";
import { createComment, getComments } from "../api/comments";
import { reanchorComments } from "./utils/reanchor";

const COMMENT_CARD_HEIGHT = 150;
const COMMENT_CARD_SPACING = 20;

export default function HighlightComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [draftComment, setDraftComment] = useState<PositionedComment | null>(
    null
  );

  const { selectionInfo, clearSelection } = useSelection();
  useEffect(() => {
    const loadComments = async () => {
      const { comments: loadedComments, error } = await getComments(
        window.location.pathname
      );

      if (error) return;

      const anchored = reanchorComments(loadedComments);
      setComments(anchored);
    };
    loadComments();
  }, [window.location.pathname]);

  useEffect(() => saveComments(comments), [comments]);
  useEffect(() => restoreHighlights(comments), [comments]);

  const handleAddComment = useCallback(
    async (draft: BaseComment) => {
      const { error } = await createComment(draft);
      if (error) {
        console.log(error);

        setDraftComment(null);
        clearSelection();
        return;
      }
      if (!draft.comment.trim()) return;
      const newComment: Comment = { ...draft, type: "TEXT" };
      setComments((prev) => [...prev, newComment]);
      setDraftComment(null);
      clearSelection();
    },
    [clearSelection]
  );

  const getCommentPositions = (comments: Comment[]) => {
    const sorted = [...comments].sort((a, b) => a.y - b.y);
    let lastY = 0;
    return sorted.map((c) => {
      let top = c.y - 270;
      if (top < lastY) top = lastY;
      lastY = top + COMMENT_CARD_HEIGHT + COMMENT_CARD_SPACING;
      return { ...c, top };
    });
  };

  const positionedComments = useMemo(
    () => getCommentPositions(comments),
    [comments]
  );

  const resolveComment = (comment: BaseComment) => {
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
  };

  const handleAddCommentClick = useCallback(() => {
    if (!selectionInfo) return;
    console.log(selectionInfo.contextBefore);
    console.log(selectionInfo.contextAfter);
    const draft: PositionedComment = {
      id: crypto.randomUUID(),
      page: window.location.pathname,
      y: selectionInfo.y,
      comment: "",
      contextBefore: selectionInfo.contextBefore,
      text: selectionInfo.text,
      contextAfter: selectionInfo.contextAfter,
      top: selectionInfo.y - 270,
    };
    setDraftComment(draft);
  }, [selectionInfo]);

  return (
    <div className={styles.wrapper}>
      {selectionInfo &&
        createPortal(
          <button
            onClick={handleAddCommentClick}
            className={styles.portal}
            style={{
              top: selectionInfo.y - 40,
              left: selectionInfo.x,
            }}
          >
            Add Comment
          </button>,
          document.body
        )}

      <div className={styles.sidebar}>
        <div className={styles.commentLayer}>
          {draftComment && (
            <DraftComment
              draftComment={draftComment}
              onCommentChange={setDraftComment}
              onSubmit={handleAddComment}
            />
          )}
          {positionedComments.length === 0 ? (
            <p style={{ padding: 16 }}>No comments yet.</p>
          ) : (
            positionedComments.map((c) => (
              <CommentCard key={c.id} card={c} onResolve={resolveComment} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
