import { User } from "../types";

export async function getUser(apiUrl: string): Promise<{
  user?: User;
  error?: string;
}> {
  try {
    const res = await fetch(`${apiUrl}/me`, {
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

export async function isUserAllowed(
  apiUrl: string,
  user: User,
  repoName: string
): Promise<{
  allowed?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(`${apiUrl}//config`, {
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
      return { allowed: false };
    }

    return { allowed: data };
  } catch (e) {
    console.log(e);
    return { error: e };
  }
}
