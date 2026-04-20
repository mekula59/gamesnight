export const ADMIN_PASSWORD = atob("Z2FtZXNuaWdodDIwMjY=");

export const SEASONAL_EVENT = {
  active: true,
  name: "Easter 2026",
  start: "2026-04-03",
  startHour: 19,
  end: "2026-04-06",
  endHour: 16,
};

export const STORAGE_VERSION = "gn-v100";
export const SITE_TITLE = "Games Night";
export const HOSTED_BY = "Mekula";
export const FEATURED_GAME = "Bullet League";
export const DISCORD_URL = "https://discord.gg/gJSjaBFBDD";
export const DISCORD_WEBHOOK = "";
export const TWITCH_URL = "https://www.twitch.tv/mekulavick";
export const SESSION_START_HOUR = 17;
export const SESSION_END_HOUR = 19;
export const SESSION_DAYS = [1, 2, 3, 4, 5, 6];

export const ACCENT_COLORS = [
  "#FFD700",
  "#FF4D8F",
  "#00E5FF",
  "#FF6B35",
  "#C77DFF",
  "#00FF94",
  "#FF5252",
  "#40C4FF",
  "#FFD740",
  "#64FFDA",
  "#FFAB40",
  "#E040FB",
  "#1DE9B6",
  "#FF6E6E",
  "#B2FF59",
  "#FF9E80",
  "#F48FB1",
  "#CE93D8",
  "#80DEEA",
  "#FF8A80",
  "#82B1FF",
  "#FFD180",
  "#A7FFEB",
  "#B388FF",
];

export const RANK_FAQ = [
  {
    icon: "👑",
    name: "The Champion",
    color: "#FFD700",
    desc: "Most wins on the board. There is only one crown, and it moves the second somebody earns it.",
  },
  {
    icon: "💀",
    name: "The Reaper",
    color: "#FF4D8F",
    desc: "All-time kill leader. Pure damage, pure pressure, and the kind of number the whole room feels.",
  },
  {
    icon: "🎯",
    name: "Sharpshooter",
    color: "#00E5FF",
    desc: "Best K/D in the room with at least 2 lobbies played. Clean work, very little waste.",
  },
  {
    icon: "🎮",
    name: "Ride or Die",
    color: "#FFAB40",
    desc: "Most appearances overall. The room can count on seeing your name whether the night is kind or not.",
  },
  {
    icon: "⚡",
    name: "Legend",
    color: "#C77DFF",
    desc: "10 or more all-time wins. Rare air. By this point your file is part of the room's history.",
  },
  {
    icon: "🔥",
    name: "Veteran",
    color: "#FFAB40",
    desc: "6 or more wins. You know how the room moves and you have proved it more than once.",
  },
  {
    icon: "⭐",
    name: "Gunslinger",
    color: "#40C4FF",
    desc: "3 or more wins. Past the rookie stage and dangerous enough that nobody ignores your tag.",
  },
  {
    icon: "🌟",
    name: "Rising Star",
    color: "#00FF94",
    desc: "Your first lobby win is on record. Once that happens, you are officially part of the chase.",
  },
  {
    icon: "🎮",
    name: "Rookie",
    color: "#7a6eaa",
    desc: "No win yet, but your name is in the room and the file is open. Everyone starts here.",
  },
];

