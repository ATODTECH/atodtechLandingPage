import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { AiAutomationOverview } from "@/components/sections/ai-automation-overview";
import { Cta } from "@/components/sections/cta";

export const metadata: Metadata = {
	title: "AI Automation | ATOD Tech Agency",
	description:
		"ATOD identifies repetitive, slow, or error-prone activities and designs practical, secure automations around them — from customer-support assistants to intelligent dashboards.",
};

export default function AiAutomationPage() {
	return (
		<main className="relative bg-page">
			<Header />
			<AiAutomationOverview />
			<Cta />
			<Footer />
		</main>
	);
}
