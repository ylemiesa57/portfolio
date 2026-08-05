import { Domain } from "@/lib/github";
import styles from "./ProjectMark.module.css";

export type MarkKind =
  | "heartChat"
  | "graphNodes"
  | "streamPipes"
  | "bookChip"
  | "eyeLens"
  | "memoryObject"
  | "coinBars"
  | "laneCar"
  | "robotArm"
  | "tinyChip"
  | "drone"
  | "sparkBuild"
  | "webNet"
  | "ledger"
  | "bot"
  | "blueprint";

const KIND_CLASS: Record<MarkKind, string> = {
  heartChat: styles.heart,
  graphNodes: styles.graph,
  streamPipes: styles.stream,
  bookChip: styles.chip,
  eyeLens: styles.eye,
  memoryObject: styles.memory,
  coinBars: styles.coin,
  laneCar: styles.car,
  robotArm: styles.arm,
  tinyChip: styles.chip,
  drone: styles.drone,
  sparkBuild: styles.spark,
  webNet: styles.net,
  ledger: styles.ledger,
  bot: styles.bot,
  blueprint: styles.blueprint,
};

function pickKind(repoName: string, domain: Domain): MarkKind {
  const n = repoName.toLowerCase();

  if (n.includes("embrace")) return "heartChat";
  if (n.includes("bom") || n.includes("bayesian")) return "graphNodes";
  if (n.includes("distributed") || n.includes("pipeline") || n.includes("kafka"))
    return "streamPipes";
  if (n.includes("rag") || n.includes("6.5931") || n.includes("accelforge"))
    return "bookChip";
  if (n.includes("vision") || n.includes("misti")) return "eyeLens";
  if (n.includes("kindred")) return "memoryObject";
  if (n.includes("finance") || n.includes("fundamentals")) return "coinBars";
  if (n.includes("fpga") || n.includes("robot-car") || n.includes("car"))
    return "laneCar";
  if (n.includes("isaac")) return "robotArm";
  if (n.includes("riscv") || n.includes("simd")) return "tinyChip";
  if (n.includes("drone")) return "drone";
  if (n.includes("cbc") || n.includes("hackathon")) return "sparkBuild";
  if (n.includes("scraper")) return "webNet";
  if (n.includes("portfolio")) return "blueprint";
  if (n.includes("agent")) return "bot";

  switch (domain) {
    case "hardware":
      return "tinyChip";
    case "ai_ml":
      return "sparkBuild";
    case "systems":
      return "streamPipes";
    case "data":
      return "ledger";
    default:
      return "blueprint";
  }
}

