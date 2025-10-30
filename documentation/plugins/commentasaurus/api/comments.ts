import { API_URL, BaseComment, Comment } from "../types";

export async function getComments(
  page: string
): Promise<{ comments?: Comment[]; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/comment?page=${page}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }

    const data = await res.json();

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
  comment: BaseComment
): Promise<{ error?: string }> {
  console.log(comment.contextBefore);
  try {
    const res = await fetch(`${API_URL}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comment),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }
    return {};
  } catch (e) {
    console.log("Create Comment: " + e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
