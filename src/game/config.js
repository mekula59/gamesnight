export const ADMIN_PASSWORD = atob("Z2FtZXNuaWdodDIwMjY=");

export const SEASONAL_EVENT = {
  active: true,
  name: "Easter 2026",
  start: "2026-04-03",
  startHour: 19,
  end: "2026-04-06",
  endHour: 16,
};

export const STORAGE_VERSION = "gn-v87";
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
    desc: "The player with the most wins overall. Only one person holds this title at a time - if someone overtakes you, they take the crown.",
  },
  {
    icon: "💀",
    name: "The Reaper",
    color: "#FF4D8F",
    desc: "The all-time kill leader. Raw damage output, no mercy. Whoever has the most total kills wears this title.",
  },
  {
    icon: "🎯",
    name: "Sharpshooter",
    color: "#00E5FF",
    desc: "The best Kill/Death ratio in the whole lobby (minimum 2 appearances). Efficient, precise, deadly.",
  },
  {
    icon: "🎮",
    name: "Ride or Die",
    color: "#FFAB40",
    desc: "The most loyal player - most appearances of anyone. Doesn't matter if you win or lose, you just keep showing up.",
  },
  {
    icon: "⚡",
    name: "Legend",
    color: "#C77DFF",
    desc: "10+ all-time wins. A rare title that very few will reach. Absolute gaming royalty.",
  },
  {
    icon: "🔥",
    name: "Veteran",
    color: "#FFAB40",
    desc: "6 or more wins. You've been around, you know the meta, and you've proven it multiple times.",
  },
  {
    icon: "⭐",
    name: "Gunslinger",
    color: "#40C4FF",
    desc: "3+ wins. You're past the rookie stage - a consistent threat who knows how to close out a lobby.",
  },
  {
    icon: "🌟",
    name: "Rising Star",
    color: "#00FF94",
    desc: "You've won at least 1 lobby. The first win is the hardest - this means you're officially on the board.",
  },
  {
    icon: "🎮",
    name: "Rookie",
    color: "#7a6eaa",
    desc: "Haven't won a lobby yet, but you're playing. Every legend started here - keep grinding.",
  },
];

