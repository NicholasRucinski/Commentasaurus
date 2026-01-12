import { useCallback, useEffect, useRef, useState } from "react";
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
import { CommentsContext, useComments } from "../../hooks/useComments";
import { BottomDrawer, CommentsPanel } from "../CommentsDrawer";

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
  const {
    comments,
    draftComment,
    setDraftComment,
    setComments,
    clearSelection,
  } = useComments();
  const [showSide, setShowSidebar] = useState<boolean>(true);

  const { apiUrl, repoOwner, repoName, repoID, repoCategoryId } =
    useCommentasaurusConfig();

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
          handleAddComment={handleAddComment}
          onResolveComment={onResolveComment}
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
  const [mounted, setMounted] = useState(false);
  const { contentRef, canComment, setDraftComment, selectionInfo, setOpen } =
    useComments();

  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectionInfo) return;
    console.log(selectionInfo);
  }, [selectionInfo]);

  if (!mounted) return <MDXContent>{children}</MDXContent>;

  return (
    <div ref={contentRef} className={styles.content}>
      {canComment &&
        selectionInfo &&
        createPortal(
          <div
            className={styles.portalWrapper}
            style={{
              position: "fixed",
              top: selectionInfo.y - window.scrollY - 48,
              left: selectionInfo.x - window.scrollX,
              zIndex: 1000,
              pointerEvents: "none",
            }}
          >
            <button
              className={styles.portal}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (!selectionInfo) return;

                const draft: PositionedComment = {
                  id: crypto.randomUUID(),
                  page: window.location.pathname,
                  y: selectionInfo.y,
                  comment: "",
                  contextBefore: selectionInfo.contextBefore,
                  text: selectionInfo.text,
                  contextAfter: selectionInfo.contextAfter,
                  top: selectionInfo.y - 270,
                  resolved: false,
                  user: user.name,
                  createdAt: Date.now().toString(),
                };
                setOpen(true);
                setDraftComment(draft);
              }}
              aria-label="Add comment to selection"
            >
              <span className={styles.portalText}>Add comment</span>
            </button>
          </div>,
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
    // if (!contentRef.current) return;

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
