"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { format } from "@/lib/i18n";

// Doit etre incrementee des que le texte des cases de consentement
// ci-dessous change - meme logique que app/new/dictaphone/consent/page.tsx,
// versionnee separement car ce formulaire affiche un texte different (4
// cases au lieu de 2).
const CONSENT_TEXT_VERSION = "2026-08-29-v1";

type Platform = "google_meet" | "teams" | "zoom";

export default function VisioConsentPage() {
  const { t, locale } = useI18n();
  const v = t.app.visioConsent;

  const PLATFORMS: { value: Platform; label: string; hint: string }[] = [
    { value: "google_meet", label: "Google Meet", hint: "ex: abc-defg-hij" },
    { value: "teams", label: "Microsoft Teams", hint: locale === "en" ? "meeting ID or invite link" : "identifiant ou lien d'invitation" },
    { value: "zoom", label: "Zoom", hint: locale === "en" ? "numeric meeting ID" : "identifiant numerique de la reunion" },
  ];

  const [title, setTitle] = useState(locale === "en" ? "Untitled meeting" : "Reunion sans titre");
  const [retention, setRetention] = useState("30");

  const [url, setUrl] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolvedPlatform, setResolvedPlatform] = useState<Platform | null>(null);
  const [resolvedNativeId, setResolvedNativeId] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);

  const [manualPlatform, setManualPlatform] = useState<Platform>("google_meet");
  const [manualNativeId, setManualNativeId] = useState("");

  // Consentement organisateur : de vraies cases pilotees par un etat React
  // (contrairement aux <div> statiques precedentes), verifiees a la fois
  // cote client (canJoin) et re-verifiees cote serveur via l'endpoint
  // /consent + crud.require_consent au moment du join reel.
  const [consentRecording, setConsentRecording] = useState(true);
  const [consentAiProcessing, setConsentAiProcessing] = useState(true);
  const [consentSharing, setConsentSharing] = useState(true);

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function resolveUrl(value: string) {
    const trimmed = value.trim();
    setResolvedPlatform(null);
    setResolvedNativeId(null);
    if (!trimmed) {
      setShowManualFallback(false);
      return;
    }
    setResolving(true);
    try {
      const res = await apiFetch("/api/visio/resolve-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed })
      });
      const data = res.ok ? await res.json() : { resolved: false };
      if (data.resolved) {
        setResolvedPlatform(data.platform);
        setResolvedNativeId(data.nativeMeetingId);
        setShowManualFallback(false);
      } else {
        setShowManualFallback(true);
      }
    } catch {
      setShowManualFallback(true);
    } finally {
      setResolving(false);
    }
  }

  function onUrlChange(value: string) {
    setUrl(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => resolveUrl(value), 500);
  }

  function onUrlBlurOrPaste() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    resolveUrl(url);
  }

  function inviteText() {
    return format(v.inviteText, {
      days: retention,
      url: typeof window !== "undefined" ? `${window.location.origin}/participant/consent` : ""
    });
  }

  async function copyInviteText() {
    try {
      await navigator.clipboard.writeText(inviteText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Best-effort : le presse-papiers peut etre indisponible (permissions,
      // contexte non securise) ; pas de fallback, l'utilisateur peut copier
      // le texte affiche a la main.
    }
  }

  async function join() {
    const platform = resolvedPlatform ?? (showManualFallback ? manualPlatform : null);
    const nativeMeetingId = resolvedNativeId ?? (showManualFallback ? manualNativeId.trim() : "");
    if (!platform || !nativeMeetingId) return;
    if (!consentRecording || !consentAiProcessing || !consentSharing) return;

    setError(null);
    setStarting(true);
    try {
      const meetingRes = await apiFetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, mode: "visio", retentionDays: Number(retention) })
      });
      const meeting = await meetingRes.json();

      // Meme endpoint que le dictaphone : une case cochee "l'enregistrement
      // et la transcription" accorde les deux types de consentement requis
      // cote serveur (oral_recording + transcript), les deux autres cases
      // couvrent des consentements supplementaires (traitement IA, partage).
      const consentRes = await apiFetch(`/api/meetings/${meeting.id}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentTypes: ["oral_recording", "transcript", "ai_processing", "participant_sharing"],
          textVersion: CONSENT_TEXT_VERSION
        })
      });
      if (!consentRes.ok) throw new Error("echec de l'enregistrement du consentement");

      const joinRes = await apiFetch("/api/visio/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id, platform, nativeMeetingId })
      });
      if (!joinRes.ok) throw new Error("echec du join");

      router.push(`/new/visio/live?id=${meeting.id}`);
    } catch (err) {
      setError(v.error);
      setStarting(false);
    }
  }

  const canJoin =
    (!!(resolvedPlatform && resolvedNativeId) || !!(showManualFallback && manualNativeId.trim())) &&
    consentRecording &&
    consentAiProcessing &&
    consentSharing;

  return (
    <div className="page page-narrow">
      <div className="top-actions">
        <Link href="/new">{v.back}</Link>
      </div>

      <h1>{v.h1}</h1>
      <p className="secondary-text" style={{ marginBottom: 14 }}>{v.sub}</p>

      <div className="label">{v.titleLabel}</div>
      <input className="input" style={{ marginBottom: 12 }} value={title} onChange={(e) => setTitle(e.target.value)} />

      <div className="label">{v.linkLabel}</div>
      <input
        className="input"
        style={{ marginBottom: 4 }}
        placeholder={v.linkPlaceholder}
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        onBlur={onUrlBlurOrPaste}
        onPaste={() => setTimeout(onUrlBlurOrPaste, 0)}
      />

      {resolving ? (
        <p className="muted" style={{ marginBottom: 12 }}>{v.detecting}</p>
      ) : resolvedPlatform ? (
        <p className="muted" style={{ marginBottom: 12, color: "var(--accent)" }}>
          {PLATFORMS.find((p) => p.value === resolvedPlatform)?.label ?? resolvedPlatform} {v.detected}
        </p>
      ) : (
        <p className="muted" style={{ marginBottom: 12 }}>{v.pasteHint}</p>
      )}

      {showManualFallback ? (
        <>
          <p className="muted" style={{ marginBottom: 10 }}>{v.fallbackHint}</p>
          <div className="label">{v.platformLabel}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {PLATFORMS.map((p) => (
              <div
                key={p.value}
                className={`card selectable ${manualPlatform === p.value ? "selected" : ""}`}
                style={{ flex: 1, textAlign: "center", padding: 10 }}
                onClick={() => setManualPlatform(p.value)}
              >
                {p.label}
              </div>
            ))}
          </div>

          <div className="label">{v.idLabel}</div>
          <input
            className="input"
            style={{ marginBottom: 12 }}
            placeholder={PLATFORMS.find((p) => p.value === manualPlatform)?.hint}
            value={manualNativeId}
            onChange={(e) => setManualNativeId(e.target.value)}
          />
        </>
      ) : null}

      <div className="card selectable" onClick={() => setConsentRecording(!consentRecording)}>
        {consentRecording ? "✓" : "○"} {v.consentRecording}
      </div>
      <div className="card selectable" onClick={() => setConsentAiProcessing(!consentAiProcessing)}>
        {consentAiProcessing ? "✓" : "○"} {v.consentAi}
      </div>
      <div className="card selectable" onClick={() => setConsentSharing(!consentSharing)}>
        {consentSharing ? "✓" : "○"} {v.consentSharing}
      </div>

      <div className="row" style={{ marginTop: 10, marginBottom: 4 }}>
        <span className="secondary-text">{v.retentionLabel}</span>
      </div>
      <select className="input" value={retention} onChange={(e) => setRetention(e.target.value)}>
        <option value="30">{v.retention30}</option>
        <option value="90">{v.retention90}</option>
        <option value="365">{v.retention365}</option>
      </select>

      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{v.inviteTitle}</div>
        <div className="secondary-text" style={{ marginBottom: 8 }}>{v.inviteBody}</div>
        <div className="muted" style={{ marginBottom: 8, fontStyle: "italic" }}>{inviteText()}</div>
        <button type="button" className="btn btn-block" onClick={copyInviteText}>
          {copied ? v.copied : v.copy}
        </button>
      </div>

      {error ? (
        <div className="card" style={{ color: "var(--danger)", marginTop: 12 }}>{error}</div>
      ) : null}

      <button className="btn btn-primary btn-block" disabled={!canJoin || starting} onClick={join}>
        {starting ? v.submitting : v.submit}
      </button>

      <p className="muted" style={{ marginTop: 12 }}>
        {v.rgpdLine} <Link href="/rgpd">{v.rgpdLink}</Link>
      </p>
    </div>
  );
}
