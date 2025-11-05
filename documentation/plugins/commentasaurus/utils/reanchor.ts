import { Comment } from "../types";

export function reanchorComments(
  comments: Comment[],
  rootNode: Node | null
): Comment[] {
  return comments.map((comment) => {
    if (!comment.text) return comment;

    const y = findTextPosition(comment, rootNode);
    if (!y) return comment;

    return {
      ...comment,
      y: y,
    };
  });
}

function findTextPosition(
  comment: Comment,
  rootNode: Node | null
): number | null {
  const { contextBefore, text, contextAfter } = comment;
  const before = contextBefore?.trim() || "";
  const middle = text?.trim() || "";
  const after = contextAfter?.trim() || "";

  if (!middle) return null;

  const allTextNodes = getAllTextNodes(rootNode);

  const searchVariants = [
    { full: `${before} ${middle} ${after}`.trim(), match: middle },
    { full: `${before} ${middle}`.trim(), match: middle },
    { full: `${middle} ${after}`.trim(), match: middle },
    { full: middle, match: middle },
  ];

  for (const node of allTextNodes) {
    if (node.parentElement?.closest("#comment-sidebar")) {
      continue;
    }
    const textContent = node.textContent || "";

    for (const { full, match } of searchVariants) {
      let startIndex = 0;
      while (true) {
        const index = textContent.indexOf(full, startIndex);
        if (index === -1) break;

        const middleIndex = full.indexOf(match);
        const start = index + middleIndex;
        const end = start + match.length;

        try {
          const range = document.createRange();
          range.setStart(node, start);
          range.setEnd(node, end);
          const rect = range.getBoundingClientRect();

          if (checkContextAroundNode(node, before, after)) {
            return rect.top + window.scrollY;
          }
        } catch {
          // Skip
        }

        startIndex = index + full.length;
      }
    }
  }

  return null;
}

function getAllTextNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let n: Text | null;
  while ((n = walker.nextNode() as Text | null)) {
    if (n.textContent && n.textContent.trim().length > 0) {
      nodes.push(n);
    }
  }
  return nodes;
}

function checkContextAroundNode(
  node: Text,
  before: string,
  after: string
): boolean {
  const parentText = node.parentElement?.textContent || "";
  const hasBefore = before ? parentText.includes(before.slice(-10)) : true;
  const hasAfter = after ? parentText.includes(after.slice(0, 10)) : true;
  return hasBefore && hasAfter;
}
