import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Cta } from "@/components/sections/cta";
import { OurMission } from "@/components/sections/our-mission";
import { VisionApproach } from "@/components/sections/vision-approach";
import { WhoWeAre } from "@/components/sections/who-we-are";
import { PageHero } from "@/components/shared/page-hero";

export const metadata: Metadata = {
	title: "About Us | ATOD Tech Agency",
	description:
		"We design and develop websites, mobile apps, and software that bring your ideas to life.",
};

export default function AboutPage() {
	return (
		<main className="relative">
			<Header />
			<PageHero
				title="Discover Our Mission And Values In Digital Product Building"
				description="We design and develop websites, mobile apps, and software that bring your ideas to life."
				action={{ label: "Contact Us", href: "/contact" }}
				titleClassName="lg:text-[64px] lg:leading-[79px]"
			/>
			<WhoWeAre />
			<OurMission />
			<VisionApproach />
			<Cta />
			<Footer />
		</main>
	);
}
