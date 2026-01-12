import { useCallback } from "react";
import { Drawer } from "vaul";
import { createComment, resolveComment } from "../../api/comments";
import { useComments } from "../../hooks/useComments";
import { useCommentasaurusConfig } from "../../hooks/useConfig";
import { BaseComment } from "../../types";
import CommentCard from "../CommentCard";
import DraftComment from "../DraftCommentCard";
import styles from "./styles.module.css";
import { Comment } from "../../types";

export function BottomDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className={styles.drawerOverlay} />

        <Drawer.Content className={styles.drawer}>
          <div className={styles.drawerHandleContainer}>
            <div className={styles.drawerHandle} />
          </div>
          <header className={styles.drawerHeader}>
            <Drawer.Title className={styles.drawerTitle}>Comments</Drawer.Title>
            <button
              className={styles.drawerButton}
              onClick={onClose}
              aria-label="Close comments"
            >
              ✕
            </button>
          </header>
          <div className={styles.drawerBody}>{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function CommentsPanel() {
  const {
    comments,
    draftComment,
    setDraftComment,
    setComments,
    clearSelection,
  } = useComments();

  const {
    apiUrl,
    autoShowComments,
    repoOwner,
    repoName,
    repoID,
    repoCategoryId,
    commentPermission,
  } = useCommentasaurusConfig();

  const handleAddComment = useCallback(
    async (draft: BaseComment) => {
      const { id, error } = await createComment(
        apiUrl,
        repoOwner,
        repoName,
        repoID,
        repoCategoryId,
        window.location.pathname,
        draft
      );
      if (!id || error) {
        console.error("error creating comment: ", error);

        setDraftComment(null);
        clearSelection();
        return;
      }
      if (!draft.comment.trim()) return;
      const newComment: Comment = { id: id, ...draft, type: "TEXT" };
      setComments((prev) => [...prev, newComment]);
      setDraftComment(null);
      clearSelection();
    },
    [clearSelection]
  );

  const onResolveComment = (comment: BaseComment) => {
    const resolve = async () => {
      const { error } = await resolveComment(
        apiUrl,
        repoOwner,
        repoName,
        repoID,
        repoCategoryId,
        window.location.pathname,
        comment
      );
      if (error) {
      }
    };
    resolve();
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
  };

  return (
    <>
      {draftComment && (
        <DraftComment
          draftComment={draftComment}
          onCommentChange={setDraftComment}
          onSubmit={handleAddComment}
        />
      )}
      {comments.length === 0 && !draftComment && (
        <div className={styles.emptyState}>
          <p>No comments yet :(</p>
        </div>
      )}
      {comments.map((c) => (
        <CommentCard
          key={c.id}
          card={c}
          onResolve={() => onResolveComment(c)}
        />
      ))}
    </>
  );
}