function Symbol({ kind }: { kind: MarkKind }) {
  switch (kind) {
    case "heartChat":
      return (
        <g className={styles.bob}>
          <path
            d="M36 28c0-6 5-10 10-10 4 0 7 2 8 5 1-3 4-5 8-5 5 0 10 4 10 10 0 12-18 22-18 22S36 40 36 28z"
            fill="currentColor"
            opacity="0.92"
          />
          <g className={styles.blink}>
            <circle cx="48" cy="30" r="1.4" fill="var(--mark-ink)" />
            <circle cx="56" cy="30" r="1.4" fill="var(--mark-ink)" />
          </g>
          <path
            d="M50 35c1.5 2 4.5 2 6 0"
            fill="none"
            stroke="var(--mark-ink)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <rect
            className={styles.float}
            x="68"
            y="18"
            width="22"
            height="14"
            rx="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.7"
          />
          <circle cx="74" cy="25" r="1.2" fill="currentColor" opacity="0.7" />
          <circle cx="79" cy="25" r="1.2" fill="currentColor" opacity="0.7" />
          <circle cx="84" cy="25" r="1.2" fill="currentColor" opacity="0.7" />
        </g>
      );

    case "graphNodes":
      return (
        <g>
          <g className={styles.orbit} opacity="0.55">
            <circle cx="54" cy="34" r="22" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </g>
          <path
            className={styles.dash}
            d="M28 48 L48 28 L72 36 L88 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle className={styles.pulse} cx="28" cy="48" r="5" fill="currentColor" />
          <circle cx="48" cy="28" r="6" fill="currentColor" />
          <circle className={styles.pulse} cx="72" cy="36" r="5" fill="currentColor" />
          <circle cx="88" cy="22" r="4" fill="currentColor" opacity="0.8" />
          <g className={styles.blink}>
            <circle cx="48" cy="28" r="1.5" fill="var(--mark-ink)" />
          </g>
        </g>
      );

    case "streamPipes":
      return (
        <g className={styles.bob}>
          <rect x="18" y="24" width="18" height="28" rx="6" fill="currentColor" opacity="0.85" />
          <rect x="82" y="24" width="18" height="28" rx="6" fill="currentColor" opacity="0.85" />
          <path
            className={styles.dash}
            d="M38 38 H82"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle className={styles.pulse} cx="50" cy="38" r="3.5" fill="currentColor" />
          <circle className={styles.pulse} cx="64" cy="38" r="3.5" fill="currentColor" />
          <g className={styles.blink}>
            <circle cx="27" cy="34" r="1.3" fill="var(--mark-ink)" />
            <circle cx="91" cy="34" r="1.3" fill="var(--mark-ink)" />
          </g>
          <path
            d="M24 42c2 2 6 2 8 0"
            fill="none"
            stroke="var(--mark-ink)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M88 42c2 2 6 2 8 0"
            fill="none"
            stroke="var(--mark-ink)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      );

    case "bookChip":
      return (
        <g className={styles.float}>
          <rect x="26" y="20" width="34" height="40" rx="4" fill="currentColor" opacity="0.9" />
          <path d="M33 28h20M33 35h16M33 42h18" stroke="var(--mark-ink)" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
          <g className={styles.wiggle}>
            <rect x="66" y="26" width="28" height="28" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <rect x="72" y="32" width="16" height="16" rx="2" fill="currentColor" opacity="0.75" />
            <circle cx="80" cy="40" r="1.4" fill="var(--mark-ink)" />
          </g>
        </g>
      );

    case "eyeLens":
      return (
        <g className={styles.bob}>
          <ellipse cx="58" cy="36" rx="34" ry="20" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <circle className={styles.pulse} cx="58" cy="36" r="12" fill="currentColor" opacity="0.85" />
          <g className={styles.blink}>
            <circle cx="58" cy="36" r="5" fill="var(--mark-ink)" />
            <circle cx="61" cy="33" r="1.6" fill="currentColor" />
          </g>
          <path
            className={styles.dash}
            d="M22 36c8-14 22-22 36-22s28 8 36 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            opacity="0.45"
          />
        </g>
      );

    case "memoryObject":
      return (
        <g className={styles.float}>
          <rect x="34" y="22" width="40" height="34" rx="8" fill="currentColor" opacity="0.9" />
          <rect x="42" y="30" width="10" height="10" rx="2" fill="var(--mark-ink)" opacity="0.35" />
          <rect x="56" y="30" width="10" height="10" rx="2" fill="var(--mark-ink)" opacity="0.35" />
          <g className={styles.blink}>
            <circle cx="47" cy="48" r="1.2" fill="var(--mark-ink)" />
            <circle cx="61" cy="48" r="1.2" fill="var(--mark-ink)" />
          </g>
          <path
            d="M50 52c2 2 6 2 8 0"
            fill="none"
            stroke="var(--mark-ink)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <g className={styles.orbit} opacity="0.7">
            <circle cx="84" cy="20" r="5" fill="currentColor" />
            <path d="M84 14v-4M84 30v-4M78 20h-4M94 20h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </g>
      );

    case "coinBars":
      return (
        <g>
          <g className={styles.wiggle}>
            <circle cx="34" cy="34" r="14" fill="currentColor" opacity="0.9" />
            <text
              x="34"
              y="39"
              textAnchor="middle"
              fontSize="12"
              fontFamily="var(--font-mono)"
              fill="var(--mark-ink)"
              fontWeight="700"
            >
              $
            </text>
          </g>
          <g className={styles.bob}>
            <rect x="58" y="40" width="8" height="16" rx="2" fill="currentColor" opacity="0.55" />
            <rect x="70" y="30" width="8" height="26" rx="2" fill="currentColor" opacity="0.75" />
            <rect x="82" y="22" width="8" height="34" rx="2" fill="currentColor" />
          </g>
        </g>
      );

    case "laneCar":
      return (
        <g className={styles.bob}>
          <path
            className={styles.dash}
            d="M20 48 H100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.45"
          />
          <path d="M20 34 H100" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.25" />
          <g className={styles.wiggle}>
            <rect x="40" y="28" width="36" height="18" rx="7" fill="currentColor" />
            <rect x="48" y="22" width="20" height="10" rx="4" fill="currentColor" opacity="0.8" />
            <circle cx="48" cy="48" r="4" fill="var(--mark-ink)" opacity="0.55" />
            <circle cx="68" cy="48" r="4" fill="var(--mark-ink)" opacity="0.55" />
            <g className={styles.blink}>
              <circle cx="52" cy="34" r="1.2" fill="var(--mark-ink)" />
              <circle cx="60" cy="34" r="1.2" fill="var(--mark-ink)" />
            </g>
          </g>
        </g>
      );

    case "robotArm":
      return (
        <g className={styles.float}>
          <circle cx="30" cy="50" r="8" fill="currentColor" opacity="0.85" />
          <path
            d="M36 46 L58 28 L78 34"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className={styles.wiggle}>
            <rect x="74" y="26" width="16" height="14" rx="3" fill="currentColor" />
            <path d="M90 30h8M90 36h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </g>
          <circle className={styles.pulse} cx="58" cy="28" r="3.5" fill="currentColor" />
        </g>
      );

    case "tinyChip":
      return (
        <g className={styles.pulse}>
          <rect x="38" y="22" width="40" height="36" rx="6" fill="currentColor" opacity="0.92" />
          <rect x="48" y="30" width="20" height="20" rx="3" fill="var(--mark-ink)" opacity="0.28" />
          <path
            d="M46 22v-6M58 22v-6M70 22v-6M46 58v6M58 58v6M70 58v6M38 32h-6M38 40h-6M38 48h-6M78 32h6M78 40h6M78 48h6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <g className={styles.blink}>
            <circle cx="54" cy="40" r="1.3" fill="var(--mark-ink)" />
            <circle cx="62" cy="40" r="1.3" fill="var(--mark-ink)" />
          </g>
          <path
            d="M54 45c2 2 6 2 8 0"
            fill="none"
            stroke="var(--mark-ink)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </g>
      );

    case "drone":
      return (
        <g className={styles.float}>
          <g className={styles.spinSlow} opacity="0.7">
            <ellipse cx="28" cy="24" rx="12" ry="3" fill="currentColor" />
            <ellipse cx="88" cy="24" rx="12" ry="3" fill="currentColor" />
          </g>
          <rect x="44" y="30" width="28" height="16" rx="6" fill="currentColor" />
          <path d="M44 36 H28 M72 36 H88" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <g className={styles.blink}>
            <circle cx="54" cy="37" r="1.2" fill="var(--mark-ink)" />
            <circle cx="62" cy="37" r="1.2" fill="var(--mark-ink)" />
          </g>
          <path
            d="M54 42c2 1.6 6 1.6 8 0"
            fill="none"
            stroke="var(--mark-ink)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </g>
      );

    case "sparkBuild":
      return (
        <g className={styles.wiggle}>
          <path
            d="M58 14 L64 32 L82 34 L68 46 L72 64 L58 54 L44 64 L48 46 L34 34 L52 32 Z"
            fill="currentColor"
            opacity="0.92"
          />
          <g className={styles.blink}>
            <circle cx="54" cy="40" r="1.4" fill="var(--mark-ink)" />
            <circle cx="62" cy="40" r="1.4" fill="var(--mark-ink)" />
          </g>
          <path
            d="M54 46c2 2 6 2 8 0"
            fill="none"
            stroke="var(--mark-ink)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      );

    case "webNet":
      return (
        <g>
          <g className={styles.orbit} opacity="0.4">
            <circle cx="58" cy="36" r="24" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="58" cy="36" r="14" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </g>
          <g className={styles.bob}>
            <circle cx="58" cy="36" r="8" fill="currentColor" />
            <path d="M50 36h-14M66 36h14M58 28v-12M58 44v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <g className={styles.blink}>
              <circle cx="55" cy="34" r="1.1" fill="var(--mark-ink)" />
              <circle cx="61" cy="34" r="1.1" fill="var(--mark-ink)" />
            </g>
          </g>
        </g>
      );

    case "ledger":
      return (
        <g className={styles.bob}>
          <rect x="30" y="18" width="52" height="44" rx="6" fill="currentColor" opacity="0.9" />
          <path d="M40 30h32M40 38h24M40 46h28" stroke="var(--mark-ink)" strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
          <g className={styles.pulse}>
            <rect x="70" y="40" width="6" height="12" rx="1.5" fill="var(--mark-ink)" opacity="0.45" />
            <rect x="78" y="34" width="6" height="18" rx="1.5" fill="var(--mark-ink)" opacity="0.45" />
          </g>
        </g>
      );

    case "bot":
      return (
        <g className={styles.bob}>
          <rect x="38" y="24" width="40" height="32" rx="10" fill="currentColor" />
          <rect x="48" y="14" width="20" height="8" rx="3" fill="currentColor" opacity="0.75" />
          <g className={styles.blink}>
            <circle cx="50" cy="38" r="2" fill="var(--mark-ink)" />
            <circle cx="66" cy="38" r="2" fill="var(--mark-ink)" />
          </g>
          <path
            d="M50 46c4 3 12 3 16 0"
            fill="none"
            stroke="var(--mark-ink)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle className={styles.pulse} cx="30" cy="40" r="3" fill="currentColor" opacity="0.7" />
          <circle className={styles.pulse} cx="86" cy="40" r="3" fill="currentColor" opacity="0.7" />
        </g>
      );

    case "blueprint":
    default:
      return (
        <g className={styles.float}>
          <rect x="28" y="18" width="56" height="44" rx="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="M40 30h32M40 38h20M40 46h28" className={styles.dash} stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle className={styles.pulse} cx="78" cy="38" r="4" fill="currentColor" />
          <g className={styles.blink}>
            <circle cx="46" cy="54" r="1.2" fill="currentColor" opacity="0.7" />
            <circle cx="54" cy="54" r="1.2" fill="currentColor" opacity="0.7" />
          </g>
        </g>
      );
  }
}

export default function ProjectMark({
  repoName,
  domain,
  active = false,
}: {
  repoName: string;
  domain: Domain;
  active?: boolean;
}) {
  const kind = pickKind(repoName, domain);
  return (
    <div
      className={`${styles.stage} ${KIND_CLASS[kind]} ${active ? styles.stageActive : ""}`}
      aria-hidden="true"
    >
      <svg className={styles.svg} viewBox="0 0 116 72" role="presentation">
        <Symbol kind={kind} />
      </svg>
    </div>
  );
}
