function VaultIcon() {
  return (
    <svg viewBox="0 0 120 120" className="h-16 w-16">
      <circle cx="60" cy="60" r="60" fill="#7c3aed" />
      <path
        d="M26 36 L46 36 L52 44 L94 44 L94 84 L26 84 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <line x1="45" y1="58" x2="72" y2="55" stroke="#ffffff" strokeWidth="2.5" />
      <line x1="45" y1="58" x2="60" y2="72" stroke="#ffffff" strokeWidth="2.5" />
      <line x1="72" y1="55" x2="60" y2="72" stroke="#ffffff" strokeWidth="2.5" />
      <circle cx="45" cy="58" r="4.5" fill="#ffffff" />
      <circle cx="72" cy="55" r="4.5" fill="#ffffff" />
      <circle cx="60" cy="72" r="4.5" fill="#ffffff" />
    </svg>
  );
}

function AnalysisIcon() {
  return (
    <svg viewBox="0 0 120 120" className="h-16 w-16">
      <circle cx="60" cy="60" r="60" fill="#7c3aed" />
      <line x1="45" y1="45" x2="60" y2="40" stroke="#ffffff" strokeWidth="2.5" />
      <line x1="45" y1="45" x2="50" y2="60" stroke="#ffffff" strokeWidth="2.5" />
      <line x1="60" y1="40" x2="50" y2="60" stroke="#ffffff" strokeWidth="2.5" />
      <circle cx="45" cy="45" r="4" fill="#ffffff" />
      <circle cx="60" cy="40" r="4" fill="#ffffff" />
      <circle cx="50" cy="60" r="4" fill="#ffffff" />
      <circle cx="58" cy="52" r="20" fill="none" stroke="#ffffff" strokeWidth="4.5" />
      <line x1="72" y1="66" x2="88" y2="82" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function McpIcon() {
  return (
    <svg viewBox="0 0 120 120" className="h-16 w-16">
      <circle cx="60" cy="60" r="60" fill="#7c3aed" />
      <line x1="32" y1="70" x2="46" y2="52" stroke="#ffffff" strokeWidth="2.5" />
      <line x1="32" y1="70" x2="48" y2="74" stroke="#ffffff" strokeWidth="2.5" />
      <circle cx="32" cy="70" r="4.5" fill="#ffffff" />
      <circle cx="46" cy="52" r="4.5" fill="#ffffff" />
      <circle cx="48" cy="74" r="4.5" fill="#ffffff" />
      <line x1="48" y1="74" x2="66" y2="60" stroke="#ffffff" strokeWidth="3" strokeDasharray="4 4" />
      <path
        d="M70 40 h20 a6 6 0 0 1 6 6 v18 a6 6 0 0 1 -6 6 h-12 l-8 8 v-8 h0 a6 6 0 0 1 -6 -6 v-18 a6 6 0 0 1 6 -6 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SECTIONS = [
  {
    icon: VaultIcon,
    heading: "Your notes, connected",
    body: "A “vault” is just a folder of your notes, linked together like a personal wiki — tools like Obsidian make them easy to write. Upload one and Shreg turns it into a graph: the ideas inside, and how they connect.",
  },
  {
    icon: AnalysisIcon,
    heading: "AI figures out what it's good for",
    body: "An AI reads through the graph and writes a short description of what it's useful for, plus example questions it answers well — so anyone (including you) knows what to expect before relying on it.",
  },
  {
    icon: McpIcon,
    heading: "Any AI agent can query it live",
    body: "MCP (Model Context Protocol) is a standard that lets AI assistants like Claude connect directly to outside data. Every graph gets its own MCP address — paste it into your agent's settings and it can search your notes while it answers you.",
  },
];

const FLOW_STEPS = ["Your notes (a vault)", "Knowledge graph", "AI analysis", "Connect via MCP"];

export function LandingExplainer() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 pb-16">
      <div className="mb-10 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-violet-700">
        {FLOW_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <span className="rounded-full bg-violet-100 px-3 py-1.5">{step}</span>
            {i < FLOW_STEPS.length - 1 && <span className="text-violet-300">&rarr;</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {SECTIONS.map(({ icon: Icon, heading, body }) => (
          <div key={heading} className="flex flex-col items-center text-center">
            <Icon />
            <h3 className="mt-4 text-sm font-medium text-violet-950">{heading}</h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
