import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ArrowLeft, Loader2, Send } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import { trpc } from "@/lib/trpc";
import { setMetaTags } from "@/utils/seoMeta";

type Path = "student" | "school";

export default function EduApply() {
  const [path, setPath] = useState<Path>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [program, setProgram] = useState("");
  const [cohortSize, setCohortSize] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submitted, setSubmitted] = useState<{ path: Path; email: string } | null>(null);
  const [error, setError] = useState("");
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  useEffect(() => {
    setMetaTags({
      title: "OlogyWood EDU — Get Started",
      description: "Tell OlogyWood whether you are a student interested in EDU or a school exploring a pilot.",
      canonical: "/edu/apply",
    });
    const requestedPath = new URLSearchParams(window.location.search).get("path");
    const requestedInterest = new URLSearchParams(window.location.search).get("interest");
    if (requestedPath === "school") setPath("school");
    if (requestedInterest === "ambassador") setProgram("Campus ambassador interest");
  }, []);

  const subject = useMemo(() => path === "school" ? "EDU School Pilot" as const : "EDU Student Interest" as const, [path]);
  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: (_result, request) => {
      // Use the completed request, not fields or tabs that may have changed in flight.
      const completedPath = request.subject === "EDU School Pilot" ? "school" : "student";
      setPath(completedPath);
      setSubmitted({ path: completedPath, email: request.email });
      setError("");
    },
    onError: (submissionError) => {
      setSubmitted(null);
      setError(submissionError.message || "We could not send your interest form. Please try again.");
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitMutation.isPending) return;
    setSubmitted(null);
    setError("");
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (school.trim().length < 2) return setError(path === "school" ? "Please enter your institution or department." : "Please enter your school or program.");
    if (message.trim().length < 10) return setError("Please tell us a little more so we can route your request.");

    submitMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      subject,
      message: [
        `EDU path: ${path}`,
        `School or institution: ${school.trim()}`,
        program.trim() ? `Program or department: ${program.trim()}` : "",
        path === "school" && cohortSize.trim() ? `Estimated participating students: ${cohortSize.trim()}` : "",
        "",
        message.trim(),
      ].filter(Boolean).join("\n"),
      website,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
        <Link href="/edu" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900"><ArrowLeft className="h-4 w-4" /> Back to OlogyWood EDU</Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-700">OlogyWood EDU</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Let&apos;s build the right starting point.</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">This is an interest form, not eligibility approval or paid activation, and not a promise of admission, employment, bookings, or income. The approved student framework is 50% off Starter or Professional after manual eligibility review and a separate successful checkout. We will use your answers to understand whether a student start or a school pilot is the right next step.</p>
            <div className="mt-8 space-y-3 text-sm text-slate-600">
              <div className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />No payment is required to submit interest.</div>
              <div className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />Approved eligibility lasts 12 months with a 30-day renewal grace period. Enterprise pricing remains institution-specific.</div>
              <div className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />A free OlogyWood account remains available separately.</div>
            </div>
            {path === "student" && <Link href="/edu/verify" className="mt-5 inline-flex text-sm font-semibold text-purple-700 underline">Already have an account? Submit evidence for manual eligibility review.</Link>}
            <Link href={path === "school" ? "/help?article=edu-school-pilot-guide" : "/help?article=edu-enrollment-guide"} target="_blank" rel="noopener noreferrer" className="mt-4 block text-sm font-semibold text-purple-700 underline">{path === "school" ? "School pilot help (opens a new tab)" : "EDU enrollment help (opens a new tab)"}</Link>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="edu-apply-title">
            <h2 id="edu-apply-title" className="text-2xl font-bold">Tell us about your interest</h2>
            <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="EDU interest path">
              {(["student", "school"] as const).map(option => (
                <button key={option} type="button" role="tab" aria-selected={path === option} disabled={submitMutation.isPending} onClick={() => { if (submitMutation.isPending) return; setPath(option); setSubmitted(null); setError(""); }} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${path === option ? "bg-white text-purple-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                  {option === "student" ? "I’m a student" : "I represent a school"}
                </button>
              ))}
            </div>

            {submitted ? (
              <div ref={successRef} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" aria-labelledby="edu-interest-success" className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 outline-none focus:ring-2 focus:ring-emerald-600">
                <CheckCircle2 aria-hidden="true" className="h-10 w-10 text-emerald-600" />
                <h3 id="edu-interest-success" className="mt-4 text-2xl font-bold text-emerald-950">{submitted.path === "school" ? "School interest submitted successfully." : "Student interest submitted successfully."}</h3>
                <p className="mt-2 break-words text-sm leading-6 text-emerald-900">We received your interest form with the contact email <strong>{submitted.email}</strong>.</p>
                <h4 className="mt-5 font-semibold text-emerald-950">What happens next</h4>
                {submitted.path === "school" ? <>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-emerald-900">
                    <li>The OlogyWood team will review your request and follow up at <span className="break-words">{submitted.email}</span> to discuss a possible pilot.</li>
                    <li>Prepare your cohort goals, approximate cohort size, and the creative work you want students to practice.</li>
                  </ol>
                  <p className="mt-4 text-sm font-semibold leading-6 text-emerald-950">This interest form does not automatically activate a school pilot or start billing. Pilot scope and institution-specific pricing require a separate discussion.</p>
                  <Link href="/edu" className="mt-5 inline-flex rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-800">Review EDU school pilot information</Link>
                </> : <>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-emerald-900">
                    <li>Create or sign in to a free OlogyWood profile using Sign Up or Sign In in the header.</li>
                    <li>Submit your enrollment evidence on the EDU verification page for manual eligibility review.</li>
                    <li>Check your review status on that page. If approved, discounted paid activation still requires a separate successful checkout.</li>
                  </ol>
                  <p className="mt-4 text-sm font-semibold leading-6 text-emerald-950">This interest form did not create an account, approve your eligibility, or charge any payment.</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/" className="inline-flex rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-800">Create or sign in to a free profile</Link>
                    <Link href="/edu/verify" className="inline-flex rounded-lg border border-purple-700 px-4 py-2.5 text-sm font-semibold text-purple-800 hover:bg-purple-50">Submit evidence / check status</Link>
                  </div>
                </>}
              </div>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true"><label htmlFor="edu-website">Website</label><input id="edu-website" value={website} onChange={event => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></div>
                <div><label htmlFor="edu-name" className="mb-1.5 block text-sm font-semibold">Your name</label><input id="edu-name" value={name} onChange={event => setName(event.target.value)} maxLength={100} required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>
                <div><label htmlFor="edu-email" className="mb-1.5 block text-sm font-semibold">Email</label><input id="edu-email" type="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={320} required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>
                <div><label htmlFor="edu-school" className="mb-1.5 block text-sm font-semibold">{path === "school" ? "Institution or department" : "School or program"}</label><input id="edu-school" value={school} onChange={event => setSchool(event.target.value)} maxLength={200} required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>
                <div><label htmlFor="edu-program" className="mb-1.5 block text-sm font-semibold">Program or department <span className="font-normal text-slate-500">(optional)</span></label><input id="edu-program" value={program} onChange={event => setProgram(event.target.value)} maxLength={200} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>
                {path === "school" && <div><label htmlFor="edu-cohort-size" className="mb-1.5 block text-sm font-semibold">Estimated participating students <span className="font-normal text-slate-500">(optional)</span></label><input id="edu-cohort-size" inputMode="numeric" value={cohortSize} onChange={event => setCohortSize(event.target.value.replace(/[^0-9-+ ]/g, "").slice(0, 40))} maxLength={40} placeholder="For example, 25–40" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>}
                <div><label htmlFor="edu-message" className="mb-1.5 block text-sm font-semibold">What are you hoping to do?</label><textarea id="edu-message" value={message} onChange={event => setMessage(event.target.value)} minLength={10} maxLength={4000} required rows={5} placeholder={path === "school" ? "Tell us about the department, cohort size, and what a pilot should help students practice." : "Tell us about your creative discipline and what you want to build on OlogyWood."} className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100" /></div>
                {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</p>}
                <button type="submit" disabled={submitMutation.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-700 px-4 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60">{submitMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Send EDU interest</>}</button>
                <p className="text-xs leading-5 text-slate-500">By sending this form, you agree that OlogyWood may contact you about the EDU program. See our <Link href="/privacy-policy" className="text-purple-700 underline">Privacy Policy</Link>.</p>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
