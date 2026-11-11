import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Award, BriefcaseBusiness, Camera, CheckCircle2, GraduationCap, Handshake, Layers3, Mail, Mic2, Sparkles, Users, Video } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import EduShareButtons from '@/components/EduShareButtons';
import { setMetaTags } from "@/utils/seoMeta";
import { EDU_SHARE_TITLE, EDU_SHARE_DESCRIPTION, EDU_SHARE_URL, EDU_SHARE_IMAGE, EDU_SHARE_IMAGE_ALT } from '@shared/eduShare';

const programPillars = [
  {
    icon: GraduationCap,
    title: "Build before graduation",
    copy: "Create a professional presence, portfolio, and audience while you are still developing your craft.",
  },
  {
    icon: Layers3,
    title: "Learn by doing",
    copy: "Publish work, promote projects, sell creative products, host events, and practice the business side of entertainment.",
  },
  {
    icon: Handshake,
    title: "Connect across disciplines",
    copy: "Find musicians, filmmakers, producers, performers, photographers, and collaborators in one creative ecosystem.",
  },
];

const studentBenefits = [
  "Free entry-level profile to get started",
  "Professional creator profile and portfolio tools",
  "Music, video, book, merch, and ticketing pathways",
  "Fan growth, direct connections, and creator promotion",
  "Opportunities to collaborate across creative disciplines",
  "A transition path into standard OlogyWood membership after graduation",
];

const eduPolicy = [
  ["50% student discount", "Approved students are eligible for 50% off Starter or Professional at a separate successful checkout. Eligibility approval is not paid activation. Enterprise remains institution-specific."],
  ["12-month verification", "Eligibility lasts 12 months. All school-email, school-code, and other enrollment evidence requires manual review; entering an email or code does not automatically verify ownership, validity, or enrollment."],
  ["30-day renewal grace", "A 30-day grace period follows the verification deadline. Submit renewal evidence from your student status page; current eligibility and grace dates remain unchanged during review. Check the page for deadlines rather than relying on email reminders. No account or creative work is deleted."],
  ["Free pilot access", "A school pilot can begin with a defined 90-day cohort and no automatic paid conversion or institutional billing obligation."],
];

const pilotSteps = [
  ["01", "Choose a department", "Start with one focused program such as recording arts, film, music business, or entertainment production."],
  ["02", "Run a 90-day cohort", "Invite a small group of students, introduce the platform, and help them complete professional creator profiles."],
  ["03", "Measure real activity", "Track profile completion, published work, collaborations, ticketing, sales, and retention—not registrations alone."],
];

const showcaseDisciplines = [
  { icon: Mic2, title: "Music + audio", copy: "Release work, build a portfolio, and grow direct connections with listeners." },
  { icon: Video, title: "Film + video", copy: "Present projects, collaborators, and production experience in one place." },
  { icon: Camera, title: "Visual media", copy: "Show photography, design, and visual storytelling with context." },
  { icon: Users, title: "Live production", copy: "Connect performance, event, and behind-the-scenes experience." },
  { icon: BriefcaseBusiness, title: "Entertainment business", copy: "Practice the professional habits that turn creative work into momentum." },
];

