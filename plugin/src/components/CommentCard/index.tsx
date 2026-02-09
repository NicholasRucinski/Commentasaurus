import { BaseComment, Comment } from "../../types";
import styles from "./styles.module.css";
import highlightStyles from "../MDXContentWithComments/styles.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useDrawerPortal } from "../../contexts/DrawerPortalContext";

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

  const isMobile = useIsMobile();

  const handleCardClick = (e: React.MouseEvent) => {
    if (isCommentOverflowing && e.currentTarget === e.target) {
      setShowModal(true);
    }
  };

  return (
    <>
      <div
        className={`${
          isMobile ? styles.commentCard : styles.commentCardDesktop
        } ${isCommentOverflowing ? styles.fade : ""}`}
        onClick={handleCardClick}
        onMouseEnter={() =>
          !isMobile &&
          document
            .querySelector(`[data-comment-id="${card.id}"]`)
            ?.classList.add(highlightStyles.hovered)
        }
        onMouseLeave={() =>
          !isMobile &&
          document
            .querySelector(`[data-comment-id="${card.id}"]`)
            ?.classList.remove(highlightStyles.hovered)
        }
        role="article"
        aria-label={`Comment by ${card.user}`}
      >
        <div className={styles.header}>
          <strong className={styles.quotedText}>
            "{cutOfText}
            {isTextOverflowing && "…"}"
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
            aria-label="Show full comment"
          >
            Show more →
          </button>
        )}

        <div className={styles.footer}>
          <div className={styles.meta}>
            <span className={styles.author}>{card.user}</span>
            <span className={styles.time}>{timeAgo(card.createdAt)}</span>
          </div>

          <button
            className={styles.resolveButton}
            onClick={(e) => {
              e.stopPropagation();
              onResolve(card);
            }}
            aria-label={`Resolve comment by ${card.user}`}
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
  const drawerPortal = useDrawerPortal();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [open]);

  if (!open) return null;

  const getPortalContainer = () => {
    if (isMobile && drawerPortal) {
      const drawerBody = drawerPortal.getDrawerBodyElement();
      if (drawerBody) {
        return drawerBody;
      }
    }
    return document.body;
  };

  const modalStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: isMobile ? 10 : 1005,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  };

  if (isMobile && drawerPortal) {
    modalStyle.position = "absolute";
    modalStyle.inset = 0;
    modalStyle.zIndex = 10;
    modalStyle.padding = "0";
    modalStyle.background = "rgba(0,0,0,0.8)";
  }

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      style={modalStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        style={{
          background: "var(--ifm-background-surface-color)",
          width: "100%",
          maxWidth: isMobile ? "none" : "720px",
          maxHeight: isMobile ? "100%" : "85vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: isMobile ? "0" : "16px",
          boxShadow: isMobile ? "none" : "0 20px 60px rgba(0,0,0,0.3)",
          transform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            padding: isMobile ? "12px 16px" : "16px 20px",
            borderBottom: "1px solid var(--ifm-color-emphasis-200)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <h3
            id="modal-title"
            style={{
              margin: 0,
              fontSize: isMobile ? "1rem" : "1.1rem",
              lineHeight: "1.4",
              wordBreak: "break-word",
              flex: 1,
            }}
          >
            "{card.text}"
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "var(--ifm-color-emphasis-100)",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              borderRadius: "6px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.2s ease",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "var(--ifm-color-emphasis-200)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "var(--ifm-color-emphasis-100)";
            }}
          >
            ✕
          </button>
        </header>

        <div
          style={{
            padding: isMobile ? "16px" : "20px",
            overflowY: "auto",
            flex: 1,
            WebkitOverflowScrolling: "touch",
            lineHeight: "1.6",
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {card.comment}
          </ReactMarkdown>
        </div>

        <footer
          style={{
            padding: isMobile ? "12px 16px" : "14px 20px",
            borderTop: "1px solid var(--ifm-color-emphasis-200)",
            fontSize: "0.9rem",
            color: "var(--ifm-color-emphasis-600)",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontWeight: 500 }}>{card.user}</span>
          <span>{timeAgo(card.createdAt)}</span>
        </footer>
      </div>
    </div>,
    getPortalContainer(),
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
