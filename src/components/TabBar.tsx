import { useT } from "../i18n.js";

export type TabId = "carte" | "activites" | "calendrier" | "historique" | "profil";

const TABS: { id: TabId; glyph: string }[] = [
  { id: "carte", glyph: "▣" },
  { id: "activites", glyph: "▤" },
  { id: "calendrier", glyph: "▦" },
  { id: "historique", glyph: "↻" },
  { id: "profil", glyph: "◔" },
];

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBar({ active, onChange }: TabBarProps): JSX.Element {
  const t = useT();
  return (
    <nav className="tabbar" aria-label="Navigation">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab ${active === tab.id ? "tab-active" : ""}`}
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id ? "page" : undefined}
        >
          <span className="tab-glyph" aria-hidden="true">{tab.glyph}</span>
          <span className="tab-label">{t(`nav.${tab.id}`)}</span>
        </button>
      ))}
    </nav>
  );
}
