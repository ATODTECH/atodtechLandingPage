"use client";

import { useState } from "react";
import { toast } from "sonner";

import { changePasswordAction } from "@/app/portal/actions";
import { FormField } from "@/components/form/form-field";
import { LoadingButton } from "@/components/form/loading-button";

export function ChangePasswordForm() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		setError(null);

		const newPassword = String(data.get("newPassword"));
		if (newPassword !== data.get("confirmPassword")) {
			setError("New passwords don't match.");
			return;
		}

		setLoading(true);
		const result = await changePasswordAction({
			currentPassword: String(data.get("currentPassword")),
			newPassword,
			signOutOtherDevices: data.get("signOutOtherDevices") === "on",
		});
		setLoading(false);

		if (!result.ok) {
			setError(result.error);
			return;
		}
		form.reset();
		toast.success("Password changed.");
	}

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-5">
			<FormField
				id="currentPassword"
				label="Current password"
				type="password"
				autoComplete="current-password"
				required
			/>
			<FormField
				id="newPassword"
				label="New password"
				type="password"
				autoComplete="new-password"
				minLength={8}
				maxLength={128}
				required
				hint="At least 8 characters."
			/>
			<FormField
				id="confirmPassword"
				label="Confirm new password"
				type="password"
				autoComplete="new-password"
				required
			/>
			<label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
				<input
					type="checkbox"
					name="signOutOtherDevices"
					defaultChecked
					className="size-4 accent-[#f56f46]"
				/>
				Sign out of all other devices
			</label>
			{error ? (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			) : null}
			<LoadingButton
				type="submit"
				loading={loading}
				loadingText="Updating…"
				className="h-11.5 self-start rounded-lg bg-brand-accent px-5 text-white hover:bg-brand-accent/90"
			>
				Update password
			</LoadingButton>
		</form>
	);
}
