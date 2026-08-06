import { FancyButton } from "@/components/shared/fancy-button";
import { OverlineBadge } from "@/components/shared/overline-badge";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

const steps = [
	{
		title: "Discovery conversation",
		description:
			"We listen to the idea, challenge, opportunity, and desired outcome.",
	},
	{
		title: "Brainstorming and product clarification",
		description:
			"We explore users, workflows, revenue options, operational needs, risks, and alternatives.",
	},
	{
		title: "Product enhancement review",
		description:
			"Our Product Intelligence & Innovation Team recommends high-value features, automation opportunities, smarter workflows, and future-ready improvements.",
	},
	{
		title: "Scope and documentation",
		description:
			"We prepare requirements, user roles, user stories, workflows, feature priorities, assumptions, and a delivery roadmap.",
	},
	{
		title: "Design and prototype",
		description:
			"We create wireframes, user journeys, visual interfaces, and interactive prototypes where required.",
	},
	{
		title: "Development and integration",
		description:
			"We build the web platform, mobile app, backend, database, APIs, dashboards, and integrations.",
	},
	{
		title: "Testing, deployment, and training",
		description:
			"We validate the solution, launch it, document it, and train relevant users.",
	},
	{
		title: "Maintenance and growth",
		description: "We monitor, support, optimize, and build future phases.",
	},
];

function StepCard({
	index,
	title,
	description,
}: {
	index: number;
	title: string;
	description: string;
}) {
	const isBlue = index % 2 === 0;

	return (
		<div
			className={cn(
				"relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/2 p-6 sm:p-8",
				isBlue
					? "bg-[radial-gradient(120%_120%_at_0%_0%,rgba(30,51,138,0.32)_0%,rgba(30,51,138,0)_62%)]"
					: "bg-[radial-gradient(120%_120%_at_100%_100%,rgba(245,111,70,0.16)_0%,rgba(245,111,70,0)_62%)]",
			)}
		>
			<span
				className={cn(
					"flex size-10 items-center justify-center rounded-full text-sm font-semibold text-white",
					isBlue
						? "bg-linear-to-b from-[#3352c4] to-brand shadow-[0_0_20px_rgba(30,51,138,0.75)]"
						: "bg-linear-to-b from-[#f9814f] to-[#f4592c] shadow-[0_0_20px_rgba(245,111,70,0.6)]",
				)}
			>
				{String(index + 1).padStart(2, "0")}
			</span>
			<h3 className="mt-5 text-lg font-semibold leading-6.5 text-white">
				{title}
			</h3>
			<p className="mt-3 text-[15px] leading-[23px] text-white/65">
				{description}
			</p>
		</div>
	);
}

export function IdeaToProject() {
	return (
		<section id="approach" className="relative overflow-hidden">
			{/* <div
				aria-hidden
				className="grid-rules pointer-events-none absolute inset-0 [--grid-rule-gap:180px]"
			/> */}
			<div
				aria-hidden
				className="pointer-events-none absolute left-[8%] top-[15%] size-100 rounded-full bg-brand/18 blur-[120px]"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute right-[5%] top-[30%] size-112.5 rounded-full bg-brand-accent/10 blur-[130px]"
			/>

			<div className="relative mx-auto w-full max-w-360 px-6 py-10 md:py-20 xl:px-20">
				<RevealGroup className="mx-auto flex max-w-180 flex-col items-center gap-5 text-center">
					<RevealItem>
						<OverlineBadge>Our Methodology</OverlineBadge>
					</RevealItem>
					<RevealItem>
						<SectionHeading>
							Our Idea-to-Project Service
						</SectionHeading>
					</RevealItem>
					<RevealItem>
						<p className="text-lg leading-[27px] text-white/65">
							A structured, end-to-end blueprint designed to turn
							abstract concepts into enterprise-grade software
							with absolute transparency.
						</p>
					</RevealItem>
				</RevealGroup>

				<RevealGroup
					stagger={0.08}
					className="mt-10 grid gap-6 md:mt-16 lg:grid-cols-2"
				>
					{steps.map((step, index) => (
						<RevealItem key={step.title} className="h-full">
							<StepCard
								index={index}
								title={step.title}
								description={step.description}
							/>
						</RevealItem>
					))}
				</RevealGroup>

				<Reveal className="mt-10 md:mt-16">
					<div className="flex flex-col items-center justify-center gap-6 text-center sm:flex-row sm:gap-6">
						<p className="text-base font-semibold leading-5 text-white">
							Have a unique business case? Let&rsquo;s clarify the
							path together.
						</p>
						<FancyButton href="/contact">
							Schedule a Consultation
						</FancyButton>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
