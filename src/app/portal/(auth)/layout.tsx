import type { Metadata } from "next";
import Link from "next/link";

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
		<div className="dark flex min-h-screen flex-col items-center justify-center bg-page px-4 py-12 text-white">
			<Link href="/" className="mb-8">
				<AtodBrandLogo aria-label="Atod Tech" className="h-16 w-auto" />
			</Link>
			<div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0f1526] p-6 sm:p-8">
				{children}
			</div>
		</div>
	);
}
