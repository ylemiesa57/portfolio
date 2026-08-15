// Static personal content that doesn't come from an API: publications,
// awards, current initiatives, work experience, and education. Sourced
// directly from Google Scholar, the MIT UROP recipients page, each
// initiative's own site, and Yaphet's own resume — nothing here is invented.

export interface Experience {
  slug: string;
  role: string;
  org: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export const experience: Experience[] = [
  {
    slug: "bloomberg",
    role: "Software Engineer Intern",
    org: "Bloomberg L.P.",
    location: "New York, NY",
    start: "May 2026",
    end: "Present",
    bullets: [
      "Architecting a production DevOps agent (Python, AWS EKS, Kubernetes) on an LLM plan-and-act loop with runbook RAG, simulating Bloomberg Media infrastructure across 12+ cluster configurations to deterministically diagnose production failures.",
      "Designing the agent's evaluation architecture (regression suites, LLM-as-judge, golden-trace replay) to validate remediation accuracy pre-deployment, targeting a 60% MTTR reduction across 40+ services.",
    ],
  },
  {
    slug: "jpl",
    role: "Engineering Intern",
    org: "Jet Propulsion Laboratory (NASA)",
    location: "Pasadena, CA",
    start: "June 2025",
    end: "August 2025",
    bullets: [
      "Accelerated mission-critical systems verification 65% via a Gemma/Llama.cpp RAG pipeline auto-generating knowledge graphs from 20+ PDF specifications.",
      "Built an ETL pipeline (OpenCV/Docling) cutting pre-processing time for 2 TB of specifications 95% (6 hours to 18 mins) and enabling 10x larger model context.",
      "Deployed a full-stack dashboard (React, Python, SQL) unifying data streams from Jama, GitHub, and Jira, streamlining engineering workflows 25%.",
    ],
  },
  {
    slug: "zenyai",
    role: "Software Engineer Intern",
    org: "Zenyai Inc. (TechStars Startup)",
    location: "Miami, FL (Remote)",
    start: "June 2024",
    end: "Aug. 2024",
    bullets: [
      "Containerized microservices (Docker) and overhauled all RESTful API endpoints (Node.js/Flask, Firebase auth, Azure), accelerating CI/CD deploys 90% and cutting API latency 50% for 170 users.",
    ],
  },
  {
    slug: "cams",
    role: "Quantitative Researcher",
    org: "Cybersecurity at MIT Sloan (CAMS)",
    location: "Cambridge, MA",
    start: "Sept. 2024",
    end: "Present",
    bullets: [
      "Architected a quantitative simulation (Python, C++) coupling Monte Carlo with a self-learning Bayesian ML loop (PyTorch) that flags zero-day anomalies from network telemetry, forecasting financial exposure at 85% accuracy and guiding $3M in loss mitigation in ICS.",
    ],
  },
];

export interface Education {
  slug: string;
  school: string;
  degree: string;
  location: string;
  start: string;
  end: string;
  coursework: string[];
}

export const education: Education[] = [
  {
    slug: "mit",
    school: "Massachusetts Institute of Technology",
    degree: "B.S. in Electrical Engineering and Computer Science + M.Eng",
    location: "Cambridge, MA",
    start: "",
    end: "B.S. May 2027, M.Eng May 2028",
    coursework: [
      "Algorithms",
      "Computation Structures",
      "Machine Learning",
      "Hardware Accelerators for AI/ML",
      "Introduction to Probability I & II",
      "Robotic Manipulation",
      "Linear Algebra",
      "Dynamic Systems Modeling & Control",
      "Digital Systems Lab",
      "C & Assembly",
    ],
  },
];

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
    url: "https://www.informs-sim.org/wsc25papers/con102.pdf",
  },
  {
    title: "Top NLP Project",
    detail: "AI Camp Hackathon (EmbraceAI)",
    year: "2025",
  },
];

export interface Initiative {
  slug: string;
  name: string;
  role: string;
  url: string;
  summary: string;
  body: string[];
}

