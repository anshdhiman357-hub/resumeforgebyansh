export type Experience = {
  company: string;
  role: string;
  start: string;
  end: string;
  bullets: string[];
};

export type Education = {
  school: string;
  degree: string;
  start: string;
  end: string;
  details: string;
};

export type Project = {
  name: string;
  description: string;
  link: string;
};

export type Certification = {
  name: string;
  image: string;
};

export type ResumeContent = {
  basics: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    summary: string;
  };
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: string[];
  certifications: Certification[];
};

export const emptyResume = (): ResumeContent => ({
  basics: {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    summary: "",
  },
  experience: [],
  education: [],
  projects: [],
  skills: [],
  certifications: [],
});

export const emptyExperience = (): Experience => ({
  company: "",
  role: "",
  start: "",
  end: "",
  bullets: [""],
});

export const emptyEducation = (): Education => ({
  school: "",
  degree: "",
  start: "",
  end: "",
  details: "",
});

export const emptyProject = (): Project => ({ name: "", description: "", link: "" });

export function normalizeResume(raw: unknown): ResumeContent {
  const base = emptyResume();
  if (!raw || typeof raw !== "object") return base;
  const value = raw as Partial<ResumeContent>;
  return {
    basics: { ...base.basics, ...(value.basics ?? {}) },
    experience: Array.isArray(value.experience) ? value.experience : [],
    education: Array.isArray(value.education) ? value.education : [],
    projects: Array.isArray(value.projects) ? value.projects : [],
    skills: Array.isArray(value.skills) ? value.skills : [],
    certifications: Array.isArray(value.certifications) ? value.certifications : [],
  };
}

/** Plain-text rendering used for ATS analysis and DOCX export. */
export function resumeToText(resume: ResumeContent): string {
  const lines: string[] = [];
  const b = resume.basics;
  lines.push(b.fullName, b.title);
  lines.push([b.email, b.phone, b.location, b.website, b.linkedin].filter(Boolean).join(" | "));
  if (b.summary) lines.push("", "SUMMARY", b.summary);

  if (resume.experience.length) {
    lines.push("", "EXPERIENCE");
    for (const item of resume.experience) {
      lines.push(`${item.role} — ${item.company} (${item.start} - ${item.end})`);
      for (const bullet of item.bullets.filter(Boolean)) lines.push(`• ${bullet}`);
    }
  }
  if (resume.projects.length) {
    lines.push("", "PROJECTS");
    for (const p of resume.projects) lines.push(`${p.name}: ${p.description} ${p.link}`.trim());
  }
  if (resume.education.length) {
    lines.push("", "EDUCATION");
    for (const e of resume.education)
      lines.push(`${e.degree} — ${e.school} (${e.start} - ${e.end}) ${e.details}`.trim());
  }
  if (resume.skills.length) lines.push("", "SKILLS", resume.skills.join(", "));
  if (resume.certifications.length)
    lines.push("", "CERTIFICATIONS", resume.certifications.join(", "));

  return lines.filter((line) => line !== undefined).join("\n");
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs work";
  return "At risk";
}
