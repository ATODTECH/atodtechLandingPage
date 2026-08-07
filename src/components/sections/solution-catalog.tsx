import {
	Activity,
	BookOpen,
	Briefcase,
	Calendar,
	CreditCard,
	FileText,
	House,
	MessageSquare,
	ShoppingBag,
	ShoppingCart,
	Truck,
	Users,
	type LucideIcon,
} from "lucide-react";

import { RevealGroup, RevealItem } from "@/components/shared/reveal";

type Solution = {
	title: string;
	icon: LucideIcon;
	description: string;
};

const solutions: Solution[] = [
	{
		title: "Marketplace Platforms",
		icon: ShoppingBag,
		description:
			"Platforms that connect buyers and sellers, customers and service providers, employers and talent, property owners and renters, or other two-sided groups. Features may include onboarding, verification, listings, search, booking, messaging, reviews, wallet, payments, commissions, subscriptions, GPS, and admin controls.",
	},
	{
		title: "E-Commerce Platforms",
		icon: ShoppingCart,
		description:
			"Online storefronts, product catalogues, carts, secure checkout, inventory, orders, delivery, promotions, customer accounts, reporting, loyalty, subscriptions, and multi-vendor commerce.",
	},
	{
		title: "Education Technology",
		icon: BookOpen,
		description:
			"School management, student information, learning management, CBT, attendance, fees, parent communication, teacher tools, digital content, and educational mobile apps. ATOD's experience includes Kiddiedu.",
	},
	{
		title: "Healthcare Systems",
		icon: Activity,
		description:
			"Patient registration, appointments, EMR, laboratory, pharmacy, billing, nursing, telehealth support, patient portals, and healthcare reporting.",
	},
	{
		title: "Business Management Systems",
		icon: Briefcase,
		description:
			"CRM, ERP, HR, payroll, procurement, inventory, accounting, asset management, expense management, workflow approvals, and analytics.",
	},
	{
		title: "Booking and Reservation Systems",
		icon: Calendar,
		description:
			"Appointments, staff availability, service packages, reminders, payments, rescheduling, cancellations, calendar integration, and operational reports.",
	},
	{
		title: "Logistics and Delivery Systems",
		icon: Truck,
		description:
			"Dispatch, driver assignment, GPS tracking, routes, shipment records, proof of delivery, fleet operations, warehouse functions, pricing, notifications, and dashboards.",
	},
	{
		title: "Financial and Payment Solutions",
		icon: CreditCard,
		description:
			"Billing, invoicing, collections, digital wallets, subscription billing, reconciliation, transaction monitoring, financial portals, expense tracking, and reporting.",
	},
	{
		title: "Real Estate and Property Systems",
		icon: House,
		description:
			"Property listings, search, inspections, tenants, rent collection, maintenance, documents, agent dashboards, occupancy, and reminders.",
	},
	{
		title: "Government and Public-Sector Systems",
		icon: FileText,
		description:
			"Citizen portals, permits, applications, revenue, case management, records, workflows, data collection, public information, and reporting dashboards.",
	},
	{
		title: "Nonprofit and Social-Impact Platforms",
		icon: Users,
		description:
			"Beneficiary registration, programs, grants, volunteers, donations, field data collection, monitoring, evaluation, impact reporting, and outreach.",
	},
	{
		title: "Membership and Community Platforms",
		icon: MessageSquare,
		description:
			"Registration, dues, directories, events, digital IDs, committees, documents, donations, communication, and member analytics.",
	},
];

function SolutionCard({ title, icon: Icon, description }: Solution) {
	return (
		<article className="flex h-full flex-col gap-6 rounded-2xl border border-white/12 bg-white/3 p-6 shadow-[0_8px_24px_rgba(30,51,138,0.102)] backdrop-blur-sm sm:p-8">
			<div className="flex items-center gap-4">
				<span className="flex size-12 shrink-0 items-center justify-center rounded-[10px] border border-brand/40 bg-brand/15">
					<Icon className="size-6 text-brand-accent" aria-hidden />
				</span>
				<h2 className="text-xl font-semibold leading-7 text-white sm:text-2xl sm:leading-8">
					{title}
				</h2>
			</div>

			<p className="text-base leading-normal text-white/70">{description}</p>
		</article>
	);
}

export function SolutionCatalog() {
	return (
		<section id="solutions" className="relative overflow-hidden">
			<div
				aria-hidden
				className="grid-rules pointer-events-none absolute inset-0 [--grid-rule-gap:180px]"
			/>

			<RevealGroup
				stagger={0.08}
				className="relative mx-auto grid w-full max-w-360 gap-6 px-6 py-10 md:py-20 lg:grid-cols-2 lg:gap-8 xl:px-30"
			>
				{solutions.map((solution) => (
					<RevealItem key={solution.title} className="h-full">
						<SolutionCard {...solution} />
					</RevealItem>
				))}
			</RevealGroup>
		</section>
	);
}
