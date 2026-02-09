import { useCallback, useEffect, useState } from "react";
import { SelectionInfo } from "../types";

export function useSelection(): {
  selectionInfo: SelectionInfo | null;
  clearSelection: () => void;
} {
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(
    null
  );

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

    const anchorNode = range.startContainer;
    const fullText =
      anchorNode.nodeType === Node.TEXT_NODE
        ? anchorNode.textContent || ""
        : anchorNode.textContent || "";

    const { before, after } = getContextWords(
      fullText,
      range.startOffset,
      range.endOffset
    );

    if (img) {
      const selectedNode = Array.from(document.querySelectorAll("img")).find(
        (node) => node.src === img.src
      ) as HTMLImageElement | undefined;

      if (selectedNode) {
        setSelectionInfo({
          type: "IMAGE",
          node: selectedNode,
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          contextBefore: before,
          text: selectedNode.alt?.trim() || "[Image]",
          contextAfter: after,
        });
      }
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      setSelectionInfo(null);
      return;
    }

    setSelectionInfo({
      type: "TEXT",
      contextBefore: before,
      text,
      contextAfter: after,
      range: range.cloneRange(),
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
    });
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  return { selectionInfo, clearSelection: () => setSelectionInfo(null) };
}

function getContextWords(
  fullText: string,
  selectionStart: number,
  selectionEnd: number
): { before: string; after: string } {
  const beforeText = fullText.slice(0, selectionStart).trim();
  const afterText = fullText.slice(selectionEnd).trim();

  const beforeWords = beforeText.split(/\s+/);
  const afterWords = afterText.split(/\s+/);

  return {
    before: beforeWords.slice(-5).join(" "),
    after: afterWords.slice(0, 5).join(" "),
  };
}
