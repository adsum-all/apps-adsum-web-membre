import { useEffect, useState } from "react";

import { ApiError } from "./api.js";

export interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Load an async resource once, exposing loading and error states. Used by the
// list tabs so each stays small and consistent.
export function useResource<T>(loader: () => Promise<T>, deps: unknown[]): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    setState({ data: null, loading: true, error: null });
    loader()
      .then((data) => {
        if (alive) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (alive) {
          // ApiError messages are already localized; the raw fallback is picked
          // from the persisted language so it is bilingual too.
          const fallback = (() => {
            try {
              return typeof localStorage !== "undefined" && localStorage.getItem("adsum.lang") === "en" ? "Network error" : "Erreur réseau";
            } catch {
              return "Erreur réseau";
            }
          })();
          const message = err instanceof ApiError ? err.message : fallback;
          setState({ data: null, loading: false, error: message });
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
