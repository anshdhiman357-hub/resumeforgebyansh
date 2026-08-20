import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Download,
  FileSearch,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResumeForge — AI Resume Builder & ATS Checker" },
      {
        name: "description",
        content:
          "Build an ATS-friendly resume with AI, match it to any job description, and get an instant ATS score with keyword fixes.",
      },
      { property: "og:title", content: "ResumeForge — AI Resume Builder & ATS Checker" },
      {
        property: "og:description",
        content:
          "AI-written resumes, instant ATS scoring, keyword gap analysis, and PDF/DOCX export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Sparkles,
    title: "AI resume builder",
    body: "Turn rough notes into a polished summary, keyword-rich skills, and quantified achievement bullets.",
  },
  {
    icon: FileSearch,
    title: "ATS compatibility score",
    body: "Score keywords, formatting, impact, and completeness out of 100 — with the reasons behind each number.",
  },
  {
    icon: Target,
    title: "Job description matching",
    body: "Paste any job post and see exactly which keywords you match and which ones you are missing.",
  },
  {
    icon: BarChart3,
    title: "Multiple versions",
    body: "Save a tailored resume per role and keep the score history for every version you create.",
  },
  {
    icon: Download,
    title: "PDF & DOCX export",
    body: "Export a clean, parser-safe layout that recruiters and screening systems can both read.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Your resumes and reports are tied to your account and visible only to you.",
  },
];

const steps = [
  "Create your account",
  "Enter your details or paste rough notes",
  "AI drafts your resume",
  "Run the ATS analysis",
  "Apply the fixes and download",
];

function Landing() {
  const primaryTo = "/dashboard";

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main>
        <section className="surface-hero border-b border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" /> AI resume builder + ATS checker
              </span>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.05] md:text-6xl">
                Write a resume that <span className="text-gradient-amber">gets past the bots</span>{" "}
                and impresses people.
              </h1>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
                Three out of four resumes are filtered out before a human ever reads them.
                ResumeForge drafts your resume with AI, scores it against the job description, and
                tells you exactly what to fix.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild className="shadow-glow">
                  <Link to={primaryTo}>
                    Build my resume <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to={primaryTo}>Check my ATS score</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Free to use · No sign-up required
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <h2 className="text-2xl font-semibold md:text-3xl">Everything you need to get shortlisted</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full transition-colors hover:border-primary/50">
                <CardContent className="pt-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <feature.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <h2 className="text-2xl font-semibold md:text-3xl">How it works</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-5">
              {steps.map((step, index) => (
                <li key={step} className="rounded-xl border border-border bg-background/60 p-5">
                  <span className="font-display text-2xl text-primary">0{index + 1}</span>
                  <p className="mt-2 text-sm leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">
            Stop guessing why you never hear back
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Build one resume, tailor it for every application, and know your score before you hit
            submit.
          </p>
          <Button size="lg" asChild className="mt-7 shadow-glow">
            <Link to={primaryTo}>
              Get started free <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        ResumeForge — AI resume builder and ATS checker.
      </footer>
    </div>
  );
}
