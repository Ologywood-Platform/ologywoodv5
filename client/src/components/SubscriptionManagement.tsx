import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, CreditCard, Calendar, ArrowUpRight, AlertTriangle, CheckCircle, Loader2, Shield, Zap, PauseCircle, PlayCircle, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/ErrorToast';
import { useLocation } from 'wouter';

type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

const TIER_INFO: Record<SubscriptionTier, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof Crown;
  description: string;
}> = {
  free: {
    label: 'Free',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    icon: Shield,
    description: '2 bookings/month, basic profile, messaging',
  },
  starter: {
    label: 'Starter',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: Zap,
    description: 'Unlimited bookings, Rider Builder, 2 releases, fan updates',
  },
  professional: {
    label: 'Professional',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    icon: Crown,
    description: 'Unlimited releases, contracts, analytics, priority support',
  },
  enterprise: {
    label: 'Enterprise',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    icon: Crown,
    description: 'Sponsor showcase, analytics, media kit, branded events',
  },
};

export function SubscriptionManagement() {
  const [, navigate] = useLocation();
  const toastCtx = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [upgradeInterval, setUpgradeInterval] = useState<'month' | 'year'>('year');

  // Fetch local subscription record
  const { data: subscription, isLoading: subLoading, refetch: refetchSub } =
    (trpc.subscription as any).getMy.useQuery(undefined, { retry: false });

  // Fetch live Stripe status
  const { data: stripeStatus, isLoading: statusLoading, refetch: refetchStatus } =
    (trpc.subscription as any).getStatus.useQuery(undefined, { retry: false });

  const cancelMutation = (trpc.subscription as any).cancel.useMutation({
    onSuccess: () => {
      toastCtx.addSuccess('Subscription cancelled', 'Your subscription will remain active until the end of the current billing period.');
      refetchSub();
      refetchStatus();
      setActionLoading(null);
    },
    onError: (err: any) => {
      toastCtx.addError('Cancel failed', err?.message || 'Could not cancel subscription.');
      setActionLoading(null);
    },
  });

  const reactivateMutation = (trpc.subscription as any).reactivate.useMutation({
    onSuccess: () => {
      toastCtx.addSuccess('Subscription reactivated', 'Your subscription has been reactivated.');
      refetchSub();
      refetchStatus();
      setActionLoading(null);
    },
    onError: (err: any) => {
      toastCtx.addError('Reactivate failed', err?.message || 'Could not reactivate subscription.');
      setActionLoading(null);
    },
  });

  const pauseMutation = (trpc.subscription as any).pause.useMutation({
    onSuccess: (data: { pauseExpiresAt: string }) => {
      const resumeDate = new Date(data.pauseExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      toastCtx.addSuccess('Subscription paused', `Your subscription is paused. It will auto-resume on ${resumeDate}.`);
      refetchSub();
      refetchStatus();
      setActionLoading(null);
      setShowPauseConfirm(false);
    },
    onError: (err: any) => {
      toastCtx.addError('Pause failed', err?.message || 'Could not pause subscription.');
      setActionLoading(null);
    },
  });

  const resumeMutation = (trpc.subscription as any).resume.useMutation({
    onSuccess: () => {
      toastCtx.addSuccess('Subscription resumed', 'Your subscription is active again. All features are restored.');
      refetchSub();
      refetchStatus();
      setActionLoading(null);
    },
    onError: (err: any) => {
      toastCtx.addError('Resume failed', err?.message || 'Could not resume subscription.');
      setActionLoading(null);
    },
  });

  const checkoutMutation = (trpc.subscription as any).createCheckoutSession.useMutation({
    onSuccess: (data: { checkoutUrl: string }) => {
      toastCtx.addInfo('Redirecting to checkout', "You'll be taken to Stripe to complete your upgrade.");
      window.open(data.checkoutUrl, '_blank');
      setActionLoading(null);
    },
    onError: (err: any) => {
      toastCtx.addError('Upgrade failed', err?.message || 'Could not create checkout session.');
      setActionLoading(null);
    },
  });

  const syncMutation = (trpc.subscription as any).syncFromStripe.useMutation({
    onSuccess: (data: { success: boolean; tier?: string; status?: string; message?: string }) => {
      if (data.success) {
        toastCtx.addSuccess('Subscription synced', `Your plan has been updated to ${data.tier} (${data.status}).`);
      } else {
        toastCtx.addError('Sync issue', data.message || 'Could not find your subscription in Stripe.');
      }
      refetchSub();
      refetchStatus();
      setActionLoading(null);
    },
    onError: (err: any) => {
      toastCtx.addError('Sync failed', err?.message || 'Could not sync subscription from Stripe.');
      setActionLoading(null);
    },
  });

  const isLoading = subLoading || statusLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-500">Loading subscription...</span>
        </CardContent>
      </Card>
    );
  }

  const tier: SubscriptionTier = subscription?.tier || 'free';
  const tierInfo = TIER_INFO[tier];
  const TierIcon = tierInfo.icon;
  const status = subscription?.status || 'active';
  const cancelAtPeriodEnd = stripeStatus?.cancelAtPeriodEnd || false;
  const isPaused = status === 'paused';
  const pauseExpiresAt = subscription?.pauseExpiresAt ? new Date(subscription.pauseExpiresAt) : null;
  const currentPeriodEnd = stripeStatus?.currentPeriodEnd
    ? new Date(stripeStatus.currentPeriodEnd)
    : subscription?.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd)
      : null;
  const trialEnd = stripeStatus?.trialEnd
    ? new Date(stripeStatus.trialEnd)
    : subscription?.trialEndsAt
      ? new Date(subscription.trialEndsAt)
      : null;
  const isTrialing = status === 'trialing' || (trialEnd && trialEnd > new Date());
  const isPaid = tier !== 'free' && (status === 'active' || status === 'trialing' || status === 'paused');

  // Determine billing interval from Stripe status ("month" or "year")
  const billingInterval: 'month' | 'year' = (stripeStatus?.interval === 'year') ? 'year' : 'month';

  // Compute display price based on tier + interval
  const getPriceDisplay = () => {
    if (isPaused) return '$0/month (paused)';
    if (tier === 'starter') {
      return billingInterval === 'year' ? '$90/year' : '$9/month';
    }
    if (tier === 'enterprise') {
      return billingInterval === 'year' ? '$790/year' : '$79/month';
    }
    // professional
    return billingInterval === 'year' ? '$290/year' : '$29/month';
  };

  const getEffectiveMonthly = () => {
    if (billingInterval !== 'year') return null;
    if (tier === 'starter') return '$7.50/mo effective';
    if (tier === 'enterprise') return '$65.83/mo effective';
    return '$24.17/mo effective';
  };

  const handleUpgrade = (plan: 'starter' | 'professional' | 'enterprise') => {
    setActionLoading(`upgrade-${plan}`);
    const origin = window.location.origin;
    checkoutMutation.mutate({
      plan,
      interval: upgradeInterval,
      successUrl: `${origin}/dashboard?subscription=success`,
      cancelUrl: `${origin}/dashboard`,
    });
  };

  const handleCancel = () => {
    setActionLoading('cancel');
    cancelMutation.mutate();
  };

  const handleReactivate = () => {
    setActionLoading('reactivate');
    reactivateMutation.mutate();
  };

  const handlePause = () => {
    setActionLoading('pause');
    pauseMutation.mutate();
  };

  const handleResume = () => {
    setActionLoading('resume');
    resumeMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPaused ? 'bg-amber-50' : tierInfo.bgColor}`}>
              {isPaused ? (
                <PauseCircle className="h-5 w-5 text-amber-600" />
              ) : (
                <TierIcon className={`h-5 w-5 ${tierInfo.color}`} />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Subscription</CardTitle>
              <CardDescription>Manage your plan and billing</CardDescription>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isPaused ? 'bg-amber-50 text-amber-700' : `${tierInfo.bgColor} ${tierInfo.color}`}`}>
            {isPaused ? 'Paused' : tierInfo.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Paused Banner */}
        {isPaused && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <PauseCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Subscription Paused</span>
            </div>
            <p className="text-xs text-amber-700">
              Your billing is paused. You won't be charged until you resume. Paid features are temporarily unavailable.
            </p>
            {pauseExpiresAt && (
              <p className="text-xs text-amber-600">
                Auto-resumes on <strong>{pauseExpiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
              </p>
            )}
            <Button
              onClick={handleResume}
              disabled={actionLoading === 'resume'}
              className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {actionLoading === 'resume' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              Resume Subscription
            </Button>
          </div>
        )}

        {/* Current Plan Summary */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Current Plan</span>
            <span className="text-sm font-bold">{tierInfo.label}</span>
          </div>
          <p className="text-xs text-slate-500">{tierInfo.description}</p>

          {/* Status */}
          {isPaid && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Status</span>
                <span className="flex items-center gap-1 text-sm">
                  {isPaused ? (
                    <>
                      <PauseCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-amber-600 font-medium">Paused</span>
                    </>
                  ) : cancelAtPeriodEnd ? (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-amber-600 font-medium">Cancels at period end</span>
                    </>
                  ) : isTrialing ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-blue-600 font-medium">Trial</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-green-600 font-medium">Active</span>
                    </>
                  )}
                </span>
              </div>

              {/* Trial End */}
              {isTrialing && trialEnd && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Trial ends</span>
                  <span className="text-sm font-medium">
                    {trialEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}

              {/* Billing Period / Next billing */}
              {!isPaused && (() => {
                // During trial, show trial end as the first billing date
                if (isTrialing && trialEnd) {
                  return (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        First billing
                      </span>
                      <span className="text-sm font-medium">
                        {trialEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  );
                }
                // After trial, show current period end
                if (currentPeriodEnd) {
                  return (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {cancelAtPeriodEnd ? 'Access until' : 'Next billing'}
                      </span>
                      <span className="text-sm font-medium">
                        {currentPeriodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Pause Expiry */}
              {isPaused && pauseExpiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Auto-resumes
                  </span>
                  <span className="text-sm font-medium">
                    {pauseExpiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}

              {/* Billing Interval */}
              {!isPaused && billingInterval === 'year' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Billing</span>
                  <span className="text-sm font-medium text-green-600">Yearly (2 months free)</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  Price
                </span>
                <span className="text-sm font-medium">
                  {isPaused ? (
                    <span className="text-amber-600">$0/month (paused)</span>
                  ) : (
                    <span>{getPriceDisplay()}</span>
                  )}
                </span>
              </div>
              {/* Effective monthly for yearly plans */}
              {!isPaused && getEffectiveMonthly() && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600"></span>
                  <span className="text-xs text-green-600">{getEffectiveMonthly()}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Plan selector — always show all tiers */}
          {!cancelAtPeriodEnd && !isPaused && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700">{tier === 'free' ? 'Choose a Plan' : 'Change Plan'}</h4>
              {/* Billing interval toggle */}
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center bg-gray-100 rounded-full p-0.5">
                  <button
                    onClick={() => setUpgradeInterval('month')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      upgradeInterval === 'month'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setUpgradeInterval('year')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      upgradeInterval === 'year'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Yearly
                    <span className="ml-1 text-[10px] font-semibold text-green-600">Save 17%</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {/* Starter */}
                <button
                  onClick={() => tier !== 'starter' && handleUpgrade('starter')}
                  disabled={actionLoading === 'upgrade-starter' || tier === 'starter'}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    tier === 'starter'
                      ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  } ${tier === 'starter' ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${tier === 'starter' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Zap className={`h-4 w-4 ${tier === 'starter' ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">Starter</div>
                      <div className="text-xs text-gray-500">Unlimited bookings, Rider Builder, 2 releases</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{upgradeInterval === 'year' ? '$7.50/mo' : '$9/mo'}</div>
                    {upgradeInterval === 'year' && <div className="text-[10px] text-gray-500">$90/yr</div>}
                    {tier === 'starter' && <span className="text-[10px] font-medium text-blue-600">Current</span>}
                  </div>
                </button>
                {/* Professional */}
                <button
                  onClick={() => tier !== 'professional' && handleUpgrade('professional')}
                  disabled={actionLoading === 'upgrade-professional' || tier === 'professional'}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    tier === 'professional'
                      ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  } ${tier === 'professional' ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${tier === 'professional' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                      <Crown className={`h-4 w-4 ${tier === 'professional' ? 'text-purple-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">Professional</div>
                      <div className="text-xs text-gray-500">Unlimited releases, contracts, analytics, priority support</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{upgradeInterval === 'year' ? '$24.17/mo' : '$29/mo'}</div>
                    {upgradeInterval === 'year' && <div className="text-[10px] text-gray-500">$290/yr</div>}
                    {tier === 'professional' && <span className="text-[10px] font-medium text-purple-600">Current</span>}
                  </div>
                </button>
                {/* Enterprise */}
                <button
                  onClick={() => tier !== 'enterprise' && handleUpgrade('enterprise')}
                  disabled={actionLoading === 'upgrade-enterprise' || tier === 'enterprise'}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    tier === 'enterprise'
                      ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200'
                      : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                  } ${tier === 'enterprise' ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${tier === 'enterprise' ? 'bg-amber-100' : 'bg-gray-100'}`}>
                      <Crown className={`h-4 w-4 ${tier === 'enterprise' ? 'text-amber-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">Enterprise</div>
                      <div className="text-xs text-gray-500">Sponsor showcase, analytics, media kit, branded events</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{upgradeInterval === 'year' ? '$65.83/mo' : '$79/mo'}</div>
                    {upgradeInterval === 'year' && <div className="text-[10px] text-gray-500">$790/yr</div>}
                    {tier === 'enterprise' && <span className="text-[10px] font-medium text-amber-600">Current</span>}
                  </div>
                </button>
              </div>
              {upgradeInterval === 'year' && (
                <p className="text-[11px] text-center text-gray-500">Billed annually. 2 months free vs monthly.</p>
              )}
            </div>
          )}

          {/* Pause / Cancel — only show when active and not already cancelling */}
          {isPaid && !cancelAtPeriodEnd && !isPaused && (
            <>
              {/* Pause Confirmation */}
              {showPauseConfirm ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <p className="text-xs text-amber-800">
                    Pausing will stop billing for up to 90 days. Your profile stays visible but marked inactive. You can resume anytime.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePause}
                      disabled={actionLoading === 'pause'}
                      size="sm"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {actionLoading === 'pause' ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <PauseCircle className="h-3 w-3 mr-1" />
                      )}
                      Confirm Pause
                    </Button>
                    <Button
                      onClick={() => setShowPauseConfirm(false)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      Never Mind
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPauseConfirm(true)}
                  className="w-full text-amber-600 border-amber-200 hover:bg-amber-50 text-xs"
                >
                  <PauseCircle className="h-3 w-3 mr-1" />
                  Pause Subscription (up to 90 days)
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={actionLoading === 'cancel'}
                className="w-full text-slate-500 hover:text-red-600 text-xs"
              >
                {actionLoading === 'cancel' ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : null}
                Cancel Subscription
              </Button>
            </>
          )}

          {/* Reactivate — show when cancelling at period end */}
          {isPaid && cancelAtPeriodEnd && !isPaused && (
            <Button
              onClick={handleReactivate}
              disabled={actionLoading === 'reactivate'}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {actionLoading === 'reactivate' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Reactivate Subscription
            </Button>
          )}

          {/* Sync from Stripe — always available to re-sync tier from Stripe */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActionLoading('sync');
              syncMutation.mutate();
            }}
            disabled={actionLoading === 'sync'}
            className="w-full text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            {actionLoading === 'sync' ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Sync from Stripe
          </Button>

          {/* View all plans */}
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate('/pricing')}
            className="w-full text-xs text-slate-500"
          >
            Compare all plans
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
