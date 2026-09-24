"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/app/portal/actions";
import { LoadingButton } from "@/components/form/loading-button";
import { dialogClassName } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

export function SignOutDialog() {
	const [open, setOpen] = useState(false);
	const [pending, startTransition] = useTransition();

	return (
		<Dialog
			open={open}
			// Keep the dialog up while signing out so the loading state stays visible.
			onOpenChange={(next) => !pending && setOpen(next)}
		>
			<DialogTrigger className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white">
				<LogOut className="size-4" aria-hidden />
				<span className="hidden sm:inline">Sign out</span>
			</DialogTrigger>
			<DialogContent className={dialogClassName} showCloseButton={!pending}>
				<DialogHeader>
					<DialogTitle>Sign out?</DialogTitle>
					<DialogDescription>
						You&rsquo;ll need to sign in again to access your documents.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="rounded-b-lg border-white/10 bg-white/5">
					<Button
						variant="outline"
						className="cursor-pointer rounded-lg"
						disabled={pending}
						onClick={() => setOpen(false)}
					>
						Cancel
					</Button>
					<LoadingButton
						loading={pending}
						loadingText="Signing out…"
						onClick={() =>
							startTransition(async () => {
								await signOutAction();
							})
						}
						className="rounded-lg bg-brand-accent text-white hover:bg-brand-accent/90"
					>
						Sign out
					</LoadingButton>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
