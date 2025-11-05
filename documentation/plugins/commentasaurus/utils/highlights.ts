import styles from "../components/MDXContentWithComments/styles.module.css";
import { Comment } from "../types";

export function restoreHighlights(comments: Comment[]) {
  const activeIds = new Set(comments.map((c) => c.id));
  document.querySelectorAll("[data-comment-id]").forEach((el) => {
    const id = el.getAttribute("data-comment-id");
    if (!id || !activeIds.has(id)) {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
    }
  });

  comments.forEach((c) => {
    if (document.querySelector(`[data-comment-id="${c.id}"]`)) return;

    const walker = document.createTreeWalker(
      document.querySelector("main") || document.body,
      NodeFilter.SHOW_TEXT
    );

    let bestNode: Text | null = null;
    let smallestDelta = Infinity;

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const text = node.nodeValue ?? "";
      const index = text.indexOf(c.text);

      if (index !== -1 && node.parentElement) {
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + c.text.length);
        const rect = range.getBoundingClientRect();
        const nodeY = rect.top + window.scrollY;
        const delta = Math.abs(nodeY - c.y);

        if (delta < smallestDelta) {
          smallestDelta = delta;
          bestNode = node;
        }
      }
    }

    if (bestNode) {
      const index = bestNode.nodeValue!.indexOf(c.text);
      const range = document.createRange();
      range.setStart(bestNode, index);
      range.setEnd(bestNode, index + c.text.length);

      const span = document.createElement("span");
      span.setAttribute("data-comment-id", c.id);
      span.className = styles.highlightedText;
      range.surroundContents(span);
    }
  });
}
