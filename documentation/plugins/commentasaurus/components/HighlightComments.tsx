import React, { useEffect, useState, useCallback, JSX } from "react";
import styles from "./styles.module.css";
import { createPortal } from "react-dom";

// --- Constants ---
const COMMENT_CARD_HEIGHT = 120;
const COMMENT_CARD_SPACING = 20;

// --- Types ---
type SelectionInfo =
  | {
      type: "TEXT";
      text: string;
      range: Range;
      x: number;
      y: number;
    }
  | {
      type: "IMAGE";
      node: HTMLImageElement;
      text: string;
      x: number;
      y: number;
    }
  | null;

type BaseComment = {
  id: string;
  comment: string;
  text: string;
  y: number;
  page: string;
};

type ImageComment = BaseComment & {
  type: "IMAGE";
  src: string;
};

type TextComment = BaseComment & {
  type: "TEXT";
};

type Comment = ImageComment | TextComment;

// --- Component ---
export default function HighlightComments(): JSX.Element {
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  const [addCommentAPIURL, setAddCommentAPIURL] = useState<
    string | undefined
  >();
  const [currentPage, setCurrentPage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAddCommentAPIURL(
        (window as any).__HIGHLIGHT_COMMENTS_CONFIG__?.commentApiUrl
      );
      setCurrentPage(window.location.pathname);
    }
  }, []);

  // Restore saved comments (if needed)
  useEffect(() => {
    // const saved = localStorage.getItem("highlight-comments");
    // if (saved) setComments(JSON.parse(saved));
  }, []);

  // Save to localStorage on update
  useEffect(() => {
    localStorage.setItem("highlight-comments", JSON.stringify(comments));
  }, [comments]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setSelectionInfo(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const contents = range.cloneContents();

    const img = contents.querySelector?.("img") as HTMLImageElement | null;
    let selectedNode: HTMLImageElement | null = null;

    if (img) {
      const allImages = Array.from(
        document.querySelectorAll("img")
      ) as HTMLImageElement[];
      for (const domImg of allImages) {
        if (domImg.src === img.src) {
          selectedNode = domImg;
          break;
        }
      }
    }

    if (selectedNode) {
      setSelectionInfo({
        type: "IMAGE",
        node: selectedNode,
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        text: selectedNode.alt?.trim() || "[Image]",
      });
    } else {
      const text = selection.toString().trim();
      if (text) {
        setSelectionInfo({
          type: "TEXT",
          text,
          range: range.cloneRange(),
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
        });
      } else {
        setSelectionInfo(null);
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const handleAddComment = useCallback(async () => {
    if (!selectionInfo) return;

    const comment = prompt("Enter your comment:");
    if (!comment) {
      setSelectionInfo(null);
      return;
    }

    const newId = crypto.randomUUID();
    const base: BaseComment = {
      id: newId,
      comment,
      text: selectionInfo.text,
      y: selectionInfo.y,
      page: currentPage,
    };

    let newComment: Comment;

    if (selectionInfo.type === "IMAGE") {
      const imageNode = selectionInfo.node;
      if (!imageNode || imageNode.parentElement?.dataset.commentId) {
        setSelectionInfo(null);
        return;
      }

      newComment = {
        ...base,
        type: "IMAGE",
        src: imageNode.src,
      };

      const wrapper = document.createElement("span");
      wrapper.className = styles.highlightedImage;
      wrapper.setAttribute("data-comment-id", newId);

      imageNode.parentNode?.insertBefore(wrapper, imageNode);
      wrapper.appendChild(imageNode);
    } else {
      newComment = {
        ...base,
        type: "TEXT",
      };

      if (!selectionInfo.range) {
        console.warn("Missing range for text selection");
        return;
      }

      try {
        const span = document.createElement("span");
        span.setAttribute("data-comment-id", newId);
        span.className = styles.highlightedText;
        selectionInfo.range.surroundContents(span);
      } catch (error) {
        console.error("Error applying highlight:", error);
        alert("Unable to add a comment to this selection.");
        setSelectionInfo(null);
        return;
      }
    }

    try {
      const resp = await fetch(addCommentAPIURL || "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComment),
      });
      console.log(resp);
      setComments((prev) => [...prev, newComment]);
    } catch (error) {
      console.error("Failed to save comment:", error);
      alert("Could not save comment online");
      setComments((prev) => [...prev, newComment]);
    }

    setSelectionInfo(null);
  }, [selectionInfo, currentPage]);

  const pageComments = comments.filter((c) => c.page === currentPage);

  // Restore highlights
  useEffect(() => {
    pageComments.forEach((c) => {
      if (document.querySelector(`[data-comment-id="${c.id}"]`)) return;

      if (c.type === "IMAGE") {
        const imageNode = document.querySelector(
          `img[src="${c.src}"]`
        ) as HTMLImageElement | null;

        if (imageNode && !imageNode.parentElement?.dataset.commentId) {
          const wrapper = document.createElement("span");
          wrapper.className = styles.highlightedImage;
          wrapper.setAttribute("data-comment-id", c.id);
          imageNode.parentNode?.insertBefore(wrapper, imageNode);
          wrapper.appendChild(imageNode);
        }
      } else {
        const walker = document.createTreeWalker(
          document.querySelector("main") || document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) =>
              node.nodeValue?.includes(c.text)
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_SKIP,
          }
        );

        let node: Text | null;
        while ((node = walker.nextNode() as Text | null)) {
          const index = node.nodeValue?.indexOf(c.text) ?? -1;
          if (index !== -1 && node.parentElement) {
            if (node.parentElement.dataset.commentId) continue;

            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + c.text.length);

            const span = document.createElement("span");
            span.setAttribute("data-comment-id", c.id);
            span.className = styles.highlightedText;

            range.surroundContents(span);
            break;
          }
        }
      }
    });
  }, [pageComments]);

  const getCommentPositions = (comments: Comment[]) => {
    const sorted = [...comments].sort((a, b) => a.y - b.y);
    let lastY = 0;
    return sorted.map((c) => {
      let top = c.y - 180;
      if (top < lastY) {
        top = lastY;
      }
      lastY = top + COMMENT_CARD_HEIGHT + COMMENT_CARD_SPACING;
      return { ...c, top };
    });
  };

  const positionedComments = getCommentPositions(pageComments);

  return (
    <div className={styles.wrapper}>
      {selectionInfo &&
        createPortal(
          <button
            onClick={handleAddComment}
            style={{
              position: "absolute",
              top: selectionInfo.y - 40,
              left: selectionInfo.x,
              background: "#facc15",
              padding: "4px 8px",
              borderRadius: "4px",
              cursor: "pointer",
              zIndex: 9999,
              fontWeight: "bold",
              border: "1px solid #888",
            }}
          >
            💬 Add Comment
          </button>,
          document.body
        )}

      <div className={styles.sidebar}>
        <div className={styles.commentLayer}>
          {positionedComments.length === 0 ? (
            <p>No comments yet.</p>
          ) : (
            positionedComments.map((c) => (
              <div
                key={c.id}
                className={styles.commentCard}
                style={{ top: `${c.top}px` }}
                onMouseEnter={() => {
                  document
                    .querySelector(`[data-comment-id="${c.id}"]`)
                    ?.classList.add(styles.hovered);
                }}
                onMouseLeave={() => {
                  document
                    .querySelector(`[data-comment-id="${c.id}"]`)
                    ?.classList.remove(styles.hovered);
                }}
                onClick={() => {
                  document
                    .querySelector(`[data-comment-id="${c.id}"]`)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                <p>
                  <strong>“{c.text}”</strong>
                </p>
                <p>{c.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
