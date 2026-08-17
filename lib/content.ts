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
      "Architecting a production DevOps agent (Python, AWS EKS, Kubernetes) on an LLM plan-and-act loop with runbook RAG, simulating Bloomberg Media infrastructure across 12+ cluster configurations to deterministically reproduce production failures.",
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
      "Architected a quantitative simulation (Python, C++) coupling Monte Carlo with a self-learning Bayesian ML loop (PyTorch) that flags zero-day anomalies from network telemetry, forecasting financial exposure at 85% accuracy and guiding $3M in loss mitigation.",
      "Co-authored two papers on AI-driven cybersecurity policy accepted at the Winter Simulation Conference (WSC), using the Colonial Pipeline incident as the case study.",
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
      "Operating System Engineering",
      "Distributed Systems",
      "Algorithms",
      "Computation Structures",
      "Deep Learning",
      "Machine Learning",
      "Hardware Accelerators for AI/ML",
      "Robotic Manipulation",
      "Semiconductor Electronic Circuits (6.2080) — differential amplifier system, TSMC 65nm, Cadence Virtuoso, full DRC/LVS sign-off",
      "Introduction to Probability (6.3700)",
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
// ---- Skills ------------------------------------------------------------------
// Context-only (like `experience` and `education`): consumed by scripts/ingest.ts
// for the knowledge graph, not rendered anywhere on the page.
//
// Deliberately grouped into a few rich nodes rather than one node per skill.
// A node whose whole text is "Python — a language Yaphet uses" is short and
// near-contentless, which embeds close to the centre of the vector space and
// therefore scores highly against almost any query — the same failure that made
// the Domain/Language nodes crowd out real answers before they were excluded
// from vector seeding. Grouping keeps each node information-dense.

export interface SkillGroup {
  slug: string;
  label: string;
  items: string[];
}

export const skills: SkillGroup[] = [
  {
    slug: "languages",
    label: "Languages",
    items: [
      "Python",
      "C++",
      "C",
      "SQL",
      "Bash",
      "Java",
      "JavaScript/TypeScript",
      "Go",
      "Bluespec SystemVerilog",
    ],
  },
  {
    slug: "frameworks-tools",
    label: "Frameworks & Tools",
    items: [
      "Kubernetes",
      "AWS (EKS)",
      "CI/CD",
      "Docker",
      "PostgreSQL",
      "Git",
      "React",
      "FastAPI",
      "Node.js",
      "Flask",
      "Kafka",
      "Spark",
      "Azure",
      "Firebase",
      "PyTorch",
      "Alembic",
    ],
  },
  {
    slug: "ai-ml-simulation",
    label: "AI/ML & Simulation",
    items: [
      "PyTorch",
      "OpenCV",
      "Fine-tuning (LoRA)",
      "DistilBERT",
      "Monte Carlo",
      "Bayesian Inference",
      "LLM Agents",
      "RAG",
      "Knowledge Graphs",
      "Vector Stores (FAISS)",
      "Llama.cpp",
      "LLM Evaluation (LLM-as-judge, regression suites)",
      "AccelForge",
    ],
  },
];

// ---- Projects ----------------------------------------------------------------
// Context-only, same as `skills` above. These are the resume's Projects section:
// the repos already in the graph carry only their (often empty) GitHub
// description, so without these the Ask endpoint has no access to what a project
// actually did or what it measured. `repo` optionally ties a project to its
// Repo node so the graph links the two.
//
// Not included: the RISC-V Processor with SIMD Extensions entry. The resume bank
// records it as an INCOMPLETE ENTRY whose bullet text and metrics were never
// captured, and explicitly says to ask rather than reconstruct them — so there
// is nothing here to state accurately yet. The `riscv-simd-core` Repo node still
// covers it in the graph. Fill the bullets into the bank and re-run ingest to
// add it properly.

export interface Project {
  slug: string;
  name: string;
  stack: string;
  /** Award / venue / timeframe line, if the resume carries one. */
  note?: string;
  bullets: string[];
  /** Name of the matching GitHub repo, when one exists (links Project → Repo). */
  repo?: string;
}

