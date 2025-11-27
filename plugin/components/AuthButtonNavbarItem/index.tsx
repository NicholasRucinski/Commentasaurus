import React from "react";
import styles from "./styles.module.css";
import { User } from "../../types";
import { useUser } from "../../contexts/UserContext";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { useCommentasaurusConfig } from "../../hooks/useConfig";

export default function AuthButtonNavbarItem() {
	const { user, setUser } = useUser();

	const { apiUrl } = useCommentasaurusConfig();

	const handleSignOut = () => {
		setUser(null);
	};

	const handleSignIn = () => {
		const redirectUri = encodeURIComponent(window.location.href);
		window.location.href = `${apiUrl}/auth?redirect_uri=${redirectUri}`;
	};

	return (
		<>
			{user ? (
				<UserImage user={user} handleSignOut={handleSignOut} />
			) : (
				<SignInButton handleSignIn={handleSignIn} />
			)}
		</>
	);
}

const UserImage = ({
	user,
	handleSignOut,
}: {
	user: User;
	handleSignOut: () => void;
}) => {
	return (
		<a
			onClick={handleSignOut}
			aria-label="Sign out"
			className={styles.userInfo}
		>
			<img src={user.avatar_url} alt={`${user.name}'s avatar`} />
		</a>
	);
};

const SignInButton = ({ handleSignIn }: { handleSignIn: () => void }) => {
	return (
		<button
			type="button"
			onClick={handleSignIn}
			className={styles.githubBtn}
			aria-label="Sign in with GitHub"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				className={styles.githubIcon}
			>
				<path
					fill="currentColor"
					d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2.1c-3.2.7-3.8-1.4-3.8-1.4-.6-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1.9 1.7 2.4 1.2 3 .9.1-.7.3-1.2.6-1.5-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3 0 0 1-.3 3.3 1.2a11.2 11.2 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.5.2 2.7.1 3 .8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.3.7.9.7 1.8v2.6c0 .3.2.7.8.6a10.9 10.9 0 0 0 7.9-10.9C23.5 5.6 18.35.5 12 .5Z"
				/>
			</svg>
			<span>Sign in with GitHub</span>
		</button>
	);
};
