// Proxy vers le service FastAPI (ai-service/) pour le bot de reunion Vexa
// (join/transcript/leave). Voir ai-service/clients/vexa.py pour le contrat
// exact avec l'API cloud Vexa et sa gestion du fallback mock.

import type { TranscriptSegment } from "./store";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export type VisioPlatform = "google_meet" | "teams" | "zoom";

function meetingKey(platform: VisioPlatform, nativeMeetingId: string): string {
  return `${platform}:${nativeMeetingId}`;
}

export async function joinVisioMeeting(params: {
  platform: VisioPlatform;
  nativeMeetingId: string;
  botName?: string;
}): Promise<{ joined: boolean; source: "real" | "mock" }> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/visio/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: params.platform,
        native_meeting_id: params.nativeMeetingId,
        bot_name: params.botName
      })
    });
    if (!res.ok) throw new Error(`ai-service visio/join error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("[vexa] ai-service unreachable, join reported as mock:", err);
    return { joined: true, source: "mock" };
  }
}

export async function getVisioTranscript(params: {
  platform: VisioPlatform;
  nativeMeetingId: string;
}): Promise<{ segments: TranscriptSegment[]; source: "real" | "mock"; live: boolean }> {
  try {
    const key = meetingKey(params.platform, params.nativeMeetingId);
    const res = await fetch(`${AI_SERVICE_URL}/visio/${encodeURIComponent(key)}/transcript`);
    if (!res.ok) throw new Error(`ai-service visio/transcript error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("[vexa] ai-service unreachable while polling transcript:", err);
    return { segments: [], source: "mock", live: false };
  }
}

export async function leaveVisioMeeting(params: {
  platform: VisioPlatform;
  nativeMeetingId: string;
}): Promise<{ segments: TranscriptSegment[]; source: "real" | "mock" }> {
  try {
    const key = meetingKey(params.platform, params.nativeMeetingId);
    const res = await fetch(`${AI_SERVICE_URL}/visio/${encodeURIComponent(key)}/leave`, { method: "POST" });
    if (!res.ok) throw new Error(`ai-service visio/leave error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("[vexa] ai-service unreachable, fallback to empty transcript:", err);
    return { segments: [], source: "mock" };
  }
}