export const projects: Project[] = [
  {
    slug: "edge-rag-llm-accelerator",
    name: "Edge RAG LLM Accelerator",
    stack: "Python, AccelForge, PyTorch",
    note: "Research Paper 2025–2026",
    bullets: [
      "Modelled a Sheared-LLaMA 2.7B system on a Jetson Orin Nano-class platform (8GB shared DRAM) using Einsum-based prefill/decode latency formulations across 5 million-document corpora.",
      "Reduced retrieval latency by 40% via a DRAM embedding cache / vector store optimizer and structured 4:2 sparsity pruning on the vector index, resolving the memory contention bottleneck between LLM weights and the embedding cache.",
    ],
    repo: "6.5931-Final-Project",
  },
  {
    slug: "distributed-data-analytics-pipeline",
    name: "Distributed Data Analytics Pipeline (HackMIT)",
    stack: "Python, Apache Spark, Apache Kafka, Docker, AWS S3",
    bullets: [
      "Designed a distributed system architecture using Apache Kafka for fault-tolerant streaming and Spark for parallel processing of over 100,000 real-time events.",
      "Achieved 88% accuracy in real-time trend classification and warehoused processed data in AWS S3 to enable large-scale downstream analysis.",
    ],
    repo: "Distributed-Data-Analytics-Pipeline",
  },
  {
    slug: "deucevision",
    name: "DeuceVision — Open-Source Sports Analytics Tool",
    stack: "Python, React.js, Flask, OpenCV, GitHub",
    bullets: [
      "Managed the full product lifecycle of an open-source sports analytics tool spanning a React.js frontend, Flask REST API backend, and OpenCV/YOLOv9 computer-vision model, from training through a live launch on GitHub reaching 50+ users.",
    ],
  },
  {
    slug: "embraceai",
    name: "EmbraceAI",
    stack: "Python, Transformers, FastAPI, HuggingFace",
    note: "1st Place, AI CAMP – NLP Track 2023",
    bullets: [
      "Won Top NLP Project at HackMIT (200+ teams); built an AI mental-health support system using fine-tuned DistilBERT at 91% intent-classification accuracy across 12 categories, served via a FastAPI inference API at under 80ms end-to-end latency.",
    ],
    repo: "EmbraceAI",
  },
  {
    slug: "embraceai-kafka-pipeline",
    name: "EmbraceAI (Data Pipeline w/ Kafka + Hugging Face Serve)",
    stack:
      "Python, Apache Kafka, Apache Spark, Docker, AWS S3, HuggingFace/Transformers (DistilBERT)",
    note: "Distinct from the EmbraceAI entry above — the distributed-systems architecture repurposed for EmbraceAI's mental-health domain.",
    bullets: [
      "Designed a distributed system architecture using Apache Kafka for fault-tolerant streaming and Spark for parallel processing of over 100,000 real-time mental-health support conversations.",
      "Achieved 91% accuracy classifying conversational risk/sentiment signals in real time via a Hugging Face-served, fine-tuned DistilBERT model, and warehoused processed data in AWS S3 to enable large-scale downstream analysis.",
    ],
    repo: "EmbraceAI",
  },
];

// ---- Project visuals ---------------------------------------------------------
// The Projects section shows an image beside each project. Most of these repos
// have nothing to photograph -- a Bluespec core or a Kafka pipeline has no UI --
// and a screenshot of a rendered README is unreadable at card size (16px body
// text lands at roughly 5px once scaled into a card). So this map is only for
// projects with a *genuine* visual:
//
//   - a live deployed frontend, captured from the running site, or
//   - a real artifact the repo itself produces (a generated plot, a diagram).
//
// Everything not listed here falls back to <ProjectMark>, the generative
// per-repo mark already used on the cards. That keeps the grid on-brand instead
// of padding it with grey screenshots of text.

export const projectVisuals: Record<string, string> = {
  portfolio: "/projects/portfolio.jpg",
  Kindred_Items: "/projects/Kindred_Items.jpg",
  "RAG-AI-OS": "/projects/RAG-AI-OS.jpg",
  "emma-gf-day": "/projects/emma-gf-day.jpg",
  "ai-bom-analysis": "/projects/ai-bom-analysis.jpg",
  boltless: "/projects/boltless.svg",
};

// Live URLs, shown as a "visit" link on the expanded card.
export const projectLiveUrls: Record<string, string> = {
  portfolio: "https://yaphetlemiesa.vercel.app",
  Kindred_Items: "https://conversational-object-twins.vercel.app",
  "RAG-AI-OS": "https://ylemiesa57.github.io/RAG-AI-OS/",
  "emma-gf-day": "https://emma-gf-day.vercel.app",
};

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
