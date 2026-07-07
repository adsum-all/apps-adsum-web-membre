import { useMemo, useRef, useState } from "react";

import { type Pays, PAYS, filtrerPays } from "../countries.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";

const inp = {
  width: "100%",
  border: `1px solid ${T.line}`,
  borderRadius: 11,
  padding: "11px 12px",
  fontSize: 13.5,
  fontFamily: T.fu,
  background: T.surf,
  boxSizing: "border-box",
} as const;

/** A searchable dropdown over the country list. Opens on focus, filters as you
 * type (accent-insensitive), and closes on selection. */
function CountryDropdown({
  placeholder,
  render,
  onPick,
  display,
}: {
  placeholder: string;
  render: (p: Pays) => string;
  onPick: (p: Pays) => void;
  display: string;
}): JSX.Element {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => filtrerPays(query), [query]);

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((v) => !v)}
        className="tap"
        style={{ ...inp, display: "flex", alignItems: "center", justifyContent: "space-between", color: display ? T.ink : T.mut }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display || placeholder}</span>
        <span style={{ color: T.mut, marginLeft: 8 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 40,
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: T.surf,
            border: `1px solid ${T.line}`,
            borderRadius: 12,
            boxShadow: "0 16px 34px -14px rgba(20,24,40,.35)",
            overflow: "hidden",
          }}
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("form.searchCountry")}
            style={{ ...inp, border: "none", borderBottom: `1px solid ${T.line}`, borderRadius: 0 }}
          />
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {results.length === 0 && <div style={{ padding: 12, fontSize: 12.5, color: T.mut }}>{t("form.noCountry")}</div>}
            {results.map((p) => (
              <div
                key={p.code}
                className="tap"
                onClick={() => {
                  onPick(p);
                  setQuery("");
                  setOpen(false);
                }}
                style={{ padding: "10px 12px", fontSize: 13.5, borderBottom: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between", gap: 8 }}
              >
                <span>{render(p)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Residence/intendance country selector. Value is the French country name. */
export function PaysSelect({ value, onChange }: { value: string; onChange: (nom: string) => void }): JSX.Element {
  const t = useT();
  return (
    <CountryDropdown
      placeholder={t("form.selectCountry")}
      display={value}
      render={(p) => p.nom}
      onPick={(p) => onChange(p.nom)}
    />
  );
}

/**
 * Phone entry: an independent dialling-code selector (indicatif + country name)
 * side by side with the local number. The dialling code is not tied to the
 * residence country: a member can live in one country and use a number from
 * another.
 */
export function PhoneField({
  indicatif,
  numero,
  onIndicatif,
  onNumero,
}: {
  indicatif: string;
  numero: string;
  onIndicatif: (i: string) => void;
  onNumero: (n: string) => void;
}): JSX.Element {
  const t = useT();
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ flex: "0 0 128px" }}>
        <CountryDropdown
          placeholder={t("form.dialCode")}
          display={indicatif}
          render={(p) => `${p.indicatif}  ${p.nom}`}
          onPick={(p) => onIndicatif(p.indicatif)}
        />
      </div>
      <input
        type="tel"
        inputMode="tel"
        value={numero}
        onChange={(e) => onNumero(e.target.value)}
        placeholder={t("form.phoneNumber")}
        style={{ ...inp, flex: 1 }}
      />
    </div>
  );
}

/** Look up a dialling code from a country name (to prefill after country pick). */
export function indicatifDePays(nom: string): string {
  const found = PAYS.find((p) => p.nom === nom);
  return found ? found.indicatif : "";
}
