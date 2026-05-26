import { readFileSync } from "node:fs";
import { normalizeGameData } from "../src/game/aliases.js";
import { SEASONS } from "../src/game/config.js";
import { INITIAL_PLAYERS, INITIAL_SESSIONS } from "../src/game/seedData.js";

const ALIAS_PATTERNS = [
  { label: "p47", pattern: /\bp47\b/i },
  { label: "Kingabulletlengue", pattern: /Kingabulletlengue/i },
  { label: "Kingabulletleague", pattern: /Kingabulletleague/i },
  { label: "Kinga", pattern: /\bKinga\b/i },
];

const sumKills = (sessions) =>
  sessions.reduce(
    (total, session) =>
      total + Object.values(session.kills || {}).reduce((sum, value) => sum + (Number(value) || 0), 0),
    0,
  );

const playerIdsForSessions = (sessions) => {
  const ids = new Set();
  sessions.forEach((session) => {
    if (session.winner) ids.add(session.winner);
    (session.attendees || []).forEach((playerId) => ids.add(playerId));
    (session.placements || []).forEach((playerId) => ids.add(playerId));
    Object.keys(session.kills || {}).forEach((playerId) => ids.add(playerId));
  });
  return ids;
};

const assertEqual = (label, actual, expected, failures) => {
  const ok = actual === expected;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${actual}`);
  if (!ok) {
    failures.push(`${label} expected ${expected}, received ${actual}`);
  }
};

const failures = [];
const seedSource = readFileSync(new URL("../src/game/seedData.js", import.meta.url), "utf8");
ALIAS_PATTERNS.forEach(({ label, pattern }) => {
  const count = (seedSource.match(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`)) || []).length;
  console.log(`${count === 0 ? "PASS" : "FAIL"} no ${label} references in seed data: ${count}`);
  if (count !== 0) {
    failures.push(`seed data still contains ${label}`);
  }
});

const { players, sessions } = normalizeGameData(INITIAL_PLAYERS, INITIAL_SESSIONS);
const playerIds = new Set(players.map((player) => player.id));
const orphanIds = [...playerIdsForSessions(sessions)].filter((playerId) => !playerIds.has(playerId)).sort();
console.log(`${orphanIds.length === 0 ? "PASS" : "FAIL"} no orphan player IDs: ${orphanIds.length}`);
if (orphanIds.length) {
  failures.push(`orphan player IDs: ${orphanIds.join(", ")}`);
}

const may25Sessions = sessions.filter((session) => session.date === "2026-05-25");
const may25Players = playerIdsForSessions(may25Sessions);
const season3 = SEASONS.find((season) => season.id === "s3");
const season3Sessions = sessions.filter(
  (session) => season3 && session.date >= season3.start && session.date <= season3.end,
);

assertEqual("May 25 lobbies", may25Sessions.length, 15, failures);
assertEqual("May 25 kills", sumKills(may25Sessions), 59, failures);
assertEqual("May 25 players", may25Players.size, 10, failures);
assertEqual("All-time sessions", sessions.length, 1071, failures);
assertEqual("All-time kills", sumKills(sessions), 6154, failures);
assertEqual("Season 3 lobbies", season3Sessions.length, 324, failures);
assertEqual("Season 3 kills", sumKills(season3Sessions), 1729, failures);

if (failures.length) {
  console.error(`Alias guard check failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exit(1);
}

console.log("PASS Kinga alias guard source check clean.");
