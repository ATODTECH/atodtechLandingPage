import { Resend } from "resend";

// Shared layout for portal emails with one call-to-action button
// (invites, password resets).

const SITE_URL = "https://www.atodtech.com";
const LOGO_URL = `${SITE_URL}/atod-logo.png`;

const FONT_STACK =
	"'Inter','Segoe UI',Roboto,-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif";

export const EMAIL_COLORS = {
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
const COLORS = EMAIL_COLORS;

export function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export type ActionEmail = {
	subject: string;
	heading: string;
	/** Already-escaped HTML for the main paragraph. */
	bodyHtml: string;
	/** Plain-text version of the main paragraph. */
	bodyText: string;
	ctaLabel: string;
	url: string;
	/** Small print under the button, e.g. when the link expires. */
	note: string;
};

export function renderActionEmail(email: ActionEmail) {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${escapeHtml(email.subject)}</title>
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
                <p style="margin:0 0 10px;font-size:21px;line-height:1.3;font-weight:700;color:${COLORS.white};font-family:${FONT_STACK};">${escapeHtml(email.heading)}</p>
                <p style="margin:0;font-size:15px;line-height:1.6;color:${COLORS.muted};font-family:${FONT_STACK};">${email.bodyHtml}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 32px 30px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="${COLORS.accent}" style="background-color:${COLORS.accent};border-radius:999px;">
                      <a href="${escapeHtml(email.url)}" style="display:inline-block;padding:13px 28px;font-size:14px;line-height:1;font-weight:600;color:${COLORS.white};text-decoration:none;font-family:${FONT_STACK};border-radius:999px;">${escapeHtml(email.ctaLabel)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${COLORS.faint};font-family:${FONT_STACK};">${escapeHtml(email.note)}</p>
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

/** Plain-text part. Mail without one looks more like spam to filters. */
export function renderActionText(email: ActionEmail) {
	return [
		email.heading,
		"",
		email.bodyText,
		"",
		`${email.ctaLabel}: ${email.url}`,
		"",
		email.note,
		"If you weren't expecting this, you can ignore it.",
		"",
		"Atod Tech · https://www.atodtech.com",
	].join("\n");
}

/** Adds a display name when DMS_EMAIL_FROM is a bare address. */
function fromAddress() {
	const from = process.env.DMS_EMAIL_FROM!.trim();
	return from.includes("<") ? from : `Atod Tech <${from}>`;
}

export async function sendActionEmail(
	to: string,
	email: ActionEmail,
	options: { replyTo?: string } = {},
) {
	const resend = new Resend(process.env.RESEND_API_KEY);
	const { error } = await resend.emails.send({
		from: fromAddress(),
		to,
		replyTo: options.replyTo,
		subject: email.subject,
		html: renderActionEmail(email),
		text: renderActionText(email),
	});
	if (error) {
		console.error("Resend error:", error);
		throw new Error("Failed to send the email.");
	}
}
