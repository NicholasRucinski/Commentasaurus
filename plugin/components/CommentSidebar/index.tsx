import React, {
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import styles from "./styles.module.css";
import DraftComment from "../DraftCommentCard";
import CommentCard from "../CommentCard";
import { BaseComment, Comment, PositionedComment } from "../../types";

const COMMENT_CARD_SPACING = 20;

export default function CommentsSidebar({
  canSeeComments,
  showSidebar,
  draftComment,
  comments,
  setShowSidebar,
  setDraftComment,
  handleAddComment,
  onResolveComment,
}) {
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [activeComment, setActiveComment] = useState<string | null>(null);

  // TODO: Keep looking into this. I feel like its close but offsetHeight is 0 a lot
  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      const heights = comments.map((c) => ({
        id: c.id,
        height: commentRefs.current[c.id]?.offsetHeight ?? 350,
      }));

      const sorted = [...comments].sort((a, b) => a.y - b.y);

      let nextAvailableTop = 0;
      const newPositions: Record<string, number> = {};

      for (const c of sorted) {
        const height = heights.find((h) => h.id === c.id)?.height ?? 150;

        const desiredTop = c.y - 270;

        const top = Math.max(desiredTop, nextAvailableTop);

        newPositions[c.id] = top;

        nextAvailableTop = top + height + COMMENT_CARD_SPACING;
      }

      setPositions(newPositions);
    });
  }, [comments]);

  return (
    <>
      {canSeeComments && (
        <div className={styles.wrapper}>
          {showSidebar ? (
            <>
              <button
                onClick={() => setShowSidebar(false)}
                className={`${styles.toggleButton} ${styles.toggleHide}`}
              >
                ❯
              </button>
              <div className={styles.sidebar} id="comment-sidebar">
                <div className={styles.commentLayer}>
                  {draftComment && (
                    <DraftComment
                      draftComment={draftComment}
                      onCommentChange={setDraftComment}
                      onSubmit={handleAddComment}
                    />
                  )}
                  <>
                    {comments.length === 0 ? (
                      <p style={{ padding: 16 }}>No comments yet.</p>
                    ) : (
                      comments.map((c) => (
                        <div
                          key={c.id}
                          ref={(el) => {
                            commentRefs.current[c.id] = el;
                          }}
                          onClick={() => setActiveComment(c.id)}
                          style={{
                            position: "absolute",
                            width: "100%",
                            left: 0,
                            right: 0,
                            top: positions[c.id] ?? 0,
                            zIndex: activeComment === c.id ? 999 : 1,
                          }}
                        >
                          <CommentCard
                            key={c.id}
                            card={c}
                            onResolve={onResolveComment}
                          />
                        </div>
                      ))
                    )}
                  </>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => setShowSidebar(true)}
              className={`${styles.toggleButton} ${styles.toggleShow}`}
            >
              ❮ Comments
            </button>
          )}
        </div>
      )}
    </>
  );
}