export const initiatives: Initiative[] = [
  {
    slug: "claude-builders-club-mit",
    name: "Claude Builders Club @ MIT",
    role: "Sponsorship Director",
    url: "https://claudeatmit.com/",
    summary:
      "Helped organize a 5-hour sprint hackathon at MIT, sponsored by Claude.",
    body: [
      "Claude Builders Club @ MIT is a student group for people building real things with Claude — workshops, project sprints, and events that put Anthropic's models in front of MIT students who want to actually ship something with them, not just read about them.",
      "As Sponsorship Director, my focus is the club's relationship with Claude itself: keeping the sponsorship active and turning it into events students actually want to show up for, rather than a logo on a slide.",
      "The clearest example so far was a 5-hour sprint hackathon at MIT, sponsored by Claude — a single-day, compressed build window where the sponsorship money did concrete things (food, prizes, room logistics) rather than sitting in a budget line. Helping put that structure together, on the sponsorship side, was the job: make sure the event could exist and that the people attending had a reason to build something in five hours instead of just talking about it.",
    ],
  },
  {
    slug: "selamta-family-project",
    name: "Selamta Family Project",
    role: "Supporting families for orphaned and abandoned children in Ethiopia",
    url: "https://www.selamtafamilyproject.org/",
    summary:
      "Organized a charity event at Montgomery Blair High School to support the project.",
    body: [
      "Selamta Family Project runs a family-based care model in Ethiopia for children who've lost parents or been abandoned — building actual households with a mother and siblings rather than routing kids through an institutional orphanage system.",
      "I organized a charity event at Montgomery Blair High School (my high school, in Silver Spring, MD) to raise support and awareness for Selamta's work — bringing a cause most students there had never heard of into a space I already had standing in, rather than asking people to seek it out on their own.",
      "It's a smaller, more local kind of contribution than a hackathon or a lab, but it's the same instinct: find where you already have reach, and use it to point at something that matters outside your own work.",
    ],
  },
  {
    slug: "mit-eesa",
    name: "MIT EESA",
    role: "Ethiopian & Eritrean Students Association at MIT",
    url: "https://www.instagram.com/mit.eesa/",
    summary: "Community and culture for Ethiopian and Eritrean students at MIT.",
    body: [
      "MIT EESA (the Ethiopian & Eritrean Students Association) is the community at MIT for students connected to Ethiopian and Eritrean culture and heritage — a place to hold onto that identity in a very demanding, very American academic environment.",
      "Being part of it is less about a single project and more about showing up — the culture nights, the community meals, the everyday check-ins that make a large institution feel smaller and more like home.",
    ],
  },
];

// Repos pinned into the featured Modules grid regardless of popularity
// ranking -- for projects worth surfacing even before they've picked up
// stars/forks (e.g. still-in-progress hardware builds).
export const PINNED_REPOS: string[] = ["EmbraceAI", "ai-bom-analysis", "Distributed-Data-Analytics-Pipeline", "6.5931-Final-Project", "visionquest-misti"];

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
  {
    repo: "apache/airflow",
    description:
      "Fixed a validation bug in the SSH provider where SSHRemoteJobOperator's cleanup step raised a spurious error whenever remote_base_dir was customized. Added regression tests. PR open, pending maintainer review.",
    url: "https://github.com/apache/airflow/pull/70233",
  },
  {
    repo: "getmoto/moto",
    description:
      "Fixed DynamoDB Number attribute size calculation to use significant digits instead of decimal string length, aligning moto's item-size check with real DynamoDB behavior. PR open, pending maintainer review.",
    url: "https://github.com/getmoto/moto/pull/10182",
  },
  {
    repo: "f4pga/prjxray",
    description:
      "Fixed a verbose-logging bug in the fuzzer's maketodo script where diagnostic output was mixed into stdout, corrupting the todo-list data file consumed downstream in the build. Routed diagnostics to stderr. PR open, pending maintainer review.",
    url: "https://github.com/f4pga/prjxray/pull/2571",
  },
];
