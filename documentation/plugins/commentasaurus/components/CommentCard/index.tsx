import { BaseComment, PositionedComment } from "../../types";
import styles from "./styles.module.css";
import highlightStyles from "../MDXContentWithComments/styles.module.css";

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
          ?.classList.add(highlightStyles.hovered)
      }
      onMouseLeave={() =>
        document
          .querySelector(`[data-comment-id="${card.id}"]`)
          ?.classList.remove(highlightStyles.hovered)
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
      <p>
        <em>-{card.user}</em>
      </p>
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
