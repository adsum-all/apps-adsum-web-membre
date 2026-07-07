import { type ReactNode, useEffect } from "react";

import { type AnniversaireCategorie, type NotifPreferences } from "../api.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";
import { CATEGORIES, FAMILLES_ANNIV, FILTRES_ACTIVITE } from "./Calendrier.js";

/**
 * Bottom sheet grouping every calendar filter. It keeps the calendar grid free
 * of a wall of chips: the grid stays visible immediately and the member opens
 * this sheet on purpose. Filters are grouped by intent (birthdays vs activities)
 * and the footer shows how many events match live. Mobile-first, accessible
 * (role dialog, Escape to close, aria-pressed on each chip).
 */
export function CalendrierFiltres({
  prefs,
  onTogglePref,
  famillesAnniv,
  onToggleFamille,
  filtres,
  onToggleFiltre,
  tousTags,
  tagFiltre,
  onToggleTag,
  resultCount,
  onReset,
  onClose,
}: {
  prefs: NotifPreferences | null;
  onTogglePref: (pref: keyof NotifPreferences) => void;
  famillesAnniv: Set<AnniversaireCategorie>;
  onToggleFamille: (key: AnniversaireCategorie) => void;
  filtres: Set<string>;
  onToggleFiltre: (key: string) => void;
  tousTags: { id: string; libelle: string }[];
  tagFiltre: string[];
  onToggleTag: (id: string) => void;
  resultCount: number;
  onReset: () => void;
  onClose: () => void;
}): JSX.Element {
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const respCats = CATEGORIES.filter((c) => c.group === "responsables");
  const perimCats = CATEGORIES.filter((c) => c.group === "perimetre");
  const actType = FILTRES_ACTIVITE.filter((f) => f.group === "type");
  const actFormat = FILTRES_ACTIVITE.filter((f) => f.group === "format");
  const actPerim = FILTRES_ACTIVITE.filter((f) => f.group === "perimetre");

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(9,12,20,0.5)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("calfiltres.dialogAria")}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.surf,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: "82%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -12px 40px rgba(9,12,20,0.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <span style={{ width: 40, height: 4, borderRadius: 999, background: T.line }} aria-hidden="true" />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 6px", borderBottom: `1px solid ${T.line}` }}>
          <span style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 16, color: T.ink }}>{t("calfiltres.title")}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" onClick={onReset} style={{ border: "none", background: "transparent", color: T.mut, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {t("calfiltres.reset")}
            </button>
            <button type="button" onClick={onClose} aria-label={t("common.close")} style={{ border: "none", background: T.bg, color: T.ink, width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>
              ×
            </button>
          </div>
        </div>

        <div style={{ overflowY: "auto", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          <Group title={t("calfiltres.groupAnniv")}>
            <SubLabel>{t("calfiltres.subResponsables")}</SubLabel>
            <Row>
              {respCats.map((c) => (
                <Chip key={c.key} on={!!prefs?.[c.pref]} onClick={() => onTogglePref(c.pref)} tone="blue">{t(c.label)}</Chip>
              ))}
              {FAMILLES_ANNIV.map((f) => (
                <Chip key={f.key} on={famillesAnniv.has(f.key)} onClick={() => onToggleFamille(f.key)} tone="amber">{t(f.label)}</Chip>
              ))}
            </Row>
            <SubLabel>{t("calfiltres.subPerimetre")}</SubLabel>
            <Row>
              {perimCats.map((c) => (
                <Chip key={c.key} on={!!prefs?.[c.pref]} onClick={() => onTogglePref(c.pref)} tone="blue">{t(c.label)}</Chip>
              ))}
            </Row>
          </Group>

          <Group title={t("nav.activites")}>
            <SubLabel>{t("calfiltres.subType")}</SubLabel>
            <Row>
              {actType.map((f) => (
                <Chip key={f.key} on={filtres.has(f.key)} onClick={() => onToggleFiltre(f.key)} tone="amber">{t(f.label)}</Chip>
              ))}
            </Row>
            <SubLabel>{t("calfiltres.subFormat")}</SubLabel>
            <Row>
              {actFormat.map((f) => (
                <Chip key={f.key} on={filtres.has(f.key)} onClick={() => onToggleFiltre(f.key)} tone="blue">{t(f.label)}</Chip>
              ))}
            </Row>
            <SubLabel>{t("calfiltres.subPerimActivite")}</SubLabel>
            <Row>
              {actPerim.map((f) => (
                <Chip key={f.key} on={filtres.has(f.key)} onClick={() => onToggleFiltre(f.key)} tone="blue">{t(f.label)}</Chip>
              ))}
            </Row>
            {tousTags.length > 0 && (
              <>
                <SubLabel>{t("calfiltres.subTags")}</SubLabel>
                <Row>
                  {tousTags.map((tg) => (
                    <Chip key={tg.id} on={tagFiltre.includes(tg.id)} onClick={() => onToggleTag(tg.id)} tone="amber">{tg.libelle}</Chip>
                  ))}
                </Row>
              </>
            )}
          </Group>
        </div>

        <div style={{ padding: "10px 18px calc(10px + env(safe-area-inset-bottom, 0px))", borderTop: `1px solid ${T.line}` }}>
          <button
            type="button"
            onClick={onClose}
            style={{ width: "100%", height: 46, borderRadius: 12, border: "none", background: `linear-gradient(180deg,${T.b500},${T.b600})`, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            {t("calfiltres.seeResults").replace("{count}", String(resultCount))}
          </button>
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ margin: 0, fontFamily: T.fd, fontWeight: 700, fontSize: 13, color: T.ink }}>{title}</h3>
      {children}
    </section>
  );
}

function SubLabel({ children }: { children: ReactNode }): JSX.Element {
  return <span style={{ fontFamily: T.fm, fontSize: 9, letterSpacing: 0.4, textTransform: "uppercase", color: T.mut, marginTop: 2 }}>{children}</span>;
}

function Row({ children }: { children: ReactNode }): JSX.Element {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{children}</div>;
}

function Chip({ on, onClick, tone, children }: { on: boolean; onClick: () => void; tone: "blue" | "amber"; children: ReactNode }): JSX.Element {
  const accent = tone === "amber" ? T.warn : T.b600;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        border: `1px solid ${on ? accent : T.line}`,
        background: on ? accent : T.surf,
        color: on ? "#fff" : T.mut,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}
