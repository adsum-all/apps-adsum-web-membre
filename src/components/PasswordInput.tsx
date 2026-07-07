import { type CSSProperties, useId, useState } from "react";

import { T } from "../proto.js";

interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  style?: CSSProperties;
  className?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  id?: string;
}

/**
 * Champ de saisie de mot de passe avec bouton bascule "afficher / masquer".
 *
 * Conserve value, onChange, required, autoComplete et le style fourni par
 * l'appelant. Le bouton est un <button type="button"> afin de ne jamais
 * soumettre le formulaire parent. Chaque instance gere son propre etat de
 * visibilite, ce qui permet plusieurs champs independants dans un meme
 * formulaire.
 */
export function PasswordInput({
  value,
  onChange,
  style,
  className,
  autoComplete,
  required,
  placeholder,
  id,
}: PasswordInputProps): JSX.Element {
  const [voir, setVoir] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        id={inputId}
        type={voir ? "text" : "password"}
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        style={{ ...(style ?? {}), width: "100%", paddingRight: 44, boxSizing: "border-box" }}
      />
      <button
        type="button"
        onClick={() => setVoir((v) => !v)}
        aria-label={voir ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={voir}
        title={voir ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 6,
          margin: "auto 0",
          height: 32,
          width: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          background: "transparent",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          color: T.mut,
        }}
      >
        {voir ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon(): JSX.Element {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(): JSX.Element {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-3.3 4.2" />
      <path d="M6.1 6.1A17.3 17.3 0 0 0 2 12s3.5 7 10 7a10.9 10.9 0 0 0 4.4-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
