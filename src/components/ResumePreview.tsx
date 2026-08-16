import type { ResumeContent } from "@/lib/resume";

export function ResumePreview({ resume }: { resume: ResumeContent }) {
  const b = resume.basics;
  const contact = [b.email, b.phone, b.location, b.website, b.linkedin].filter(Boolean);

  return (
    <div
      id="resume-sheet"
      className="mx-auto w-full max-w-[820px] rounded-lg bg-paper p-10 text-paper-foreground shadow-elevated"
    >
      <header className="border-b border-paper-foreground/20 pb-4">
        <h1 className="font-display text-3xl font-semibold">{b.fullName || "Your Name"}</h1>
        {b.title ? <p className="mt-1 text-sm font-medium opacity-80">{b.title}</p> : null}
        {contact.length ? (
          <p className="mt-2 text-xs opacity-70">{contact.join("  •  ")}</p>
        ) : null}
      </header>

      {b.summary ? (
        <Section title="Professional Summary">
          <p className="text-sm leading-relaxed">{b.summary}</p>
        </Section>
      ) : null}

      {resume.experience.length ? (
        <Section title="Experience">
          <div className="space-y-4">
            {resume.experience.map((item, index) => (
              <div key={index}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {item.role || "Role"}
                    {item.company ? ` — ${item.company}` : ""}
                  </p>
                  <p className="text-xs opacity-70">
                    {[item.start, item.end].filter(Boolean).join(" – ")}
                  </p>
                </div>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  {item.bullets.filter(Boolean).map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {resume.projects.length ? (
        <Section title="Projects">
          <div className="space-y-2 text-sm">
            {resume.projects.map((project, index) => (
              <div key={index}>
                <span className="font-semibold">{project.name}</span>
                {project.description ? ` — ${project.description}` : ""}
                {project.link ? <span className="opacity-70"> ({project.link})</span> : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {resume.education.length ? (
        <Section title="Education">
          <div className="space-y-2 text-sm">
            {resume.education.map((item, index) => (
              <div key={index} className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  <span className="font-semibold">{item.degree || "Degree"}</span>
                  {item.school ? ` — ${item.school}` : ""}
                  {item.details ? <span className="opacity-70"> · {item.details}</span> : null}
                </span>
                <span className="text-xs opacity-70">
                  {[item.start, item.end].filter(Boolean).join(" – ")}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {resume.skills.length ? (
        <Section title="Skills">
          <p className="text-sm leading-relaxed">{resume.skills.join(" • ")}</p>
        </Section>
      ) : null}

      {resume.certifications.length ? (
        <Section title="Certifications">
          <p className="text-sm leading-relaxed">{resume.certifications.join(" • ")}</p>
        </Section>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 font-display text-xs font-bold uppercase tracking-[0.18em] opacity-70">
        {title}
      </h2>
      {children}
    </section>
  );
}