export default function Edu() {
  useEffect(() => {
    setMetaTags({
      title: EDU_SHARE_TITLE,
      description: EDU_SHARE_DESCRIPTION,
      canonical: EDU_SHARE_URL,
      ogUrl: EDU_SHARE_URL,
      ogImage: EDU_SHARE_IMAGE,
      ogImageAlt: EDU_SHARE_IMAGE_ALT,
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#080914] text-white">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_78%_12%,rgba(168,85,247,0.3),transparent_32%),linear-gradient(135deg,#0b1021_0%,#100b20_55%,#070811_100%)]">
          <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" aria-hidden="true" />
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-10 lg:py-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-300/30 bg-purple-300/10 px-4 py-2 text-sm font-medium text-purple-200">
                <Sparkles className="h-4 w-4" /> OlogyWood EDU
              </div>
              <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">The next generation of entertainment starts here.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">A launchpad for emerging artists, filmmakers, producers, performers, and entertainment professionals to build, collaborate, showcase, and monetize their creativity.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/edu/apply?path=student" className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3.5 font-semibold transition hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300">
                  Start as a student <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/edu/apply?path=school" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-300">
                  Explore a school pilot <Handshake className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-5 text-sm text-slate-400">Free entry-level access is available. The approved 50% Starter/Professional discount requires manual eligibility approval and a separate successful checkout; approval alone does not activate a paid plan.</p>
              <Link href="/edu/verify" className="mt-3 inline-flex text-sm font-semibold text-purple-300 hover:text-purple-200">Already have an account? Submit student verification →</Link>
              <EduShareButtons />
            </div>
            <div className="relative rounded-3xl border border-white/15 bg-white/[0.06] p-6 shadow-2xl shadow-purple-950/30 backdrop-blur sm:p-8">
              <div className="absolute -right-3 -top-3 rounded-full bg-fuchsia-500 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">Launchpad</div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Create", "Profile + portfolio"],
                  ["Connect", "People + opportunities"],
                  ["Showcase", "Work + events"],
                  ["Grow", "Fans + revenue"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                    <p className="text-sm font-semibold uppercase tracking-widest text-purple-300">{label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-purple-300/20 bg-purple-500/10 p-5">
                <p className="text-sm leading-6 text-purple-100">Your first professional presence should not have to wait until after graduation.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-purple-950/20">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">The approved EDU framework</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A meaningful benefit with clear guardrails.</h2>
              <p className="mt-4 leading-7 text-slate-300">The EDU policy is designed to be attractive to students and responsible for schools. Student pricing is not automatic: documented eligibility must be manually approved, and paid activation requires a separate successful checkout.</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {eduPolicy.map(([title, copy]) => (
                <article key={title} className="rounded-2xl border border-purple-300/15 bg-white/[0.05] p-6">
                  <h3 className="text-xl font-semibold text-white">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-400">{copy}</p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-sm leading-6 text-slate-400">Graduates may keep their account and creative work; if EDU eligibility ends, the account transitions to the applicable standard plan price after notice. Students are not automatically enrolled in a paid plan.</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">More than a discount</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A place to practice the creative business.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">OlogyWood EDU is designed to help students turn creative work into professional momentum—without promising bookings, employment, income, or school endorsement.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {programPillars.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 transition hover:-translate-y-1 hover:border-purple-400/40">
                <Icon className="h-8 w-8 text-purple-300" />
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-slate-400">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.03]">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">For students</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Start with the tools you need now.</h2>
              <p className="mt-4 leading-7 text-slate-300">You do not need to wait until your career is established. Begin with a free profile, then grow into paid creator capabilities when they become useful.</p>
              <Link href="/pricing" className="mt-7 inline-flex items-center gap-2 font-semibold text-purple-300 hover:text-purple-200">See current plans <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {studentBenefits.map(benefit => (
                <div key={benefit} className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/30 p-4 text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <span className="leading-6">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0d1022]">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">Your creativity deserves an audience</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Build a body of work people can understand.</h2>
              <p className="mt-4 leading-7 text-slate-300">Start with the work you are making now. These are illustrative pathways—not claims about completed student projects—and each can grow into a professional creator presence on OlogyWood.</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {showcaseDisciplines.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="rounded-2xl border border-purple-300/15 bg-purple-500/[0.07] p-5 transition hover:-translate-y-1 hover:border-purple-300/40">
                  <Icon className="h-7 w-7 text-purple-300" aria-hidden="true" />
                  <h3 className="mt-5 font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-purple-950/20">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">Campus community</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Become an OlogyWood Campus Ambassador.</h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-300">Help connect the next generation of artists, filmmakers, producers, and entertainment professionals. We are collecting early interest while the program structure is finalized.</p>
              <Link href="/edu/apply?path=student&interest=ambassador" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-500">Share ambassador interest <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {["Peer leadership and campus connection", "Creator showcases and networking", "Recognition for verified participation"].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4 text-slate-200"><Award className="h-5 w-5 shrink-0 text-fuchsia-300" aria-hidden="true" /><span>{item}</span></div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">For schools and departments</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Pilot a professional creator ecosystem.</h2>
              <p className="mt-4 leading-7 text-slate-300">Start small with one department and a 90-day cohort. OlogyWood can support a measurable pilot before any broader institutional commitment.</p>
              <Link href="/edu/apply?path=school" className="mt-7 inline-flex items-center gap-2 rounded-xl border border-purple-300/40 bg-purple-500/10 px-5 py-3 font-semibold text-purple-100 hover:bg-purple-500/20">Request a partnership conversation <Mail className="h-4 w-4" /></Link>
            </div>
            <div className="space-y-4">
              {pilotSteps.map(([number, title, copy]) => (
                <div key={number} className="flex gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <span className="text-2xl font-bold text-purple-300">{number}</span>
                  <div><h3 className="text-xl font-semibold">{title}</h3><p className="mt-2 leading-7 text-slate-400">{copy}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
          <div className="rounded-3xl border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/15 via-purple-500/10 to-transparent p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-200">Future-facing initiative</p>
            <div className="mt-3 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h2 className="text-3xl font-bold sm:text-4xl">OlogyWood HBCU Creator Initiative</h2>
                <p className="mt-4 max-w-3xl leading-7 text-slate-300">A proposed OlogyWood EDU program for cross-campus collaboration, creator showcases, and emerging-talent discovery across HBCU communities. This is an idea in development, not an announced institutional partnership.</p>
              </div>
              <Link href="/edu/apply?path=school" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 font-semibold text-white hover:bg-white/15">Discuss a pilot <Handshake className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0b1021]">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">Professional Toolbelt</p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Know your rights. Build your leverage.</h2>
                <p className="mt-4 leading-7 text-slate-300">The new entertainment world rewards creators who understand ownership, metadata, licensing and the difference between a promising opportunity and a contract they should review carefully.</p>
                <p className="mt-4 text-sm leading-6 text-slate-400">These guides provide general education, not legal, tax or royalty-administration advice. Confirm current rules with the relevant organization and a qualified professional.</p>
                <Link href="/help?article=toolbelt-release-checklist" className="mt-7 inline-flex items-center gap-2 font-semibold text-purple-300 hover:text-purple-200">Open the release checklist <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Know Your Rights", "Composition, master, publishing, performance, sync and digital rights.", "toolbelt-know-your-rights"],
                  ["Follow the Money", "Map PROs, SoundExchange, The MLC, distributors, publishers and other revenue paths.", "toolbelt-royalty-map"],
                  ["Get Sync Ready", "Prepare rights documentation, instrumentals, stems and clearance contacts.", "toolbelt-sync-ready"],
                  ["Sync Licensing & Radio Placements", "Prepare, pitch and document sync uses and radio opportunities with the right permissions.", "toolbelt-sync-radio-placements"],
                  ["Radio, Streaming & Distribution", "Keep credits, identifiers, delivery records and royalty paths accurate.", "toolbelt-radio-streaming"],
                  ["Understand the Deal", "Review territory, term, exclusivity, compensation, AI and sublicensing language.", "toolbelt-review-opportunity"],
                  ["Build Your Professional Toolkit", "Use a practical release, placement and record-keeping checklist.", "toolbelt-release-checklist"],
                  ["Register with the Right Organization", "A step-by-step starting point for ASCAP and SoundExchange registration.", "toolbelt-pro-registration"],
                ].map(([title, copy, guide]) => (
                  <Link key={title} href={`/help?article=${guide}`} className="rounded-2xl border border-purple-300/15 bg-purple-500/[0.07] p-5 transition hover:-translate-y-1 hover:border-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-300">
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-purple-300">Read guide <ArrowRight className="h-3.5 w-3.5" /></span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-purple-700 to-fuchsia-700">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between lg:px-10">
            <div><h2 className="text-3xl font-bold">Build your next opportunity early.</h2><p className="mt-2 text-purple-100">Join the platform where creative education meets real-world momentum.</p></div>
             <div className="flex flex-col gap-3 sm:flex-row"><Link href="/get-started" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-purple-800 hover:bg-purple-50">Create a free profile <ArrowRight className="h-4 w-4" /></Link><Link href="/edu/apply?path=school" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-5 py-3 font-semibold text-white hover:bg-white/10">Talk to OlogyWood <BriefcaseBusiness className="h-4 w-4" /></Link></div>
          </div>
        </section>
      </main>
    </div>
  );
}
