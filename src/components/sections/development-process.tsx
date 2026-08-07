import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { RevealGroup, RevealItem } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

type Step = {
	title: string;
	description: string;
	/** The one step the design calls out in accent orange. */
	highlight?: boolean;
};

const steps: Step[] = [
	{
		title: "Discover",
		description:
			"Understand the business, users, problem, goals, risks, and success measures.",
	},
	{
		title: "Enhance",
		description:
			"Use the Product Intelligence & Innovation Team to identify stronger features, automation, monetization, and scalability opportunities.",
		highlight: true,
	},
	{
		title: "Define",
		description:
			"Prepare scope, requirements, workflows, architecture, milestones, assumptions, and deliverables.",
	},
	{
		title: "Design",
		description:
			"Create user journeys, wireframes, prototypes, interfaces, and design systems.",
	},
	{
		title: "Build",
		description:
			"Develop the web, mobile, backend, database, APIs, integrations, and dashboards.",
	},
	{
		title: "Test",
		description:
			"Validate functionality, usability, security, compatibility, performance, and acceptance criteria.",
	},
	{
		title: "Deploy",
		description:
			"Configure hosting, domain, production environment, app stores, monitoring, and releases as agreed.",
	},
	{
		title: "Train and document",
		description:
			"Provide manuals, technical records, handover materials, and training.",
	},
	{
		title: "Support and improve",
		description: "Maintain, optimize, secure, and expand the product.",
	},
];

function StepCard({ index, title, description, highlight }: Step & { index: number }) {
	return (
		<article
			className={cn(
				"flex h-full flex-col gap-4 rounded-2xl border p-6",
				highlight
					? "border-brand-accent/50 bg-brand/10 shadow-[0_4px_12px_rgba(245,111,70,0.12)]"
					: "border-white/8 bg-white/2",
			)}
		>
			<div className="flex items-center gap-3">
				<span
					className={cn(
						"flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
						highlight ? "bg-brand-accent" : "bg-brand",
					)}
				>
					{String(index + 1).padStart(2, "0")}
				</span>
				<h3 className="text-lg font-semibold leading-6 text-white">{title}</h3>
			</div>
			<p className="text-[15px] leading-6 text-white/65">{description}</p>
		</article>
	);
}

export function DevelopmentProcess() {
	return (
		<section className="relative overflow-hidden">
			<div className="relative mx-auto w-full max-w-360 px-6 pb-10 pt-33 md:pb-20 lg:pt-45 xl:px-30">
				<RevealGroup className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
					<RevealItem direction="right" className="flex flex-col gap-2">
						<SectionHeading>Our Development Process</SectionHeading>
						<p className="text-base leading-6 text-white/65">
							How we translate your ideas into robust, production-ready systems.
						</p>
					</RevealItem>
					<RevealItem direction="left">
						<Link
							href="/services"
							className="group inline-flex shrink-0 cursor-pointer items-center gap-2 text-[15px] font-medium leading-5 text-brand-accent transition-colors hover:text-brand-accent/80"
						>
							See Software Development Service Catalogue
							<ArrowRight
								className="size-4 transition-transform group-hover:translate-x-0.5"
								aria-hidden
							/>
						</Link>
					</RevealItem>
				</RevealGroup>

				<RevealGroup
					stagger={0.08}
					className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
				>
					{steps.map((step, index) => (
						<RevealItem key={step.title} className="h-full">
							<StepCard index={index} {...step} />
						</RevealItem>
					))}
				</RevealGroup>
			</div>
		</section>
	);
}
