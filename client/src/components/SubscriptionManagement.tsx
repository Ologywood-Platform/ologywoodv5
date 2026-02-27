import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, CreditCard, Calendar, ArrowUpRight, AlertTriangle, CheckCircle, Loader2, Shield, Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/ErrorToast';
import { useLocation } from 'wouter';

type SubscriptionTier = 'free' | 'starter' | 'professional';

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
    description: '2 bookings/month, basic profile',
  },
  starter: {
    label: 'Starter',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: Zap,
    description: 'Unlimited bookings, Rider Builder, fan updates',
  },
  professional: {
    label: 'Professional',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    icon: Crown,
    description: 'Contracts, e-signatures, analytics, priority support',
  },
};

export function SubscriptionManagement() {
  const [, navigate] = useLocation();
  const toastCtx = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
  const isPaid = tier !== 'free' && (status === 'active' || status === 'trialing');

  const handleUpgrade = (plan: 'starter' | 'professional') => {
    setActionLoading(`upgrade-${plan}`);
    const origin = window.location.origin;
    checkoutMutation.mutate({
      plan,
      successUrl: `${origin}/artist-dashboard?subscription=success`,
      cancelUrl: `${origin}/artist-dashboard`,
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${tierInfo.bgColor}`}>
              <TierIcon className={`h-5 w-5 ${tierInfo.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg">Subscription</CardTitle>
              <CardDescription>Manage your plan and billing</CardDescription>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tierInfo.bgColor} ${tierInfo.color}`}>
            {tierInfo.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
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
                  {cancelAtPeriodEnd ? (
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

              {/* Billing Period */}
              {currentPeriodEnd && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {cancelAtPeriodEnd ? 'Access until' : 'Next billing'}
                  </span>
                  <span className="text-sm font-medium">
                    {currentPeriodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  Price
                </span>
                <span className="text-sm font-medium">
                  {tier === 'starter' ? '$9' : '$29'}/month
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {/* Free tier — show upgrade options */}
          {tier === 'free' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                onClick={() => handleUpgrade('starter')}
                disabled={actionLoading === 'upgrade-starter'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionLoading === 'upgrade-starter' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Upgrade to Starter — $9/mo
              </Button>
              <Button
                onClick={() => handleUpgrade('professional')}
                disabled={actionLoading === 'upgrade-professional'}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {actionLoading === 'upgrade-professional' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Crown className="h-4 w-4 mr-2" />
                )}
                Go Professional — $29/mo
              </Button>
            </div>
          )}

          {/* Starter tier — show upgrade to Professional */}
          {tier === 'starter' && !cancelAtPeriodEnd && (
            <Button
              onClick={() => handleUpgrade('professional')}
              disabled={actionLoading === 'upgrade-professional'}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {actionLoading === 'upgrade-professional' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowUpRight className="h-4 w-4 mr-2" />
              )}
              Upgrade to Professional — $29/mo
            </Button>
          )}

          {/* Cancel / Reactivate */}
          {isPaid && !cancelAtPeriodEnd && (
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
          )}

          {isPaid && cancelAtPeriodEnd && (
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
