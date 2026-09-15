# NIL Readiness Protections — Implementation Design

**Author:** Manus AI  
**Status:** Approved implementation design  
**Legal boundary:** This is a product-control design, not legal advice. S. 4668 is proposed rather than enacted, and qualified sports counsel must review the final Terms and contract language before OlogyWood relies on it.

## Product posture

OlogyWood remains a **self-service technology marketplace**, not an athlete agent. The platform does not negotiate or solicit endorsement agreements for athletes. Existing platform fee percentages remain unchanged and are presented separately from any athlete-agent fee.

The new controls are voluntary readiness protections based on the August 2026 revised Senate text. The interface must never describe the proposal as enacted law or represent that OlogyWood, an institution, an athletic association, or a lawyer has certified a deal.

## Private athlete compliance profile

One private `nil_athlete_compliance_profiles` record belongs to one Athlete artist profile. It stores athletic status, institution and association information, institution state, eligibility end date, compliance-office contact, minor/guardian status, representative involvement, and a timestamped athlete attestation. None of these fields is returned by public artist-profile procedures.

The allowed athletic-status values are `prospective_student_athlete`, `college_student_athlete`, `professional_athlete`, `former_athlete`, and `other`. The association/division fields are descriptive rather than a legal eligibility determination. The athlete must confirm that the information is self-reported and may require institutional or legal review.

## NIL deal compliance record

One `nil_compliance_deals` record represents one athlete-controlled compliance entry. A deal can optionally reference an OlogyWood booking or Ology Live booking, but it does not replace either source record and does not alter payment accounting.

Each deal records whether it is NIL activity and whether it is an endorsement contract, the source/counterparty, agreement and compensation dates, gross compensation, services, term, nonperformance termination terms, enrollment/residency nonconditioning confirmation, representative identity and state-registration details, and separately classified athlete compensation, platform service fee, payment-processing fee, and agent fee.

When the athlete voluntarily uses the proposed-protection mode for a covered student-athlete endorsement, the agent fee percentage cannot exceed **5%** of the endorsement contract value. This limit never changes OlogyWood platform or Stripe fees.

## Reporting readiness and in-app reminders

The platform groups deals by an athlete-controlled normalized source key and calculates gross NIL compensation from that source over the preceding twelve months. The current proposed reporting threshold is shown as **$600**. Agreement reminders use five calendar days from entry; compensation reminders use thirty calendar days from receipt when the compensation was not already reported.

Deadlines are calculated when the authenticated athlete opens the NIL Compliance Center. No background job or email automation is created. Reminder status is derived as `not_required`, `upcoming`, `due`, `overdue`, or `submitted`. OlogyWood does not claim to file reports. The athlete or an authorized representative records submission status, timestamp, recipient, attestation, and optional evidence.

## Evidence and immutable history

Evidence bytes are stored privately in S3 under an owner-scoped random key. The database stores only the key, URL, file name, MIME type, size, and uploader metadata. Evidence accepts PDF, PNG, JPEG, or WebP up to 10 MB.

Every create, update, submission, attestation, and evidence action appends a `nil_compliance_events` row. No product API updates or deletes event rows. Event snapshots contain compliance metadata only and exclude file bytes, secrets, payment credentials, and signatures.

## Contract and Terms versioning

The shared constants `NIL_TERMS_VERSION` and `NIL_CONTRACT_TEMPLATE_VERSION` are embedded into new NIL compliance records, generated booking NIL contracts, and athlete Ology Live session contracts. Existing contracts remain readable and retain their original data. New generated contracts store a compliance snapshot and version identifier; signed records are never silently rewritten.

Contract language replaces “NCAA Compliant” with **“Athlete self-certified; institutional or legal review may be required.”** It replaces “Platform disclosure via Ologywood” with a truthful athlete/authorized-representative status. It separates athlete compensation, OlogyWood platform service fees, Stripe/payment-processing fees, and any representative fee. It also includes services, parties, nonperformance termination, eligibility-limited term where relevant, enrollment/residency nonconditioning, and a proposed-statutory-rights arbitration carve-out.

## Authorization

