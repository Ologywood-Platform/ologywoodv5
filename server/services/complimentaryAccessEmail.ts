import { getEmailLogoImage } from '../../shared/emailBranding';
import { COMPLIMENTARY_TIERS, type ComplimentaryTier } from '../../shared/complimentaryAccess';
import { sendEmail } from '../email';

export type ComplimentaryEmailInput = {
  email: string;
  name: string | null;
  tier: ComplimentaryTier;
  expiresAt: Date | null;
};
export function escapeEmailHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}
export function buildComplimentaryAccessEmail(input: ComplimentaryEmailInput) {
  if (!COMPLIMENTARY_TIERS.includes(input.tier)) throw new Error('Unsupported complimentary tier');
  if (input.expiresAt && !Number.isFinite(input.expiresAt.getTime())) throw new Error('Invalid grant expiration');
  const baseUrl = 'https://www.ologywood.com';
  const plan = input.tier[0].toUpperCase() + input.tier.slice(1);
  const name = escapeEmailHtml(input.name?.trim() || 'there');
  const expiry = input.expiresAt
    ? `${new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' }).format(input.expiresAt)} UTC`
    : 'No scheduled expiration';
  const subject = `Your complimentary OlogyWood ${plan} access is active`;
  const unsubscribe = `${baseUrl}/unsubscribe?email=${encodeURIComponent(input.email)}&type=subscription`;
  const html = `<!doctype html><html><body style="margin:0;background:#f5f3ff;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;padding:32px;">
      ${getEmailLogoImage()}
      <h1 style="font-size:24px;text-align:center;color:#6D28D9;">Your complimentary access is active</h1>
      <p>Hi ${name},</p>
      <p>The OlogyWood platform owner has granted your account complimentary <strong>${plan}</strong> plan access. You can sign in with this email address and start using the features included in your plan.</p>
      <div style="padding:20px;background:#f5f3ff;border-left:4px solid #6D28D9;border-radius:8px;">
        <p><strong>Plan:</strong> ${plan}</p>
        <p><strong>Platform subscription fee:</strong> $0/month while this grant is active</p>
        <p><strong>Expiration:</strong> ${escapeEmailHtml(expiry)}</p>
      </div>
      <p>This is complimentary plan access, not a paid subscription or an automatically renewing trial. ${input.expiresAt ? 'When this grant expires, your account returns to its underlying eligible plan or Free.' : 'There is no scheduled expiration, but the platform owner may change or revoke the grant.'} Expiration or revocation does not automatically start a paid subscription.</p>
      <p style="text-align:center;margin:28px 0;"><a href="${baseUrl}/workspace" style="display:inline-block;background:#6D28D9;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;">Sign in and open your Workspace</a></p>
      <p>You can review your plan in <a href="${baseUrl}/settings">Account Settings</a> or on the <a href="${baseUrl}/pricing">Pricing page</a>. Need help? Visit the <a href="${baseUrl}/help">Help Center</a>.</p>
      <p style="font-size:13px;color:#4b5563;">Complimentary access waives only the platform subscription fee. Standard marketplace and transaction fees, Stripe processing, and fan purchases still apply. Your plan's normal limits and account permissions remain in place. This grant does not cancel or refund any separate Stripe billing.</p>
      <p>Thank you for being part of OlogyWood.<br>The OlogyWood Team</p>
      <div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:24px;font-size:12px;color:#6b7280;">
        You are receiving this account update because the platform owner granted your account complimentary access.<br>
        <a href="${unsubscribe}">Unsubscribe</a> · <a href="${baseUrl}/settings">Email preferences</a> · <a href="${baseUrl}/privacy">Privacy Policy</a>
      </div>
    </div></body></html>`;
  return { to: input.email, subject, html };
}
export async function sendComplimentaryAccessEmail(input: ComplimentaryEmailInput): Promise<boolean> {
  return sendEmail(buildComplimentaryAccessEmail(input), { timeoutMs: 8_000 });
}
