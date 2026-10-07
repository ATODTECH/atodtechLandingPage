import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AtodBrandLogo } from "@/assets";

export const metadata: Metadata = {
	title: "Documents | ATOD Tech Agency",
	robots: { index: false, follow: false },
};

export default function PortalAuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="dark relative flex min-h-screen flex-col items-center justify-center bg-page px-4 py-16 text-white">
			<Link
				href="/"
				aria-label="Back to home page"
				className="absolute top-5 left-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white sm:top-6 sm:left-6"
			>
				<ArrowLeft className="size-4" aria-hidden />
				Back
			</Link>
			<Link href="/" className="mb-8">
				<AtodBrandLogo aria-label="Atod Tech" className="h-20 w-auto" />
			</Link>
			<div className="w-full max-w-md rounded-lg border border-white/10 bg-[#0f1526] p-6 sm:p-8">
				{children}
			</div>
		</div>
	);
}
