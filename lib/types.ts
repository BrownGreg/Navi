export type Project = { id: string; name: string };

// Miroir de MeetingOut (ai-service/schemas.py) tel que serialise en camelCase
// par CamelModel.
export type Meeting = {
  id: string;
  shareId: string;
  title: string;
  mode: "visio" | "dictaphone";
  date: string;
  durationMin: number;
  status: "processing" | "ready";
  source: "real" | "mock";
  retentionDays: number;
  transcript?: { speaker: string; text: string; start: number; end?: number }[] | null;
  cr?: {
    resume: string;
    decisions: string[];
    actions: { text: string; owner: string; priority?: string | null; done?: boolean }[];
    themes: string[];
  } | null;
  platform?: "google_meet" | "teams" | "zoom" | null;
  nativeMeetingId?: string | null;
  moderation?: { flagged: boolean; category?: string | null; rationale?: string | null; source: string } | null;
  classification?: {
    tone: string;
    urgency: string;
    themes: string[];
    perSegment: { speaker: string; theme: string; tone: string }[];
  } | null;
  project?: Project | null;
};
