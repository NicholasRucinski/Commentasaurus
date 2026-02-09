import { useEffect, useRef } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { BaseComment, PositionedComment } from "../../types";
import styles from "./styles.module.css";

interface DraftCommentProps {
  draftComment: PositionedComment;
  onCommentChange: React.Dispatch<React.SetStateAction<PositionedComment | null>>;
  onSubmit: (draft: BaseComment) => Promise<void>;
}

const DraftComment = ({
  draftComment,
  onCommentChange,
  onSubmit,
}: DraftCommentProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onCommentChange((prev) => prev && { ...prev, comment: e.target.value });
  };

  const handleSubmit = (e) => {
    if (draftComment.comment.trim()) {
      e.preventDefault();
      onSubmit(draftComment);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    onCommentChange(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (draftComment.comment.trim()) {
        onSubmit(draftComment);
      }
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCommentChange(null);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const isMobile = useIsMobile();

  const isSubmitDisabled = !draftComment.comment.trim();

  return (
    <div
      className={
        isMobile ? styles.draftCommentCard : styles.draftCommentCardDesktop
      }
      style={{ top: `${draftComment.top}px` }}
      aria-label="Draft comment"
    >
      <div className={styles.draftHeader}>
        <strong className={styles.draftQuotedText}>
          "{draftComment.text}"
        </strong>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          placeholder="Write your comment..."
          value={draftComment.comment}
          className={styles.commentCardInput}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label="Comment text"
          rows={3}
        />

        <div className={styles.draftFooter}>
          <div className={styles.draftActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
              aria-label="Cancel comment"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitDisabled}
              aria-label="Submit comment"
            >
              Submit
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DraftComment;
