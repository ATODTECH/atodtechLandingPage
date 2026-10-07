"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = {
	value: string;
	label: string;
	disabled?: boolean;
};

type SelectFieldProps = {
	id: string;
	label: string;
	options: SelectOption[];
	placeholder?: string;
	/** Submits the value with the surrounding <form>, like a native select. */
	name?: string;
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	disabled?: boolean;
	required?: boolean;
	error?: string;
	className?: string;
	labelClassName?: string;
	fieldClassName?: string;
	contentClassName?: string;
};

/** A labelled shadcn Select, styled to match FormField. */
export function SelectField({
	id,
	label,
	options,
	placeholder,
	name,
	value,
	defaultValue,
	onValueChange,
	disabled,
	required,
	error,
	className,
	labelClassName,
	fieldClassName,
	contentClassName,
}: SelectFieldProps) {
	const errorId = error ? `${id}-error` : undefined;

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<Label
				htmlFor={id}
				className={cn("text-sm text-[#EAEAEA]", labelClassName)}
			>
				{label}
			</Label>
			<Select
				name={name ?? id}
				items={options}
				// Base UI uses null for "nothing selected".
				value={value === undefined ? undefined : value || null}
				defaultValue={defaultValue || null}
				onValueChange={(next) => onValueChange?.((next as string | null) ?? "")}
				disabled={disabled}
				required={required}
			>
				{/* data-[size] matches the trigger's own height rule so it can be overridden. */}
				<SelectTrigger
					id={id}
					aria-invalid={!!error}
					aria-describedby={errorId}
					className={cn(
						"w-full cursor-pointer rounded-lg bg-white data-[size=default]:h-11.5 text-[#6D758F] dark:bg-white dark:hover:bg-white data-placeholder:text-[#6D758F]/70",
						fieldClassName,
					)}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				{/* Open below the field at its width, rather than over it. */}
				<SelectContent
					alignItemWithTrigger={false}
					align="start"
					sideOffset={6}
					className={cn(
						"rounded-lg border border-black/5 bg-white p-1.5 text-[#0c111d] shadow-xl ring-0",
						contentClassName,
					)}
				>
					{options.map((option) => (
						<SelectItem
							key={option.value}
							value={option.value}
							disabled={option.disabled}
							className="cursor-pointer rounded-md py-2.5 pr-9 pl-3 text-sm text-[#344054] focus:bg-[#f2f4f7] focus:text-[#0c111d] data-highlighted:bg-[#f2f4f7] data-highlighted:text-[#0c111d] data-selected:font-medium data-selected:text-[#0c111d] [&_svg]:text-brand-accent"
						>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{error ? (
				<p id={errorId} className="text-xs text-destructive">
					{error}
				</p>
			) : null}
		</div>
	);
}
