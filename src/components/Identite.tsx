import { type MembreProfile, getDocuments, getEngagements } from "../api.js";
import { useT } from "../i18n.js";
import { T } from "../proto.js";
import { useResource } from "../useResource.js";

interface PieceProps {
  titre: string;
  sousTitre: string;
  done: boolean;
  onClick?: () => void;
}

function Piece({ titre, sousTitre, done, onClick }: PieceProps): JSX.Element {
  return (
    <div
      onClick={onClick}
      className={onClick ? "tap" : undefined}
      style={{ background: T.surf, border: `1px solid ${T.line}`, borderRadius: 13, padding: 13, display: "flex", alignItems: "center", gap: 11 }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 9, background: done ? T.okbg : T.bg, color: done ? T.ok : T.mut, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
        {done ? "✓" : "◻"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{titre}</div>
        <div style={{ fontSize: 10.5, color: done ? T.ok : T.mut }}>{sousTitre}</div>
      </div>
      {onClick && <span style={{ color: T.mut }}>›</span>}
    </div>
  );
}

export function Identite({
  token,
  profile,
  onEngagements,
  onSuivi,
}: {
  token: string;
  profile: MembreProfile | null;
  onEngagements: () => void;
  onSuivi: () => void;
}): JSX.Element {
  const t = useT();
  const docs = useResource(() => getDocuments(token), [token]);
  const engs = useResource(() => getEngagements(token), [token]);

  const verified = profile?.verifie ?? false;
  const documents = docs.data ?? [];
  const engagements = engs.data ?? [];
  const photoOk = verified || documents.some((d) => d.type === "photo" && d.statut === "traite");
  const pieceOk = verified || documents.some((d) => d.type === "piece_identite" && d.statut === "traite");
  const engagementsOk = verified || (engagements.length > 0 && engagements.every((e) => e.signe));
  const doneCount = [photoOk, pieceOk, engagementsOk].filter(Boolean).length;

  return (
    <div className="scr" style={{ padding: "6px 18px 14px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < doneCount ? T.b600 : T.line }} />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Piece titre={t("app.profil.photoAlt")} sousTitre={photoOk ? t("suivi.validated") : t("identite.toProvide")} done={photoOk} />
        <Piece titre={t("identite.officialDoc")} sousTitre={pieceOk ? t("identite.keptProtected") : t("identite.toProvide")} done={pieceOk} />
        <Piece
          titre={t("identite.engagementsSigned")}
          sousTitre={engagementsOk ? t("identite.engagementsDetail") : t("identite.toReadSign")}
          done={engagementsOk}
          onClick={onEngagements}
        />
      </div>

      {verified ? (
        <div style={{ marginTop: 14, background: T.okbg, border: `1px solid ${T.ok}`, borderRadius: 14, padding: 14, textAlign: "center" }}>
          <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 15, color: T.ok }}>{t("suivi.identityValidated")}</div>
          <div style={{ fontSize: 11, color: T.mut, marginTop: 4, lineHeight: 1.5 }}>
            {t("identite.validatedBy")}
            <br />
            {t("identite.cardQrFullyActive")}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14, background: T.warnbg, border: `1px solid ${T.warn}`, borderRadius: 14, padding: 14, textAlign: "center" }}>
          <div style={{ fontFamily: T.fd, fontWeight: 700, fontSize: 15, color: T.warn }}>{t("identite.awaitingVerification")}</div>
          <div style={{ fontSize: 11, color: T.mut, marginTop: 4, lineHeight: 1.5 }}>
            {t("identite.notFullyActive")}
          </div>
        </div>
      )}

      <div onClick={onSuivi} className="tap" style={{ marginTop: 12, height: 44, border: `1.5px solid ${T.ink}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 600 }}>
        {t("identite.trackProcessing")}
      </div>

      <div style={{ textAlign: "center", fontFamily: T.fm, fontSize: 8.5, color: T.faint, marginTop: 14 }}>
        {t("identite.gdprNote")}
      </div>
    </div>
  );
}
