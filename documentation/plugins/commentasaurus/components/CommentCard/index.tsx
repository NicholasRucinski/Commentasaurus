import { BaseComment, Comment } from "../../types";
import styles from "./styles.module.css";
import highlightStyles from "../MDXContentWithComments/styles.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useEffect, useRef, useState } from "react";

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
        {/* --- HEADER --- */}
        <div className={styles.header}>
          <strong className={styles.quotedText}>
            “{cutOfText}
            {isTextOverflowing && "…"}”
          </strong>
        </div>

        {/* --- PREVIEW --- */}
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

        {/* --- FOOTER (metadata & actions) --- */}
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

function CommentModal({
  open,
  onClose,
  card,
}: {
  open: boolean;
  onClose: () => void;
  card: Comment;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!open) return null;

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
          zIndex: 9999,
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
    </div>
  );
}

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
