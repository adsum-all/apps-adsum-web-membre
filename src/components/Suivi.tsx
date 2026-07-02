import { type MembreProfile, getDocuments } from "../api.js";
import { T } from "../proto.js";
import { useResource } from "../useResource.js";

type StepState = "done" | "current" | "pending";

interface Step {
  titre: string;
  sousTitre: string;
  state: StepState;
}

function Dot({ state }: { state: StepState }): JSX.Element {
  if (state === "done") {
    return <div style={{ position: "absolute", left: -24, top: 0, width: 18, height: 18, borderRadius: "50%", background: T.ok, color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>;
  }
  if (state === "current") {
    return <div style={{ position: "absolute", left: -24, top: 0, width: 18, height: 18, borderRadius: "50%", background: T.b600, color: "#fff", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>●</div>;
  }
  return <div style={{ position: "absolute", left: -24, top: 0, width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${T.line}`, background: T.surf }} />;
}

function fmt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
}

export function Suivi({ token, profile }: { token: string; profile: MembreProfile | null }): JSX.Element {
  const docs = useResource(() => getDocuments(token), [token]);
  const verified = profile?.verifie ?? false;
  const documents = docs.data ?? [];
  const dernier = documents[0] ?? null;

  // Derive the furthest reached stage from the real dossier state.
  const recu = verified || documents.some((d) => ["recu", "lu", "traite"].includes(d.statut));
  const lu = verified || documents.some((d) => ["lu", "traite"].includes(d.statut));
  const traiteEnCours = !verified && documents.some((d) => d.statut === "lu");

  const steps: Step[] = [
    { titre: "Dossier soumis", sousTitre: dernier?.demande_le ? fmt(dernier.demande_le) : "Compte créé par l'administration", state: "done" },
    { titre: "Reçu par l'administration", sousTitre: recu ? "Bien reçu" : "En attente", state: recu ? "done" : "current" },
    { titre: "Lu par un administrateur", sousTitre: lu ? fmt(dernier?.recu_le ?? null) || "Consulté" : "En attente", state: lu ? "done" : recu ? "current" : "pending" },
    {
      titre: verified ? "Identité validée" : "En cours de traitement",
      sousTitre: verified ? "Carte & QR actifs" : "Délai estimé : 48-72 h",
      state: verified ? "done" : lu || traiteEnCours ? "current" : "pending",
    },
    { titre: "Décision finale", sousTitre: verified ? "Validée" : "En attente", state: verified ? "done" : "pending" },
  ];

  return (
    <div className="scr" style={{ padding: "6px 18px 14px" }}>
      <div style={{ fontSize: 11, color: T.mut, marginBottom: 18 }}>
        {verified ? "Identité validée" : "Validation d'identité en cours"}
      </div>
      <div style={{ position: "relative", paddingLeft: 24 }}>
        <div style={{ position: "absolute", left: 8, top: 5, bottom: 14, width: 2, background: T.line }} />
        {steps.map((s, i) => (
          <div key={s.titre} style={{ position: "relative", marginBottom: i < steps.length - 1 ? 18 : 0 }}>
            <Dot state={s.state} />
            <div style={{ fontSize: 12.5, fontWeight: 600, color: s.state === "pending" ? T.faint : s.state === "current" ? T.b600 : T.ink }}>
              {s.titre}
            </div>
            <div style={{ fontSize: 10.5, color: s.state === "pending" ? T.faint : T.mut }}>{s.sousTitre}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, background: T.bg, border: `1px solid ${T.line}`, borderRadius: 12, padding: 12, fontSize: 10.5, color: T.mut, lineHeight: 1.5 }}>
        ⓘ Le traitement par l'administration peut prendre du temps. Vous êtes notifié à chaque étape.
      </div>
    </div>
  );
}
