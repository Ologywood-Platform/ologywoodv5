import express, { Router, Request, Response } from 'express';
import { unsubscribeAllEmailPreferencesByToken } from '../db';
import { getFanUnsubscribeStatus, unsubscribeFanByToken } from '../services/fanEmailConsentService';

const router = Router();
// Kept narrow for direct route mounting and RFC 8058 form payloads. The app's
// global parser has already consumed bodies in production, so this is a no-op there.
router.use(express.urlencoded({ extended: false, limit: '8kb' }));

function noStore(res: Response): Response {
  return res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
}

function html(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function page(title: string, message: string, fields = '', button = ''): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${html(title)} - Ologywood</title></head><body><main><h1>${html(title)}</h1><p>${html(message)}</p>${fields ? `<form method="post" action="/api/email/unsubscribe">${fields}<button type="submit">${html(button)}</button></form>` : ''}<p><a href="/settings">Manage email preferences</a></p></main></body></html>`;
}

function tokenValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= 2048 ? value : null;
}

/**
 * GET is deliberately a confirmation view only. Mail scanners and link
 * previews must never cause an opt-out. fanToken is a creator-scoped HMAC
 * capability; the legacy opaque token remains a global preference capability.
 */
router.get('/unsubscribe', async (req: Request, res: Response) => {
  noStore(res);
  const fanToken = tokenValue(req.query.fanToken);
  const legacyToken = tokenValue(req.query.token);

  if (fanToken) {
    const status = await getFanUnsubscribeStatus(fanToken);
    if (!status.valid) {
      return res.status(404).send(page('This unsubscribe link is no longer active', 'You may have already unsubscribed or changed your creator update preference.'));
    }
    return res.status(200).send(page(
      'Unsubscribe from creator updates?',
      'This stops only the creator updates associated with this email link. It does not change other creator subscriptions or global email preferences.',
      `<input type="hidden" name="fanToken" value="${html(fanToken)}">`,
      'Unsubscribe from these creator updates',
    ));
  }

  if (legacyToken) {
    // Do not look up an opaque legacy token on GET: it only leads to the same
    // confirmation page and avoiding a lookup reduces scanner side effects.
    return res.status(200).send(page(
      'Unsubscribe from all emails?',
      'This stops marketing and promotional Ologywood emails. Transactional account and booking messages may still be sent.',
      `<input type="hidden" name="token" value="${html(legacyToken)}">`,
      'Unsubscribe from all emails',
    ));
  }

  // Legacy email/userId URLs never authorize an opt-out. They require the
  // signed-in settings flow rather than treating an identifier as authority.
  if (typeof req.query.email === 'string' || typeof req.query.userId === 'string') {
    return res.status(401).send(page('Sign in required', 'For your security, sign in to change email preferences.'));
  }
  return res.status(400).send(page('Invalid unsubscribe link', 'This link is missing a valid unsubscribe token.'));
});

/**
 * POST supports both browser confirmation and RFC 8058 one-click requests.
 * List-Unsubscribe=One-Click recipient mail uses ?fanToken=...; no GET ever
 * mutates. fanToken takes precedence and can never affect global preferences.
 */
router.post('/unsubscribe', async (req: Request, res: Response) => {
  noStore(res);
  const fanToken = tokenValue(req.query.fanToken) ?? tokenValue(req.body?.fanToken);
  const legacyToken = tokenValue(req.query.token) ?? tokenValue(req.body?.token);

  try {
    if (fanToken) {
      const success = await unsubscribeFanByToken(fanToken);
      if (!success) {
        return res.status(404).send(page('This unsubscribe link is no longer active', 'You may have already unsubscribed or changed your creator update preference.'));
      }
      return res.status(200).send(page('Unsubscribed from creator updates', 'You will no longer receive updates from this creator. Your other creator subscriptions and global email preferences were not changed.'));
    }

    if (legacyToken) {
      const success = await unsubscribeAllEmailPreferencesByToken(legacyToken);
      if (!success) {
        return res.status(404).send(page('This unsubscribe link is no longer active', 'Sign in to manage your email preferences.'));
      }
      return res.status(200).send(page('Unsubscribed from all emails', 'You will no longer receive Ologywood marketing or promotional emails.'));
    }

    if (typeof req.body?.email === 'string' || typeof req.body?.userId === 'string' ||
        typeof req.query.email === 'string' || typeof req.query.userId === 'string') {
      return res.status(401).send(page('Sign in required', 'For your security, sign in to change email preferences.'));
    }
    return res.status(400).send(page('Invalid unsubscribe link', 'This link is missing a valid unsubscribe token.'));
  } catch {
    // Do not disclose fan identity, creator identity, token parsing, or errors.
    return res.status(500).send(page('Unable to process unsubscribe', 'Please try again later or sign in to manage your preferences.'));
  }
});

export default router;
