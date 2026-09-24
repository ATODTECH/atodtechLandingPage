"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { FormField } from "@/components/form/form-field";
import { SelectField } from "@/components/form/select-field";

const ALL = "all";

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
					className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-[#6D758F]"
					aria-hidden
				/>
				<FormField
					id="q"
					label="Search documents by name"
					type="search"
					placeholder="Search by name"
					defaultValue={params.get("q") ?? ""}
					labelClassName="sr-only"
					fieldClassName="pl-9"
				/>
			</form>
			{clients.length > 0 ? (
				<SelectField
					id="client-filter"
					label="Filter by client"
					labelClassName="sr-only"
					className="sm:w-60"
					options={[
						{ value: ALL, label: "All clients" },
						...clients.map((c) => ({ value: c.id, label: c.name })),
					]}
					value={params.get("client") ?? ALL}
					onValueChange={(value) => setParam("client", value === ALL ? "" : value)}
				/>
			) : null}
		</div>
	);
}
