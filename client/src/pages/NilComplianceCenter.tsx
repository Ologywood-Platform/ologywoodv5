import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, ExternalLink, FileCheck2, Plus, Scale, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { SiteHeader } from "@/components/SiteHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NIL_AGENT_FEE_MAX_PERCENT,
  NIL_ATHLETIC_STATUS_LABELS,
  NIL_ATHLETIC_STATUS_VALUES,
  NIL_DEAL_TYPE_VALUES,
  type NilAthleticStatus,
} from "@shared/nilCompliance";

type ProfileForm = {
  athleticStatus: NilAthleticStatus;
  institutionName: string;
  institutionState: string;
  associationName: string;
  divisionLevel: string;
  eligibilityEndsAt: string;
  complianceContactName: string;
  complianceContactEmail: string;
  complianceContactPhone: string;
  isMinor: boolean;
  guardianName: string;
  guardianEmail: string;
  representativeInvolved: boolean;
  attested: boolean;
};

const emptyProfile: ProfileForm = {
  athleticStatus: "college_student_athlete",
  institutionName: "",
  institutionState: "",
  associationName: "",
  divisionLevel: "",
  eligibilityEndsAt: "",
  complianceContactName: "",
  complianceContactEmail: "",
  complianceContactPhone: "",
  isMinor: false,
  guardianName: "",
  guardianEmail: "",
  representativeInvolved: false,
  attested: false,
};

