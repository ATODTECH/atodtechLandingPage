"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { NativeSelect } from "@/components/portal/ui";
import { Input } from "@/components/ui/input";

/** Client and name filters, kept in the URL so they survive refreshes. */
export function DocumentFilters({
	clients,
}: {
	clients: { id: string; name: string }[];
}) {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();

	function setParam(key: string, value: string) {
		const next = new URLSearchParams(params);
		if (value) next.set(key, value);
		else next.delete(key);
		router.replace(`${pathname}?${next}`);
	}

	return (
		<div className="mb-4 flex flex-col gap-2 sm:flex-row">
			<form
				className="relative flex-1"
				onSubmit={(e) => {
					e.preventDefault();
					setParam("q", String(new FormData(e.currentTarget).get("q")).trim());
				}}
			>
				<Search
					className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40"
					aria-hidden
				/>
				<Input
					name="q"
					type="search"
					placeholder="Search by name"
					aria-label="Search documents by name"
					defaultValue={params.get("q") ?? ""}
					className="h-9 pl-9"
				/>
			</form>
			{clients.length > 0 ? (
				<NativeSelect
					aria-label="Filter by client"
					value={params.get("client") ?? ""}
					onChange={(e) => setParam("client", e.target.value)}
					className="sm:w-56"
				>
					<option value="">All clients</option>
					{clients.map((c) => (
						<option key={c.id} value={c.id}>
							{c.name}
						</option>
					))}
				</NativeSelect>
			) : null}
		</div>
	);
}
