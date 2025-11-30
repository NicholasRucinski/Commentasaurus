import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
	title: "Commentasaurus",
	tagline: "Dinosaurs are awesome",
	favicon: "img/favicon.ico",

	plugins: [
		[
			require.resolve("./plugins/commentasaurus"),
			{
				// The url for the API. Default is Localhost:8080
				apiUrl: "https://api.commentasaurus.nickrucinski.com",
				// Should the comment sidebar be shown by default
				autoShowComments: false,
				// Sets the permissions for who can comment
				// [anon] - Anonymous users can comment
				// [auth] - Only authenticated users can comment
				// [team] - Only people with access to the org can comment
				commentPermission: "anon",
				repoName: "Commentasaurus",
				repoOwner: "NicholasRucinski",
				repoID: "R_kgDOO_Stlg",
				repoCategoryId: "DIC_kwDOO_Stls4CxCMV",
			},
		],
	],

	themes: ["@docusaurus/theme-mermaid"],
	markdown: {
		mermaid: true,
	},

	// Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
	future: {
		v4: true, // Improve compatibility with the upcoming Docusaurus v4
	},

	// Set the production url of your site here
	url: "https://commentasaurus.nickrucinski.com",
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: "/",

	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "NicholasRucinski", // Usually your GitHub org/user name.
	projectName: "Commentasaurus", // Usually your repo name.

	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	presets: [
		[
			"@docusaurus/preset-classic",
			{
				docs: {
					routeBasePath: "/",
					sidebarPath: require.resolve("./sidebars.ts"),
					// Please change this to your repo.
					// Remove this to remove the "edit this page" links.
				},
				blog: false,
				theme: {
					customCss: require.resolve("./src/css/custom.css"),
				},
			} satisfies Preset.Options,
		],
	],

	themeConfig: {
		// Replace with your project's social card
		navbar: {
			title: "Commentasaurus",
			logo: {
				alt: "My Site Logo",
				src: "img/docusaurus.png",
			},
			items: [
				{
					type: "docSidebar",
					sidebarId: "docSidebar",
					position: "left",
					label: "Docs",
				},
				{
					type: "docSidebar",
					sidebarId: "tutorialSidebar",
					position: "left",
					label: "Tutorial",
				},

				{
					href: "https://github.com/NicholasRucinski/Commentasaurus",
					label: "GitHub",
					position: "right",
				},
				{ type: "custom-authButton", position: "right" },
			],
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Docs",
					items: [
						{
							label: "Tutorial",
							to: "/tutorial-basics/intro",
						},
					],
				},
				{
					title: "More",
					items: [
						{
							label: "GitHub",
							href: "https://github.com/facebook/docusaurus",
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
		},
	} satisfies Preset.ThemeConfig,
};

export default config;
