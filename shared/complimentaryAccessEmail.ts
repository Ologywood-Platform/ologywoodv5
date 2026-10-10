export type ComplimentaryEmailOutcome =
  | 'ready' | 'provider_accepted' | 'provider_unconfirmed'
  | 'skipped_inactive' | 'skipped_stale_revision' | 'skipped_billing_conflict'
  | 'skipped_invalid_or_unverified_email' | 'skipped_opt_out'
  | 'skipped_already_attempted' | 'not_configured' | 'error';

export function getGrantEmailNotice(outcome: ComplimentaryEmailOutcome | undefined): string {
  switch (outcome) {
    case 'provider_accepted': return 'Confirmation email sent to the email provider; inbox delivery is not yet confirmed.';
    case 'skipped_opt_out': return 'Confirmation email skipped because this user opted out of emails.';
    case 'skipped_invalid_or_unverified_email': return 'Confirmation email skipped: the account needs a valid, verified email address.';
    case 'skipped_already_attempted': return 'This grant revision already has a recorded email attempt; no duplicate was sent.';
    case 'skipped_inactive': case 'skipped_stale_revision': case 'skipped_billing_conflict':
      return 'Confirmation email skipped because the grant or billing state changed. Review the current account state.';
    case 'provider_unconfirmed': return 'Email acceptance could not be confirmed. Access remains granted; review delivery logs before resending.';
    case 'not_configured': return 'Email is not configured. Access remains granted; no confirmation email was sent.';
    default: return 'Email confirmation could not be verified. Access remains granted; review delivery logs before resending.';
  }
}
