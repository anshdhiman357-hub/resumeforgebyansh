import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Download,
  FileDown,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ResumePreview } from "@/components/ResumePreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { analyzeAts, generateResumeDraft, type AtsResult } from "@/lib/ai.functions";
import {
  emptyCertification,
  emptyEducation,
  emptyExperience,
  emptyProject,
  normalizeResume,
  resumeToText,
  scoreLabel,
  type ResumeContent,
} from "@/lib/resume";

export const Route = createFileRoute("/_authenticated/resume/$id")({
  head: () => ({
    meta: [
      { title: "Resume editor & ATS check — ResumeForge" },
      {
        name: "description",
        content:
          "Edit your resume, generate AI content, and score it against any job description for ATS compatibility.",
      },
      { property: "og:title", content: "Resume editor & ATS check — ResumeForge" },
      {
        property: "og:description",
        content: "AI resume editing with live ATS scoring and keyword gap analysis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResumeEditor,
});

function ResumeEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const generateDraft = useServerFn(generateResumeDraft);
  const runAts = useServerFn(analyzeAts);

  const [title, setTitle] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [resume, setResume] = useState<ResumeContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [background, setBackground] = useState("");
  const [seniority, setSeniority] = useState("");
  const [skillsHint, setSkillsHint] = useState("");
  const [ats, setAts] = useState<AtsResult | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["resume", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("resumes").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setTargetRole(data.target_role ?? "");
    setResume(normalizeResume(data.content));
  }, [data]);

  const resumeText = useMemo(() => (resume ? resumeToText(resume) : ""), [resume]);

  function update(mutate: (draft: ResumeContent) => void) {
    setResume((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      mutate(next);
      return next;
    });
  }

  async function save() {
    if (!resume) return;
    setSaving(true);
    const { error } = await supabase
      .from("resumes")
      .update({ title, target_role: targetRole, content: resume })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Resume saved");
  }

  async function draftWithAi() {
    setDrafting(true);
    try {
      const result = await generateDraft({
        data: { targetRole, seniority, rawBackground: background, skills: skillsHint },
      });
      update((draft) => {
        draft.basics.summary = result.summary;
        draft.skills = Array.from(new Set([...draft.skills, ...result.skills]));
        if (draft.experience.length === 0) draft.experience = [emptyExperience()];
        const first = draft.experience[0];
        if (first) first.bullets = result.bullets;
      });
      toast.success("AI draft added — review and edit before saving.");
    } catch (err) {
      toast.error(readableError(err));
    } finally {
      setDrafting(false);
    }
  }

  async function checkAts() {
    if (!resumeText.trim()) return;
    setScanning(true);
    try {
      const result = await runAts({ data: { resumeText, jobDescription, targetRole } });
      setAts(result);
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("ats_reports").insert({
          user_id: userData.user.id,
          resume_id: id,
          job_description: jobDescription,
          score: result.score,
          section_scores: result.sectionScores,
          matched_keywords: result.matchedKeywords,
          missing_keywords: result.missingKeywords,
          suggestions: result.suggestions,
        });
      }
    } catch (err) {
      toast.error(readableError(err));
    } finally {
      setScanning(false);
    }
  }

  function downloadDocx() {
    if (!resume) return;
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset="utf-8"></head><body><pre style="font-family:Calibri,Arial,sans-serif;font-size:11pt;white-space:pre-wrap">${escapeHtml(
      resumeText,
    )}</pre></body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(title || "resume").replace(/\s+/g, "-").toLowerCase()}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">This resume could not be loaded.</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/dashboard" })}>
          Back to my resumes
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen print:bg-transparent">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-hero opacity-90 print:hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklab,var(--primary)_28%,transparent),transparent)] print:hidden"
      />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="sticky top-16 z-30 -mx-2 mb-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-2 backdrop-blur-md print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
            <ArrowLeft className="size-4" /> My resumes
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadDocx}>
              <FileDown className="size-4" /> DOCX
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download className="size-4" /> PDF
            </Button>
            <Button size="sm" className="shadow-glow" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="print:hidden [&_[data-slot=card]]:border-border/60 [&_[data-slot=card]]:bg-card/70 [&_[data-slot=card]]:backdrop-blur-sm [&_[data-slot=card]]:transition-shadow [&_[data-slot=card]:hover]:shadow-elevated">
            <Tabs defaultValue="content">
              <TabsList className="grid w-full grid-cols-3 border border-border/60 bg-card/60 backdrop-blur">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="ai">AI assist</TabsTrigger>
                <TabsTrigger value="ats">ATS check</TabsTrigger>
              </TabsList>


            {/* ---------------- Content ---------------- */}
            <TabsContent value="content" className="space-y-5 pt-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resume settings</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Field label="Version name" value={title} onChange={setTitle} />
                  <Field
                    label="Target job title"
                    value={targetRole}
                    onChange={setTargetRole}
                    placeholder="Frontend Developer"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personal details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    value={resume.basics.fullName}
                    onChange={(v) => update((d) => void (d.basics.fullName = v))}
                  />
                  <Field
                    label="Headline"
                    value={resume.basics.title}
                    onChange={(v) => update((d) => void (d.basics.title = v))}
                  />
                  <Field
                    label="Email"
                    value={resume.basics.email}
                    onChange={(v) => update((d) => void (d.basics.email = v))}
                  />
                  <Field
                    label="Phone"
                    value={resume.basics.phone}
                    onChange={(v) => update((d) => void (d.basics.phone = v))}
                  />
                  <Field
                    label="Location"
                    value={resume.basics.location}
                    onChange={(v) => update((d) => void (d.basics.location = v))}
                  />
                  <Field
                    label="LinkedIn"
                    value={resume.basics.linkedin}
                    onChange={(v) => update((d) => void (d.basics.linkedin = v))}
                  />
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Professional summary</Label>
                    <Textarea
                      className="mt-2"
                      rows={4}
                      value={resume.basics.summary}
                      onChange={(e) => update((d) => void (d.basics.summary = e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Experience</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => update((d) => void d.experience.push(emptyExperience()))}
                  >
                    <Plus className="size-4" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-5">
                  {resume.experience.map((item, index) => (
                    <div key={index} className="rounded-lg border border-border p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Role"
                          value={item.role}
                          onChange={(v) => update((d) => void (d.experience[index]!.role = v))}
                        />
                        <Field
                          label="Company"
                          value={item.company}
                          onChange={(v) => update((d) => void (d.experience[index]!.company = v))}
                        />
                        <Field
                          label="Start"
                          value={item.start}
                          onChange={(v) => update((d) => void (d.experience[index]!.start = v))}
                          placeholder="Jan 2023"
                        />
                        <Field
                          label="End"
                          value={item.end}
                          onChange={(v) => update((d) => void (d.experience[index]!.end = v))}
                          placeholder="Present"
                        />
                      </div>
                      <Label className="mt-4 block text-xs">Achievements</Label>
                      <div className="mt-2 space-y-2">
                        {item.bullets.map((bullet, bulletIndex) => (
                          <div key={bulletIndex} className="flex gap-2">
                            <Textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) =>
                                update(
                                  (d) =>
                                    void (d.experience[index]!.bullets[bulletIndex] =
                                      e.target.value),
                                )
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Remove bullet"
                              onClick={() =>
                                update((d) => void d.experience[index]!.bullets.splice(bulletIndex, 1))
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => update((d) => void d.experience[index]!.bullets.push(""))}
                        >
                          <Plus className="size-4" /> Bullet
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => update((d) => void d.experience.splice(index, 1))}
                        >
                          Remove role
                        </Button>
                      </div>
                    </div>
                  ))}
                  {resume.experience.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No experience added yet.</p>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Education</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => update((d) => void d.education.push(emptyEducation()))}
                  >
                    <Plus className="size-4" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resume.education.map((item, index) => (
                    <div key={index} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
                      <Field
                        label="Degree"
                        value={item.degree}
                        onChange={(v) => update((d) => void (d.education[index]!.degree = v))}
                      />
                      <Field
                        label="School"
                        value={item.school}
                        onChange={(v) => update((d) => void (d.education[index]!.school = v))}
                      />
                      <Field
                        label="Start"
                        value={item.start}
                        onChange={(v) => update((d) => void (d.education[index]!.start = v))}
                      />
                      <Field
                        label="End"
                        value={item.end}
                        onChange={(v) => update((d) => void (d.education[index]!.end = v))}
                      />
                      <div className="sm:col-span-2 flex items-end gap-2">
                        <div className="flex-1">
                          <Field
                            label="Details"
                            value={item.details}
                            onChange={(v) => update((d) => void (d.education[index]!.details = v))}
                            placeholder="GPA, honours, coursework"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove education"
                          onClick={() => update((d) => void d.education.splice(index, 1))}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {resume.education.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No education added yet.</p>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Projects</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => update((d) => void d.projects.push(emptyProject()))}
                  >
                    <Plus className="size-4" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resume.projects.map((item, index) => (
                    <div key={index} className="grid gap-3 rounded-lg border border-border p-4">
                      <Field
                        label="Name"
                        value={item.name}
                        onChange={(v) => update((d) => void (d.projects[index]!.name = v))}
                      />
                      <Field
                        label="Description"
                        value={item.description}
                        onChange={(v) => update((d) => void (d.projects[index]!.description = v))}
                      />
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Field
                            label="Link"
                            value={item.link}
                            onChange={(v) => update((d) => void (d.projects[index]!.link = v))}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove project"
                          onClick={() => update((d) => void d.projects.splice(index, 1))}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {resume.projects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No projects added yet.</p>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Skills & certifications</CardTitle>
                  <CardDescription>Comma separated.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Skills</Label>
                    <Textarea
                      className="mt-2"
                      rows={3}
                      value={resume.skills.join(", ")}
                      onChange={(e) => update((d) => void (d.skills = splitList(e.target.value)))}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Certifications</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          update((d) => void d.certifications.push(emptyCertification()))
                        }
                      >
                        <Plus className="size-4" /> Add
                      </Button>
                    </div>
                    {resume.certifications.map((cert, index) => (
                      <div key={index} className="rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Certification name"
                            value={cert.name}
                            onChange={(e) =>
                              update((d) => {
                                const item = d.certifications[index];
                                if (item) item.name = e.target.value;
                              })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => update((d) => void d.certifications.splice(index, 1))}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          {cert.image ? (
                            <img
                              src={cert.image}
                              alt={`${cert.name || "Certificate"} preview`}
                              className="h-14 w-20 rounded border border-border object-cover"
                            />
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            <input
                              id={`cert-image-${index}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (!file) return;
                                if (file.size > 1_500_000) {
                                  toast.error("Image too large — please use one under 1.5 MB.");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const result = String(reader.result ?? "");
                                  update((d) => {
                                    const item = d.certifications[index];
                                    if (item) item.image = result;
                                  });
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                document.getElementById(`cert-image-${index}`)?.click()
                              }
                            >
                              <ImagePlus className="size-4" />
                              {cert.image ? "Replace image" : "Add image"}
                            </Button>
                            {cert.image ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  update((d) => {
                                    const item = d.certifications[index];
                                    if (item) item.image = "";
                                  })
                                }
                              >
                                Remove image
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                    {resume.certifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No certifications yet.</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---------------- AI assist ---------------- */}
            <TabsContent value="ai" className="pt-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Let AI write the first draft</CardTitle>
                  <CardDescription>
                    Describe your background in plain words. AI writes a summary, keyword-rich
                    skills, and achievement bullets you can edit.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field
                    label="Target job title"
                    value={targetRole}
                    onChange={setTargetRole}
                    placeholder="Data Analyst"
                  />
                  <Field
                    label="Experience level"
                    value={seniority}
                    onChange={setSeniority}
                    placeholder="Fresher / 3 years / Senior"
                  />
                  <div>
                    <Label className="text-xs">Your background</Label>
                    <Textarea
                      className="mt-2"
                      rows={6}
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      placeholder="What you studied, where you worked, what you built, tools you use…"
                    />
                  </div>
                  <Field
                    label="Key skills"
                    value={skillsHint}
                    onChange={setSkillsHint}
                    placeholder="SQL, Python, Excel"
                  />
                  <Button onClick={draftWithAi} disabled={drafting} className="w-full">
                    {drafting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Wand2 className="size-4" />
                    )}
                    Generate resume content
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---------------- ATS ---------------- */}
            <TabsContent value="ats" className="space-y-5 pt-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ATS compatibility check</CardTitle>
                  <CardDescription>
                    Paste the job description to match keywords, or leave it empty for a general
                    check.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    rows={8}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here…"
                  />
                  <Button onClick={checkAts} disabled={scanning} className="w-full">
                    {scanning ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    Run ATS analysis
                  </Button>
                </CardContent>
              </Card>

              {ats ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-baseline gap-3 text-base">
                      <span className="font-display text-4xl text-primary">{ats.score}</span>
                      <span className="text-muted-foreground">/ 100 · {scoreLabel(ats.score)}</span>
                    </CardTitle>
                    <CardDescription>{ats.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-3">
                      {(
                        [
                          ["Keyword match", ats.sectionScores.keywords],
                          ["Formatting", ats.sectionScores.formatting],
                          ["Impact & metrics", ats.sectionScores.impact],
                          ["Completeness", ats.sectionScores.completeness],
                        ] as const
                      ).map(([label, value]) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{label}</span>
                            <span>{value}</span>
                          </div>
                          <Progress value={value} className="mt-1 h-2" />
                        </div>
                      ))}
                    </div>

                    {ats.matchedKeywords.length ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Matched keywords
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ats.matchedKeywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {ats.missingKeywords.length ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Missing keywords
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ats.missingKeywords.map((keyword) => (
                            <Badge key={keyword} variant="outline">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={() =>
                            update(
                              (d) =>
                                void (d.skills = Array.from(
                                  new Set([...d.skills, ...ats.missingKeywords]),
                                )),
                            )
                          }
                        >
                          Add missing keywords to skills
                        </Button>
                      </div>
                    ) : null}

                    {ats.suggestions.length ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Suggestions
                        </p>
                        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
                          {ats.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>

          <div className="lg:sticky lg:top-32 lg:self-start">
            <ResumePreview resume={resume} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        className="mt-2"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function readableError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("429")) return "AI is busy right now. Please retry in a moment.";
  if (message.includes("402")) return "AI credits are exhausted. Please top up to continue.";
  return message || "Something went wrong.";
}
