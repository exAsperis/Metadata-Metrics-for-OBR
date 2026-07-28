import OBR from "@owlbear-rodeo/sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  analyzeMetadata,
  type MetadataAnalysis,
} from "../metadata/analyzeMetadata";

type Status = "connecting" | "ready" | "restricted" | "error";

interface OwlbearState {
  status: Status;
  analysis: MetadataAnalysis | null;
  updatedAt: Date | null;
  error: string | null;
  themeError: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

const setThemeVariables = (theme: Awaited<ReturnType<typeof OBR.theme.getTheme>>) => {
  const root = document.documentElement;
  root.dataset.theme = theme.mode.toLowerCase();
  root.style.setProperty("--obr-primary", theme.primary.main);
  root.style.setProperty("--obr-primary-contrast", theme.primary.contrastText);
  root.style.setProperty("--obr-bg", theme.background.default);
  root.style.setProperty("--obr-paper", theme.background.paper);
  root.style.setProperty("--obr-text", theme.text.primary);
  root.style.setProperty("--obr-muted", theme.text.secondary);
  root.style.setProperty("--obr-disabled", theme.text.disabled);
};

export function useOwlbearMetadata(): OwlbearState {
  const [status, setStatus] = useState<Status>("connecting");
  const [analysis, setAnalysis] = useState<MetadataAnalysis | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const activeRef = useRef(false);
  const roleRef = useRef<"GM" | "PLAYER" | null>(null);

  const acceptMetadata = useCallback((metadata: unknown) => {
    if (!activeRef.current || roleRef.current !== "GM") return;
    try {
      setAnalysis(analyzeMetadata(metadata));
      setUpdatedAt(new Date());
      setError(null);
      setStatus("ready");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Metadata analysis failed.",
      );
      setStatus("error");
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!activeRef.current) return;
    setRefreshing(true);
    try {
      try {
        setThemeVariables(await OBR.theme.getTheme());
        setThemeError(null);
      } catch {
        setThemeError("Owlbear theme unavailable; using system colors.");
      }
      const role = await OBR.player.getRole();
      roleRef.current = role;
      if (role !== "GM") {
        setStatus("restricted");
        setAnalysis(null);
        return;
      }
      acceptMetadata(await OBR.room.getMetadata());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to read room metadata.",
      );
      setStatus("error");
    } finally {
      if (activeRef.current) setRefreshing(false);
    }
  }, [acceptMetadata]);

  useEffect(() => {
    activeRef.current = true;
    let unsubscribeMetadata: (() => void) | undefined;
    let unsubscribePlayer: (() => void) | undefined;
    let unsubscribeTheme: (() => void) | undefined;
    let ready = false;
    const readyTimeout = window.setTimeout(() => {
      if (!activeRef.current || ready) return;
      setError("Owlbear SDK did not become ready. Confirm this page is loaded as an extension.");
      setStatus("error");
    }, 8_000);

    if (window.self === window.top) {
      setError("Open this extension inside an Owlbear Rodeo room.");
      setStatus("error");
      return () => {
        activeRef.current = false;
      };
    }

    OBR.onReady(async () => {
      if (!activeRef.current) return;
      ready = true;
      window.clearTimeout(readyTimeout);
      try {
        try {
          setThemeVariables(await OBR.theme.getTheme());
          unsubscribeTheme = OBR.theme.onChange(setThemeVariables);
          setThemeError(null);
        } catch {
          setThemeError("Owlbear theme unavailable; using system colors.");
        }

        const role = await OBR.player.getRole();
        if (!activeRef.current) return;
        roleRef.current = role;
        unsubscribePlayer = OBR.player.onChange((player) => {
          if (!activeRef.current || player.role === roleRef.current) return;
          roleRef.current = player.role;
          if (player.role === "GM") void refresh();
          else {
            setAnalysis(null);
            setStatus("restricted");
          }
        });
        unsubscribeMetadata = OBR.room.onMetadataChange(acceptMetadata);

        if (role !== "GM") {
          setStatus("restricted");
          return;
        }

        acceptMetadata(await OBR.room.getMetadata());
      } catch (cause) {
        if (!activeRef.current) return;
        setError(
          cause instanceof Error ? cause.message : "Owlbear SDK initialization failed.",
        );
        setStatus("error");
      }
    });

    return () => {
      activeRef.current = false;
      window.clearTimeout(readyTimeout);
      unsubscribeMetadata?.();
      unsubscribePlayer?.();
      unsubscribeTheme?.();
    };
  }, [acceptMetadata, refresh]);

  return {
    status,
    analysis,
    updatedAt,
    error,
    themeError,
    refreshing,
    refresh,
  };
}
