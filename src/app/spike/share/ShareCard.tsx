"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

const STORY_FILE_NAME = "cuon-story.png";

function noSubscription() {
  // `navigator.userAgent` never changes for the life of a tab, so there is
  // nothing to subscribe to — same shape as `useSyncExternalStore` still
  // wants, per `ThemeToggle`'s own comment on reading browser-owned values
  // outside an effect.
  return () => {};
}

function getUserAgentSnapshot(): string {
  return window.navigator.userAgent;
}

function getServerUserAgentSnapshot(): string {
  return "";
}

type TShareOutcome = { status: "idle" } | { status: "shared" } | { status: "error"; name: string };

/**
 * Spike 2 (D30): can the browser's native Web Share Sheet send the
 * `/spike/og` PNG straight to Instagram/Messenger/Zalo's story composer?
 * Fetches the PNG once, shows the user agent and `canShare({ files })`
 * result so each device test (Trúc, by hand) is self-documenting from a
 * screenshot alone.
 */
export function ShareCard() {
  const t = useTranslations("spike.share");
  const userAgent = useSyncExternalStore(noSubscription, getUserAgentSnapshot, getServerUserAgentSnapshot);
  const [file, setFile] = useState<File | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<TShareOutcome>({ status: "idle" });

  // Derived synchronously from `file`, not a `setState`-in-effect
  // (react-hooks' `set-state-in-effect` rule) — no need for the value
  // itself to live in state. The revoke-on-change/unmount side effect
  // below doesn't call `setState`, so the rule doesn't apply to it.
  const downloadUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadStoryFile() {
      try {
        const response = await fetch("/spike/og");
        if (!response.ok) throw new Error(`/spike/og responded with ${response.status}`);
        const blob = await response.blob();
        if (cancelled) return;
        setFile(new File([blob], STORY_FILE_NAME, { type: "image/png" }));
      } catch (error) {
        if (cancelled) return;
        setFetchError(error instanceof Error ? error.name : String(error));
      }
    }

    void loadStoryFile();
    return () => {
      cancelled = true;
    };
  }, []);

  const canShareFiles =
    file !== null && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

  async function handleShare() {
    if (!file) return;
    try {
      await navigator.share({ files: [file] });
      setOutcome({ status: "shared" });
    } catch (error) {
      // The user closing the share sheet isn't an error worth showing (D30's
      // own test list: "an AbortError shows nothing").
      if (error instanceof DOMException && error.name === "AbortError") return;
      setOutcome({ status: "error", name: error instanceof Error ? error.name : String(error) });
    }
  }

  return (
    <main style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h1>{t("heading")}</h1>
      <p>
        {t("userAgentLabel")}: <span>{userAgent}</span>
      </p>

      {fetchError ? <p>{t("errorPrefix")}: {fetchError}</p> : null}

      {canShareFiles ? (
        <button type="button" onClick={() => void handleShare()}>
          {t("shareButton")}
        </button>
      ) : file && downloadUrl ? (
        <div>
          <a href={downloadUrl} download={STORY_FILE_NAME}>
            {t("downloadFallback")}
          </a>
          <p>{t("openInBrowserHint")}</p>
        </div>
      ) : null}

      {outcome.status === "shared" ? <p>{t("shareSuccess")}</p> : null}
      {outcome.status === "error" ? (
        <p>
          {t("errorPrefix")}: {outcome.name}
        </p>
      ) : null}
    </main>
  );
}
