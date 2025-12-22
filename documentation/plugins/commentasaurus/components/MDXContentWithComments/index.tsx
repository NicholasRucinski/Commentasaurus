import { useEffect, useRef, useState } from "react";
import { PositionedComment, Comment, BaseComment } from "../../types";
import { useSelection } from "../../hooks/useSelection";
import { useUser } from "../../contexts/UserContext";
import { useCommentasaurusConfig } from "../../hooks/useConfig";
import { useIsMobile } from "../../hooks/useIsMobile";
import { isUserAllowed } from "../../api/user";
import { createComment, getComments, resolveComment } from "../../api/comments";
import { reanchorComments } from "../../utils/reanchor";
import { restoreHighlights } from "../../utils/highlights";
import CommentsSidebar from "../CommentSidebar";
import MDXContent from "@theme/MDXContent";
import styles from "./styles.module.css";
import { createPortal } from "react-dom";
import type { Props } from "@theme/DocItem/Content";
import CommentCard from "../CommentCard";
import { CommentsContext, useComments } from "../../hooks/useComments";

export default function ContentWithComments({ children }: Props) {
  const isMobile = useIsMobile();

  return (
    <CommentsController>
      {isMobile ? (
        <MobileLayout>{children}</MobileLayout>
      ) : (
        <DesktopLayout>{children}</DesktopLayout>
      )}
    </CommentsController>
  );
}

function DesktopLayout({ children }: Props) {
  const { comments, draftComment, setDraftComment } = useComments();
  const [showSide, setShowSidebar] = useState<boolean>(true);
  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      <Content>{children}</Content>

      <div className={styles.commentSidebar}>
        <CommentsSidebar
          comments={comments}
          canSeeComments={true}
          showSidebar={showSide}
          setShowSidebar={setShowSidebar}
          draftComment={draftComment}
          setDraftComment={setDraftComment}
          handleAddComment={() => {}}
          onResolveComment={() => {}}
        />
      </div>
    </div>
  );
}

function MobileLayout({ children }: Props) {
  const { open, setOpen } = useComments();

  return (
    <>
      <Content>{children}</Content>

      <button
        className={styles.mobileCommentButton}
        onClick={() => setOpen(true)}
      >
        💬
      </button>

      <BottomDrawer open={open} onClose={() => setOpen(false)}>
        <CommentsPanel />
      </BottomDrawer>
    </>
  );
}

function Content({ children }: Props) {
  const { contentRef, canComment, selectionInfo, setDraftComment, setOpen } =
    useComments();

  const handleAddComment = () => {
    if (!selectionInfo) return;

    setOpen(true);

    setDraftComment({
      id: crypto.randomUUID(),
      page: window.location.pathname,
      comment: "",
      y: selectionInfo.y,
      contextBefore: "",
      text: selectionInfo.text,
      contextAfter: "",
      resolved: false,
      user: "me",
      createdAt: Date.now().toString(),
      top: 10,
    });
  };

  return (
    <div ref={contentRef} className={styles.content}>
      {canComment &&
        selectionInfo &&
        createPortal(
          <button
            className={styles.addCommentButton}
            style={{
              top: selectionInfo.y - 40,
              left: selectionInfo.x,
            }}
            onClick={handleAddComment}
          >
            Add comment
          </button>,
          document.body
        )}

      <MDXContent>{children}</MDXContent>
    </div>
  );
}

function CommentsController({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [rawComments, setRawComments] = useState<Comment[]>([]);
  const [draftComment, setDraftComment] = useState<PositionedComment | null>(
    null
  );

  const { selectionInfo, clearSelection } = useSelection();
  const { user } = useUser();

  const {
    apiUrl,
    autoShowComments,
    repoOwner,
    repoName,
    repoID,
    repoCategoryId,
    commentPermission,
  } = useCommentasaurusConfig();

  const [canComment, setCanComment] = useState(false);
  const [canSeeComments, setCanSeeComments] = useState(false);
  const [open, setOpen] = useState(autoShowComments);

  useEffect(() => {
    if (!contentRef.current) return;

    (async () => {
      const { allowed } = await isUserAllowed(
        apiUrl,
        repoOwner,
        repoName,
        user,
        commentPermission
      );

      setCanComment(allowed);
      setCanSeeComments(allowed);

      if (!allowed) return;

      const { comments } = await getComments(
        apiUrl,
        repoOwner,
        repoName,
        repoID,
        repoCategoryId,
        window.location.pathname,
        commentPermission
      );

      setRawComments(comments);
      setComments(reanchorComments(comments, contentRef.current));
    })();
  }, [user]);

  useEffect(() => {
    restoreHighlights(comments);
  }, [comments]);

  const value = {
    contentRef,

    comments,
    setComments,

    draftComment,
    setDraftComment,

    canComment,
    canSeeComments,

    open,
    setOpen,

    selectionInfo,
    clearSelection,
  };

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
}

function BottomDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return createPortal(
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHandle} />

        <header className={styles.drawerHeader}>
          <h2>Comments:</h2>
        </header>

        <div className={styles.drawerBody}>{children}</div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
}

function CommentsPanel() {
  const { comments, draftComment } = useComments();

  return (
    <>
      {draftComment && (
        <CommentCard card={draftComment as any} onResolve={() => {}} />
      )}

      {comments.map((c) => (
        <CommentCard key={c.id} card={c} onResolve={() => {}} />
      ))}
    </>
  );
}