export const BADGE_CATALOGUE = [
  { icon: "🏆", name: "Winner", desc: "Opened your account with a lobby win", how: "Take first place in any lobby" },
  { icon: "👑", name: "The Champion", desc: "Current all-time wins leader", how: "Hold more wins than anyone else in the room" },
  { icon: "💀", name: "The Reaper", desc: "Current all-time kill leader", how: "Own the highest total kill count on record" },
  { icon: "🎯", name: "Sharpshooter", desc: "Best K/D ratio with 2 or more lobbies", how: "Keep your K/D highest after at least 2 appearances" },
  { icon: "🎮", name: "Ride or Die", desc: "Most total appearances", how: "Answer the call more than anyone else" },
  { icon: "🔥", name: "Win Streak", desc: "String together multiple wins in one run", how: "Win 3 or more consecutive lobbies" },
  { icon: "⚡", name: "Legend", desc: "10 or more total wins", how: "Reach 10 wins and make the file undeniable" },
  { icon: "🌟", name: "Veteran", desc: "6 or more total wins", how: "Reach 6 wins" },
  { icon: "⭐", name: "Gunslinger", desc: "3 or more total wins", how: "Reach 3 wins" },
  { icon: "🌟", name: "Rising Star", desc: "First win secured", how: "Win your first ever lobby" },
  { icon: "📅", name: "Full House", desc: "Made every lobby, minimum 4", how: "Do not miss a Games Night once the run starts" },
  { icon: "💥", name: "50 Kills", desc: "50 total kills across all lobbies", how: "Put 50 eliminations on the board" },
  { icon: "🎖️", name: "100 Kills", desc: "100 total kills. Serious work.", how: "Reach 100 kills all time" },
  { icon: "💀", name: "500 Kills", desc: "500 total kills. The room knows your name.", how: "Reach 500 all-time kills" },
  { icon: "⚡", name: "2.0+ K/G", desc: "Average 2 or more kills per lobby", how: "Stay above 2.0 K/G across at least 2 lobbies" },
  { icon: "🌟", name: "Big Game", desc: "10 or more kills in one lobby", how: "Drop 10 kills in a single lobby" },
  { icon: "🎯", name: "50% Win Rate", desc: "Won at least half your lobbies", how: "Hold 50% or better win rate across 3 or more games" },
  { icon: "🗡️", name: "Assassin", desc: "6 or more kills in a single lobby", how: "Drop 6 kills in one lobby" },
  { icon: "🧱", name: "Iron Wall", desc: "Reliable top-end finisher", how: "Finish top 3 in 10 or more lobbies" },
  { icon: "📆", name: "Marathon", desc: "Played 15 or more lobbies in one day", how: "Stay in the room for 15 lobbies on a single session date" },
  { icon: "🤝", name: "Never 1st", desc: "Stayed loyal without touching the crown", how: "Play 20 or more lobbies without a win" },
  { icon: "☄️", name: "Rampage", desc: "Repeated monster lobbies", how: "Drop 6 or more kills in 3 separate lobbies" },
  { icon: "🌊", name: "Hot Hand", desc: "Owned a whole session day", how: "Win 3 or more lobbies in one day" },
  { icon: "🎂", name: "Day One", desc: "Played during Games Night's first month", how: "Limited edition. Be part of month one." },
  { icon: "🥚", name: "Easter Egg", desc: "Showed up on Easter Saturday, April 4, 2026", how: "Limited edition. Play on Easter Saturday." },
  { icon: "💪", name: "No Days Off", desc: "Showed up on Good Friday, April 3, 2026", how: "Limited edition. Frag on the holiday." },
  { icon: "🚀", name: "First Blood S2", desc: "Claimed the first win of Season 2", how: "Season 2 exclusive. Win before anyone else does." },
  { icon: "🌅", name: "Opening Night", desc: "Played the first Season 2 session", how: "Season 2 exclusive. Show up on April 1, 2026." },
  { icon: "👑", name: "S2 Champion", desc: "Current Season 2 wins leader", how: "Hold the most wins in Season 2" },
  { icon: "🃏", name: "Fool's Crown", desc: "Won on April Fools Day, April 1, 2026", how: "Limited edition. Take a lobby on the strangest day of the month." },
  { icon: "🏆", name: "S1 Champion", desc: "Season 1 wins leader", how: "Finish first by wins in March 2026. Permanent honor." },
  { icon: "💀", name: "S1 Reaper", desc: "Season 1 kill leader", how: "Lead Season 1 in total kills. Permanent honor." },
  { icon: "🥈", name: "S1 Podium", desc: "Finished among the Season 1 frontrunners", how: "Place 2nd, 3rd, or 4th by wins in Season 1" },
  { icon: "☄️", name: "S1 Record Breaker", desc: "Best single game of Season 1 at 7K", how: "Season 1 record currently belongs to EZEDINEYoutube" },
  { icon: "🛡️", name: "S1 Iron Man", desc: "Season 1's most reliable attendance", how: "Show up more than anyone else during Season 1" },
];

export const SEASONS = [
  { id: "s1", name: "Season 1", label: "Mar 2026", start: "2026-03-01", end: "2026-03-31", color: "#FFD700" },
  { id: "s2", name: "Season 2", label: "Apr 2026", start: "2026-04-01", end: "2026-04-30", color: "#00E5FF" },
  { id: "s3", name: "Season 3", label: "May 2026", start: "2026-05-01", end: "2026-05-31", color: "#FF4D8F" },
  { id: "s4", name: "Season 4", label: "Jun 2026", start: "2026-06-01", end: "2026-06-30", color: "#C77DFF" },
];
