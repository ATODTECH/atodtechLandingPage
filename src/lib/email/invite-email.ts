import {
	EMAIL_COLORS,
	escapeHtml,
	sendActionEmail,
	type ActionEmail,
} from "@/lib/email/action-email";

type InviteEmail = {
	to: string;
	inviterName: string;
	/** Replies go to the person who sent the invite, not a no-reply inbox. */
	inviterEmail?: string;
	url: string;
} & ({ kind: "admin" | "account" } | { kind: "share"; documentName: string });

function inviteContent(email: InviteEmail): ActionEmail {
	const note = `This link expires in 7 days and only works for ${email.to}.`;
	switch (email.kind) {
		case "admin": {
			const body = `${email.inviterName} has invited you to help manage documents on the Atod Tech portal.`;
			return {
				subject: `${email.inviterName} invited you to manage Atod Tech documents`,
				heading: "You've been invited as an admin",
				bodyHtml: escapeHtml(body),
				bodyText: body,
				ctaLabel: "Accept invite",
				url: email.url,
				note,
			};
		}
		case "account": {
			const body = `${email.inviterName} has invited you to the Atod Tech document portal, where you can view and download your project files.`;
			return {
				subject: `${email.inviterName} invited you to the Atod Tech portal`,
				heading: "You've been invited",
				bodyHtml: escapeHtml(body),
				bodyText: body,
				ctaLabel: "Accept invite",
				url: email.url,
				note,
			};
		}
		case "share":
			return {
				subject: `${email.inviterName} shared "${email.documentName}" with you`,
				heading: "A document was shared with you",
				bodyHtml: `${escapeHtml(email.inviterName)} shared <strong style="color:${EMAIL_COLORS.white};">${escapeHtml(email.documentName)}</strong> with you on the Atod Tech portal.`,
				bodyText: `${email.inviterName} shared "${email.documentName}" with you on the Atod Tech portal.`,
				ctaLabel: "Open document",
				url: email.url,
				note,
			};
	}
}

export async function sendInviteEmail(email: InviteEmail) {
	await sendActionEmail(email.to, inviteContent(email), {
		replyTo: email.inviterEmail,
	});
}
