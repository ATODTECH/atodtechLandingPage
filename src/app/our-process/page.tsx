import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Cta } from "@/components/sections/cta";
import { DevelopmentProcess } from "@/components/sections/development-process";

export const metadata: Metadata = {
	title: "Our Process | ATOD Tech Agency",
	description:
		"How we translate your ideas into robust, production-ready systems — from discovery and definition through build, testing, deployment, and ongoing support.",
};

export default function OurProcessPage() {
	return (
		<main className="relative bg-page">
			<Header />
			<DevelopmentProcess />
			<Cta />
			<Footer />
		</main>
	);
}
