import Image from "next/image";
import {
	BarChart3,
	Bot,
	BookOpen,
	CalendarDays,
	Code2,
	Database,
	FileText,
	Mail,
	MessageSquare,
	PenTool,
	ScrollText,
	Users,
	type LucideIcon,
} from "lucide-react";

import { aiAutomation } from "@/assets";
import { RevealGroup, RevealItem } from "@/components/shared/reveal";

type Capability = {
	label: string;
	icon: LucideIcon;
};

const leftColumn: Capability[] = [
	{ label: "AI customer-support assistants", icon: Bot },
	{ label: "WhatsApp and website enquiry automation", icon: MessageSquare },
	{ label: "Lead capture, qualification and follow-up closely", icon: Users },
	{ label: "Automated appointment and scheduling", icon: CalendarDays },
	{ label: "Document reading, extraction & classing", icon: FileText },
	{ label: "Proposal, report and summary generation", icon: ScrollText },
];

const rightColumn: Capability[] = [
	{ label: "Internal knowledge tools for employees", icon: BookOpen },
	{ label: "Automated email and notification workflows", icon: Mail },
	{ label: "Data-entry and record-updating systems", icon: Database },
	{ label: "Intelligent dashboards and decision support", icon: BarChart3 },
	{ label: "Content workflow assistance", icon: PenTool },
	{ label: "Custom AI features in existing systems", icon: Code2 },
];

function CapabilityCard({ label, icon: Icon }: Capability) {
	return (
		<div className="flex items-center gap-3 rounded-[10px] border border-white/8 bg-white/3 p-2">
			<span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-brand/40 bg-brand/15">
				<Icon className="size-4 text-brand-accent" aria-hidden />
			</span>
			<span className="text-[15px] leading-5 text-white">{label}</span>
		</div>
	);
}

function CapabilityColumn({ items }: { items: Capability[] }) {
	return (
		<RevealGroup stagger={0.06} className="flex flex-1 flex-col gap-4">
			{items.map((capability) => (
				<RevealItem key={capability.label}>
					<CapabilityCard {...capability} />
				</RevealItem>
			))}
		</RevealGroup>
	);
}

export function AiAutomationOverview() {
	return (
		<section className="relative overflow-hidden">
			<div className="relative mx-auto w-full max-w-360 px-6 pb-10 pt-33 md:pb-20 lg:pt-45 xl:px-30">
				<div className="grid gap-12 xl:grid-cols-[520fr_656fr] xl:gap-16">
					<RevealGroup className="flex flex-col">
						<RevealItem direction="right">
							<h1 className="text-[28px] font-bold leading-tight text-white sm:text-[32px] lg:text-[40px] lg:leading-13">
								Use AI to Save Time, Reduce Manual Work and
								Serve Customers Better
							</h1>
						</RevealItem>
						<RevealItem direction="right">
							<p className="mt-6 text-base leading-6 text-white/70">
								AI should solve real operational problems, not
								simply add another trend to your business. ATOD
								identifies repetitive, slow, or error-prone
								activities and designs practical, secure
								automations around them.
							</p>
						</RevealItem>
						<RevealItem direction="right" className="mt-8">
							<Image
								src={aiAutomation}
								alt="A neural network visualisation labelled Neural Engine and Secure Flow"
								sizes="(min-width: 1280px) 520px, calc(100vw - 48px)"
								className="w-full h-full object-contain"
							/>
						</RevealItem>
					</RevealGroup>

					<div className="flex flex-col">
						<RevealItem>
							<h2 className="text-[13px] font-medium uppercase leading-4 tracking-[1.3px] text-white/55">
								Automation capabilities include:
							</h2>
						</RevealItem>
						<div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
							<CapabilityColumn items={leftColumn} />
							<CapabilityColumn items={rightColumn} />
						</div>
					</div>
				</div>
			</div>

			<div className="border-y border-white/8 bg-white/2">
				<div className="mx-auto w-full max-w-360 px-6 py-6 xl:px-20">
					<p className="text-sm italic leading-6 text-white/60">
						We combine AI with strict business rules, approvals,
						security controls, and human-in-the-loop reviews so that
						your automation remains 100% useful, responsible, and
						aligned with your organizational compliance.
					</p>
				</div>
			</div>
		</section>
	);
}
