// Static personal content that doesn't come from an API: publications,
// awards, and current initiatives. Sourced directly from Google Scholar,
// the MIT UROP recipients page, and each initiative's own site — nothing
// here is invented.

export interface Publication {
  title: string;
  authors: string;
  venue: string;
  year: number;
  citedBy?: number;
  url?: string;
}

export const SCHOLAR_URL = "https://scholar.google.com/citations?hl=en&user=8-AV3ucAAAAJ";

export const publications: Publication[] = [
  {
    title: "How Does AI Transform Cyber Risk Management?",
    authors: "S. Zeijlemaker, Y.K. Lemiesa, S.L. Schröer, A. Abhishta, M. Siegel",
    venue: "Systems, 13(10), 835",
    year: 2025,
    citedBy: 10,
  },
  {
    title: "AI on Small and Noisy Data is Ineffective for ICS Cyber Risk Management",
    authors: "Y. Lemiesa, R. Pal, M. Siegel",
    venue: "2025 Winter Simulation Conference (WSC), 2611–2622",
    year: 2025,
  },
  {
    title: "How should managers use AI for critical infrastructure risk management?",
    authors: "R. Pal, Y. Lemiesa, M. Siegel, B. Nag",
    venue: "Forbes India",
    year: 2025,
  },
];

export interface Award {
  title: string;
  detail: string;
  year: string;
  url?: string;
}

export const awards: Award[] = [
  {
    title: "Outstanding UROP Student Award",
    detail: "MIT UROP, Sloan School of Management",
    year: "2026",
    url: "https://urop.mit.edu/mentors/outstanding-student/student-recipients/",
  },
  {
    title: "Best Paper Nominee",
    detail: "Winter Simulation Conference (WSC) 2025",
    year: "2025",
    url: SCHOLAR_URL,
  },
  {
    title: "Top NLP Project",
    detail: "AI Camp Hackathon (EmbraceAI)",
    year: "2025",
  },
];

export interface Initiative {
  name: string;
  role: string;
  url: string;
}

export const initiatives: Initiative[] = [
  {
    name: "Claude Builders Club @ MIT",
    role: "Sponsorship Director",
    url: "https://claudeatmit.com/",
  },
  {
    name: "Selamta Family Project",
    role: "Supporting families for orphaned and abandoned children in Ethiopia",
    url: "https://www.selamtafamilyproject.org/",
  },
  {
    name: "MIT EESA",
    role: "Ethiopian & Eritrean Students Association at MIT",
    url: "https://www.instagram.com/mit.eesa/",
  },
];

// Repos pinned into the featured Modules grid regardless of popularity
// ranking -- for projects worth surfacing even before they've picked up
// stars/forks (e.g. still-in-progress hardware builds).
export const PINNED_REPOS: string[] = ["fpga-autonomous-robot-car"];

export interface OSSContribution {
  repo: string;
  description: string;
  url: string;
}

export const ossContributions: OSSContribution[] = [
  {
    repo: "bamdadd/leakgauge",
    description:
      "Defensive prompt-injection benchmark for measuring agent robustness. Fixed a hex-decoding edge case and clarified a CLI help string.",
    url: "https://github.com/bamdadd/leakgauge/pulls?q=is%3Apr+author%3Aylemiesa57",
  },
  {
    repo: "Naungth/EyeM",
    description:
      "Robotic pick-and-place visual servoing project (IBVS control, state machine, depth estimation). Contributed cube-detection integration and scene setup.",
    url: "https://github.com/Naungth/EyeM/pulls?q=is%3Apr+author%3Aylemiesa57",
  },
];
