import {
	Code,
	Cpu,
	FileText,
	Globe,
	Headset,
	Link2,
	Smartphone,
	SwatchBook,
	type LucideIcon,
} from "lucide-react";

import { RevealGroup, RevealItem } from "@/components/shared/reveal";

type Service = {
	title: string;
	icon: LucideIcon;
	bullets: string[];
};

const leftColumn: Service[] = [
	{
		title: "Custom Software Development",
		icon: Code,
		bullets: [
			"Business management platforms",
			"Workflow and approval systems",
			"Administrative portals",
			"Customer and member portals",
			"Data collection and reporting systems",
			"Role-based information systems",
			"Legacy system modernization",
		],
	},
	{
		title: "Web Application Development",
		icon: Globe,
		bullets: [
			"Secure browser-based systems",
			"Subscription platforms",
			"Dashboards and analytics",
			"Multi-location portals",
			"Booking and reservation systems",
			"Online communities and service platforms",
		],
	},
	{
		title: "System Analysis and Documentation",
		icon: FileText,
		bullets: [
			"Business Requirement Documents",
			"Product Requirement Documents",
			"Software Requirement Specifications",
			"Functional and technical specifications",
			"User stories and acceptance criteria",
			"System architecture and database documentation",
			"API documentation",
			"User and administrator manuals",
			"Testing, deployment, and maintenance guides",
		],
	},
	{
		title: "System Integration",
		icon: Link2,
		bullets: [
			"Payment gateways",
			"SMS and email services",
			"Maps and GPS",
			"Accounting and CRM platforms",
			"Identity and authentication providers",
			"Cloud services",
			"Third-party APIs",
			"Data migration and synchronization",
		],
	},
];

const rightColumn: Service[] = [
	{
		title: "Mobile App Development",
		icon: Smartphone,
		bullets: [
			"Android applications",
			"iOS applications",
			"Cross-platform apps",
			"Customer-facing apps",
			"Internal workforce apps",
			"Educational, healthcare, logistics, booking, marketplace, and commerce apps",
		],
	},
	{
		title: "AI Automation",
		icon: Cpu,
		bullets: [
			"AI customer-service assistants",
			"Lead capture and qualification",
			"Document processing and data extraction",
			"Automated email and follow-up workflows",
			"Internal knowledge assistants",
			"AI-powered search",
			"Report generation",
			"Workflow and application integration",
			"Recommendation and decision-support systems",
		],
	},
	{
		title: "UI/UX and Product Design",
		icon: SwatchBook,
		bullets: [
			"User research",
			"User journeys",
			"Information architecture",
			"Wireframes",
			"Interactive prototypes",
			"Mobile and web interface design",
			"Dashboards and design systems",
			"Usability improvement and product redesign",
		],
	},
	{
		title: "Maintenance and Support",
		icon: Headset,
		bullets: [
			"Bug fixes and security updates",
			"Performance optimization",
			"Feature enhancements",
			"Infrastructure and deployment support",
			"Database maintenance",
			"Monitoring and backup planning",
			"System upgrades and modernization",
		],
	},
];

function ServiceCard({ title, icon: Icon, bullets }: Service) {
	return (
		<article className="flex flex-col gap-5 rounded-[18px] border border-white/12 bg-white/3 p-6 shadow-[0_8px_24px_rgba(30,51,138,0.102)] backdrop-blur-sm sm:p-8">
			<div className="flex items-center gap-4">
				<span className="flex size-12 shrink-0 items-center justify-center rounded-[10px] border border-brand/40 bg-brand/15">
					<Icon className="size-6 text-badge-text" aria-hidden />
				</span>
				<h2 className="text-xl font-semibold leading-7 text-white">{title}</h2>
			</div>

			<div aria-hidden className="h-px w-full bg-white/10" />

			<ul className="flex flex-col gap-2.5">
				{bullets.map((bullet) => (
					<li key={bullet} className="flex items-start gap-2">
						<span
							aria-hidden
							className="mt-1.75 size-1.5 shrink-0 rounded-full bg-brand-accent"
						/>
						<span className="text-[15px] leading-5 text-white/70">
							{bullet}
						</span>
					</li>
				))}
			</ul>
		</article>
	);
}

function ServiceColumn({ services }: { services: Service[] }) {
	return (
		<RevealGroup stagger={0.12} className="flex flex-1 flex-col gap-6 lg:gap-10">
			{services.map((service) => (
				<RevealItem key={service.title}>
					<ServiceCard {...service} />
				</RevealItem>
			))}
		</RevealGroup>
	);
}

export function ServiceCatalog() {
	return (
		<section className="relative overflow-hidden">
			<div
				aria-hidden
				className="grid-rules pointer-events-none absolute inset-0 [--grid-rule-gap:180px]"
			/>

			<div className="relative mx-auto w-full max-w-360 px-6 py-10 md:py-20 xl:px-30">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
					<ServiceColumn services={leftColumn} />
					<ServiceColumn services={rightColumn} />
				</div>
			</div>
		</section>
	);
}
