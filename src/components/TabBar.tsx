import { useT } from "../i18n.js";

export type TabId = "carte" | "activites" | "calendrier" | "historique" | "profil";

/** Crisp inline SVG icons (24px grid, 1.8 stroke) for a professional tab bar. */
function TabIcon({ id }: { id: TabId }): JSX.Element {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (id) {
    case "carte":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </svg>
      );
    case "activites":
      return (
        <svg {...common}>
          <path d="M3 12h4l2.5-6 4 12 2.5-6h5" />
        </svg>
      );
    case "calendrier":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      );
    case "historique":
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 1 0 2.3-5.6" />
          <path d="M4 4v4h4" />
          <path d="M12 8v4l3 2" />
        </svg>
      );
    case "profil":
      return (
        <svg {...common}>
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M5 20c1.2-3.4 3.9-5 7-5s5.8 1.6 7 5" />
        </svg>
      );
  }
}

const TABS: TabId[] = ["carte", "activites", "calendrier", "historique", "profil"];

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBar({ active, onChange }: TabBarProps): JSX.Element {
  const t = useT();
  return (
    <nav className="tabbar" aria-label="Navigation">
      {TABS.map((id) => (
        <button
          key={id}
          type="button"
          className={`tab ${active === id ? "tab-active" : ""}`}
          onClick={() => onChange(id)}
          aria-current={active === id ? "page" : undefined}
        >
          <span className="tab-glyph">
            <TabIcon id={id} />
          </span>
          <span className="tab-label">{t(`nav.${id}`)}</span>
        </button>
      ))}
    </nav>
  );
}
