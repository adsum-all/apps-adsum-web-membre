export type TabId = "carte" | "activites" | "historique" | "profil";

const TABS: { id: TabId; label: string; glyph: string }[] = [
  { id: "carte", label: "Ma carte", glyph: "▣" },
  { id: "activites", label: "Activites", glyph: "▤" },
  { id: "historique", label: "Historique", glyph: "↻" },
  { id: "profil", label: "Profil", glyph: "◔" },
];

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBar({ active, onChange }: TabBarProps): JSX.Element {
  return (
    <nav className="tabbar" aria-label="Navigation">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`tab ${active === t.id ? "tab-active" : ""}`}
          onClick={() => onChange(t.id)}
          aria-current={active === t.id ? "page" : undefined}
        >
          <span className="tab-glyph" aria-hidden="true">{t.glyph}</span>
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
