import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Cta } from "@/components/sections/cta";
import { ServiceCatalog } from "@/components/sections/service-catalog";
import { PageHero } from "@/components/shared/page-hero";
import { SplitBadge } from "@/components/shared/split-badge";

export const metadata: Metadata = {
	title: "Our Services | ATOD Tech Agency",
	description:
		"Custom software, mobile applications, web platforms, AI automation, and product design for startups, businesses, institutions, and public-sector organizations.",
};

export default function ServicesPage() {
	return (
		<main className="relative">
			<Header />
			<PageHero
				title="Our Services"
				description="ATOD designs and develops custom software, mobile applications, AI-powered automation, websites, and information systems for startups, businesses, institutions, and public-sector organizations."
				badge={
					<SplitBadge label="CAPABILITIES">
						Comprehensive Digital Agency Services
					</SplitBadge>
				}
				action={{ label: "Contact Us", href: "/contact" }}
			/>
			<ServiceCatalog />
			<Cta />
			<Footer />
		</main>
	);
}
