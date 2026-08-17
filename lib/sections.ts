// Single source of truth for the page's navigable sections. Consumed by
// app/page.tsx (to stamp anchor ids onto each section) and by the LLM
// navigator (both the API system prompt and the client-side scroll executor).
// Keep ids in sync with the order sections are rendered in app/page.tsx.

export interface SectionSpec {
  id: string;
  // Sheet label shown in the drafting-sheet UI and the command bar.
  label: string;
  // Plain-language description the local model uses to route a question to a
  // section. Written from the visitor's side: what they'd actually ask for.
  keywords: string;
}

export const SECTIONS: SectionSpec[] = [
  {
    id: "hero",
    label: "Working drawing",
    keywords:
      "the intro, who Yaphet is, his tagline and summary, overview stats, top of the page, start over, home, education, MIT, degree, coursework, work experience, internships, Bloomberg, Jet Propulsion Laboratory, NASA, JPL, Zenyai, CAMS, MIT Sloan, technical skills, what languages or tools he knows",
  },
  {
    id: "modules",
    label: "Projects",
    keywords:
      "projects, repositories, GitHub repos, code, the things he has built, hardware, AI/ML, systems, data projects, portfolio work",
  },
  {
    id: "awards",
    label: "Honors",
    keywords:
      "awards, honors, recognition, the Outstanding UROP Student Award, best paper nominee, hackathon wins, prizes",
  },
  {
    id: "publications",
    label: "Publications",
    keywords:
      "research papers, publications, academic work, Google Scholar, cyber risk, ICS, papers he has written or co-authored",
  },
  {
    id: "oss",
    label: "Open source",
    keywords:
      "open source contributions, pull requests, PRs to other projects, apache airflow, leakgauge, EyeM, contributing to other people's repos",
  },
  {
    id: "initiatives",
    label: "Initiatives",
    keywords:
      "communities, clubs, leadership, Claude Builders Club at MIT, MIT EESA, Selamta Family Project, charity, volunteering, organizing",
  },
  {
    id: "contact",
    label: "Contact",
    keywords:
      "contact, email, get in touch, reach out, LinkedIn, GitHub profile, hire, connect, bottom of the page",
  },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);
