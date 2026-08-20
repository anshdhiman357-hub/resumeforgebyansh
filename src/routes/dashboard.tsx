import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { FilePlus2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createResume,
  deleteResume,
  listResumes,
  type StoredResume,
} from "@/lib/resume-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My resumes — ResumeForge" },
      {
        name: "description",
        content: "Manage your saved resume versions and ATS score history in ResumeForge.",
      },
      { property: "og:title", content: "My resumes — ResumeForge" },
      { property: "og:description", content: "Manage saved resume versions and ATS reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setResumes(listResumes());
    setReady(true);
  }, []);

  function startNew() {
    const item = createResume();
    navigate({ to: "/resume/$id", params: { id: item.id } });
  }

  function remove(id: string) {
    deleteResume(id);
    setResumes(listResumes());
    toast.success("Resume deleted");
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">My resumes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Build, tailor and score as many versions as you need — saved right in this browser.
            </p>
          </div>
          <Button onClick={startNew}>
            <FilePlus2 className="size-4" /> New resume
          </Button>
        </div>

        {!ready ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
        ) : resumes.length === 0 ? (
          <Card className="mt-8 border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <p className="font-display text-lg">No resumes yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Start a resume, let AI draft your summary and bullet points, then check the ATS
                score against any job description.
              </p>
              <Button onClick={startNew}>Create your first resume</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => (
              <Card key={resume.id} className="transition-colors hover:border-primary/60">
                <CardHeader>
                  <CardTitle className="truncate text-base">{resume.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {resume.target_role || "No target role"} · updated{" "}
                    {new Date(resume.updated_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button size="sm" asChild>
                    <Link to="/resume/$id" params={{ id: resume.id }}>
                      Open
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(resume.id)}
                    aria-label={`Delete ${resume.title}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