All compliance profile, deal, reporting, evidence, and audit procedures require an authenticated user who owns an artist profile whose `talentType` is `athlete`. Invited team members do not receive NIL compliance access in the first version because the records contain private eligibility, representative, and evidence information. Administrators do not receive an implicit bypass through the athlete API; any future compliance review must use a separate audited administrative procedure.

Ology Live remains available to all creator types. Athlete-only contract analysis, NIL templates, earnings reports, and compliance controls are server-gated by the owned Athlete profile.

## Legacy and payment boundaries

All schema changes are additive and nullable/default-safe. Existing athlete profiles, bookings, contracts, Ology Live sessions, signatures, and payment records remain unchanged. Current 1% booking/release, 15% Ology Live, 15% Fan Club, subscription, and Stripe-processing calculations are not modified. The implementation changes labels and contract presentation so those charges are not described as agent compensation.

## Implementation and validation record

The private NIL Compliance Center, athlete onboarding intake, deal log, proposed-protection toggle, fee separation, representative registration fields, rolling twelve-month calculation, five-day and thirty-day in-app reminders, submission attestations, private evidence workflow, and append-only history are implemented. Athlete NIL template discovery and creation, NIL contract analysis, NIL activity exports, and the Compliance Center are server-gated to an owned Athlete profile. Ology Live creation and ordinary earnings remain available to all creator types.

The generated booking NIL contract and Ology Live agreement now use versioned readiness language, separated fee classifications, non-agent disclosures, written-service and termination terms, enrollment/residency nonconditioning language, eligibility-limited terms where applicable, and preserved non-waivable student-athlete rights. The Terms amendment is versioned as `2026-09-29` and uses the existing in-app notice and acceptance flow. The language does not state that S. 4668 is enacted or that OlogyWood certifies NCAA, institutional, state, or federal compliance.

The additive migration created `nil_athlete_compliance_profiles`, `nil_compliance_deals`, and `nil_compliance_events`, and added nullable version/snapshot fields to existing contract tables. A narrow idempotent runtime compatibility guard handles legacy database drift by creating only those approved tables and inspecting columns before adding only missing metadata. The guard tolerates a legacy environment that does not yet have the optional Ology Live session-contract table. No destructive DDL is used.

Private evidence is stored under an owner-scoped randomized S3 key. Athlete-facing audit responses expose only a `hasEvidence` flag and file metadata—not the storage key or a durable URL. Opening evidence requires a separate owner-authorized request that issues a short-lived storage URL.

An isolated real-database validation proved Athlete authorization, non-Athlete denial, proposed 5% rejection and acceptance, separated fees, rolling-threshold reminders, athlete-attested submission status, redacted evidence fields, immutable event history, and exact zero-residue cleanup. Responsive validation used the actual Compliance Center component with isolated data and confirmed mobile card stacking, readable deadline controls, separated-fee presentation, and desktop continuity. All validation-only routes, users, profiles, deals, events, sessions, scripts, and token files were removed.

Validation completed with TypeScript passing, **535 focused NIL/security/payment/contract tests passing**, the complete suite passing with **2,809 tests and 23 skipped**, and the production build succeeding. Repository hygiene checks found no whitespace errors, conflict markers, temporary validation artifacts, or exposed secrets.

> **Counsel review remains required:** Before relying on these provisions as legal compliance controls, qualified sports counsel should approve the Terms amendment, generated NIL contract clauses, student-athlete statutory-rights carve-out, representative-fee scope, and institutional/state disclosure workflow. The feature is technically ready to publish as a voluntary readiness tool; it is not a legal certification system.

The publishable implementation checkpoint is `ab7198f4`.

## Post-publication wording correction

Live verification of checkpoint `189fad61` found one remaining homepage card labeled **“NCAA Compliant”** with unsupported school-approval wording. The card was replaced with **“NIL Readiness Tools”** and now describes private deal records, proposed reporting reminders, fee separation, and the need for institutional or legal review. A permanent regression now rejects the former homepage certification claim. The affected 86-test set, TypeScript, the complete 2,809-test suite with 23 skipped, and the production build passed after the correction.