export const BADGE_CATALOGUE = [
  { icon: "🏆", name: "Winner", desc: "Won at least 1 lobby", how: "Win any game" },
  { icon: "👑", name: "The Champion", desc: "Currently the all-time win leader", how: "Hold the most wins of anyone" },
  { icon: "💀", name: "The Reaper", desc: "Currently the all-time kill leader", how: "Hold the most kills of anyone" },
  { icon: "🎯", name: "Sharpshooter", desc: "Best K/D ratio (min 2 lobbies)", how: "Keep your K/D highest across 2+ lobbies" },
  { icon: "🎮", name: "Ride or Die", desc: "Most total appearances", how: "Show up more than anyone else" },
  { icon: "🔥", name: "Win Streak", desc: "Won multiple games in a row", how: "Win 3+ consecutive lobbies" },
  { icon: "⚡", name: "Legend", desc: "10+ total wins", how: "Grind out 10 wins" },
  { icon: "🌟", name: "Veteran", desc: "6+ total wins", how: "Reach 6 wins" },
  { icon: "⭐", name: "Gunslinger", desc: "3+ total wins", how: "Reach 3 wins" },
  { icon: "🌟", name: "Rising Star", desc: "First win earned", how: "Win your first ever lobby" },
  { icon: "📅", name: "Full House", desc: "Attended every single lobby (min 4)", how: "Never miss a Games Night" },
  { icon: "💥", name: "50 Kills", desc: "50 total kills across all lobbies", how: "Rack up 50 kills" },
  { icon: "🎖️", name: "100 Kills", desc: "100 total kills - absolute menace", how: "100 kills total. That's serious." },
  { icon: "💀", name: "500 Kills", desc: "500 total kills - you live in this lobby", how: "500 kills all time. Pure damage." },
  { icon: "⚡", name: "2.0+ K/G", desc: "Kill/Game ratio 2.0+ (min 2 lobbies)", how: "Stay above 2.0 K/G across 2+ games" },
  { icon: "🌟", name: "Big Game", desc: "10+ kills in a single lobby", how: "Drop 10 kills in one game" },
  { icon: "🎯", name: "50% Win Rate", desc: "Won half or more of your lobbies (min 3)", how: "Win 50%+ of games with 3+ played" },
  { icon: "🗡️", name: "Assassin", desc: "6+ kills in a single lobby", how: "Drop 6 kills in one game" },
  { icon: "🧱", name: "Iron Wall", desc: "Consistent top 3 finisher", how: "Finish top 3 in 10+ lobbies total" },
  { icon: "📆", name: "Marathon", desc: "15+ lobbies in one session day", how: "Play 15 or more lobbies in one day" },
  { icon: "🤝", name: "Never 1st", desc: "Loyal squad member - never wins", how: "Play 20+ lobbies without a single win (respect)" },
  { icon: "☄️", name: "Rampage", desc: "6+ kills in a single lobby - 3 or more times", how: "Drop 6+ kills in 3 separate lobbies" },
  { icon: "🌊", name: "Hot Hand", desc: "3+ wins in a single session day", how: "Win 3 or more lobbies in one day" },
  { icon: "🎂", name: "Day One", desc: "Played in the first month of Games Night - Apr 4, 2026", how: "Limited edition. You were there in month one." },
  { icon: "🥚", name: "Easter Egg", desc: "Played on Easter Saturday - Apr 4, 2026", how: "Limited edition. Show up on Easter Saturday." },
  { icon: "💪", name: "No Days Off", desc: "Showed up on Good Friday - Apr 3, 2026", how: "Limited edition. Frag on a public holiday." },
  { icon: "🚀", name: "First Blood S2", desc: "First win of Season 2 - Apr 2026", how: "S2 exclusive. Win a lobby in Season 2 before anyone else." },
  { icon: "🌅", name: "Opening Night", desc: "Played on the very first Season 2 session", how: "S2 exclusive. Show up on April 1st, 2026." },
  { icon: "👑", name: "S2 Champion", desc: "Most wins in Season 2", how: "Hold the most Season 2 wins of any player." },
  { icon: "🃏", name: "Fool's Crown", desc: "Won a lobby on April Fools Day - Apr 1, 2026", how: "Limited edition. Won on the one day nobody saw it coming." },
  { icon: "🏆", name: "S1 Champion", desc: "Season 1 Champion - most wins in March 2026", how: "Finished #1 by wins in Season 1. Permanent." },
  { icon: "💀", name: "S1 Reaper", desc: "Season 1 Kill Leader - most kills in March 2026", how: "Led all players in total kills for Season 1. Permanent." },
  { icon: "🥈", name: "S1 Podium", desc: "Finished top 3 in Season 1 standings", how: "Placed 2nd, 3rd or 4th by wins in Season 1." },
  { icon: "☄️", name: "S1 Record Breaker", desc: "Best single game of Season 1 - 7K in one lobby", how: "EZEDINEYoutube holds the Season 1 single-game kill record." },
  { icon: "🛡️", name: "S1 Iron Man", desc: "Most appearances in Season 1 - almost never missed", how: "Showed up more than anyone else across all of Season 1." },
];

export const SEASONS = [
  { id: "s1", name: "Season 1", label: "Mar 2026", start: "2026-03-01", end: "2026-03-31", color: "#FFD700" },
  { id: "s2", name: "Season 2", label: "Apr 2026", start: "2026-04-01", end: "2026-04-30", color: "#00E5FF" },
  { id: "s3", name: "Season 3", label: "May 2026", start: "2026-05-01", end: "2026-05-31", color: "#FF4D8F" },
  { id: "s4", name: "Season 4", label: "Jun 2026", start: "2026-06-01", end: "2026-06-30", color: "#C77DFF" },
];
