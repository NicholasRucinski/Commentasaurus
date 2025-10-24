import { useCallback, useEffect, useState } from "react";
import { SelectionInfo } from "../../types";

export function useSelection() {
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
          text: selectedNode.alt?.trim() || "[Image]",
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
      text,
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
