import { BaseComment, PositionedComment } from "../../types";
import styles from "./styles.module.css";

interface DraftCommentProps {
  draftComment: PositionedComment;
  onCommentChange: React.Dispatch<React.SetStateAction<BaseComment | null>>;
  onSubmit: (draft: BaseComment) => Promise<void>;
}

const DraftComment = ({
  draftComment,
  onCommentChange,
  onSubmit,
}: DraftCommentProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onCommentChange((prev) => prev && { ...prev, comment: e.target.value });
  };

  const handleSubmit = (e) => {
    if (draftComment.comment.trim()) {
      e.preventDefault();
      onSubmit(draftComment);
    }
  };

  return (
    <div
      className={styles.draftCommentCard}
      style={{ top: `${draftComment.top}px` }}
    >
      <p>
        <strong>Draft for “{draftComment.text}”</strong>
      </p>
      <form>
        <textarea
          placeholder="Write your comment..."
          value={draftComment.comment}
          className={styles.commentCardInput}
          onChange={handleChange}
        />
        <div className={styles.draftActions}>
          <button
            type="submit"
            className={styles.draftCommentCardButton}
            onClick={handleSubmit}
          >
            Submit
          </button>
          <button
            className={styles.draftCommentCardButton}
            onClick={() => onCommentChange(null)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default DraftComment;
