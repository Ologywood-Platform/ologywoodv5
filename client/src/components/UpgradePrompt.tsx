/**
 * UpgradePrompt — Shows when a user tries to access a feature above their tier.
 * Displays the required plan and a CTA to upgrade.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface UpgradePromptProps {
  feature: string;
  requiredPlan: string;
  description?: string;
}

export function UpgradePrompt({ feature, requiredPlan, description }: UpgradePromptProps) {
  const [, navigate] = useLocation();

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardContent className="py-8 text-center">
        <Lock className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-1">{feature} — {requiredPlan} Plan Required</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
          {description || `Upgrade to the ${requiredPlan} plan to unlock ${feature.toLowerCase()} and grow your career.`}
        </p>
        <Button onClick={() => navigate("/pricing")} className="gap-2">
          View Plans <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Inline upgrade banner for use within existing pages
 */
export function UpgradeBanner({ feature, requiredPlan, onUpgrade }: { feature: string; requiredPlan: string; onUpgrade?: () => void }) {
  const [, navigate] = useLocation();

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Lock className="h-5 w-5 text-amber-500 shrink-0" />
        <div>
          <p className="text-sm font-medium">{feature} requires {requiredPlan} plan</p>
          <p className="text-xs text-muted-foreground">Upgrade to unlock this feature</p>
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={onUpgrade || (() => navigate("/pricing"))} className="shrink-0">
        Upgrade
      </Button>
    </div>
  );
}
