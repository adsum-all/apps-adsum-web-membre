import { useEffect, useMemo, useState } from "react";

import {
  type AnniversaireCategorie,
  type AnniversaireOut,
  type EvenementOut,
  type NotifPreferences,
  getAnniversaires,
  getEvenements,
  getNotifPreferences,
} from "../api.js";
import { type Lang, useLang, useT } from "../i18n.js";
import { dayKey, monthGrid, monthLabel } from "../format.js";
import { T } from "../proto.js";
import { useResource } from "../useResource.js";
import { CalendrierJour } from "./CalendrierJour.js";

const WEEKDAYS: Record<Lang, string[]> = {
  fr: ["L", "M", "M", "J", "V", "S", "D"],
  en: ["M", "T", "W", "T", "F", "S", "S"],
};

const CATEGORIES: { key: AnniversaireCategorie; pref: keyof NotifPreferences; label: string }[] = [
  { key: "vip", pref: "cal_vip", label: "calendar.filterVip" },
  { key: "responsables", pref: "cal_responsables", label: "calendar.filterResponsables" },
  { key: "commission", pref: "cal_commission", label: "calendar.filterCommission" },
];

function eventDayKey(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dayKey(d);
}

export function Calendrier({
  token,
  onJoin,
}: {
  token: string;
  onJoin?: (evenement: EvenementOut) => void;
}): JSX.Element {
  const t = useT();
  const lang = useLang();
  const now = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState<{ year: number; month: number }>({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState<string>(dayKey(now));
  const [prefs, setPrefs] = useState<NotifPreferences | null>(null);
  const [birthdays, setBirthdays] = useState<AnniversaireOut[]>([]);

  const { data: events, loading, error } = useResource(() => getEvenements(token), [token]);

  useEffect(() => {
    void getNotifPreferences(token).then(setPrefs).catch(() => undefined);
  }, [token]);

  // Fetch birthdays only for categories whose preference toggle is on, for the
  // currently visible month. Birthdays stay subtle: activities are primary.
  useEffect(() => {
    if (!prefs) return;
    let alive = true;
    const active = CATEGORIES.filter((c) => prefs[c.pref]);
    if (active.length === 0) {
      setBirthdays([]);
      return;
    }
    const mois = cursor.month + 1;
    Promise.all(active.map((c) => getAnniversaires(token, { categorie: c.key, mois }).catch(() => [])))
      .then((lists) => {
        if (!alive) return;
        const seen = new Set<string>();
        const merged: AnniversaireOut[] = [];
        for (const list of lists) {
          for (const a of list) {
            if (seen.has(a.id)) continue;
            seen.add(a.id);
            merged.push(a);
          }
        }
        setBirthdays(merged);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [token, prefs, cursor.year, cursor.month]);

  const cells = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor.year, cursor.month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EvenementOut[]>();
    for (const e of events ?? []) {
      const key = eventDayKey(e.debut);
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const birthdaysByDay = useMemo(() => {
    const map = new Map<string, AnniversaireOut[]>();
    for (const a of birthdays) {
      if (a.mois !== cursor.month + 1) continue;
      const key = `${cursor.year}-${String(a.mois).padStart(2, "0")}-${String(a.jour).padStart(2, "0")}`;
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [birthdays, cursor.year, cursor.month]);

  function togglePref(pref: keyof NotifPreferences): void {
    if (!prefs) return;
    setPrefs({ ...prefs, [pref]: !prefs[pref] });
    // The persistent write lives in Settings; here we only steer the view.
  }

  function shift(delta: number): void {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  if (loading) return <Centered text={t("calendar.loading")} />;
  if (error) return <Centered text={error} />;

  const selectedEvents = eventsByDay.get(selected) ?? [];
  const selectedBirthdays = birthdaysByDay.get(selected) ?? [];
  const todayKey = dayKey(now);

  return (
    <div style={{ paddingBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button type="button" aria-label={t("calendar.prev")} onClick={() => shift(-1)} style={navBtn}>‹</button>
        <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 16, textTransform: "capitalize" }}>
          {monthLabel(cursor.year, cursor.month, lang)}
        </div>
        <button type="button" aria-label={t("calendar.next")} onClick={() => shift(1)} style={navBtn}>›</button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {CATEGORIES.map((c) => {
          const on = prefs ? prefs[c.pref] : false;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => togglePref(c.pref)}
              style={{
                padding: "5px 11px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                border: `1px solid ${on ? T.b600 : T.line}`,
                background: on ? T.b600 : T.surf,
                color: on ? "#fff" : T.mut,
                cursor: "pointer",
              }}
            >
              {t(c.label)}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 4 }}>
        {WEEKDAYS[lang].map((w, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: T.faint, padding: "2px 0" }}>{w}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((cell) => {
          const hasEvents = (eventsByDay.get(cell.key) ?? []).length > 0;
          const hasBirthday = (birthdaysByDay.get(cell.key) ?? []).length > 0;
          const isSelected = cell.key === selected;
          const isToday = cell.key === todayKey;
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => setSelected(cell.key)}
              style={{
                aspectRatio: "1",
                borderRadius: 10,
                border: isToday ? `1.5px solid ${T.b600}` : `1px solid ${T.line}`,
                background: isSelected ? T.b600 : cell.inMonth ? T.surf : T.bg,
                color: isSelected ? "#fff" : cell.inMonth ? T.ink : T.faint,
                fontSize: 12.5,
                fontWeight: 600,
                position: "relative",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {cell.day}
              <span style={{ position: "absolute", bottom: 5, left: 0, right: 0, display: "flex", gap: 3, justifyContent: "center" }}>
                {hasEvents && <span style={{ width: 5, height: 5, borderRadius: "50%", background: isSelected ? "#fff" : T.b600 }} />}
                {hasBirthday && <span style={{ width: 5, height: 5, borderRadius: "50%", background: isSelected ? "#ffd9a0" : T.warn }} />}
              </span>
            </button>
          );
        })}
      </div>

      <CalendrierJour events={selectedEvents} anniversaires={selectedBirthdays} onJoin={onJoin} />
    </div>
  );
}

const navBtn = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: `1px solid ${T.line}`,
  background: T.surf,
  color: T.ink,
  fontSize: 18,
  cursor: "pointer",
} as const;

function Centered({ text }: { text: string }): JSX.Element {
  return (
    <div className="empty">
      <div className="empty-glyph" aria-hidden="true">▦</div>
      <p>{text}</p>
    </div>
  );
}
