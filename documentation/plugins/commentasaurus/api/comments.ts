import { BaseComment, Comment } from "../types";

export async function getComments(
  apiUrl: string,
  org: string,
  repoName: string,
  repoId: string,
  categoryId: string,
  page: string
): Promise<{ comments?: Comment[]; error?: string }> {
  try {
    const encodedPage = encodeURIComponent(page);
    const res = await fetch(
      `${apiUrl}/${org}/${repoName}/${encodedPage}/comments?category_id=${categoryId}&repo_id=${repoId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }

    const data = await res.json();
    console.log(data);

    if (data == null) {
      return {
        comments: [],
      };
    }

    return {
      comments: data,
    };
  } catch (e) {
    console.log(e);
    return { error: e };
  }
}

export async function createComment(
  apiUrl: string,
  org: string,
  repoName: string,
  repoId: string,
  categoryId: string,
  page: string,
  comment: BaseComment
): Promise<{ id?: string; error?: string }> {
  try {
    const encodedPage = encodeURIComponent(page);
    const res = await fetch(
      `${apiUrl}/${org}/${repoName}/${encodedPage}/comments?category_id=${categoryId}&repo_id=${repoId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }

    const data = await res.json();

    return { id: data };
  } catch (e) {
    console.log("Create Comment: " + e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function resolveComment(
  apiUrl: string,
  org: string,
  repoName: string,
  repoId: string,
  categoryId: string,
  page: string,
  comment: BaseComment
): Promise<{ error?: string }> {
  try {
    const encodedPage = encodeURIComponent(page);
    const res = await fetch(
      `${apiUrl}/${org}/${repoName}/${encodedPage}/comments?category_id=${categoryId}&repo_id=${repoId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: comment.id,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }

    return {};
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
