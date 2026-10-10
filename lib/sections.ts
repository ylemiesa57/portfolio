// The kinds of content the site holds, by the ids the knowledge graph stamps
// on its nodes. Consumed by the LLM navigator (its system prompt picks one of
// these) and by the page, which maps each id to the view that shows it
// (components/site/Site.tsx, VIEW_OF_SECTION).

export interface SectionSpec {
  id: string;
  // Label used when the page names the section.
  label: string;
  // Plain-language description the local model uses to route a question to a
  // section. Written from the visitor's side: what they'd actually ask for.
  keywords: string;
}

export const SECTIONS: SectionSpec[] = [
  {
    id: "hero",
    label: "About",
    keywords:
      "the intro, who Yaphet is, his summary, the first page, start over, home",
  },
  {
    id: "research",
    label: "Research",
    keywords:
      "research interests, research statement, what he studies, research threads, cyber risk, retrieval and knowledge graphs, edge inference, hardware for machine learning, agents and evaluation",
  },
  {
    id: "publications",
    label: "Publications",
    keywords:
      "research papers, publications, academic work, Google Scholar, citations, cyber risk, ICS, papers he has written or co-authored",
  },
  {
    id: "awards",
    label: "Honors",
    keywords:
      "awards, honors, recognition, the Outstanding UROP Student Award, best paper nominee, hackathon wins, prizes",
  },
  {
    id: "modules",
    label: "Projects",
    keywords:
      "projects, repositories, GitHub repos, code, the things he has built, hardware, AI/ML, systems, data projects, portfolio work",
  },
  {
    id: "experience",
    label: "Experience",
    keywords:
      "work experience, internships, Bloomberg, Jet Propulsion Laboratory, NASA, JPL, Zenyai, CAMS, MIT Sloan, education, MIT, degree, coursework, technical skills, what languages or tools he knows, resume, CV",
  },
  {
    id: "oss",
    label: "Open source",
    keywords:
      "open source contributions, pull requests, PRs to other projects, apache airflow, leakgauge, EyeM, contributing to other people's repos",
  },
  {
    id: "initiatives",
    label: "Community",
    keywords:
      "communities, clubs, leadership, Claude Builders Club at MIT, MIT EESA, Selamta Family Project, charity, volunteering, organizing",
  },
  {
    id: "contact",
    label: "Contact",
    keywords:
      "contact, email, get in touch, reach out, LinkedIn, GitHub profile, hire, connect",
  },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);

export function sectionById(id: string): SectionSpec | undefined {
  return SECTIONS.find((s) => s.id === id);
}

// Experience, education and skills used to live in the first section, and the
// served graph snapshot may still say so until the next ingest. Resolve by
// kind so a cited job or degree always lands on the Experience section.
const EXPERIENCE_KINDS = new Set(["Experience", "Education", "SkillGroup"]);

export function sectionForNode(node: { type: string; sectionId: string }): string {
  if (EXPERIENCE_KINDS.has(node.type)) return "experience";
  return sectionById(node.sectionId) ? node.sectionId : "hero";
}
