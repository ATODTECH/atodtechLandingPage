import type { Metadata } from "next";
import { ArrowDown } from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ConsultationCta } from "@/components/sections/consultation-cta";
import { Cta } from "@/components/sections/cta";
import { FaqAccordion } from "@/components/sections/faq-accordion";
import { PageHero } from "@/components/shared/page-hero";
import { SplitBadge } from "@/components/shared/split-badge";

export const metadata: Metadata = {
	title: "FAQs | ATOD Tech Agency",
	description:
		"Answers to common questions about our custom software development, integrations, automation, and post-launch support.",
};

export default function FaqsPage() {
	return (
		<main className="relative">
			<Header />
			<PageHero
				title="Frequently Asked Questions"
				description="Find answers to common questions about our custom software development, integrations, automation, and post-launch support."
				contentClassName="pt-40 pb-24 md:pb-24 lg:pt-60 lg:pb-47.5"
				badge={
					<SplitBadge label="Help Center">
						<span className="inline-flex items-center gap-1.5">
							We are here to help clarify the path
							<ArrowDown className="size-4 shrink-0" aria-hidden />
						</span>
					</SplitBadge>
				}
			/>
			<FaqAccordion />
			<ConsultationCta
				eyebrow="Still have questions?"
				heading="Let us talk. We will help you shape the project."
				description="Start with the problem you want to solve, the people you want to serve, or the process you want to improve. We are here to partner with you."
				action={{ label: "Contact Us", href: "/contact" }}
			/>
			<Cta />
			<Footer />
		</main>
	);
}
