import { BaseComment, Comment } from "../../types";
import styles from "./styles.module.css";
import highlightStyles from "../MDXContentWithComments/styles.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

interface CommentCardProps {
  card: Comment;
  onResolve: (comment: BaseComment) => void;
}

const MAX_PREVIEW_LENGTH = 100;
const MAX_TEXT_PREVIEW_LENGTH = 50;

const CommentCard: React.FC<CommentCardProps> = ({ card, onResolve }) => {
  const [showModal, setShowModal] = useState(false);

  const cutOfText = card.text.slice(0, MAX_TEXT_PREVIEW_LENGTH);
  const plainTextPreview = card.comment.slice(0, MAX_PREVIEW_LENGTH);

  const isTextOverflowing = card.text.length > MAX_TEXT_PREVIEW_LENGTH;
  const isCommentOverflowing = card.comment.length > MAX_PREVIEW_LENGTH;

  return (
    <>
      <div
        className={`${styles.commentCard} ${
          isCommentOverflowing ? styles.fade : ""
        }`}
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
      >
        <div className={styles.header}>
          <strong className={styles.quotedText}>
            “{cutOfText}
            {isTextOverflowing && "…"}”
          </strong>
        </div>

        <div className={styles.preview}>
          {plainTextPreview}
          {isCommentOverflowing && "…"}
        </div>

        {isCommentOverflowing && (
          <button
            className={styles.showMoreButton}
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
          >
            Show more →
          </button>
        )}

        <div className={styles.footer}>
          <div className={styles.meta}>
            <span className={styles.author}>- {card.user}</span>
            <span className={styles.time}>{timeAgo(card.createdAt)}</span>
          </div>

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

      <CommentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        card={card}
      />
    </>
  );
};

export default CommentCard;

const CommentModal = ({ open, onClose, card }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        padding: "40px",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "48px",
          marginTop: "15%",
          marginBottom: "15%",
          borderRadius: "10px",
          maxWidth: "700px",
          width: "100%",
          boxShadow: "0 4px 30px rgba(0,0,0,0.2)",
        }}
      >
        <h3>{card.text}</h3>

        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {card.comment}
        </ReactMarkdown>

        <p>
          <em>- {card.user}</em>
        </p>

        <button onClick={onClose} style={{ marginTop: "20px" }}>
          Close
        </button>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const diff = (Date.now() - date.getTime()) / 1000;

  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2629800) return `${Math.floor(diff / 604800)}w ago`;
  if (diff < 31557600) return `${Math.floor(diff / 2629800)}mo ago`;

  return `${Math.floor(diff / 31557600)}y ago`;
}
