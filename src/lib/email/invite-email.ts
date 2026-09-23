import { Resend } from "resend";

const SITE_URL = "https://www.atodtech.com";
const LOGO_URL = `${SITE_URL}/atod-logo.png`;

const FONT_STACK =
	"'Inter','Segoe UI',Roboto,-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif";

const COLORS = {
	page: "#0c111d",
	card: "#0f1526",
	cardInset: "#0a0e18",
	border: "#1c2340",
	brand: "#1e338a",
	accent: "#f56f46",
	white: "#ffffff",
	muted: "#9aa2c0",
	faint: "#5b6386",
};

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

type InviteEmail =
	| { kind: "admin" | "account"; to: string; inviterName: string; url: string }
	| {
			kind: "share";
			to: string;
			inviterName: string;
			url: string;
			documentName: string;
	  };

function copyFor(email: InviteEmail) {
	switch (email.kind) {
		case "admin":
			return {
				subject: `${email.inviterName} invited you to manage Atod Tech documents`,
				heading: "You've been invited as an admin",
				body: `${email.inviterName} has invited you to help manage documents on the Atod Tech portal.`,
				cta: "Accept invite",
			};
		case "account":
			return {
				subject: `${email.inviterName} invited you to the Atod Tech portal`,
				heading: "You've been invited",
				body: `${email.inviterName} has invited you to the Atod Tech document portal, where you can view and download your project files.`,
				cta: "Accept invite",
			};
		case "share":
			return {
				subject: `${email.inviterName} shared "${email.documentName}" with you`,
				heading: "A document was shared with you",
				body: `${email.inviterName} shared <strong style="color:${COLORS.white};">${escapeHtml(email.documentName)}</strong> with you on the Atod Tech portal.`,
				cta: "Open document",
			};
	}
}

export function renderInviteEmail(email: InviteEmail) {
	const copy = copyFor(email);
	// Share copy already contains escaped HTML; the others are plain text.
	const body = email.kind === "share" ? copy.body : escapeHtml(copy.body);

	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${escapeHtml(copy.subject)}</title>
  </head>
  <body style="margin:0;padding:0;width:100%;background-color:${COLORS.page};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.page};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${COLORS.card};border:1px solid ${COLORS.border};border-radius:10px;overflow:hidden;">
            <tr>
              <td align="center" bgcolor="${COLORS.brand}" style="background-color:${COLORS.brand};background-image:linear-gradient(180deg,#2c46ac 0%,${COLORS.brand} 55%,#16265f 100%);padding:28px 32px;">
                <img src="${LOGO_URL}" width="88" height="97" alt="Atod Tech" style="display:block;width:88px;height:auto;border:0;outline:none;text-decoration:none;" />
              </td>
            </tr>
            <tr>
              <td style="padding:30px 32px 6px;">
                <p style="margin:0 0 10px;font-size:21px;line-height:1.3;font-weight:700;color:${COLORS.white};font-family:${FONT_STACK};">${escapeHtml(copy.heading)}</p>
                <p style="margin:0;font-size:15px;line-height:1.6;color:${COLORS.muted};font-family:${FONT_STACK};">${body}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 32px 30px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="${COLORS.accent}" style="background-color:${COLORS.accent};border-radius:999px;">
                      <a href="${escapeHtml(email.url)}" style="display:inline-block;padding:13px 28px;font-size:14px;line-height:1;font-weight:600;color:${COLORS.white};text-decoration:none;font-family:${FONT_STACK};border-radius:999px;">${escapeHtml(copy.cta)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${COLORS.faint};font-family:${FONT_STACK};">This link expires in 7 days and only works for ${escapeHtml(email.to)}.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background-color:${COLORS.cardInset};border-top:1px solid ${COLORS.border};">
                <p style="margin:0;font-size:12px;line-height:1.6;color:${COLORS.faint};font-family:${FONT_STACK};">
                  Sent from the <a href="${SITE_URL}" style="color:${COLORS.muted};text-decoration:none;">Atod Tech</a> document portal. If you weren't expecting this, you can ignore it.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendInviteEmail(email: InviteEmail) {
	const resend = new Resend(process.env.RESEND_API_KEY);
	const { error } = await resend.emails.send({
		from: process.env.DMS_EMAIL_FROM!,
		to: email.to,
		subject: copyFor(email).subject,
		html: renderInviteEmail(email),
	});
	if (error) {
		console.error("Resend error:", error);
		throw new Error("Failed to send the invite email.");
	}
}
