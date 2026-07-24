// Etat transitoire : persistance par fichier JSON local, en attendant le
// branchement complet de Prisma/Postgres (ticket P2-05). Ne pas etendre ce
// store pour de nouvelles features qui pourraient a la place vivre en base.
import fs from "fs";
import path from "path";

export type TranscriptSegment = {
  speaker: string;
  text: string;
  start: number;
};

export type MeetingCR = {
  resume: string;
  decisions: string[];
  actions: { text: string; owner: string }[];
  themes: string[];
};

export type ModerationResult = {
  flagged: boolean;
  category?: string | null;
  rationale?: string | null;
  source: "real" | "mock";
};

export type Meeting = {
  id: string;
  shareId: string;
  title: string;
  mode: "visio" | "dictaphone";
  date: string;
  durationMin: number;
  status: "processing" | "ready";
  source: "mock" | "real";
  retentionDays: number;
  transcript?: TranscriptSegment[];
  cr?: MeetingCR;
  platform?: "google_meet" | "teams" | "zoom";
  nativeMeetingId?: string;
  moderation?: ModerationResult;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "meetings.json");

function seedMeetings(): Meeting[] {
  return [
    {
      id: "seed-1",
      shareId: "shr-seed1",
      title: "Point equipe hebdo",
      mode: "visio",
      date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      durationMin: 45,
      status: "ready",
      source: "mock",
      retentionDays: 30,
      transcript: [
        { speaker: "Kim", text: "On fait un tour rapide des sujets de la semaine.", start: 0 },
        { speaker: "Participant 2", text: "Le sprint 4 a pris un peu de retard sur la diarisation.", start: 12 },
        { speaker: "Kim", text: "On valide qu'on garde le meme perimetre pour le sprint 5.", start: 28 }
      ],
      cr: {
        resume: "Point hebdomadaire sur l'avancement du sprint et les blocages en cours.",
        decisions: ["Perimetre du sprint 5 valide sans modification"],
        actions: [{ text: "Envoyer le recap client", owner: "Kim" }],
        themes: ["Avancement sprint", "Diarisation"]
      }
    },
    {
      id: "seed-2",
      shareId: "shr-seed2",
      title: "Retro sprint 4",
      mode: "dictaphone",
      date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      durationMin: 30,
      status: "ready",
      source: "mock",
      retentionDays: 90,
      transcript: [
        { speaker: "Max", text: "Ce qui a bien marche : la mise en place du wireframe.", start: 0 },
        { speaker: "Intervenant anonyme", text: "Ce qui a moins bien marche : l'integration Gladia a pris du temps.", start: 15 }
      ],
      cr: {
        resume: "Retrospective du sprint 4 : points positifs et blocages techniques.",
        decisions: ["Prevoir un buffer de 2 jours sur les integrations API au sprint 5"],
        actions: [{ text: "Documenter l'integration Gladia", owner: "Max" }],
        themes: ["Retrospective", "Integrations API"]
      }
    }
  ];
}

function ensureStore(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedMeetings(), null, 2), "utf-8");
  }
}

export function getAllMeetings(): Meeting[] {
  ensureStore();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  const meetings: Meeting[] = JSON.parse(raw);
  return meetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getMeetingById(id: string): Meeting | undefined {
  return getAllMeetings().find((m) => m.id === id);
}

export function getMeetingByShareId(shareId: string): Meeting | undefined {
  return getAllMeetings().find((m) => m.shareId === shareId);
}

function saveAll(meetings: Meeting[]): void {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(meetings, null, 2), "utf-8");
}

export function createMeeting(input: {
  title: string;
  mode: "visio" | "dictaphone";
  retentionDays: number;
}): Meeting {
  const meetings = getAllMeetings();
  const id = `mtg-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const meeting: Meeting = {
    id,
    shareId: `shr-${Math.random().toString(36).slice(2, 10)}`,
    title: input.title,
    mode: input.mode,
    date: new Date().toISOString(),
    durationMin: 0,
    status: "processing",
    source: "mock",
    retentionDays: input.retentionDays
  };
  meetings.push(meeting);
  saveAll(meetings);
  return meeting;
}

export function updateMeeting(id: string, patch: Partial<Meeting>): Meeting | undefined {
  const meetings = getAllMeetings();
  const idx = meetings.findIndex((m) => m.id === id);
  if (idx === -1) return undefined;
  meetings[idx] = { ...meetings[idx], ...patch };
  saveAll(meetings);
  return meetings[idx];
}

export type RgpdRequest = {
  id: string;
  email: string;
  meetingId: string;
  type: "access" | "rectification" | "erasure";
  createdAt: string;
};

const RGPD_FILE = path.join(DATA_DIR, "rgpd-requests.json");

export function saveRgpdRequest(req: Omit<RgpdRequest, "id" | "createdAt">): RgpdRequest {
  ensureStore();
  let list: RgpdRequest[] = [];
  if (fs.existsSync(RGPD_FILE)) {
    list = JSON.parse(fs.readFileSync(RGPD_FILE, "utf-8"));
  }
  const full: RgpdRequest = {
    ...req,
    id: `rgpd-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString()
  };
  list.push(full);
  fs.writeFileSync(RGPD_FILE, JSON.stringify(list, null, 2), "utf-8");
  return full;
}
