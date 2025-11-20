import { CommentPermission } from "..";
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

		if (res.status === 401) {
			return { user: undefined }
		}

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Error ${res.status}: ${text}`);
		}
		const data = await res.json();

		if (!data) {
			return { user: undefined };
		}

		return { user: data.user };
	} catch (e) {
		console.log(e);
		return { error: e };
	}
}

export async function isUserAllowed(
	apiUrl: string,
	org: string,
	repoName: string,
	user: User,
	permissionLevel: CommentPermission
): Promise<{
	allowed?: boolean;
	error?: string;
}> {
	try {
		const res = await fetch(`${apiUrl}/${org}/${repoName}/permissions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				user,
				permissionLevel,
			}),
		});

		if (res.status === 200) {
			return { allowed: true };
		} else if (res.status === 401) {
			return { allowed: false };
		} else {
			const text = await res.text();
			throw new Error(`Error ${res.status}: ${text}`);
		}
	} catch (e) {
		console.log(e);
		return { error: e };
	}
}