type DealForm = {
  sourceName: string;
  title: string;
  dealType: (typeof NIL_DEAL_TYPE_VALUES)[number];
  agreementDate: string;
  termStartsAt: string;
  termEndsAt: string;
  servicesDescription: string;
  counterpartyName: string;
  counterpartyEmail: string;
  grossCompensation: string;
  compensationReceivedAmount: string;
  compensationReceivedAt: string;
  isEndorsementContract: boolean;
  proposedProtectionEnabled: boolean;
  divisionOneReportingApplies: boolean;
  writtenAgreementConfirmed: boolean;
  nonperformanceTerminationTerms: string;
  notConditionedOnEnrollmentOrResidency: boolean;
  representativeInvolved: boolean;
  representativeName: string;
  representativeEmail: string;
  representativeRegistrationState: string;
  representativeRegistrationNumber: string;
  agencyContractConfirmed: boolean;
  agentFeePercent: string;
  platformServiceFeeAmount: string;
  paymentProcessingFeeAmount: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const emptyDeal: DealForm = {
  sourceName: "",
  title: "",
  dealType: "brand_endorsement",
  agreementDate: today(),
  termStartsAt: "",
  termEndsAt: "",
  servicesDescription: "",
  counterpartyName: "",
  counterpartyEmail: "",
  grossCompensation: "",
  compensationReceivedAmount: "",
  compensationReceivedAt: "",
  isEndorsementContract: true,
  proposedProtectionEnabled: true,
  divisionOneReportingApplies: false,
  writtenAgreementConfirmed: false,
  nonperformanceTerminationTerms: "",
  notConditionedOnEnrollmentOrResidency: false,
  representativeInvolved: false,
  representativeName: "",
  representativeEmail: "",
  representativeRegistrationState: "",
  representativeRegistrationNumber: "",
  agencyContractConfirmed: false,
  agentFeePercent: "",
  platformServiceFeeAmount: "",
  paymentProcessingFeeAmount: "",
};

function asDate(value: string) {
  return value ? new Date(`${value}T12:00:00.000Z`) : null;
}

function money(value: string) {
  return value.trim() ? Number(value) : null;
}

function formatMoney(value: string | number | null | undefined) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function reminderBadge(status: string) {
  if (status === "overdue") return <Badge variant="destructive">Overdue</Badge>;
  if (status === "due") return <Badge className="bg-amber-500">Due within 24 hours</Badge>;
  if (status === "upcoming") return <Badge variant="secondary">Upcoming</Badge>;
  if (status === "submitted") return <Badge className="bg-emerald-600">Submission recorded</Badge>;
  return <Badge variant="outline">Not currently required</Badge>;
}

export default function NilComplianceCenter() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const dashboard = trpc.nilCompliance.getDashboard.useQuery();
  const events = trpc.nilCompliance.listEvents.useQuery(undefined, { enabled: !!dashboard.data?.complianceProfile });
  const [editingProfile, setEditingProfile] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfile);
  const [dealForm, setDealForm] = useState<DealForm>(emptyDeal);
  const [submissionDrafts, setSubmissionDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const profile = dashboard.data?.complianceProfile;
    if (!profile) return;
    setProfileForm({
      athleticStatus: profile.athleticStatus,
      institutionName: profile.institutionName || "",
      institutionState: profile.institutionState || "",
      associationName: profile.associationName || "",
      divisionLevel: profile.divisionLevel || "",
      eligibilityEndsAt: profile.eligibilityEndsAt ? new Date(profile.eligibilityEndsAt).toISOString().slice(0, 10) : "",
      complianceContactName: profile.complianceContactName || "",
      complianceContactEmail: profile.complianceContactEmail || "",
      complianceContactPhone: profile.complianceContactPhone || "",
      isMinor: profile.isMinor,
      guardianName: profile.guardianName || "",
      guardianEmail: profile.guardianEmail || "",
      representativeInvolved: profile.representativeInvolved,
      attested: false,
    });
  }, [dashboard.data?.complianceProfile]);

  const refresh = async () => {
    await Promise.all([utils.nilCompliance.getDashboard.invalidate(), utils.nilCompliance.listEvents.invalidate()]);
  };

  const saveProfile = trpc.nilCompliance.saveProfile.useMutation({
    onSuccess: async () => { toast.success("Private athlete compliance profile saved"); setEditingProfile(false); await refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const createDeal = trpc.nilCompliance.createDeal.useMutation({
    onSuccess: async () => { toast.success("NIL deal added to your private compliance log"); setDealForm({ ...emptyDeal, agreementDate: today() }); setShowDealForm(false); await refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const recordSubmission = trpc.nilCompliance.recordSubmission.useMutation({
    onSuccess: async () => { toast.success("Submission status recorded"); await refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const uploadEvidence = trpc.nilCompliance.uploadEvidence.useMutation({
    onSuccess: async () => { toast.success("Private disclosure evidence uploaded"); await refresh(); },
    onError: (error) => toast.error(error.message),
  });

  const openEvidence = async (eventId: number) => {
    try {
      const result = await utils.client.nilCompliance.getEvidenceUrl.query({ eventId });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(error?.message || "Could not open private evidence");
    }
  };

  const isStudentAthlete = profileForm.athleticStatus === "college_student_athlete" || profileForm.athleticStatus === "prospective_student_athlete";
  const protectedEndorsement = isStudentAthlete && dealForm.isEndorsementContract && dealForm.proposedProtectionEnabled;
  const currentSourceTotal = useMemo(() => dashboard.data?.deals.reduce((sum, deal) => sum + Number(deal.grossCompensation), 0) ?? 0, [dashboard.data?.deals]);

  const submitProfile = () => {
    saveProfile.mutate({
      ...profileForm,
      institutionName: profileForm.institutionName || null,
      institutionState: profileForm.institutionState || null,
      associationName: profileForm.associationName || null,
      divisionLevel: profileForm.divisionLevel || null,
      eligibilityEndsAt: asDate(profileForm.eligibilityEndsAt),
      complianceContactName: profileForm.complianceContactName || null,
      complianceContactEmail: profileForm.complianceContactEmail || null,
      complianceContactPhone: profileForm.complianceContactPhone || null,
      guardianName: profileForm.guardianName || null,
      guardianEmail: profileForm.guardianEmail || null,
      attested: true,
    });
  };

  const submitDeal = () => {
    createDeal.mutate({
      sourceType: "manual",
      sourceName: dealForm.sourceName,
      title: dealForm.title,
      dealType: dealForm.dealType,
      isNilActivity: true,
      isEndorsementContract: dealForm.isEndorsementContract,
      proposedProtectionEnabled: dealForm.proposedProtectionEnabled,
      divisionOneReportingApplies: dealForm.divisionOneReportingApplies,
      agreementDate: asDate(dealForm.agreementDate)!,
      termStartsAt: asDate(dealForm.termStartsAt),
      termEndsAt: asDate(dealForm.termEndsAt),
      servicesDescription: dealForm.servicesDescription,
      counterpartyName: dealForm.counterpartyName,
      counterpartyEmail: dealForm.counterpartyEmail || null,
      grossCompensation: money(dealForm.grossCompensation) ?? 0,
      compensationReceivedAmount: money(dealForm.compensationReceivedAmount),
      compensationReceivedAt: asDate(dealForm.compensationReceivedAt),
      writtenAgreementConfirmed: dealForm.writtenAgreementConfirmed,
      nonperformanceTerminationTerms: dealForm.nonperformanceTerminationTerms || null,
      notConditionedOnEnrollmentOrResidency: dealForm.notConditionedOnEnrollmentOrResidency,
      representativeInvolved: dealForm.representativeInvolved,
      representativeName: dealForm.representativeName || null,
      representativeEmail: dealForm.representativeEmail || null,
      representativeRegistrationState: dealForm.representativeRegistrationState || null,
      representativeRegistrationNumber: dealForm.representativeRegistrationNumber || null,
      agencyContractConfirmed: dealForm.agencyContractConfirmed,
      agentFeePercent: money(dealForm.agentFeePercent),
      platformServiceFeeAmount: money(dealForm.platformServiceFeeAmount),
      paymentProcessingFeeAmount: money(dealForm.paymentProcessingFeeAmount),
    });
  };

  if (dashboard.isLoading) return <div className="min-h-screen bg-background"><SiteHeader /><main className="container mx-auto px-4 py-12">Loading NIL Compliance Center…</main></div>;
  if (dashboard.error) return <div className="min-h-screen bg-background"><SiteHeader /><main className="container mx-auto px-4 py-12"><Alert variant="destructive"><AlertTitle>NIL Compliance Center unavailable</AlertTitle><AlertDescription>{dashboard.error.message}</AlertDescription></Alert></main></div>;

  const data = dashboard.data!;
  const showProfileForm = !data.complianceProfile || editingProfile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/40 dark:from-gray-950 dark:to-gray-900">
      <SiteHeader />
      <main className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button variant="ghost" size="sm" className="-ml-3 mb-2" onClick={() => navigate("/dashboard")}><ArrowLeft className="mr-2 h-4 w-4" />Artist Dashboard</Button>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Scale className="h-7 w-7 text-violet-600" />NIL Compliance Center</h1>
            <p className="mt-2 text-muted-foreground">Private readiness tools for {data.artistProfile.artistName}. Nothing here is displayed on your public profile.</p>
          </div>
          {data.complianceProfile && <Button variant="outline" onClick={() => setEditingProfile(true)}>Update private profile</Button>}
        </div>

        <Alert className="border-violet-200 bg-violet-50 dark:bg-violet-950/20">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Proposed federal protections—not enacted law</AlertTitle>
          <AlertDescription>OlogyWood is a technology marketplace, not your athlete agent or lawyer. These reminders do not file anything for you. Confirm requirements with your institution and qualified sports counsel.</AlertDescription>
        </Alert>

        {showProfileForm && (
          <Card>
            <CardHeader><CardTitle>Private athlete compliance profile</CardTitle><CardDescription>Used only for your contracts, reminders, and readiness checks.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><Label htmlFor="athleticStatus">Athletic status</Label><select id="athleticStatus" className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={profileForm.athleticStatus} onChange={(e) => setProfileForm({ ...profileForm, athleticStatus: e.target.value as NilAthleticStatus })}>{NIL_ATHLETIC_STATUS_VALUES.map((value) => <option key={value} value={value}>{NIL_ATHLETIC_STATUS_LABELS[value]}</option>)}</select></div>
              <div><Label htmlFor="institutionName">Institution</Label><Input id="institutionName" className="mt-1" value={profileForm.institutionName} onChange={(e) => setProfileForm({ ...profileForm, institutionName: e.target.value })} placeholder="College or university" /></div>
              <div><Label htmlFor="institutionState">Institution state</Label><Input id="institutionState" className="mt-1" value={profileForm.institutionState} onChange={(e) => setProfileForm({ ...profileForm, institutionState: e.target.value })} placeholder="State" /></div>
              <div><Label htmlFor="associationName">Association</Label><Input id="associationName" className="mt-1" value={profileForm.associationName} onChange={(e) => setProfileForm({ ...profileForm, associationName: e.target.value })} placeholder="NCAA, NAIA, conference, or other" /></div>
              <div><Label htmlFor="divisionLevel">Division / level</Label><Input id="divisionLevel" className="mt-1" value={profileForm.divisionLevel} onChange={(e) => setProfileForm({ ...profileForm, divisionLevel: e.target.value })} placeholder="Division I, Division II, NAIA…" /></div>
              <div><Label htmlFor="eligibilityEndsAt">Eligibility end date</Label><Input id="eligibilityEndsAt" type="date" className="mt-1" value={profileForm.eligibilityEndsAt} onChange={(e) => setProfileForm({ ...profileForm, eligibilityEndsAt: e.target.value })} /></div>
              <div><Label htmlFor="complianceContactName">Compliance contact</Label><Input id="complianceContactName" className="mt-1" value={profileForm.complianceContactName} onChange={(e) => setProfileForm({ ...profileForm, complianceContactName: e.target.value })} placeholder="Name" /></div>
              <div><Label htmlFor="complianceContactEmail">Compliance email</Label><Input id="complianceContactEmail" type="email" className="mt-1" value={profileForm.complianceContactEmail} onChange={(e) => setProfileForm({ ...profileForm, complianceContactEmail: e.target.value })} /></div>
              <div><Label htmlFor="complianceContactPhone">Compliance phone</Label><Input id="complianceContactPhone" className="mt-1" value={profileForm.complianceContactPhone} onChange={(e) => setProfileForm({ ...profileForm, complianceContactPhone: e.target.value })} /></div>
              <div className="space-y-3 pt-6">
                <label className="flex items-center gap-2"><Checkbox checked={profileForm.representativeInvolved} onCheckedChange={(value) => setProfileForm({ ...profileForm, representativeInvolved: value === true })} />I currently use an athlete representative or agent</label>
                <label className="flex items-center gap-2"><Checkbox checked={profileForm.isMinor} onCheckedChange={(value) => setProfileForm({ ...profileForm, isMinor: value === true })} />I am under 18</label>
              </div>
              {profileForm.isMinor && <><div><Label htmlFor="guardianName">Guardian name</Label><Input id="guardianName" className="mt-1" value={profileForm.guardianName} onChange={(e) => setProfileForm({ ...profileForm, guardianName: e.target.value })} /></div><div><Label htmlFor="guardianEmail">Guardian email</Label><Input id="guardianEmail" type="email" className="mt-1" value={profileForm.guardianEmail} onChange={(e) => setProfileForm({ ...profileForm, guardianEmail: e.target.value })} /></div></>}
              <label className="md:col-span-2 flex items-start gap-3 rounded-md border p-4 text-sm"><Checkbox checked={profileForm.attested} onCheckedChange={(value) => setProfileForm({ ...profileForm, attested: value === true })} /><span>I confirm this private information is accurate to the best of my knowledge. I understand OlogyWood does not determine eligibility or certify compliance.</span></label>
              <div className="md:col-span-2 flex gap-2"><Button onClick={submitProfile} disabled={!profileForm.attested || saveProfile.isPending}>{saveProfile.isPending ? "Saving…" : "Save private profile"}</Button>{data.complianceProfile && <Button variant="ghost" onClick={() => setEditingProfile(false)}>Cancel</Button>}</div>
            </CardContent>
          </Card>
        )}

        {data.complianceProfile && !showProfileForm && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Logged NIL value</p><p className="text-2xl font-bold">{formatMoney(currentSourceTotal)}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Needs attention</p><p className="text-2xl font-bold text-red-600">{data.reminderCounts.overdue + data.reminderCounts.due}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Representative fee ceiling</p><p className="text-2xl font-bold">{NIL_AGENT_FEE_MAX_PERCENT}%</p><p className="text-xs text-muted-foreground">Protected student-athlete endorsements only</p></CardContent></Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Private NIL deal log</CardTitle><CardDescription>Track agreements, separated fees, and proposed reporting deadlines.</CardDescription></div><Button onClick={() => setShowDealForm(!showDealForm)}><Plus className="mr-2 h-4 w-4" />Add NIL deal</Button></CardHeader>
              {showDealForm && <CardContent className="border-t pt-6 grid gap-4 md:grid-cols-2">
                <div><Label>Source / brand</Label><Input value={dealForm.sourceName} onChange={(e) => setDealForm({ ...dealForm, sourceName: e.target.value })} /></div>
                <div><Label>Deal title</Label><Input value={dealForm.title} onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })} /></div>
                <div><Label>Deal type</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={dealForm.dealType} onChange={(e) => setDealForm({ ...dealForm, dealType: e.target.value as DealForm["dealType"], isEndorsementContract: e.target.value === "brand_endorsement" })}>{NIL_DEAL_TYPE_VALUES.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></div>
                <div><Label>Agreement date</Label><Input type="date" value={dealForm.agreementDate} onChange={(e) => setDealForm({ ...dealForm, agreementDate: e.target.value })} /></div>
                <div><Label>Term starts</Label><Input type="date" value={dealForm.termStartsAt} onChange={(e) => setDealForm({ ...dealForm, termStartsAt: e.target.value })} /></div>
                <div><Label>Term ends</Label><Input type="date" value={dealForm.termEndsAt} onChange={(e) => setDealForm({ ...dealForm, termEndsAt: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Services / deliverables</Label><Textarea value={dealForm.servicesDescription} onChange={(e) => setDealForm({ ...dealForm, servicesDescription: e.target.value })} placeholder="Describe the posts, appearances, endorsements, or other services." /></div>
                <div><Label>Counterparty</Label><Input value={dealForm.counterpartyName} onChange={(e) => setDealForm({ ...dealForm, counterpartyName: e.target.value })} /></div>
                <div><Label>Counterparty email</Label><Input type="email" value={dealForm.counterpartyEmail} onChange={(e) => setDealForm({ ...dealForm, counterpartyEmail: e.target.value })} /></div>
                <div><Label>Athlete gross compensation</Label><Input type="number" min="0" step="0.01" value={dealForm.grossCompensation} onChange={(e) => setDealForm({ ...dealForm, grossCompensation: e.target.value })} /></div>
                <div><Label>Compensation received</Label><Input type="number" min="0" step="0.01" value={dealForm.compensationReceivedAmount} onChange={(e) => setDealForm({ ...dealForm, compensationReceivedAmount: e.target.value })} /></div>
                <div><Label>Date compensation received</Label><Input type="date" value={dealForm.compensationReceivedAt} onChange={(e) => setDealForm({ ...dealForm, compensationReceivedAt: e.target.value })} /></div>
                <div><Label>OlogyWood platform service fee</Label><Input type="number" min="0" step="0.01" value={dealForm.platformServiceFeeAmount} onChange={(e) => setDealForm({ ...dealForm, platformServiceFeeAmount: e.target.value })} placeholder="Separate from agent fees" /></div>
                <div><Label>Stripe / payment-processing fee</Label><Input type="number" min="0" step="0.01" value={dealForm.paymentProcessingFeeAmount} onChange={(e) => setDealForm({ ...dealForm, paymentProcessingFeeAmount: e.target.value })} /></div>
                <div className="space-y-3 rounded-md border p-4 md:col-span-2">
                  <label className="flex items-start gap-2"><Checkbox checked={dealForm.proposedProtectionEnabled} onCheckedChange={(value) => setDealForm({ ...dealForm, proposedProtectionEnabled: value === true })} /><span><strong>Apply proposed federal protection checks</strong><span className="block text-xs text-muted-foreground">Voluntary readiness checks while the Protect College Sports Act remains proposed and not enacted.</span></span></label>
                  <label className="flex items-center gap-2"><Checkbox checked={dealForm.divisionOneReportingApplies} onCheckedChange={(value) => setDealForm({ ...dealForm, divisionOneReportingApplies: value === true })} />Use proposed Division I reporting reminders for this deal</label>
                  <label className="flex items-center gap-2"><Checkbox checked={dealForm.writtenAgreementConfirmed} onCheckedChange={(value) => setDealForm({ ...dealForm, writtenAgreementConfirmed: value === true })} />The agreement is in writing</label>
                  <label className="flex items-center gap-2"><Checkbox checked={dealForm.notConditionedOnEnrollmentOrResidency} onCheckedChange={(value) => setDealForm({ ...dealForm, notConditionedOnEnrollmentOrResidency: value === true })} />Validity and payment are not conditioned on enrollment, continued enrollment, or residence</label>
                  <label className="flex items-center gap-2"><Checkbox checked={dealForm.representativeInvolved} onCheckedChange={(value) => setDealForm({ ...dealForm, representativeInvolved: value === true })} />An athlete representative or agent is involved</label>
                </div>
                <div className="md:col-span-2"><Label>Nonperformance termination terms</Label><Textarea value={dealForm.nonperformanceTerminationTerms} onChange={(e) => setDealForm({ ...dealForm, nonperformanceTerminationTerms: e.target.value })} /></div>
                {dealForm.representativeInvolved && <>
                  <div><Label>Representative name</Label><Input value={dealForm.representativeName} onChange={(e) => setDealForm({ ...dealForm, representativeName: e.target.value })} /></div>
                  <div><Label>Representative email</Label><Input type="email" value={dealForm.representativeEmail} onChange={(e) => setDealForm({ ...dealForm, representativeEmail: e.target.value })} /></div>
                  <div><Label>Registration state</Label><Input value={dealForm.representativeRegistrationState} onChange={(e) => setDealForm({ ...dealForm, representativeRegistrationState: e.target.value })} /></div>
                  <div><Label>Registration number</Label><Input value={dealForm.representativeRegistrationNumber} onChange={(e) => setDealForm({ ...dealForm, representativeRegistrationNumber: e.target.value })} /></div>
                  <div><Label>Representative fee (%)</Label><Input type="number" min="0" max={protectedEndorsement ? NIL_AGENT_FEE_MAX_PERCENT : 100} step="0.01" value={dealForm.agentFeePercent} onChange={(e) => setDealForm({ ...dealForm, agentFeePercent: e.target.value })} /><p className="mt-1 text-xs text-muted-foreground">{protectedEndorsement ? `Maximum ${NIL_AGENT_FEE_MAX_PERCENT}% for this proposed-protection student-athlete endorsement.` : "Recorded separately from OlogyWood and payment-processing fees."}</p></div>
                  <label className="flex items-center gap-2 pt-7"><Checkbox checked={dealForm.agencyContractConfirmed} onCheckedChange={(value) => setDealForm({ ...dealForm, agencyContractConfirmed: value === true })} />Separate written agency contract confirmed</label>
                </>}
                <div className="md:col-span-2 flex gap-2"><Button onClick={submitDeal} disabled={createDeal.isPending}>{createDeal.isPending ? "Saving…" : "Save private deal"}</Button><Button variant="ghost" onClick={() => setShowDealForm(false)}>Cancel</Button></div>
              </CardContent>}
            </Card>

            <div className="space-y-4">
              {data.deals.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">No private NIL deals logged yet.</CardContent></Card> : data.deals.map((deal) => {
                const agreementKey = `${deal.id}:agreement`;
                const compensationKey = `${deal.id}:compensation`;
                return <Card key={deal.id}>
                  <CardHeader><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>{deal.title}</CardTitle><CardDescription>{deal.sourceName} · {deal.dealType.replaceAll("_", " ")}</CardDescription></div><Badge variant="outline">{formatMoney(deal.grossCompensation)}</Badge></div></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Same source / rolling 12 months</p><p className="font-semibold">{formatMoney(deal.sameSourceTotalCents / 100)}</p></div><div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Separated fees</p><p className="text-sm">Agent {formatMoney(deal.agentFeeAmount)} · Platform {formatMoney(deal.platformServiceFeeAmount)} · Processing {formatMoney(deal.paymentProcessingFeeAmount)}</p></div></div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-md bg-muted/50 p-4"><div className="flex items-center justify-between gap-2"><p className="font-medium">Agreement reporting</p>{reminderBadge(deal.agreementReminderStatus)}</div><p className="mt-2 text-xs text-muted-foreground">{deal.agreementDueAt ? `Proposed deadline: ${new Date(deal.agreementDueAt).toLocaleDateString()}` : "Threshold or scope not currently met."}</p>{deal.agreementDisclosureStatus !== "submitted" && deal.reportingRequired && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input placeholder="Recipient recorded by athlete" value={submissionDrafts[agreementKey] || ""} onChange={(e) => setSubmissionDrafts({ ...submissionDrafts, [agreementKey]: e.target.value })} /><Button size="sm" onClick={() => recordSubmission.mutate({ dealId: deal.id, kind: "agreement", recipient: submissionDrafts[agreementKey] || "", submittedBy: "athlete", attested: true })}>Record submitted</Button></div>}</div>
                      <div className="rounded-md bg-muted/50 p-4"><div className="flex items-center justify-between gap-2"><p className="font-medium">Compensation reporting</p>{reminderBadge(deal.compensationReminderStatus)}</div><p className="mt-2 text-xs text-muted-foreground">{deal.compensationDueAt ? `Proposed deadline: ${new Date(deal.compensationDueAt).toLocaleDateString()}` : "Begins when compensation receipt is recorded and scope applies."}</p>{deal.compensationDisclosureStatus !== "submitted" && deal.compensationDueAt && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input placeholder="Recipient recorded by athlete" value={submissionDrafts[compensationKey] || ""} onChange={(e) => setSubmissionDrafts({ ...submissionDrafts, [compensationKey]: e.target.value })} /><Button size="sm" onClick={() => recordSubmission.mutate({ dealId: deal.id, kind: "compensation", recipient: submissionDrafts[compensationKey] || "", submittedBy: "athlete", attested: true })}>Record submitted</Button></div>}</div>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-violet-700"><Upload className="h-4 w-4" />Attach private evidence<input className="sr-only" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => uploadEvidence.mutate({ dealId: deal.id, fileName: file.name, mimeType: file.type as "application/pdf" | "image/png" | "image/jpeg" | "image/webp", fileData: String(reader.result) }); reader.readAsDataURL(file); event.target.value = ""; }} /></label>
                  </CardContent>
                </Card>;
              })}
            </div>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck2 className="h-5 w-5" />Private audit history</CardTitle><CardDescription>Append-only records of profile, deal, submission, and evidence actions.</CardDescription></CardHeader>
              <CardContent>{events.data?.length ? <div className="space-y-3">{events.data.slice(0, 20).map((event) => <div key={event.id} className="flex items-start gap-3 border-b pb-3 last:border-0"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{event.eventType.replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}{event.evidenceFileName ? ` · ${event.evidenceFileName}` : ""}</p>{event.hasEvidence && <Button type="button" variant="link" size="sm" className="h-auto px-0 text-xs" onClick={() => openEvidence(event.id)}><ExternalLink className="mr-1 h-3 w-3" />Open private evidence</Button>}</div></div>)}</div> : <p className="text-sm text-muted-foreground">No compliance history yet.</p>}</CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
