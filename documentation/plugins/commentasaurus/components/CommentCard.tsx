import styles from "./styles.module.css";
import { BaseComment, PositionedComment } from "../types";

interface CommentCardProps {
  card: PositionedComment;
  onResolve: (comment: BaseComment) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({ card, onResolve }) => {
  return (
    <div
      className={styles.commentCard}
      style={{ top: `${card.top}px` }}
      onMouseEnter={() =>
        document
          .querySelector(`[data-comment-id="${card.id}"]`)
          ?.classList.add(styles.hovered)
      }
      onMouseLeave={() =>
        document
          .querySelector(`[data-comment-id="${card.id}"]`)
          ?.classList.remove(styles.hovered)
      }
      onClick={() =>
        document
          .querySelector(`[data-comment-id="${card.id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    >
      <p>
        <strong>“{card.text}”</strong>
      </p>
      <p>{card.comment}</p>
      <div>
        <button
          className={styles.resolveButton}
          onClick={(e) => {
            e.stopPropagation();
            onResolve(card);
          }}
        >
          Resolve
        </button>
      </div>
    </div>
  );
};

export default CommentCard;
