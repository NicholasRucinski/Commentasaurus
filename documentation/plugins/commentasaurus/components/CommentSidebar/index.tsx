import React from "react";
import styles from "./styles.module.css";
import DraftComment from "../DraftCommentCard";
import CommentCard from "../CommentCard";

export default function CommentsSidebar({
  canSeeComments,
  showSidebar,
  setShowSidebar,
  draftComment,
  setDraftComment,
  handleAddComment,
  positionedComments,
  onResolveComment,
}) {
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
                    {positionedComments.length === 0 ? (
                      <p style={{ padding: 16 }}>No comments yet.</p>
                    ) : (
                      positionedComments.map((c) => (
                        <CommentCard
                          key={c.id}
                          card={c}
                          onResolve={onResolveComment}
                        />
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
