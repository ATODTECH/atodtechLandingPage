import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Cta } from "@/components/sections/cta";
import { IndustryMarquee } from "@/components/sections/industry-marquee";
import { PageHero } from "@/components/shared/page-hero";

export const metadata: Metadata = {
	title: "Industries | ATOD Tech Agency",
	description:
		"Custom software solutions engineered to drive automation, digital transformation, and accelerated growth across both specialized and large-scale global sectors.",
};

export default function IndustriesPage() {
	return (
		<main className="relative">
			<Header />
			<PageHero
				title="Industries We Serve"
				description="Custom software solutions engineered to drive automation, digital transformation, and accelerated growth across both specialized and large-scale global sectors."
				contentClassName="pt-40 pb-10 md:pb-10 lg:pt-46 lg:pb-14"
				descriptionClassName="lg:max-w-256"
			/>
			<IndustryMarquee />
			<Cta />
			<Footer />
		</main>
	);
}
