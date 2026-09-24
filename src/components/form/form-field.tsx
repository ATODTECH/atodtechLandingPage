import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FormFieldProps = {
	id: string;
	label: string;
	placeholder?: string;
	type?: React.HTMLInputTypeAttribute | "textarea";
	rows?: number;
	name?: string;
	value?: string;
	defaultValue?: string;
	disabled?: boolean;
	readOnly?: boolean;
	required?: boolean;
	autoComplete?: string;
	autoFocus?: boolean;
	minLength?: number;
	maxLength?: number;
	hint?: string;
	error?: string;
	onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
	onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
	className?: string;
	labelClassName?: string;
	fieldClassName?: string;
};

// dark:bg-white keeps fields white inside `.dark` containers (e.g. the portal).
const fieldBase =
	"rounded-lg bg-white text-[#6D758F] dark:bg-white dark:disabled:bg-white/80";

export function FormField({
	id,
	label,
	placeholder,
	type = "text",
	rows = 4,
	name,
	value,
	defaultValue,
	disabled,
	readOnly,
	required,
	autoComplete,
	autoFocus,
	minLength,
	maxLength,
	hint,
	error,
	onChange,
	onBlur,
	className,
	labelClassName,
	fieldClassName,
}: FormFieldProps) {
	const errorId = error ? `${id}-error` : undefined;
	const hintId = hint ? `${id}-hint` : undefined;
	const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
	const shared = {
		id,
		name: name ?? id,
		placeholder,
		value,
		defaultValue,
		disabled,
		readOnly,
		required,
		autoFocus,
		minLength,
		maxLength,
		onChange,
		onBlur,
		"aria-invalid": !!error,
		"aria-describedby": describedBy,
	};

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<Label
				htmlFor={id}
				className={cn("text-sm text-[#EAEAEA]", labelClassName)}
			>
				{label}
			</Label>
			{type === "textarea" ? (
				<Textarea
					{...shared}
					rows={rows}
					className={cn("min-h-23 resize-none", fieldBase, fieldClassName)}
				/>
			) : (
				<Input
					{...shared}
					type={type}
					autoComplete={autoComplete}
					className={cn("h-11.5", fieldBase, fieldClassName)}
				/>
			)}
			{hint && !error ? (
				<p id={hintId} className="text-xs text-white/50">
					{hint}
				</p>
			) : null}
			{error ? (
				<p id={errorId} className="text-xs text-destructive">
					{error}
				</p>
			) : null}
		</div>
	);
}
