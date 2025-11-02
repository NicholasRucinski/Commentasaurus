import { API_URL, User } from "../types";

export async function getUser(): Promise<{
  user?: User;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_URL}/me`, {
      credentials: "include",
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }
    const data = await res.json();

    if (!data) {
      return { user: null };
    }

    return { user: data.user };
  } catch (e) {
    console.log(e);
    return { error: e };
  }
}
