import type { Metadata } from "next";
import { ArrowDown } from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Cta } from "@/components/sections/cta";
import { SolutionCatalog } from "@/components/sections/solution-catalog";
import { PageHero } from "@/components/shared/page-hero";
import { SplitBadge } from "@/components/shared/split-badge";

export const metadata: Metadata = {
	title: "Solutions | ATOD Tech Agency",
	description:
		"From complex transactional multi-sided marketplaces to high-reliability healthcare systems, we architect and deploy robust, tailored digital solutions.",
};

export default function SolutionsPage() {
	return (
		<main className="relative">
			<Header />
			<PageHero
				title="Software Solutions We've Built"
				description="From complex transactional multi-sided marketplaces to high-reliability healthcare systems, we architect and deploy robust, tailored digital solutions."
				contentClassName="pt-40 pb-24 md:pb-24 lg:pt-46 lg:pb-36.5"
				badge={
					<SplitBadge label="CAPABILITIES">
						<span className="inline-flex items-center gap-1.5">
							Comprehensive Digital Agency Services
							<ArrowDown className="size-4 shrink-0" aria-hidden />
						</span>
					</SplitBadge>
				}
				action={{ label: "Turn Your Idea Into a Product", href: "/contact" }}
			/>
			<SolutionCatalog />
			<Cta />
			<Footer />
		</main>
	);
}
