import * as React from "react";
import {
	File,
	FileArchive,
	FileAudio,
	FileImage,
	FileSpreadsheet,
	FileText,
	FileVideo,
	Presentation,
} from "lucide-react";

import { cn } from "@/lib/utils";

/** Dialogs render in a portal outside the portal's `.dark` wrapper. */
export const dialogClassName =
	"dark rounded-lg bg-[#0f1526] text-white ring-white/10 sm:max-w-md";

export function PageHeader({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
				{description ? (
					<p className="mt-1 text-sm text-white/60">{description}</p>
				) : null}
			</div>
			{children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
		</div>
	);
}

export function Badge({
	tone = "neutral",
	className,
	...props
}: React.ComponentProps<"span"> & {
	tone?: "neutral" | "public" | "accent" | "warning";
}) {
	const tones = {
		neutral: "border-white/15 bg-white/5 text-white/70",
		public: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
		accent: "border-brand-accent/40 bg-brand-accent/10 text-brand-accent",
		warning: "border-amber-400/30 bg-amber-400/10 text-amber-300",
	};
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium",
				tones[tone],
				className,
			)}
			{...props}
		/>
	);
}

export function EmptyState({
	title,
	children,
}: {
	title: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="rounded-lg border border-dashed border-white/15 px-6 py-16 text-center">
			<p className="font-medium">{title}</p>
			{children ? (
				<div className="mt-2 text-sm text-white/60">{children}</div>
			) : null}
		</div>
	);
}

export function FileIcon({
	mimeType,
	className,
}: {
	mimeType: string;
	className?: string;
}) {
	const Icon = mimeType.startsWith("image/")
		? FileImage
		: mimeType.startsWith("video/")
			? FileVideo
			: mimeType.startsWith("audio/")
				? FileAudio
				: mimeType.includes("spreadsheet") ||
						mimeType.includes("excel") ||
						mimeType === "text/csv"
					? FileSpreadsheet
					: mimeType.includes("presentation") ||
							mimeType.includes("powerpoint")
						? Presentation
						: mimeType === "application/zip"
							? FileArchive
							: mimeType === "application/pdf" ||
									mimeType.startsWith("text/") ||
									mimeType.includes("word")
								? FileText
								: File;
	return <Icon className={cn("size-5 text-white/60", className)} aria-hidden />;
}
