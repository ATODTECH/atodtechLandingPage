import type { StaticImageData } from "next/image";

import {
	cyberShot1,
	cyberShot2,
	cyberShot3,
	phoneMockup1,
	phoneMockup2,
	phoneMockup3,
	projectCyberdependency,
	projectPickup,
	projectSabiwork,
} from "@/assets";

/** A bullet, optionally with a bold lead-in ahead of the sentence. */
export type CaseStudyItem = string | { lead: string; text: string };

export type CaseStudySlide = {
	label: string;
	body?: string;
	items?: CaseStudyItem[];
};

export type CaseStudyTheme = {
	/** `navy` is a coloured panel with white copy; `light` is white with dark copy. */
	tone: "navy" | "light";
	/** Badge, title, dots and nav colour. Only the `light` tone uses it. */
	accent?: string;
};

/**
 * `device` keeps screens at their natural height. `page` is for long website
 * scrolls: they are pinned to the top of a fixed frame and cropped at the
 * bottom, so you read the top of the page instead of a shrunken sliver.
 */
export type GalleryLayout = "device" | "page";

export type Project = {
	slug: string;
	name: string;
	category: string;
	image: StaticImageData;
	caseStudyTitle: string;
	theme: CaseStudyTheme;
	galleryLayout: GalleryLayout;
	mockups: StaticImageData[];
	slides: CaseStudySlide[];
};

export const projects: Project[] = [
	{
		slug: "sabiwork",
		name: "Sabiwork App",
		category: "Artisan Platform",
		image: projectSabiwork,
		caseStudyTitle: "Sabiwork - Artisan Platform",
		theme: { tone: "navy" },
		galleryLayout: "device",
		mockups: [phoneMockup2, phoneMockup3, phoneMockup1],
		slides: [
			{
				label: "Overview",
				body: "Sabiwork is a sleek, modern mobile application built to connect homeowners with verified, high-quality artisans for urgent plumbing, electrical, and maintenance services. We solved the confidence gap with upfront pricing transparency, detailed rating structures, and real-time live mapping.",
			},
			{
				label: "Challenges",
				body: "Finding reliable artisans is often time-consuming and stressful. Customers face issues with trust, availability, and quality of work. On the other side, skilled artisans often lack visibility and opportunities to showcase their skills to a wider audience.",
			},
			{
				label: "Solutions",
				items: [
					"Makes it easy for customers to discover, book, and review artisans.",
					"Provides artisans with more visibility and consistent job opportunities.",
					"Ensures trust and reliability through a rating and review system.",
				],
			},
			{
				label: "Key Features",
				items: [
					"Browse artisans by category (plumbing, electrical, carpentry).",
					"Schedule services at your convenience.",
					"Seamless communication between users and artisans.",
					"Pay directly through the app.",
				],
			},
		],
	},
	{
		slug: "cyberdependency",
		name: "Cyberdependency",
		category: "Educational Platform",
		image: projectCyberdependency,
		caseStudyTitle: "Cyberdependency - Educational Platform",
		theme: { tone: "light", accent: "#089fe3" },
		galleryLayout: "page",
		mockups: [cyberShot1, cyberShot2, cyberShot3],
		slides: [
			{
				label: "Overview",
				body: "Cyber Dependency is an IT service platform that requires a new, modernized website to replace its existing one while retaining the same domain name. The goal is to enhance user experience, improve accessibility, and provide dedicated section for key services such as IT training, software development, subcontracting, and business security.",
			},
			{
				label: "Challenges",
				body: "Many businesses struggle to find qualified IT professionals like cyber security officer to protect their digital assets, while aspiring IT professionals often lack access to structured, practical, and affordable IT education. Existing platforms typically focus on either IT services or online learning, forcing users to switch between multiple platforms to meet their needs.",
			},
			{
				label: "Solutions",
				items: [
					{
						lead: "Unified Digital Platform:",
						text: "We designed a single platform where businesses can hire qualified IT professionals while individuals can learn in-demand tech skills through structured live training programs.",
					},
					{
						lead: "Interactive Learning Experience:",
						text: "We created an engaging learning environment with live sessions, video lessons, progress tracking, assessments, certifications, and easy access to course resources.",
					},
					{
						lead: "Simple & User-Centered Experience:",
						text: "We built an intuitive interface that makes it easy to explore services, enroll in courses, manage learning, and connect with IT experts from one place.",
					},
				],
			},
			{
				label: "Key Features",
				items: [
					"Modern and attractive landing page.",
					"Well structured sections for different service offerings.",
					"Secure user inquiry handling.",
					"Admin panel for managing student records and uploading class recordings.",
				],
			},
		],
	},
	{
		slug: "pickup",
		name: "Pickup App",
		category: "Interstate Travel",
		image: projectPickup,
		caseStudyTitle: "Pickup - Interstate Travel",
		theme: { tone: "navy" },
		galleryLayout: "device",
		mockups: [projectPickup],
		slides: [
			{
				label: "Overview",
				body: "Case study copy for Pickup is still being written. Add the project overview here.",
			},
			{
				label: "Challenges",
				body: "Add the problems this project set out to solve.",
			},
			{
				label: "Solutions",
				items: ["Add the first solution.", "Add the second solution."],
			},
			{
				label: "Key Features",
				items: [
					"Add the first key feature.",
					"Add the second key feature.",
				],
			},
		],
	},
];
