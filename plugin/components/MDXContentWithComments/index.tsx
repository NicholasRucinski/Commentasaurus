import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PositionedComment, Comment, BaseComment } from "../../types";
import { useSelection } from "../../hooks/useSelection";
import { useUser } from "../../contexts/UserContext";
import { useCommentasaurusConfig } from "../../hooks/useConfig";
import { isUserAllowed } from "../../api/user";
import { createComment, getComments, resolveComment } from "../../api/comments";
import { reanchorComments } from "../../utils/reanchor";
import { restoreHighlights } from "../../utils/highlights";
import CommentsSidebar from "../CommentSidebar";
import MDXContent from "@theme/MDXContent";
import styles from "./styles.module.css";
import { createPortal } from "react-dom";
import type { Props } from "@theme/DocItem/Content";

export default function ContentWithComments({ children }: Props) {
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
  const [canComment, setCanComment] = useState<boolean>(false);
  const [canSeeComments, setCanSeeComments] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(autoShowComments);

  useEffect(() => {
    const fetchData = async (rootNode: HTMLElement | null) => {
      const { allowed, error: permError } = await isUserAllowed(
        apiUrl,
        repoOwner,
        repoName,
        user,
        commentPermission
      );

      if (permError) {
        console.error("Permission check failed:", permError);
        return;
      }

      setCanComment(allowed);
      setCanSeeComments(allowed);

      if (allowed) {
        const { comments: loadedComments, error: loadError } =
          await getComments(
            apiUrl,
            repoOwner,
            repoName,
            repoID,
            repoCategoryId,
            window.location.pathname,
            commentPermission
          );

        if (loadError) {
          console.error("Failed to load comments:", loadError);
          return;
        }
        setRawComments(loadedComments);
        const anchored = reanchorComments(loadedComments, rootNode);
        setComments(anchored);
      }
    };
    if (contentRef.current) {
      fetchData(contentRef.current);
    }
  }, [window.location.pathname, user, contentRef.current]);

  useEffect(() => {
    restoreHighlights(comments);
  }, [comments, contentRef.current]);

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

  const handleAddCommentClick = useCallback(() => {
    if (!selectionInfo) return;
    if (!showSidebar) setShowSidebar(true);
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
    setDraftComment(draft);
  }, [selectionInfo]);

  const handleSetShowSidebar = useCallback(
    (show: boolean) => {
      setShowSidebar(show);

      if (show) {
        setComments([]);

        setTimeout(() => {
          setComments(reanchorComments(rawComments, contentRef.current));
        }, 25);
      }
    },
    [rawComments, contentRef]
  );

  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      <div style={{ flex: 1 }} ref={contentRef}>
        <>
          {canComment && (
            <>
              {selectionInfo &&
                createPortal(
                  <button
                    onClick={handleAddCommentClick}
                    className={styles.portal}
                    style={{
                      top: selectionInfo.y - 40,
                      left: selectionInfo.x,
                    }}
                  >
                    Add Comment
                  </button>,
                  document.body
                )}
            </>
          )}
        </>
        <MDXContent>{children}</MDXContent>
      </div>

      <div className={styles.commentSidebar}>
        <CommentsSidebar
          canSeeComments={canSeeComments}
          showSidebar={showSidebar}
          draftComment={draftComment}
          comments={comments}
          setShowSidebar={handleSetShowSidebar}
          setDraftComment={setDraftComment}
          handleAddComment={handleAddComment}
          onResolveComment={onResolveComment}
        />
      </div>
    </div>
  );
}
