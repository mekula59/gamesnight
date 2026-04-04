import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════
const ADMIN_PASSWORD     = atob("Z2FtZXNuaWdodDIwMjY=");

// ── Seasonal Event config — single source of truth for all event logic ──
const SEASONAL_EVENT={
  active:true,
  name:"Easter 2026",
  start:"2026-04-03",startHour:19,
  end:"2026-04-06",  endHour:16,
};
const isEventActive=()=>{
  const d=new Date(),ds=d.toISOString().split("T")[0],hr=d.getUTCHours();
  if(!SEASONAL_EVENT.active)return false;
  const{start,startHour,end,endHour}=SEASONAL_EVENT;
  return(ds===start&&hr>=startHour)||(ds>start&&ds<end)||(ds===end&&hr<endHour);
};
const STORAGE_VERSION    = "gn-v85"; // bumped — Easter Saturday 16 lobbies (s379–s394), FKxPhanteon debuts
const SITE_TITLE         = "Games Night";
const HOSTED_BY          = "Mekula";
const FEATURED_GAME      = "Bullet League";
const DISCORD_URL        = "https://discord.gg/gJSjaBFBDD";
const DISCORD_WEBHOOK    = ""; // paste your webhook URL here to enable auto-posting
const TWITCH_URL         = "https://www.twitch.tv/mekulavick";
const SESSION_START_HOUR = 17;
const SESSION_END_HOUR   = 19;
const SESSION_DAYS       = [1,2,3,4,5,6];

// ═══════════════════════════════════════════════════
//  ROSTER — 30 players
// ═══════════════════════════════════════════════════
const INITIAL_PLAYERS = [
  {id:"p01",username:"MekulaGG",          color:"#FFD700",host:true},
  {id:"p02",username:"Teriqstp",           color:"#FF4D8F"},
  {id:"p03",username:"Sanctus",            color:"#00E5FF"},
  {id:"p04",username:"DjxHunter",          color:"#FF6B35"},
  {id:"p05",username:"bohdanmain",         color:"#C77DFF"},
  {id:"p06",username:"OxHodlHamster",      color:"#00FF94"},
  {id:"p07",username:"dhemo",              color:"#FF5252"},
  {id:"p08",username:"chugrud",            color:"#40C4FF"},
  {id:"p09",username:"SirHaazy99",         color:"#FFD740"},
  {id:"p10",username:"izzyboi",            color:"#64FFDA"},
  {id:"p11",username:"Loudmouth",          color:"#FFAB40"},
  {id:"p12",username:"michkyle",           color:"#E040FB"},
  {id:"p13",username:"TheLostOG",          color:"#1DE9B6"},
  {id:"p14",username:"Hackqam",            color:"#FF6E6E"},
  {id:"p15",username:"Nellywaz",           color:"#B2FF59"},
  {id:"p16",username:"Zakipro",            color:"#FF9E80"},
  {id:"p17",username:"ZapGrupoBulletBR9293870164",color:"#90CAF9"},
  {id:"p18",username:"CelesteHI5",         color:"#F48FB1"},
  {id:"p19",username:"xLilithx",           color:"#CE93D8"},
  {id:"p20",username:"DeadlySoaringSeagull6",color:"#80DEEA"},
  {id:"p21",username:"Beedee4PF",          color:"#FF8A80"},
  {id:"p22",username:"Bxdguy",             color:"#82B1FF"},
  {id:"p23",username:"ReyzinhoPL",         color:"#FFD180"},
  {id:"p24",username:"Web3guy",            color:"#A7FFEB"},
  {id:"p25",username:"FKxKingLurius",      color:"#B388FF"},
  {id:"p26",username:"Web3hustlre",        color:"#FFCC80"},
  {id:"p27",username:"FKxPhanteon",        color:"#E0E0E0"},
  {id:"p28",username:"Lazerine",           color:"#CCFF90"},
  {id:"p29",username:"ElderRovingWorm81",  color:"#FF80AB"},
  {id:"p30",username:"EZEDINEYoutube",     color:"#4DFFB4"},
  {id:"p31",username:"Ironlover",           color:"#FF6B6B"},
  {id:"p32",username:"KhingPilot",         color:"#00BFA5"},
  {id:"p33",username:"iVimXGF",            color:"#FF7043"},
  {id:"p34",username:"TMIyc",              color:"#00E5B0"},
  {id:"p35",username:"Demejii55",          color:"#FF6F91"},
  {id:"p36",username:"0netwoo",             color:"#00E676"},
  {id:"p37",username:"FKxVanBR",            color:"#FF6D00"},
];

const ACCENT_COLORS = [
  "#FFD700","#FF4D8F","#00E5FF","#FF6B35","#C77DFF","#00FF94",
  "#FF5252","#40C4FF","#FFD740","#64FFDA","#FFAB40","#E040FB",
  "#1DE9B6","#FF6E6E","#B2FF59","#FF9E80","#F48FB1","#CE93D8",
  "#80DEEA","#FF8A80","#82B1FF","#FFD180","#A7FFEB","#B388FF",
];

// ═══════════════════════════════════════════════════
//  PRE-LOADED SESSIONS — 13 lobbies from screenshots
// ═══════════════════════════════════════════════════
const INITIAL_SESSIONS = [
  {id:"s01",date:"2026-03-04",notes:"Lobby 1",
   winner:"p02",attendees:["p02","p01","p18","p03","p08","p10"],
   placements:["p02","p01","p18","p03","p08","p10"],
   kills:{p02:1,p01:1,p18:0,p03:0,p08:0,p10:0},deaths:{}},
  {id:"s02",date:"2026-03-04",notes:"Lobby 2",
   winner:"p08",attendees:["p08","p01","p02","p09","p03","p18"],
   placements:["p08","p01","p02","p09","p03","p18"],
   kills:{p08:1,p01:2,p02:1,p09:0,p03:0,p18:0},deaths:{}},
  {id:"s03",date:"2026-03-04",notes:"Lobby 3",
   winner:"p25",attendees:["p25","p02","p01","p07","p15","p05","p04","p18"],
   placements:["p25","p02","p01","p07","p15","p05","p04","p18"],
   kills:{p25:3,p02:2,p01:0,p07:0,p15:0,p05:0,p04:0,p18:0},deaths:{}},
  {id:"s04",date:"2026-03-04",notes:"Lobby 4",
   winner:"p01",attendees:["p01","p07","p02","p25","p15"],
   placements:["p01","p07","p02","p25","p15"],
   kills:{p01:3,p07:0,p02:1,p25:0,p15:0},deaths:{}},
  {id:"s05",date:"2026-03-05",notes:"Lobby 5",
   winner:"p02",attendees:["p02","p16","p30","p01","p18"],
   placements:["p02","p16","p30","p01","p18"],
   kills:{p02:3,p16:1,p30:0,p01:0,p18:0},deaths:{}},
  {id:"s06",date:"2026-03-05",notes:"Lobby 6",
   winner:"p16",attendees:["p16","p01","p18","p07","p30","p02"],
   placements:["p16","p01","p18","p07","p30","p02"],
   kills:{p16:1,p01:1,p18:0,p07:1,p30:0,p02:0},deaths:{}},
  {id:"s07",date:"2026-03-05",notes:"Lobby 7",
   winner:"p01",attendees:["p01","p02","p16","p07","p18","p03"],
   placements:["p01","p02","p16","p07","p18","p03"],
   kills:{p01:5,p02:0,p16:0,p07:0,p18:0,p03:0},deaths:{}},
  {id:"s08",date:"2026-03-05",notes:"Lobby 8",
   winner:"p02",attendees:["p02","p07","p06","p01","p18","p08"],
   placements:["p02","p07","p06","p01","p18","p08"],
   kills:{p02:0,p07:2,p06:0,p01:1,p18:0,p08:0},deaths:{}},
  {id:"s09",date:"2026-03-05",notes:"Lobby 9",
   winner:"p02",attendees:["p02","p07","p18","p04","p01","p05"],
   placements:["p02","p07","p18","p04","p01","p05"],
   kills:{p02:0,p07:2,p18:1,p04:0,p01:1,p05:1},deaths:{}},
  {id:"s10",date:"2026-03-05",notes:"Lobby 10",
   winner:"p15",attendees:["p15","p01","p07","p05","p02","p18"],
   placements:["p15","p01","p07","p05","p02","p18"],
   kills:{p15:1,p01:1,p07:1,p05:0,p02:1,p18:0},deaths:{}},
  {id:"s11",date:"2026-03-05",notes:"Lobby 11",
   winner:"p05",attendees:["p05","p02","p01","p15","p18"],
   placements:["p05","p02","p01","p15","p18"],
   kills:{p05:1,p02:1,p01:2,p15:0,p18:0},deaths:{}},
  {id:"s12",date:"2026-03-05",notes:"Lobby 12",
   winner:"p18",attendees:["p18","p02","p07","p15","p01","p04","p05"],
   placements:["p18","p02","p07","p15","p01","p04","p05"],
   kills:{p18:3,p02:1,p07:0,p15:0,p01:1,p04:0,p05:0},deaths:{}},
  {id:"s13",date:"2026-03-05",notes:"Lobby 13",
   winner:"p07",attendees:["p07","p18","p02","p06","p09","p01"],
   placements:["p07","p18","p02","p06","p09","p01"],
   kills:{p07:2,p18:2,p02:0,p06:0,p09:0,p01:0},deaths:{}},
  // ── 2026-03-06 · 15 new lobbies ──
  {id:"s15",date:"2026-03-06",notes:"Lobby 15",
   winner:"p30",attendees:["p30","p18","p07","p02","p03","p11","p01","p12"],
   placements:["p30","p18","p07","p02","p03","p11","p01","p12"],
   kills:{p30:3,p18:0,p07:0,p02:1,p03:1,p11:0,p01:1,p12:0},deaths:{}},
  {id:"s16",date:"2026-03-06",notes:"Lobby 16",
   winner:"p02",attendees:["p02","p24","p01","p07","p18","p03","p04","p06","p08","p11"],
   placements:["p02","p24","p01","p07","p18","p03","p04","p06","p08","p11"],
   kills:{p02:2,p24:2,p01:1,p07:1,p18:0,p03:0,p04:1,p06:0,p08:0,p11:0},deaths:{}},
  {id:"s17",date:"2026-03-06",notes:"Lobby 17",
   winner:"p02",attendees:["p02","p01","p04","p11","p07","p03","p06","p24","p18","p08"],
   placements:["p02","p01","p04","p11","p07","p03","p06","p24","p18","p08"],
   kills:{p02:2,p01:3,p04:0,p11:0,p07:1,p03:0,p06:1,p24:1,p18:0,p08:0},deaths:{}},
  {id:"s18",date:"2026-03-06",notes:"Lobby 18",
   winner:"p04",attendees:["p04","p01","p05","p14","p03","p18","p17","p07","p02"],
   placements:["p04","p01","p05","p14","p03","p18","p17","p07","p02"],
   kills:{p04:3,p01:1,p05:1,p14:0,p03:1,p18:0,p17:1,p07:0,p02:0},deaths:{}},
  {id:"s19",date:"2026-03-06",notes:"Lobby 19",
   winner:"p07",attendees:["p07","p02","p04","p18","p01","p17","p05","p03"],
   placements:["p07","p02","p04","p18","p01","p17","p05","p03"],
   kills:{p07:2,p02:2,p04:2,p18:0,p01:1,p17:0,p05:0,p03:0},deaths:{}},
  {id:"s20",date:"2026-03-06",notes:"Lobby 20",
   winner:"p02",attendees:["p02","p01","p05","p04","p18","p03","p07"],
   placements:["p02","p01","p05","p04","p18","p03","p07"],
   kills:{p02:3,p01:2,p05:1,p04:0,p18:0,p03:0,p07:0},deaths:{}},
  {id:"s21",date:"2026-03-06",notes:"Lobby 21",
   winner:"p04",attendees:["p04","p05","p01","p07","p02","p18"],
   placements:["p04","p05","p01","p07","p02","p18"],
   kills:{p04:3,p05:1,p01:0,p07:1,p02:0,p18:0},deaths:{}},
  {id:"s22",date:"2026-03-06",notes:"Lobby 22",
   winner:"p16",attendees:["p16","p18","p01","p02","p05"],
   placements:["p16","p18","p01","p02","p05"],
   kills:{p16:1,p18:1,p01:1,p02:0,p05:0},deaths:{}},
  {id:"s23",date:"2026-03-06",notes:"Lobby 23",
   winner:"p01",attendees:["p01","p02","p16","p04","p18","p05"],
   placements:["p01","p02","p16","p04","p18","p05"],
   kills:{p01:1,p02:0,p16:0,p04:1,p18:0,p05:0},deaths:{}},
  {id:"s24",date:"2026-03-06",notes:"Lobby 24",
   winner:"p07",attendees:["p07","p01","p02","p18","p04","p24","p11","p14"],
   placements:["p07","p01","p02","p18","p04","p24","p11","p14"],
   kills:{p07:2,p01:0,p02:1,p18:1,p04:0,p24:0,p11:0,p14:0},deaths:{}},
  {id:"s25",date:"2026-03-06",notes:"Lobby 25",
   winner:"p02",attendees:["p02","p07","p14","p04","p11","p01","p18","p24"],
   placements:["p02","p07","p14","p04","p11","p01","p18","p24"],
   kills:{p02:2,p07:1,p14:0,p04:2,p11:1,p01:1,p18:0,p24:0},deaths:{}},
  {id:"s26",date:"2026-03-06",notes:"Lobby 26",
   winner:"p07",attendees:["p07","p14","p02","p04","p01","p17","p05","p03","p18"],
   placements:["p07","p14","p02","p04","p01","p17","p05","p03","p18"],
   kills:{p07:3,p14:2,p02:1,p04:1,p01:0,p17:0,p05:0,p03:0,p18:0},deaths:{}},
  {id:"s27",date:"2026-03-06",notes:"Lobby 27",
   winner:"p05",attendees:["p05","p02","p01","p07","p14","p17","p18","p03","p04"],
   placements:["p05","p02","p01","p07","p14","p17","p18","p03","p04"],
   kills:{p05:2,p02:3,p01:1,p07:0,p14:0,p17:1,p18:0,p03:0,p04:0},deaths:{}},
  {id:"s28",date:"2026-03-06",notes:"Lobby 28",
   winner:"p02",attendees:["p02","p01","p16","p18","p04","p05"],
   placements:["p02","p01","p16","p18","p04","p05"],
   kills:{p02:3,p01:1,p16:0,p18:1,p04:0,p05:0},deaths:{}},
  {id:"s29",date:"2026-03-06",notes:"Lobby 29",
   winner:"p11",attendees:["p11","p01","p03","p07","p02","p18","p12"],
   placements:["p11","p01","p03","p07","p02","p18","p12"],
   kills:{p11:0,p01:3,p03:0,p07:0,p02:0,p18:0,p12:0},deaths:{}},

  // ── 2026-03-07 · 13 lobbies ──
  {id:"s30",date:"2026-03-07",notes:"Lobby 30",
   winner:"p01",attendees:["p01","p04","p02","p07","p18","p29"],
   placements:["p01","p04","p02","p07","p18","p29"],
   kills:{p01:3,p04:1,p02:1,p07:0,p18:0,p29:0},deaths:{}},
  {id:"s31",date:"2026-03-07",notes:"Lobby 31",
   winner:"p02",attendees:["p02","p05","p29","p01","p11","p16","p13","p04","p07"],
   placements:["p02","p05","p29","p01","p11","p16","p13","p04","p07"],
   kills:{p02:3,p05:1,p29:1,p01:0,p11:1,p16:0,p13:1,p04:0,p07:0},deaths:{}},
  {id:"s32",date:"2026-03-07",notes:"Lobby 32",
   winner:"p13",attendees:["p13","p02","p29","p01","p15","p04","p05","p18","p11"],
   placements:["p13","p02","p29","p01","p15","p04","p05","p18","p11"],
   kills:{p13:3,p02:0,p29:1,p01:1,p15:1,p04:0,p05:0,p18:0,p11:0},deaths:{}},
  {id:"s33",date:"2026-03-07",notes:"Lobby 33",
   winner:"p13",attendees:["p13","p01","p07","p29","p02","p05","p04","p18","p10"],
   placements:["p13","p01","p07","p29","p02","p05","p04","p18","p10"],
   kills:{p13:3,p01:0,p07:0,p29:1,p02:2,p05:0,p04:0,p18:0,p10:0},deaths:{}},
  {id:"s34",date:"2026-03-07",notes:"Lobby 34",
   winner:"p29",attendees:["p29","p02","p07","p01","p10","p04","p05","p18"],
   placements:["p29","p02","p07","p01","p10","p04","p05","p18"],
   kills:{p29:2,p02:2,p07:0,p01:0,p10:1,p04:0,p05:0,p18:0},deaths:{}},
  {id:"s35",date:"2026-03-07",notes:"Lobby 35",
   winner:"p01",attendees:["p01","p25","p04","p02","p13","p18","p29","p10"],
   placements:["p01","p25","p04","p02","p13","p18","p29","p10"],
   kills:{p01:3,p25:1,p04:2,p02:1,p13:0,p18:0,p29:0,p10:0},deaths:{}},
  {id:"s36",date:"2026-03-07",notes:"Lobby 36",
   winner:"p29",attendees:["p29","p05","p04","p01","p02","p13","p18"],
   placements:["p29","p05","p04","p01","p02","p13","p18"],
   kills:{p29:1,p05:3,p04:0,p01:1,p02:1,p13:0,p18:0},deaths:{}},
  {id:"s37",date:"2026-03-07",notes:"Lobby 37",
   winner:"p29",attendees:["p29","p04","p02","p13","p05","p10","p01"],
   placements:["p29","p04","p02","p13","p05","p10","p01"],
   kills:{p29:1,p04:1,p02:2,p13:1,p05:1,p10:0,p01:0},deaths:{}},
  {id:"s38",date:"2026-03-07",notes:"Lobby 38",
   winner:"p29",attendees:["p29","p10","p02","p13","p01","p12","p04"],
   placements:["p29","p10","p02","p13","p01","p12","p04"],
   kills:{p29:1,p10:1,p02:1,p13:0,p01:0,p12:0,p04:0},deaths:{}},
  {id:"s39",date:"2026-03-07",notes:"Lobby 39",
   winner:"p29",attendees:["p29","p01","p02","p04","p12","p13"],
   placements:["p29","p01","p02","p04","p12","p13"],
   kills:{p29:3,p01:2,p02:0,p04:0,p12:0,p13:0},deaths:{}},
  {id:"s40",date:"2026-03-07",notes:"Lobby 40",
   winner:"p02",attendees:["p02","p29","p30","p01","p07","p12","p04","p05"],
   placements:["p02","p29","p30","p01","p07","p12","p04","p05"],
   kills:{p02:2,p29:1,p30:0,p01:1,p07:1,p12:1,p04:0,p05:0},deaths:{}},
  {id:"s41",date:"2026-03-07",notes:"Lobby 41",
   winner:"p29",attendees:["p29","p30","p02","p01","p16","p07","p05"],
   placements:["p29","p30","p02","p01","p16","p07","p05"],
   kills:{p29:2,p30:2,p02:1,p01:0,p16:0,p07:0,p05:0},deaths:{}},
  {id:"s42",date:"2026-03-07",notes:"Lobby 42",
   winner:"p16",attendees:["p16","p02","p29","p12","p05","p30","p07"],
   placements:["p16","p02","p29","p12","p05","p30","p07"],
   kills:{p16:4,p02:0,p29:0,p12:1,p05:0,p30:0,p07:0},deaths:{}},

  // ── 2026-03-08 · 15 lobbies ──
  {id:"s43",date:"2026-03-09",notes:"Lobby 43",
   winner:"p07",attendees:["p07","p04","p01","p02","p18","p11","p30","p13","p25","p06"],
   placements:["p07","p04","p01","p02","p18","p11","p30","p13","p25","p06"],
   kills:{p07:1,p04:2,p01:3,p02:0,p18:0,p11:0,p30:1,p13:0,p25:0,p06:0},deaths:{}},
  {id:"s44",date:"2026-03-09",notes:"Lobby 44",
   winner:"p19",attendees:["p19","p02","p30","p25","p05","p08","p18","p11","p07","p04","p01"],
   placements:["p19","p02","p30","p25","p05","p08","p18","p11","p07","p04","p01"],
   kills:{p19:2,p02:2,p30:1,p25:1,p05:0,p08:3,p18:0,p11:1,p07:0,p04:0,p01:0},deaths:{}},
  {id:"s45",date:"2026-03-09",notes:"Lobby 45",
   winner:"p07",attendees:["p07","p02","p25","p01","p04","p08","p06","p05","p11","p18"],
   placements:["p07","p02","p25","p01","p04","p08","p06","p05","p11","p18"],
   kills:{p07:3,p02:0,p25:0,p01:0,p04:0,p08:0,p06:1,p05:1,p11:0,p18:0},deaths:{}},
  {id:"s46",date:"2026-03-09",notes:"Lobby 46",
   winner:"p25",attendees:["p25","p04","p07","p06","p18","p01","p13","p02","p11","p08","p05"],
   placements:["p25","p04","p07","p06","p18","p01","p13","p02","p11","p08","p05"],
   kills:{p25:1,p04:1,p07:4,p06:2,p18:0,p01:0,p13:0,p02:1,p11:1,p08:0,p05:0},deaths:{}},
  {id:"s47",date:"2026-03-09",notes:"Lobby 47",
   winner:"p25",attendees:["p25","p04","p15","p02","p06","p01","p03","p14","p07","p05","p18","p11"],
   placements:["p25","p04","p15","p02","p06","p01","p03","p14","p07","p05","p18","p11"],
   kills:{p25:2,p04:0,p15:1,p02:1,p06:2,p01:2,p03:0,p14:2,p07:0,p05:0,p18:0,p11:0},deaths:{}},
  {id:"s48",date:"2026-03-09",notes:"Lobby 48",
   winner:"p04",attendees:["p04","p25","p01","p07","p03","p18","p14"],
   placements:["p04","p25","p01","p07","p03","p18","p14"],
   kills:{p04:1,p25:1,p01:2,p07:0,p03:2,p18:0,p14:0},deaths:{}},
  {id:"s49",date:"2026-03-09",notes:"Lobby 49",
   winner:"p15",attendees:["p15","p02","p18","p25","p01","p03","p04"],
   placements:["p15","p02","p18","p25","p01","p03","p04"],
   kills:{p15:1,p02:2,p18:1,p25:0,p01:1,p03:0,p04:0},deaths:{}},
  {id:"s50",date:"2026-03-09",notes:"Lobby 50",
   winner:"p25",attendees:["p25","p04","p15","p02","p01","p18"],
   placements:["p25","p04","p15","p02","p01","p18"],
   kills:{p25:1,p04:1,p15:1,p02:0,p01:1,p18:0},deaths:{}},
  {id:"s51",date:"2026-03-09",notes:"Lobby 51",
   winner:"p30",attendees:["p30","p15","p02","p01","p18"],
   placements:["p30","p15","p02","p01","p18"],
   kills:{p30:4,p15:0,p02:0,p01:0,p18:0},deaths:{}},
  {id:"s52",date:"2026-03-09",notes:"Lobby 52",
   winner:"p25",attendees:["p25","p02","p08","p06","p07","p01","p03"],
   placements:["p25","p02","p08","p06","p07","p01","p03"],
   kills:{p25:0,p02:1,p08:1,p06:1,p07:0,p01:0,p03:0},deaths:{}},
  {id:"s53",date:"2026-03-09",notes:"Lobby 53",
   winner:"p25",attendees:["p25","p04","p02","p05","p13","p07","p14","p01","p03","p11","p06","p18"],
   placements:["p25","p04","p02","p05","p13","p07","p14","p01","p03","p11","p06","p18"],
   kills:{p25:2,p04:2,p02:1,p05:0,p13:2,p07:1,p14:1,p01:1,p03:0,p11:0,p06:0,p18:0},deaths:{}},
  {id:"s54",date:"2026-03-09",notes:"Lobby 54",
   winner:"p15",attendees:["p15","p14","p02","p07","p04","p25","p03","p05","p18","p08","p01"],
   placements:["p15","p14","p02","p07","p04","p25","p03","p05","p18","p08","p01"],
   kills:{p15:2,p14:3,p02:0,p07:1,p04:0,p25:1,p03:1,p05:1,p18:0,p08:0,p01:0},deaths:{}},
  {id:"s55",date:"2026-03-09",notes:"Lobby 55",
   winner:"p25",attendees:["p25","p14","p07","p02","p15","p04","p08","p03","p05","p18"],
   placements:["p25","p14","p07","p02","p15","p04","p08","p03","p05","p18"],
   kills:{p25:1,p14:0,p07:4,p02:1,p15:0,p04:0,p08:0,p03:1,p05:0,p18:0},deaths:{}},
  {id:"s56",date:"2026-03-09",notes:"Lobby 56",
   winner:"p30",attendees:["p30","p18","p15","p02","p01","p05","p04"],
   placements:["p30","p18","p15","p02","p01","p05","p04"],
   kills:{p30:3,p18:0,p15:0,p02:0,p01:1,p05:0,p04:0},deaths:{}},
  {id:"s57",date:"2026-03-09",notes:"Lobby 57",
   winner:"p30",attendees:["p30","p25","p06","p03","p08","p07","p02","p18","p01"],
   placements:["p30","p25","p06","p03","p08","p07","p02","p18","p01"],
   kills:{p30:5,p25:0,p06:1,p03:0,p08:0,p07:1,p02:0,p18:0,p01:0},deaths:{}},

  // ── 2026-03-10 · Tuesday · 15 lobbies ──
  {id:"s58",date:"2026-03-10",notes:"Lobby 58",
   winner:"p18",attendees:["p18","p01","p08","p11","p02"],
   placements:["p18","p01","p08","p11","p02"],
   kills:{p18:1,p01:2,p08:1,p11:0,p02:0},deaths:{}},
  {id:"s59",date:"2026-03-10",notes:"Lobby 59",
   winner:"p07",attendees:["p07","p08","p30","p01","p11","p18","p02","p04"],
   placements:["p07","p08","p30","p01","p11","p18","p02","p04"],
   kills:{p07:4,p08:2,p30:1,p01:0,p11:0,p18:0,p02:0,p04:0},deaths:{}},
  {id:"s60",date:"2026-03-10",notes:"Lobby 60",
   winner:"p01",attendees:["p01","p04","p02","p07","p18","p11","p08"],
   placements:["p01","p04","p02","p07","p18","p11","p08"],
   kills:{p01:2,p04:1,p02:0,p07:2,p18:0,p11:0,p08:0},deaths:{}},
  {id:"s61",date:"2026-03-10",notes:"Lobby 61",
   winner:"p02",attendees:["p02","p01","p11","p04","p07","p12","p08","p18","p05"],
   placements:["p02","p01","p11","p04","p07","p12","p08","p18","p05"],
   kills:{p02:2,p01:3,p11:0,p04:0,p07:2,p12:0,p08:0,p18:0,p05:0},deaths:{}},
  {id:"s62",date:"2026-03-10",notes:"Lobby 62",
   winner:"p01",attendees:["p01","p07","p06","p02","p04","p08","p18"],
   placements:["p01","p07","p06","p02","p04","p08","p18"],
   kills:{p01:4,p07:1,p06:1,p02:0,p04:0,p08:0,p18:0},deaths:{}},
  {id:"s63",date:"2026-03-10",notes:"Lobby 63",
   winner:"p02",attendees:["p02","p18","p05","p04","p07","p01","p10","p06"],
   placements:["p02","p18","p05","p04","p07","p01","p10","p06"],
   kills:{p02:2,p18:1,p05:1,p04:1,p07:1,p01:1,p10:0,p06:0},deaths:{}},
  {id:"s64",date:"2026-03-10",notes:"Lobby 64",
   winner:"p04",attendees:["p04","p01","p18","p02","p05","p07"],
   placements:["p04","p01","p18","p02","p05","p07"],
   kills:{p04:2,p01:1,p18:1,p02:0,p05:0,p07:0},deaths:{}},
  {id:"s65",date:"2026-03-10",notes:"Lobby 65",
   winner:"p07",attendees:["p07","p02","p01","p05","p18","p11","p04","p08"],
   placements:["p07","p02","p01","p05","p18","p11","p04","p08"],
   kills:{p07:0,p02:4,p01:2,p05:0,p18:0,p11:0,p04:0,p08:0},deaths:{}},
  {id:"s66",date:"2026-03-10",notes:"Lobby 66",
   winner:"p07",attendees:["p07","p06","p18","p04","p01","p02","p05","p11"],
   placements:["p07","p06","p18","p04","p01","p02","p05","p11"],
   kills:{p07:2,p06:2,p18:0,p04:2,p01:1,p02:0,p05:0,p11:0},deaths:{}},
  {id:"s67",date:"2026-03-10",notes:"Lobby 67",
   winner:"p02",attendees:["p02","p07","p01","p04","p06","p18","p17"],
   placements:["p02","p07","p01","p04","p06","p18","p17"],
   kills:{p02:2,p07:0,p01:2,p04:1,p06:0,p18:0,p17:0},deaths:{}},
  {id:"s68",date:"2026-03-10",notes:"Lobby 68",
   winner:"p04",attendees:["p04","p02","p07","p01","p17","p18","p11"],
   placements:["p04","p02","p07","p01","p17","p18","p11"],
   kills:{p04:2,p02:0,p07:0,p01:2,p17:0,p18:0,p11:0},deaths:{}},
  {id:"s69",date:"2026-03-10",notes:"Lobby 69",
   winner:"p02",attendees:["p02","p11","p01","p04","p17"],
   placements:["p02","p11","p01","p04","p17"],
   kills:{p02:1,p11:1,p01:1,p04:0,p17:0},deaths:{}},
  {id:"s70",date:"2026-03-10",notes:"Lobby 70",
   winner:"p03",attendees:["p03","p01","p04","p02","p17"],
   placements:["p03","p01","p04","p02","p17"],
   kills:{p03:2,p01:2,p04:0,p02:0,p17:0},deaths:{}},
  {id:"s71",date:"2026-03-10",notes:"Lobby 71",
   winner:"p30",attendees:["p30","p02","p01","p04","p18"],
   placements:["p30","p02","p01","p04","p18"],
   kills:{p30:3,p02:0,p01:1,p04:0,p18:0},deaths:{}},
  {id:"s72",date:"2026-03-10",notes:"Lobby 72",
   winner:"p01",attendees:["p01","p02","p30","p18","p04","p17"],
   placements:["p01","p02","p30","p18","p04","p17"],
   kills:{p01:3,p02:0,p30:1,p18:1,p04:0,p17:0},deaths:{}},

  // ── 2026-03-11 · Wednesday · 15 lobbies ──
  {id:"s73",date:"2026-03-11",notes:"Lobby 73",
   winner:"p02",attendees:["p02","p01","p14","p03","p18"],
   placements:["p02","p01","p14","p03","p18"],
   kills:{p02:2,p01:1,p14:0,p03:0,p18:0},deaths:{}},
  {id:"s74",date:"2026-03-11",notes:"Lobby 74",
   winner:"p07",attendees:["p07","p04","p02","p03","p18","p14","p01","p09"],
   placements:["p07","p04","p02","p03","p18","p14","p01","p09"],
   kills:{p07:2,p04:1,p02:0,p03:2,p18:0,p14:0,p01:0,p09:0},deaths:{}},
  {id:"s75",date:"2026-03-11",notes:"Lobby 75",
   winner:"p07",attendees:["p07","p14","p01","p02","p05","p03","p25","p18","p04","p09"],
   placements:["p07","p14","p01","p02","p05","p03","p25","p18","p04","p09"],
   kills:{p07:2,p14:2,p01:2,p02:0,p05:1,p03:0,p25:0,p18:0,p04:1,p09:0},deaths:{}},
  {id:"s76",date:"2026-03-11",notes:"Lobby 76",
   winner:"p25",attendees:["p25","p02","p04","p05","p14","p07","p01","p18"],
   placements:["p25","p02","p04","p05","p14","p07","p01","p18"],
   kills:{p25:4,p02:2,p04:0,p05:0,p14:0,p07:1,p01:0,p18:0},deaths:{}},
  {id:"s77",date:"2026-03-11",notes:"Lobby 77",
   winner:"p25",attendees:["p25","p08","p14","p02","p04","p12","p01","p07","p30","p05","p17","p18"],
   placements:["p25","p08","p14","p02","p04","p12","p01","p07","p30","p05","p17","p18"],
   kills:{p25:1,p08:2,p14:2,p02:2,p04:0,p12:2,p01:1,p07:0,p30:0,p05:0,p17:0,p18:0},deaths:{}},
  {id:"s78",date:"2026-03-11",notes:"Lobby 78",
   winner:"p25",attendees:["p25","p31","p15","p08","p05","p01","p02","p04","p14"],
   placements:["p25","p31","p15","p08","p05","p01","p02","p04","p14"],
   kills:{p25:1,p31:2,p15:0,p08:1,p05:2,p01:0,p02:0,p04:0,p14:0},deaths:{}},
  {id:"s79",date:"2026-03-11",notes:"Lobby 79",
   winner:"p01",attendees:["p01","p07","p02","p14","p04","p12","p25","p05","p31","p18"],
   placements:["p01","p07","p02","p14","p04","p12","p25","p05","p31","p18"],
   kills:{p01:3,p07:3,p02:1,p14:1,p04:0,p12:0,p25:0,p05:0,p31:0,p18:0},deaths:{}},
  {id:"s80",date:"2026-03-11",notes:"Lobby 80",
   winner:"p04",attendees:["p04","p02","p25","p12","p08","p07","p14","p01"],
   placements:["p04","p02","p25","p12","p08","p07","p14","p01"],
   kills:{p04:1,p02:4,p25:0,p12:0,p08:0,p07:1,p14:0,p01:0},deaths:{}},
  {id:"s81",date:"2026-03-11",notes:"Lobby 81",
   winner:"p07",attendees:["p07","p01","p14","p08","p04","p02","p15","p12","p03"],
   placements:["p07","p01","p14","p08","p04","p02","p15","p12","p03"],
   kills:{p07:5,p01:2,p14:0,p08:0,p04:0,p02:1,p15:0,p12:0,p03:0},deaths:{}},
  {id:"s82",date:"2026-03-11",notes:"Lobby 82",
   winner:"p07",attendees:["p07","p02","p01","p04","p03"],
   placements:["p07","p02","p01","p04","p03"],
   kills:{p07:2,p02:1,p01:0,p04:1,p03:0},deaths:{}},
  {id:"s83",date:"2026-03-11",notes:"Lobby 83",
   winner:"p07",attendees:["p07","p25","p04","p02","p01"],
   placements:["p07","p25","p04","p02","p01"],
   kills:{p07:1,p25:1,p04:1,p02:1,p01:0},deaths:{}},
  {id:"s84",date:"2026-03-11",notes:"Lobby 84",
   winner:"p01",attendees:["p01","p06","p02","p07","p04","p18"],
   placements:["p01","p06","p02","p07","p04","p18"],
   kills:{p01:3,p06:0,p02:1,p07:0,p04:0,p18:0},deaths:{}},
  {id:"s85",date:"2026-03-11",notes:"Lobby 85",
   winner:"p01",attendees:["p01","p07","p02","p04","p18"],
   placements:["p01","p07","p02","p04","p18"],
   kills:{p01:1,p07:1,p02:0,p04:1,p18:0},deaths:{}},
  {id:"s86",date:"2026-03-11",notes:"Lobby 86",
   winner:"p01",attendees:["p01","p15","p02","p04","p18"],
   placements:["p01","p15","p02","p04","p18"],
   kills:{p01:0,p15:1,p02:0,p04:0,p18:0},deaths:{}},
  {id:"s88",date:"2026-03-12",notes:"Lobby 88",
    winner:"p02",attendees:["p02","p04","p01","p30","p09","p18"],
    placements:["p02","p04","p01","p30","p09","p18"],
    kills:{"p02":2,"p04":1,"p01":1,"p30":1,"p09":0,"p18":0}},
  {id:"s89",date:"2026-03-12",notes:"Lobby 89",
    winner:"p02",attendees:["p02","p01","p30","p04","p16","p18","p08","p12"],
    placements:["p02","p01","p30","p04","p16","p18","p08","p12"],
    kills:{"p02":1,"p01":0,"p30":2,"p04":1,"p16":1,"p18":0,"p08":0,"p12":0}},
  {id:"s90",date:"2026-03-12",notes:"Lobby 90",
    winner:"p02",attendees:["p02","p24","p04","p30","p01","p16","p08","p12","p18"],
    placements:["p02","p24","p04","p30","p01","p16","p08","p12","p18"],
    kills:{"p02":2,"p24":3,"p04":0,"p30":3,"p01":0,"p16":0,"p08":0,"p12":0,"p18":0}},
  {id:"s91",date:"2026-03-12",notes:"Lobby 91",
    winner:"p24",attendees:["p24","p04","p01","p07","p16","p02","p30","p08","p18","p12","p11"],
    placements:["p24","p04","p01","p07","p16","p02","p30","p08","p18","p12","p11"],
    kills:{"p24":4,"p04":0,"p01":0,"p07":0,"p16":2,"p02":1,"p30":0,"p08":0,"p18":1,"p12":0,"p11":0}},
  {id:"s92",date:"2026-03-12",notes:"Lobby 92",
    winner:"p30",attendees:["p30","p04","p07","p01","p02","p09","p24","p18"],
    placements:["p30","p04","p07","p01","p02","p09","p24","p18"],
    kills:{"p30":3,"p04":2,"p07":1,"p01":0,"p02":0,"p09":0,"p24":0,"p18":0}},
  {id:"s93",date:"2026-03-12",notes:"Lobby 93",
    winner:"p02",attendees:["p02","p11","p24","p04","p01","p18"],
    placements:["p02","p11","p24","p04","p01","p18"],
    kills:{"p02":2,"p11":0,"p24":2,"p04":0,"p01":1,"p18":0}},
  {id:"s94",date:"2026-03-12",notes:"Lobby 94",
    winner:"p15",attendees:["p15","p24","p07","p02","p04","p18","p08","p01"],
    placements:["p15","p24","p07","p02","p04","p18","p08","p01"],
    kills:{"p15":1,"p24":1,"p07":4,"p02":0,"p04":0,"p18":0,"p08":0,"p01":0}},
  {id:"s95",date:"2026-03-12",notes:"Lobby 95",
    winner:"p02",attendees:["p02","p11","p24","p04","p18","p12","p07"],
    placements:["p02","p11","p24","p04","p18","p12","p07"],
    kills:{"p02":2,"p11":1,"p24":2,"p04":0,"p18":0,"p12":0,"p07":0}},
  {id:"s96",date:"2026-03-12",notes:"Lobby 96",
    winner:"p08",attendees:["p08","p24","p02","p18","p11","p04","p01"],
    placements:["p08","p24","p02","p18","p11","p04","p01"],
    kills:{"p08":2,"p24":2,"p02":1,"p18":0,"p11":0,"p04":0,"p01":0}},
  {id:"s97",date:"2026-03-12",notes:"Lobby 97",
    winner:"p02",attendees:["p02","p04","p11","p08","p01","p18","p24","p05"],
    placements:["p02","p04","p11","p08","p01","p18","p24","p05"],
    kills:{"p02":2,"p04":1,"p11":0,"p08":1,"p01":1,"p18":0,"p24":0,"p05":0}},
  {id:"s98",date:"2026-03-12",notes:"Lobby 98",
    winner:"p05",attendees:["p05","p08","p04","p11","p03","p18","p02"],
    placements:["p05","p08","p04","p11","p03","p18","p02"],
    kills:{"p05":3,"p08":1,"p04":2,"p11":0,"p03":0,"p18":0,"p02":0}},
  {id:"s99",date:"2026-03-12",notes:"Lobby 99",
    winner:"p04",attendees:["p04","p05","p08","p02","p11","p18"],
    placements:["p04","p05","p08","p02","p11","p18"],
    kills:{"p04":3,"p05":0,"p08":1,"p02":1,"p11":0,"p18":0}},
  {id:"s100",date:"2026-03-12",notes:"Lobby 100",
    winner:"p08",attendees:["p08","p01","p02","p05","p04","p11","p18"],
    placements:["p08","p01","p02","p05","p04","p11","p18"],
    kills:{"p08":1,"p01":4,"p02":1,"p05":0,"p04":0,"p11":0,"p18":0}},
  {id:"s101",date:"2026-03-12",notes:"Lobby 101",
    winner:"p01",attendees:["p01","p08","p05","p02","p11","p04","p18"],
    placements:["p01","p08","p05","p02","p11","p04","p18"],
    kills:{"p01":3,"p08":1,"p05":0,"p02":0,"p11":1,"p04":0,"p18":0}},
  {id:"s87",date:"2026-03-11",notes:"Lobby 87",
   winner:"p02",attendees:["p02","p15","p04","p06","p01"],
   placements:["p02","p15","p04","p06","p01"],
   kills:{p02:3,p15:0,p04:0,p06:0,p01:0},deaths:{}},

  // ── 2026-03-13 Friday · Lobbies 102–114 ──
  {id:"s102",date:"2026-03-13",notes:"Lobby 102",
    winner:"p04",attendees:["p04","p29","p02","p01","p15","p18","p21"],
    placements:["p04","p29","p02","p01","p15","p18","p21"],
    kills:{"p04":0,"p29":0,"p02":1,"p01":1,"p15":0,"p18":0,"p21":0}},

  {id:"s103",date:"2026-03-13",notes:"Lobby 103",
    winner:"p02",attendees:["p02","p08","p15","p11","p29","p01","p04","p10","p03","p05","p18"],
    placements:["p02","p08","p15","p11","p29","p01","p04","p10","p03","p05","p18"],
    kills:{"p02":2,"p08":0,"p15":2,"p11":1,"p29":1,"p01":1,"p04":0,"p10":1,"p03":0,"p05":0,"p18":0}},

  {id:"s104",date:"2026-03-13",notes:"Lobby 104",
    winner:"p02",attendees:["p02","p07","p15","p24","p01","p04","p12","p31","p11","p25","p29","p05","p08","p10","p18"],
    placements:["p02","p07","p15","p24","p01","p04","p12","p31","p11","p25","p29","p05","p08","p10","p18"],
    kills:{"p02":3,"p07":4,"p15":1,"p24":3,"p01":0,"p04":0,"p12":0,"p31":0,"p11":1,"p25":0,"p29":0,"p05":0,"p08":1,"p10":0,"p18":0}},

  {id:"s105",date:"2026-03-13",notes:"Lobby 105",
    winner:"p02",attendees:["p02","p29","p15","p10","p25","p11","p07","p01","p04","p14","p24","p05","p08","p18"],
    placements:["p02","p29","p15","p10","p25","p11","p07","p01","p04","p14","p24","p05","p08","p18"],
    kills:{"p02":3,"p29":1,"p15":1,"p10":1,"p25":1,"p11":2,"p07":0,"p01":0,"p04":0,"p14":1,"p24":0,"p05":0,"p08":0,"p18":0}},

  {id:"s106",date:"2026-03-13",notes:"Lobby 106",
    winner:"p07",attendees:["p07","p29","p02","p01","p25","p15","p18","p31","p14","p24","p11","p05","p08","p32"],
    placements:["p07","p29","p02","p01","p25","p15","p18","p31","p14","p24","p11","p05","p08","p32"],
    kills:{"p07":2,"p29":1,"p02":2,"p01":4,"p25":0,"p15":0,"p18":1,"p31":0,"p14":1,"p24":0,"p11":1,"p05":0,"p08":0,"p32":0}},

  {id:"s107",date:"2026-03-13",notes:"Lobby 107",
    winner:"p29",attendees:["p29","p07","p25","p14","p01","p04","p02","p11","p31","p08","p18","p24","p05","p21"],
    placements:["p29","p07","p25","p14","p01","p04","p02","p11","p31","p08","p18","p24","p05","p21"],
    kills:{"p29":0,"p07":0,"p25":1,"p14":0,"p01":3,"p04":2,"p02":1,"p11":2,"p31":0,"p08":0,"p18":0,"p24":0,"p05":0,"p21":0}},

  {id:"s108",date:"2026-03-13",notes:"Lobby 108",
    winner:"p02",attendees:["p02","p01","p07","p04","p25","p29","p18","p31","p15","p14","p05","p21"],
    placements:["p02","p01","p07","p04","p25","p29","p18","p31","p15","p14","p05","p21"],
    kills:{"p02":4,"p01":3,"p07":0,"p04":1,"p25":1,"p29":1,"p18":0,"p31":0,"p15":0,"p14":0,"p05":0,"p21":0}},

  {id:"s109",date:"2026-03-13",notes:"Lobby 109",
    winner:"p01",attendees:["p01","p04","p29","p02","p07","p06","p15","p12","p05","p03"],
    placements:["p01","p04","p29","p02","p07","p06","p15","p12","p05","p03"],
    kills:{"p01":3,"p04":0,"p29":1,"p02":1,"p07":0,"p06":2,"p15":0,"p12":0,"p05":0,"p03":0}},

  {id:"s110",date:"2026-03-13",notes:"Lobby 110",
    winner:"p05",attendees:["p05","p29","p07","p03","p06","p04","p02","p01"],
    placements:["p05","p29","p07","p03","p06","p04","p02","p01"],
    kills:{"p05":3,"p29":0,"p07":1,"p03":1,"p06":2,"p04":0,"p02":0,"p01":0}},

  {id:"s111",date:"2026-03-13",notes:"Lobby 111",
    winner:"p29",attendees:["p29","p02","p06","p04","p18","p05","p03","p01"],
    placements:["p29","p02","p06","p04","p18","p05","p03","p01"],
    kills:{"p29":1,"p02":2,"p06":2,"p04":0,"p18":1,"p05":0,"p03":0,"p01":0}},

  {id:"s112",date:"2026-03-13",notes:"Lobby 112",
    winner:"p02",attendees:["p02","p01","p29","p05","p04","p06","p18","p08"],
    placements:["p02","p01","p29","p05","p04","p06","p18","p08"],
    kills:{"p02":4,"p01":1,"p29":0,"p05":0,"p04":1,"p06":1,"p18":0,"p08":0}},

  {id:"s113",date:"2026-03-13",notes:"Lobby 113",
    winner:"p05",attendees:["p05","p29","p01","p02","p08","p04"],
    placements:["p05","p29","p01","p02","p08","p04"],
    kills:{"p05":1,"p29":2,"p01":0,"p02":1,"p08":0,"p04":0}},

  {id:"s114",date:"2026-03-13",notes:"Lobby 114",
    winner:"p02",attendees:["p02","p04","p01","p05","p29"],
    placements:["p02","p04","p01","p05","p29"],
    kills:{"p02":0,"p04":1,"p01":2,"p05":0,"p29":0}},

  {id:"s115",date:"2026-03-13",notes:"Lobby 115",
    winner:"p01",attendees:["p01","p04","p02","p11","p05"],
    placements:["p01","p04","p02","p11","p05"],
    kills:{"p01":2,"p04":1,"p02":1,"p11":0,"p05":0}},

  // ── Mar 14, 2026 — 14 lobbies ──
  {id:"s116",date:"2026-03-14",notes:"Lobby 116",
    winner:"p02",attendees:["p02","p01","p24","p14","p11","p33","p18","p08"],
    placements:["p02","p01","p24","p14","p11","p33","p18","p08"],
    kills:{"p02":0,"p01":2,"p24":0,"p14":3,"p11":0,"p33":0,"p18":0,"p08":0}},

  {id:"s117",date:"2026-03-14",notes:"Lobby 117",
    winner:"p07",attendees:["p07","p01","p08","p02","p04","p14","p11","p21"],
    placements:["p07","p01","p08","p02","p04","p14","p11","p21"],
    kills:{"p07":1,"p01":3,"p08":0,"p02":1,"p04":0,"p14":0,"p11":0,"p21":0}},

  {id:"s118",date:"2026-03-14",notes:"Lobby 118",
    winner:"p02",attendees:["p02","p24","p01","p18","p07","p14","p04","p30","p21"],
    placements:["p02","p24","p01","p18","p07","p14","p04","p30","p21"],
    kills:{"p02":2,"p24":0,"p01":2,"p18":0,"p07":2,"p14":0,"p04":0,"p30":0,"p21":0}},

  {id:"s119",date:"2026-03-14",notes:"Lobby 119",
    winner:"p30",attendees:["p30","p04","p01","p02","p14","p07","p24","p18"],
    placements:["p30","p04","p01","p02","p14","p07","p24","p18"],
    kills:{"p30":1,"p04":2,"p01":3,"p02":1,"p14":0,"p07":0,"p24":0,"p18":0}},

  {id:"s120",date:"2026-03-14",notes:"Lobby 120",
    winner:"p02",attendees:["p02","p01","p14","p16","p04","p21","p20","p24","p07"],
    placements:["p02","p01","p14","p16","p04","p21","p20","p24","p07"],
    kills:{"p02":0,"p01":3,"p14":1,"p16":1,"p04":0,"p21":0,"p20":0,"p24":1,"p07":0}},

  {id:"s121",date:"2026-03-14",notes:"Lobby 121",
    winner:"p02",attendees:["p02","p14","p04","p08","p24","p20","p01","p09"],
    placements:["p02","p14","p04","p08","p24","p20","p01","p09"],
    kills:{"p02":3,"p14":3,"p04":1,"p08":0,"p24":0,"p20":0,"p01":0,"p09":0}},

  {id:"s122",date:"2026-03-14",notes:"Lobby 122",
    winner:"p02",attendees:["p02","p14","p01","p18","p24","p20","p08"],
    placements:["p02","p14","p01","p18","p24","p20","p08"],
    kills:{"p02":1,"p14":3,"p01":1,"p18":0,"p24":1,"p20":0,"p08":0}},

  {id:"s123",date:"2026-03-14",notes:"Lobby 123",
    winner:"p14",attendees:["p14","p04","p24","p01","p20","p02","p18"],
    placements:["p14","p04","p24","p01","p20","p02","p18"],
    kills:{"p14":3,"p04":1,"p24":1,"p01":0,"p20":0,"p02":0,"p18":0}},

  {id:"s124",date:"2026-03-14",notes:"Lobby 124",
    winner:"p04",attendees:["p04","p20","p14","p01","p02","p18"],
    placements:["p04","p20","p14","p01","p02","p18"],
    kills:{"p04":2,"p20":0,"p14":2,"p01":1,"p02":0,"p18":0}},

  {id:"s125",date:"2026-03-14",notes:"Lobby 125",
    winner:"p01",attendees:["p01","p14","p04","p20","p18","p02"],
    placements:["p01","p14","p04","p20","p18","p02"],
    kills:{"p01":1,"p14":0,"p04":1,"p20":1,"p18":0,"p02":0}},

  {id:"s126",date:"2026-03-14",notes:"Lobby 126",
    winner:"p02",attendees:["p02","p04","p14","p20","p18","p01"],
    placements:["p02","p04","p14","p20","p18","p01"],
    kills:{"p02":2,"p04":0,"p14":0,"p20":0,"p18":0,"p01":0}},

  {id:"s127",date:"2026-03-14",notes:"Lobby 127",
    winner:"p02",attendees:["p02","p15","p14","p30","p04","p01","p18","p20"],
    placements:["p02","p15","p14","p30","p04","p01","p18","p20"],
    kills:{"p02":3,"p15":1,"p14":2,"p30":0,"p04":0,"p01":0,"p18":0,"p20":0}},

  {id:"s128",date:"2026-03-14",notes:"Lobby 128",
    winner:"p20",attendees:["p20","p04","p01","p14","p16","p18","p02"],
    placements:["p20","p04","p01","p14","p16","p18","p02"],
    kills:{"p20":1,"p04":0,"p01":2,"p14":2,"p16":0,"p18":0,"p02":0}},

  {id:"s129",date:"2026-03-14",notes:"Lobby 129",
    winner:"p01",attendees:["p01","p15","p14","p16","p20","p04","p02","p30","p18"],
    placements:["p01","p15","p14","p16","p20","p04","p02","p30","p18"],
    kills:{"p01":4,"p15":0,"p14":2,"p16":2,"p20":0,"p04":0,"p02":0,"p30":0,"p18":0}},
  // ── Mon 16 Mar 2026 — 14 lobbies ──
  {id:"s130",date:"2026-03-16",notes:"Lobby 130",
    winner:"p02",attendees:["p02","p11","p01","p04","p18","p09"],
    placements:["p02","p11","p01","p04","p18","p09"],
    kills:{"p02":1,"p11":0,"p01":2,"p04":2,"p18":0,"p09":0}},

  {id:"s131",date:"2026-03-16",notes:"Lobby 131",
    winner:"p04",attendees:["p04","p01","p02","p18","p09","p07"],
    placements:["p04","p01","p02","p18","p09","p07"],
    kills:{"p04":2,"p01":1,"p02":1,"p18":0,"p09":0,"p07":0}},

  {id:"s132",date:"2026-03-16",notes:"Lobby 132",
    winner:"p04",attendees:["p04","p02","p07","p18","p01","p09"],
    placements:["p04","p02","p07","p18","p01","p09"],
    kills:{"p04":1,"p02":2,"p07":0,"p18":0,"p01":1,"p09":0}},

  {id:"s133",date:"2026-03-16",notes:"Lobby 133",
    winner:"p02",attendees:["p02","p01","p07","p04","p09","p18"],
    placements:["p02","p01","p07","p04","p09","p18"],
    kills:{"p02":2,"p01":1,"p07":1,"p04":0,"p09":0,"p18":0}},

  {id:"s134",date:"2026-03-16",notes:"Lobby 134",
    winner:"p04",attendees:["p04","p18","p07","p01","p02"],
    placements:["p04","p18","p07","p01","p02"],
    kills:{"p04":1,"p18":1,"p07":2,"p01":0,"p02":0}},

  {id:"s135",date:"2026-03-16",notes:"Lobby 135",
    winner:"p02",attendees:["p02","p04","p01","p11","p18"],
    placements:["p02","p04","p01","p11","p18"],
    kills:{"p02":1,"p04":1,"p01":1,"p11":0,"p18":0}},

  {id:"s136",date:"2026-03-16",notes:"Lobby 136",
    winner:"p04",attendees:["p04","p01","p02","p18","p11","p12"],
    placements:["p04","p01","p02","p18","p11","p12"],
    kills:{"p04":2,"p01":2,"p02":0,"p18":0,"p11":0,"p12":0}},

  {id:"s137",date:"2026-03-16",notes:"Lobby 137",
    winner:"p01",attendees:["p01","p04","p14","p02","p11"],
    placements:["p01","p04","p14","p02","p11"],
    kills:{"p01":2,"p04":0,"p14":0,"p02":0,"p11":0}},

  {id:"s138",date:"2026-03-16",notes:"Lobby 138",
    winner:"p14",attendees:["p14","p01","p02","p12","p11","p04","p18"],
    placements:["p14","p01","p02","p12","p11","p04","p18"],
    kills:{"p14":1,"p01":2,"p02":1,"p12":1,"p11":0,"p04":0,"p18":0}},

  {id:"s139",date:"2026-03-16",notes:"Lobby 139",
    winner:"p04",attendees:["p04","p18","p02","p01","p14","p11","p12"],
    placements:["p04","p18","p02","p01","p14","p11","p12"],
    kills:{"p04":0,"p18":0,"p02":1,"p01":2,"p14":0,"p11":0,"p12":0}},

  {id:"s140",date:"2026-03-16",notes:"Lobby 140",
    winner:"p02",attendees:["p02","p04","p01","p14","p03","p08","p11","p18"],
    placements:["p02","p04","p01","p14","p03","p08","p11","p18"],
    kills:{"p02":2,"p04":1,"p01":0,"p14":2,"p03":0,"p08":0,"p11":0,"p18":0}},

  {id:"s141",date:"2026-03-16",notes:"Lobby 141",
    winner:"p01",attendees:["p01","p02","p04","p14","p03"],
    placements:["p01","p02","p04","p14","p03"],
    kills:{"p01":1,"p02":1,"p04":1,"p14":0,"p03":0}},

  {id:"s142",date:"2026-03-16",notes:"Lobby 142",
    winner:"p14",attendees:["p14","p02","p01","p04","p03"],
    placements:["p14","p02","p01","p04","p03"],
    kills:{"p14":1,"p02":0,"p01":2,"p04":1,"p03":0}},

  {id:"s143",date:"2026-03-16",notes:"Lobby 143",
    winner:"p02",attendees:["p02","p01","p04","p14"],
    placements:["p02","p01","p04","p14"],
    kills:{"p02":1,"p01":2,"p04":0,"p14":0}},

  // ── Tue 17 Mar 2026 — 14 lobbies ──
  {id:"s144",date:"2026-03-17",notes:"Lobby 144",
    winner:"p02",attendees:["p02","p04","p07","p11","p14","p10","p18","p08"],
    placements:["p02","p04","p07","p11","p14","p10","p18","p08"],
    kills:{"p02":2,"p04":0,"p07":1,"p11":1,"p14":1,"p10":1,"p18":0,"p08":0}},

  {id:"s145",date:"2026-03-17",notes:"Lobby 145",
    winner:"p02",attendees:["p02","p14","p19","p10","p07","p04","p01","p08","p18","p11"],
    placements:["p02","p14","p19","p10","p07","p04","p01","p08","p18","p11"],
    kills:{"p02":2,"p14":4,"p19":0,"p10":0,"p07":2,"p04":0,"p01":0,"p08":0,"p18":0,"p11":0}},

  {id:"s146",date:"2026-03-17",notes:"Lobby 146",
    winner:"p04",attendees:["p04","p02","p19","p06","p14","p07","p11","p10","p01","p18","p08"],
    placements:["p04","p02","p19","p06","p14","p07","p11","p10","p01","p18","p08"],
    kills:{"p04":2,"p02":1,"p19":0,"p06":1,"p14":1,"p07":1,"p11":0,"p10":0,"p01":0,"p18":0,"p08":0}},

  {id:"s147",date:"2026-03-17",notes:"Lobby 147",
    winner:"p30",attendees:["p30","p07","p14","p19","p18","p01","p02","p11","p10"],
    placements:["p30","p07","p14","p19","p18","p01","p02","p11","p10"],
    kills:{"p30":6,"p07":0,"p14":1,"p19":0,"p18":0,"p01":0,"p02":0,"p11":0,"p10":0}},

  {id:"s148",date:"2026-03-17",notes:"Lobby 148",
    winner:"p30",attendees:["p30","p02","p08","p04","p19","p15","p18","p14","p07","p01","p11"],
    placements:["p30","p02","p08","p04","p19","p15","p18","p14","p07","p01","p11"],
    kills:{"p30":6,"p02":0,"p08":1,"p04":0,"p19":0,"p15":1,"p18":1,"p14":0,"p07":0,"p01":0,"p11":0}},

  {id:"s149",date:"2026-03-17",notes:"Lobby 149",
    winner:"p02",attendees:["p02","p08","p12","p07","p15","p04","p18","p14","p19"],
    placements:["p02","p08","p12","p07","p15","p04","p18","p14","p19"],
    kills:{"p02":2,"p08":0,"p12":3,"p07":0,"p15":0,"p04":2,"p18":0,"p14":0,"p19":0}},

  {id:"s150",date:"2026-03-17",notes:"Lobby 150",
    winner:"p15",attendees:["p15","p12","p02","p07","p14","p04","p01","p03","p18","p08"],
    placements:["p15","p12","p02","p07","p14","p04","p01","p03","p18","p08"],
    kills:{"p15":0,"p12":4,"p02":0,"p07":1,"p14":1,"p04":1,"p01":0,"p03":0,"p18":0,"p08":0}},

  {id:"s151",date:"2026-03-17",notes:"Lobby 151",
    winner:"p08",attendees:["p08","p18","p15","p01","p12","p02","p07","p14","p04"],
    placements:["p08","p18","p15","p01","p12","p02","p07","p14","p04"],
    kills:{"p08":3,"p18":2,"p15":0,"p01":0,"p12":1,"p02":0,"p07":1,"p14":0,"p04":0}},

  {id:"s152",date:"2026-03-17",notes:"Lobby 152",
    winner:"p01",attendees:["p01","p06","p04","p12","p15","p07","p02","p14","p18","p09"],
    placements:["p01","p06","p04","p12","p15","p07","p02","p14","p18","p09"],
    kills:{"p01":2,"p06":0,"p04":5,"p12":1,"p15":0,"p07":0,"p02":1,"p14":0,"p18":0,"p09":0}},

  {id:"s153",date:"2026-03-17",notes:"Lobby 153",
    winner:"p02",attendees:["p02","p15","p08","p04","p06","p01","p12","p14"],
    placements:["p02","p15","p08","p04","p06","p01","p12","p14"],
    kills:{"p02":4,"p15":0,"p08":0,"p04":0,"p06":0,"p01":2,"p12":0,"p14":0}},

  {id:"s154",date:"2026-03-17",notes:"Lobby 154",
    winner:"p02",attendees:["p02","p04","p14","p06","p11","p18","p01"],
    placements:["p02","p04","p14","p06","p11","p18","p01"],
    kills:{"p02":3,"p04":0,"p14":1,"p06":1,"p11":0,"p18":0,"p01":0}},

  {id:"s155",date:"2026-03-17",notes:"Lobby 155",
    winner:"p01",attendees:["p01","p04","p02","p18","p06","p14"],
    placements:["p01","p04","p02","p18","p06","p14"],
    kills:{"p01":3,"p04":0,"p02":0,"p18":0,"p06":0,"p14":1}},

  {id:"s156",date:"2026-03-17",notes:"Lobby 156",
    winner:"p02",attendees:["p02","p04","p18","p01"],
    placements:["p02","p04","p18","p01"],
    kills:{"p02":3,"p04":0,"p18":0,"p01":0}},

  {id:"s157",date:"2026-03-17",notes:"Lobby 157",
    winner:"p02",attendees:["p02","p18","p04"],
    placements:["p02","p18","p04"],
    kills:{"p02":1,"p18":0,"p04":0}},
  // ── Wed 18 Mar 2026 — 15 lobbies ──
  {id:"s158",date:"2026-03-18",notes:"Lobby 158",
    winner:"p08",attendees:["p08","p02","p04","p01","p14","p09","p18","p11"],
    placements:["p08","p02","p04","p01","p14","p09","p18","p11"],
    kills:{"p08":1,"p02":3,"p04":1,"p01":0,"p14":2,"p09":0,"p18":0,"p11":0}},

  {id:"s159",date:"2026-03-18",notes:"Lobby 159",
    winner:"p07",attendees:["p07","p02","p14","p04","p11","p09","p05","p18","p01"],
    placements:["p07","p02","p14","p04","p11","p09","p05","p18","p01"],
    kills:{"p07":1,"p02":1,"p14":1,"p04":1,"p11":0,"p09":1,"p05":0,"p18":0,"p01":0}},

  {id:"s160",date:"2026-03-18",notes:"Lobby 160",
    winner:"p08",attendees:["p08","p14","p07","p02","p04","p24","p11","p05","p09","p18"],
    placements:["p08","p14","p07","p02","p04","p24","p11","p05","p09","p18"],
    kills:{"p08":2,"p14":1,"p07":2,"p02":0,"p04":2,"p24":0,"p11":1,"p05":0,"p09":0,"p18":0}},

  {id:"s161",date:"2026-03-18",notes:"Lobby 161",
    winner:"p02",attendees:["p02","p24","p11","p08","p07","p14","p01","p06","p04","p05","p18"],
    placements:["p02","p24","p11","p08","p07","p14","p01","p06","p04","p05","p18"],
    kills:{"p02":3,"p24":2,"p11":0,"p08":0,"p07":1,"p14":2,"p01":1,"p06":0,"p04":0,"p05":0,"p18":0}},

  {id:"s162",date:"2026-03-18",notes:"Lobby 162",
    winner:"p08",attendees:["p08","p06","p14","p24","p04","p05","p01","p12","p11","p02","p07","p09","p18"],
    placements:["p08","p06","p14","p24","p04","p05","p01","p12","p11","p02","p07","p09","p18"],
    kills:{"p08":2,"p06":4,"p14":1,"p24":1,"p04":3,"p05":0,"p01":0,"p12":0,"p11":1,"p02":0,"p07":0,"p09":0,"p18":0}},

  {id:"s163",date:"2026-03-18",notes:"Lobby 163",
    winner:"p24",attendees:["p24","p04","p08","p02","p07","p12","p14","p05","p01","p11","p18","p06"],
    placements:["p24","p04","p08","p02","p07","p12","p14","p05","p01","p11","p18","p06"],
    kills:{"p24":1,"p04":3,"p08":2,"p02":2,"p07":0,"p12":0,"p14":1,"p05":1,"p01":0,"p11":0,"p18":0,"p06":0}},

  {id:"s164",date:"2026-03-18",notes:"Lobby 164",
    winner:"p06",attendees:["p06","p01","p18","p24","p08","p02","p12","p11","p05","p04"],
    placements:["p06","p01","p18","p24","p08","p02","p12","p11","p05","p04"],
    kills:{"p06":1,"p01":3,"p18":1,"p24":2,"p08":0,"p02":0,"p12":0,"p11":1,"p05":0,"p04":0}},

  {id:"s165",date:"2026-03-18",notes:"Lobby 165",
    winner:"p02",attendees:["p02","p01","p18","p04","p06","p11","p05","p24","p08","p14"],
    placements:["p02","p01","p18","p04","p06","p11","p05","p24","p08","p14"],
    kills:{"p02":2,"p01":0,"p18":1,"p04":0,"p06":2,"p11":0,"p05":0,"p24":1,"p08":0,"p14":0}},

  {id:"s166",date:"2026-03-18",notes:"Lobby 166",
    winner:"p04",attendees:["p04","p01","p14","p24","p02","p11","p08","p03","p18","p06","p05"],
    placements:["p04","p01","p14","p24","p02","p11","p08","p03","p18","p06","p05"],
    kills:{"p04":3,"p01":4,"p14":1,"p24":0,"p02":1,"p11":0,"p08":0,"p03":0,"p18":0,"p06":0,"p05":0}},

  {id:"s167",date:"2026-03-18",notes:"Lobby 167",
    winner:"p01",attendees:["p01","p05","p04","p11","p08","p24","p18","p02","p14"],
    placements:["p01","p05","p04","p11","p08","p24","p18","p02","p14"],
    kills:{"p01":2,"p05":1,"p04":0,"p11":3,"p08":1,"p24":0,"p18":0,"p02":0,"p14":0}},

  {id:"s168",date:"2026-03-18",notes:"Lobby 168",
    winner:"p06",attendees:["p06","p01","p18","p02","p05","p04","p14","p24"],
    placements:["p06","p01","p18","p02","p05","p04","p14","p24"],
    kills:{"p06":1,"p01":1,"p18":2,"p02":1,"p05":0,"p04":0,"p14":1,"p24":0}},

  {id:"s169",date:"2026-03-18",notes:"Lobby 169",
    winner:"p14",attendees:["p14","p01","p05","p02","p04","p06","p18"],
    placements:["p14","p01","p05","p02","p04","p06","p18"],
    kills:{"p14":2,"p01":1,"p05":0,"p02":1,"p04":0,"p06":0,"p18":0}},

  {id:"s170",date:"2026-03-18",notes:"Lobby 170",
    winner:"p02",attendees:["p02","p04","p14","p01","p05","p08","p18"],
    placements:["p02","p04","p14","p01","p05","p08","p18"],
    kills:{"p02":1,"p04":1,"p14":0,"p01":1,"p05":0,"p08":1,"p18":0}},

  {id:"s171",date:"2026-03-18",notes:"Lobby 171",
    winner:"p16",attendees:["p16","p02","p04","p14","p18","p01","p06"],
    placements:["p16","p02","p04","p14","p18","p01","p06"],
    kills:{"p16":1,"p02":2,"p04":0,"p14":0,"p18":0,"p01":0,"p06":1}},

  {id:"s172",date:"2026-03-18",notes:"Lobby 172",
    winner:"p01",attendees:["p01","p02","p16","p04","p14"],
    placements:["p01","p02","p16","p04","p14"],
    kills:{"p01":2,"p02":1,"p16":0,"p04":0,"p14":0}},
  // ── Thu 19 Mar 2026 — 14 lobbies ──
  {id:"s173",date:"2026-03-19",notes:"Lobby 173",
    winner:"p02",attendees:["p02","p04","p11","p01"],
    placements:["p02","p04","p11","p01"],
    kills:{"p02":2,"p04":0,"p11":0,"p01":0}},

  {id:"s174",date:"2026-03-19",notes:"Lobby 174",
    winner:"p30",attendees:["p30","p01","p02","p04","p11","p09","p18"],
    placements:["p30","p01","p02","p04","p11","p09","p18"],
    kills:{"p30":3,"p01":1,"p02":1,"p04":0,"p11":0,"p09":1,"p18":0}},

  {id:"s175",date:"2026-03-19",notes:"Lobby 175",
    winner:"p02",attendees:["p02","p08","p18","p01","p05","p04","p10","p11","p06","p09"],
    placements:["p02","p08","p18","p01","p05","p04","p10","p11","p06","p09"],
    kills:{"p02":3,"p08":1,"p18":1,"p01":2,"p05":0,"p04":0,"p10":0,"p11":0,"p06":1,"p09":0}},

  {id:"s176",date:"2026-03-19",notes:"Lobby 176",
    winner:"p04",attendees:["p04","p06","p02","p01","p05","p09","p18","p11"],
    placements:["p04","p06","p02","p01","p05","p09","p18","p11"],
    kills:{"p04":2,"p06":1,"p02":1,"p01":2,"p05":1,"p09":0,"p18":0,"p11":0}},

  {id:"s177",date:"2026-03-19",notes:"Lobby 177",
    winner:"p02",attendees:["p02","p04","p05","p11","p01","p09","p18"],
    placements:["p02","p04","p05","p11","p01","p09","p18"],
    kills:{"p02":1,"p04":1,"p05":0,"p11":0,"p01":2,"p09":0,"p18":0}},

  {id:"s178",date:"2026-03-19",notes:"Lobby 178",
    winner:"p01",attendees:["p01","p02","p11","p05","p14","p08","p04","p18"],
    placements:["p01","p02","p11","p05","p14","p08","p04","p18"],
    kills:{"p01":4,"p02":2,"p11":0,"p05":0,"p14":0,"p08":0,"p04":0,"p18":0}},

  {id:"s179",date:"2026-03-19",notes:"Lobby 179",
    winner:"p02",attendees:["p02","p04","p10","p07","p05","p01","p11","p14","p18"],
    placements:["p02","p04","p10","p07","p05","p01","p11","p14","p18"],
    kills:{"p02":2,"p04":0,"p10":2,"p07":1,"p05":1,"p01":1,"p11":0,"p14":0,"p18":0}},

  {id:"s180",date:"2026-03-19",notes:"Lobby 180",
    winner:"p30",attendees:["p30","p02","p04","p07","p18","p08","p01","p14","p11"],
    placements:["p30","p02","p04","p07","p18","p08","p01","p14","p11"],
    kills:{"p30":6,"p02":0,"p04":0,"p07":1,"p18":0,"p08":0,"p01":0,"p14":0,"p11":0}},

  {id:"s181",date:"2026-03-19",notes:"Lobby 181",
    winner:"p04",attendees:["p04","p05","p18","p11","p02","p15","p07","p01"],
    placements:["p04","p05","p18","p11","p02","p15","p07","p01"],
    kills:{"p04":1,"p05":4,"p18":2,"p11":0,"p02":0,"p15":0,"p07":0,"p01":0}},

  {id:"s182",date:"2026-03-19",notes:"Lobby 182",
    winner:"p07",attendees:["p07","p04","p01","p11","p05","p02","p18"],
    placements:["p07","p04","p01","p11","p05","p02","p18"],
    kills:{"p07":0,"p04":1,"p01":3,"p11":1,"p05":0,"p02":0,"p18":0}},

  {id:"s183",date:"2026-03-19",notes:"Lobby 183",
    winner:"p04",attendees:["p04","p11","p07","p02","p01","p18","p05","p17"],
    placements:["p04","p11","p07","p02","p01","p18","p05","p17"],
    kills:{"p04":2,"p11":2,"p07":1,"p02":1,"p01":0,"p18":0,"p05":0,"p17":0}},

  {id:"s184",date:"2026-03-19",notes:"Lobby 184",
    winner:"p02",attendees:["p02","p07","p11","p05","p01","p04"],
    placements:["p02","p07","p11","p05","p01","p04"],
    kills:{"p02":1,"p07":3,"p11":0,"p05":0,"p01":0,"p04":0}},

  {id:"s185",date:"2026-03-19",notes:"Lobby 185",
    winner:"p16",attendees:["p16","p15","p02","p18","p04","p07","p01","p06","p05"],
    placements:["p16","p15","p02","p18","p04","p07","p01","p06","p05"],
    kills:{"p16":4,"p15":0,"p02":3,"p18":0,"p04":0,"p07":0,"p01":1,"p06":0,"p05":0}},

  {id:"s186",date:"2026-03-19",notes:"Lobby 186",
    winner:"p02",attendees:["p02","p01","p04","p16","p07","p15","p06","p05","p18"],
    placements:["p02","p01","p04","p16","p07","p15","p06","p05","p18"],
    kills:{"p02":0,"p01":1,"p04":2,"p16":3,"p07":0,"p15":0,"p06":0,"p05":0,"p18":0}},
  // ── Fri 20 Mar 2026 — 14 lobbies ──
  {id:"s187",date:"2026-03-20",notes:"Lobby 187",
    winner:"p02",attendees:["p02","p08","p11","p04","p12","p25","p18","p01"],
    placements:["p02","p08","p11","p04","p12","p25","p18","p01"],
    kills:{"p02":3,"p08":0,"p11":1,"p04":1,"p12":0,"p25":0,"p18":0,"p01":0}},

  {id:"s188",date:"2026-03-20",notes:"Lobby 188",
    winner:"p11",attendees:["p11","p01","p25","p02","p04","p12","p08","p18"],
    placements:["p11","p01","p25","p02","p04","p12","p08","p18"],
    kills:{"p11":0,"p01":2,"p25":1,"p02":1,"p04":1,"p12":1,"p08":0,"p18":0}},

  {id:"s189",date:"2026-03-20",notes:"Lobby 189",
    winner:"p02",attendees:["p02","p12","p11","p04","p18","p08","p01"],
    placements:["p02","p12","p11","p04","p18","p08","p01"],
    kills:{"p02":2,"p12":0,"p11":1,"p04":0,"p18":1,"p08":0,"p01":0}},

  {id:"s190",date:"2026-03-20",notes:"Lobby 190",
    winner:"p02",attendees:["p02","p11","p08","p12","p18","p04"],
    placements:["p02","p11","p08","p12","p18","p04"],
    kills:{"p02":1,"p11":2,"p08":1,"p12":0,"p18":0,"p04":0}},

  {id:"s191",date:"2026-03-20",notes:"Lobby 191",
    winner:"p02",attendees:["p02","p18","p09","p11","p08","p04"],
    placements:["p02","p18","p09","p11","p08","p04"],
    kills:{"p02":4,"p18":0,"p09":1,"p11":0,"p08":0,"p04":0}},

  {id:"s192",date:"2026-03-20",notes:"Lobby 192",
    winner:"p04",attendees:["p04","p02","p18","p05","p11","p09","p01"],
    placements:["p04","p02","p18","p05","p11","p09","p01"],
    kills:{"p04":2,"p02":1,"p18":0,"p05":0,"p11":0,"p09":0,"p01":0}},

  {id:"s193",date:"2026-03-20",notes:"Lobby 193",
    winner:"p07",attendees:["p07","p01","p11","p04","p18","p02","p05"],
    placements:["p07","p01","p11","p04","p18","p02","p05"],
    kills:{"p07":1,"p01":2,"p11":1,"p04":0,"p18":0,"p02":1,"p05":0}},

  {id:"s194",date:"2026-03-20",notes:"Lobby 194",
    winner:"p07",attendees:["p07","p01","p05","p04","p18","p02"],
    placements:["p07","p01","p05","p04","p18","p02"],
    kills:{"p07":3,"p01":1,"p05":1,"p04":0,"p18":0,"p02":0}},

  {id:"s195",date:"2026-03-20",notes:"Lobby 195",
    winner:"p07",attendees:["p07","p18","p02","p05","p01","p04"],
    placements:["p07","p18","p02","p05","p01","p04"],
    kills:{"p07":2,"p18":0,"p02":1,"p05":0,"p01":1,"p04":0}},

  {id:"s196",date:"2026-03-20",notes:"Lobby 196",
    winner:"p04",attendees:["p04","p02","p05","p01","p07","p18"],
    placements:["p04","p02","p05","p01","p07","p18"],
    kills:{"p04":2,"p02":2,"p05":0,"p01":1,"p07":0,"p18":0}},

  {id:"s197",date:"2026-03-20",notes:"Lobby 197",
    winner:"p02",attendees:["p02","p05","p01","p04","p07","p18"],
    placements:["p02","p05","p01","p04","p07","p18"],
    kills:{"p02":2,"p05":0,"p01":1,"p04":2,"p07":0,"p18":0}},

  {id:"s198",date:"2026-03-20",notes:"Lobby 198",
    winner:"p07",attendees:["p07","p02","p01","p04","p05","p17","p18"],
    placements:["p07","p02","p01","p04","p05","p17","p18"],
    kills:{"p07":1,"p02":1,"p01":3,"p04":1,"p05":0,"p17":0,"p18":0}},

  {id:"s199",date:"2026-03-20",notes:"Lobby 199",
    winner:"p05",attendees:["p05","p04","p01","p07","p18","p02"],
    placements:["p05","p04","p01","p07","p18","p02"],
    kills:{"p05":4,"p04":0,"p01":0,"p07":0,"p18":1,"p02":0}},

  {id:"s200",date:"2026-03-20",notes:"Lobby 200",
    winner:"p02",attendees:["p02","p01","p17","p05","p07","p04"],
    placements:["p02","p01","p17","p05","p07","p04"],
    kills:{"p02":2,"p01":3,"p17":0,"p05":0,"p07":0,"p04":0}},
  // ── Sat 21 Mar 2026 — 14 lobbies ──
  {id:"s201",date:"2026-03-21",notes:"Lobby 201",
    winner:"p01",attendees:["p01","p02","p03","p18"],
    placements:["p01","p02","p03","p18"],
    kills:{"p01":1,"p02":2,"p03":0,"p18":0}},

  {id:"s202",date:"2026-03-21",notes:"Lobby 202",
    winner:"p01",attendees:["p01","p06","p15","p18","p02","p03","p07"],
    placements:["p01","p06","p15","p18","p02","p03","p07"],
    kills:{"p01":5,"p06":0,"p15":0,"p18":0,"p02":1,"p03":0,"p07":0}},

  {id:"s203",date:"2026-03-21",notes:"Lobby 203",
    winner:"p06",attendees:["p06","p02","p03","p01","p18"],
    placements:["p06","p02","p03","p01","p18"],
    kills:{"p06":1,"p02":1,"p03":0,"p01":1,"p18":0}},

  {id:"s204",date:"2026-03-21",notes:"Lobby 204",
    winner:"p29",attendees:["p29","p15","p11","p01","p07","p02","p06","p18","p04"],
    placements:["p29","p15","p11","p01","p07","p02","p06","p18","p04"],
    kills:{"p29":2,"p15":1,"p11":0,"p01":2,"p07":2,"p02":0,"p06":0,"p18":0,"p04":0}},

  {id:"s205",date:"2026-03-21",notes:"Lobby 205",
    winner:"p02",attendees:["p02","p29","p01","p08","p18","p15","p06","p04","p07"],
    placements:["p02","p29","p01","p08","p18","p15","p06","p04","p07"],
    kills:{"p02":2,"p29":0,"p01":2,"p08":0,"p18":0,"p15":0,"p06":1,"p04":0,"p07":0}},

  {id:"s206",date:"2026-03-21",notes:"Lobby 206",
    winner:"p29",attendees:["p29","p15","p01","p04","p02","p18","p11","p06","p08"],
    placements:["p29","p15","p01","p04","p02","p18","p11","p06","p08"],
    kills:{"p29":2,"p15":0,"p01":2,"p04":2,"p02":0,"p18":0,"p11":0,"p06":1,"p08":0}},

  {id:"s207",date:"2026-03-21",notes:"Lobby 207",
    winner:"p04",attendees:["p04","p15","p02","p01","p18","p29","p11","p20"],
    placements:["p04","p15","p02","p01","p18","p29","p11","p20"],
    kills:{"p04":1,"p15":1,"p02":2,"p01":1,"p18":0,"p29":0,"p11":0,"p20":0}},

  {id:"s208",date:"2026-03-21",notes:"Lobby 208",
    winner:"p25",attendees:["p25","p29","p14","p15","p04","p11","p01","p18","p20","p02"],
    placements:["p25","p29","p14","p15","p04","p11","p01","p18","p20","p02"],
    kills:{"p25":1,"p29":2,"p14":2,"p15":0,"p04":0,"p11":2,"p01":0,"p18":0,"p20":0,"p02":0}},

  {id:"s209",date:"2026-03-21",notes:"Lobby 209",
    winner:"p29",attendees:["p29","p02","p15","p14","p01","p18","p20","p11","p04"],
    placements:["p29","p02","p15","p14","p01","p18","p20","p11","p04"],
    kills:{"p29":1,"p02":2,"p15":0,"p14":0,"p01":1,"p18":0,"p20":1,"p11":0,"p04":0}},

  {id:"s210",date:"2026-03-21",notes:"Lobby 210",
    winner:"p14",attendees:["p14","p20","p02","p01","p04","p11","p29"],
    placements:["p14","p20","p02","p01","p04","p11","p29"],
    kills:{"p14":2,"p20":0,"p02":1,"p01":1,"p04":1,"p11":0,"p29":0}},

  {id:"s211",date:"2026-03-21",notes:"Lobby 211",
    winner:"p02",attendees:["p02","p20","p04","p14","p01","p29","p18","p12"],
    placements:["p02","p20","p04","p14","p01","p29","p18","p12"],
    kills:{"p02":1,"p20":2,"p04":2,"p14":0,"p01":1,"p29":0,"p18":0,"p12":0}},

  {id:"s212",date:"2026-03-21",notes:"Lobby 212",
    winner:"p29",attendees:["p29","p02","p01","p20","p18","p04"],
    placements:["p29","p02","p01","p20","p18","p04"],
    kills:{"p29":1,"p02":1,"p01":2,"p20":0,"p18":0,"p04":0}},

  {id:"s213",date:"2026-03-21",notes:"Lobby 213",
    winner:"p02",attendees:["p02","p01","p29","p04","p18","p20"],
    placements:["p02","p01","p29","p04","p18","p20"],
    kills:{"p02":2,"p01":2,"p29":1,"p04":0,"p18":0,"p20":0}},

  {id:"s214",date:"2026-03-21",notes:"Lobby 214",
    winner:"p01",attendees:["p01","p29","p02","p04","p18"],
    placements:["p01","p29","p02","p04","p18"],
    kills:{"p01":4,"p29":0,"p02":0,"p04":0,"p18":0}},

  {id:"s215",date:"2026-03-23",notes:"Lobby 215",
    winner:"p02",attendees:["p02","p07","p04","p18","p01","p06"],
    placements:["p02","p07","p04","p18","p01","p06"],
    kills:{"p07":3,"p18":1}},
  {id:"s216",date:"2026-03-23",notes:"Lobby 216",
    winner:"p06",attendees:["p06","p01","p08","p02","p04","p09","p18","p07"],
    placements:["p06","p01","p08","p02","p04","p09","p18","p07"],
    kills:{"p06":2,"p01":2,"p08":1,"p02":1}},
  {id:"s217",date:"2026-03-23",notes:"Lobby 217",
    winner:"p01",attendees:["p01","p07","p02","p06","p18","p04","p09","p08","p05"],
    placements:["p01","p07","p02","p06","p18","p04","p09","p08","p05"],
    kills:{"p01":4,"p07":1,"p02":2}},
  {id:"s218",date:"2026-03-23",notes:"Lobby 218",
    winner:"p07",attendees:["p07","p02","p01","p18","p08","p05","p12","p06"],
    placements:["p07","p02","p01","p18","p08","p05","p12","p06"],
    kills:{"p07":2,"p02":2,"p01":2}},
  {id:"s219",date:"2026-03-23",notes:"Lobby 219",
    winner:"p01",attendees:["p01","p06","p08","p02","p18","p09","p07","p05","p17"],
    placements:["p01","p06","p08","p02","p18","p09","p07","p05","p17"],
    kills:{"p01":4,"p08":1,"p02":1}},
  {id:"s220",date:"2026-03-23",notes:"Lobby 220",
    winner:"p06",attendees:["p06","p02","p12","p01","p05","p18","p21","p08","p04","p17"],
    placements:["p06","p02","p12","p01","p05","p18","p21","p08","p04","p17"],
    kills:{"p06":1,"p12":1,"p01":3,"p05":1}},
  {id:"s221",date:"2026-03-23",notes:"Lobby 221",
    winner:"p06",attendees:["p06","p04","p08","p18","p02","p12","p05","p17","p01"],
    placements:["p06","p04","p08","p18","p02","p12","p05","p17","p01"],
    kills:{"p06":2,"p04":1,"p08":2,"p18":1,"p12":1}},
  {id:"s222",date:"2026-03-23",notes:"Lobby 222",
    winner:"p06",attendees:["p06","p05","p04","p02","p34","p12","p17","p18","p01"],
    placements:["p06","p05","p04","p02","p34","p12","p17","p18","p01"],
    kills:{"p06":3,"p05":2,"p12":1,"p17":1}},
  {id:"s223",date:"2026-03-23",notes:"Lobby 223",
    winner:"p04",attendees:["p04","p02","p34","p06","p12","p05","p01","p18"],
    placements:["p04","p02","p34","p06","p12","p05","p01","p18"],
    kills:{"p04":3,"p02":2,"p12":1,"p05":1}},
  {id:"s224",date:"2026-03-23",notes:"Lobby 224",
    winner:"p34",attendees:["p34","p05","p02","p18","p04","p12","p01"],
    placements:["p34","p05","p02","p18","p04","p12","p01"],
    kills:{"p34":2,"p05":1,"p02":1,"p18":1}},
  {id:"s225",date:"2026-03-23",notes:"Lobby 225",
    winner:"p34",attendees:["p34","p04","p01","p02","p18","p05"],
    placements:["p34","p04","p01","p02","p18","p05"],
    kills:{"p34":1,"p04":1,"p01":2,"p02":1}},
  {id:"s226",date:"2026-03-23",notes:"Lobby 226",
    winner:"p04",attendees:["p04","p34","p18","p02","p01","p21"],
    placements:["p04","p34","p18","p02","p01","p21"],
    kills:{"p04":2,"p02":1,"p01":1}},
  {id:"s227",date:"2026-03-23",notes:"Lobby 227",
    winner:"p01",attendees:["p01","p30","p14","p02","p04","p05","p18"],
    placements:["p01","p30","p14","p02","p04","p05","p18"],
    kills:{"p01":3,"p30":2,"p14":1}},
  {id:"s228",date:"2026-03-23",notes:"Lobby 228",
    winner:"p04",attendees:["p04","p01","p02","p14","p05","p18"],
    placements:["p04","p01","p02","p14","p05","p18"],
    kills:{"p04":1,"p01":1,"p02":1}},

  {id:"s229",date:"2026-03-24",notes:"Lobby 229",
    winner:"p01",attendees:["p01","p23","p02","p08","p10","p18"],
    placements:["p01","p23","p02","p08","p10","p18"],
    kills:{"p01":3,"p23":1,"p02":1}},

  {id:"s230",date:"2026-03-24",notes:"Lobby 230",
    winner:"p02",attendees:["p02","p08","p10","p01","p18","p03"],
    placements:["p02","p08","p10","p01","p18","p03"],
    kills:{"p02":1,"p08":1,"p01":2}},

  {id:"s231",date:"2026-03-24",notes:"Lobby 231",
    winner:"p12",attendees:["p12","p01","p03","p18","p08","p02"],
    placements:["p12","p01","p03","p18","p08","p02"],
    kills:{"p12":1,"p01":2}},

  {id:"s232",date:"2026-03-24",notes:"Lobby 232",
    winner:"p02",attendees:["p02","p03","p01","p18","p08","p12","p10"],
    placements:["p02","p03","p01","p18","p08","p12","p10"],
    kills:{"p02":2,"p03":1,"p01":1,"p08":1}},

  {id:"s233",date:"2026-03-24",notes:"Lobby 233",
    winner:"p08",attendees:["p08","p15","p16","p18","p01","p02","p07","p12","p03"],
    placements:["p08","p15","p16","p18","p01","p02","p07","p12","p03"],
    kills:{"p08":2,"p18":1,"p01":2,"p12":1}},

  {id:"s234",date:"2026-03-24",notes:"Lobby 234",
    winner:"p08",attendees:["p08","p16","p05","p10","p01","p04","p12","p02","p18","p07","p03"],
    placements:["p08","p16","p05","p10","p01","p04","p12","p02","p18","p07","p03"],
    kills:{"p08":1,"p16":2,"p10":2,"p01":1}},

  {id:"s235",date:"2026-03-24",notes:"Lobby 235",
    winner:"p16",attendees:["p16","p02","p08","p11","p01","p03","p05","p18","p12","p07","p10"],
    placements:["p16","p02","p08","p11","p01","p03","p05","p18","p12","p07","p10"],
    kills:{"p02":2,"p08":2,"p01":2,"p03":1}},

  {id:"s236",date:"2026-03-24",notes:"Lobby 236",
    winner:"p07",attendees:["p07","p02","p01","p04","p18","p11","p03","p12","p08","p05","p16"],
    placements:["p07","p02","p01","p04","p18","p11","p03","p12","p08","p05","p16"],
    kills:{"p07":2,"p01":4,"p04":1,"p12":1}},

  {id:"s237",date:"2026-03-24",notes:"Lobby 237",
    winner:"p07",attendees:["p07","p03","p02","p04","p14","p11","p18","p09","p01"],
    placements:["p07","p03","p02","p04","p14","p11","p18","p09","p01"],
    kills:{"p07":1,"p03":1,"p02":1,"p11":2}},

  {id:"s238",date:"2026-03-24",notes:"Lobby 238",
    winner:"p01",attendees:["p01","p05","p04","p03","p02","p11","p07"],
    placements:["p01","p05","p04","p03","p02","p11","p07"],
    kills:{"p01":3,"p05":2,"p02":1}},

  {id:"s239",date:"2026-03-24",notes:"Lobby 239",
    winner:"p07",attendees:["p07","p02","p01","p05","p04","p03","p18","p11"],
    placements:["p07","p02","p01","p05","p04","p03","p18","p11"],
    kills:{"p07":2,"p01":3,"p03":1}},

  {id:"s240",date:"2026-03-24",notes:"Lobby 240",
    winner:"p02",attendees:["p02","p04","p18","p07","p06","p01","p03","p11","p05"],
    placements:["p02","p04","p18","p07","p06","p01","p03","p11","p05"],
    kills:{"p02":2,"p04":1,"p18":1,"p01":1}},

  {id:"s241",date:"2026-03-24",notes:"Lobby 241",
    winner:"p07",attendees:["p07","p05","p03","p04","p30","p01","p18","p02"],
    placements:["p07","p05","p03","p04","p30","p01","p18","p02"],
    kills:{"p07":4,"p05":2,"p01":1}},

  {id:"s242",date:"2026-03-24",notes:"Lobby 242",
    winner:"p02",attendees:["p02","p07","p01","p04","p03","p18","p30"],
    placements:["p02","p07","p01","p04","p03","p18","p30"],
    kills:{"p07":2,"p01":3}},

  {id:"s243",date:"2026-03-24",notes:"Lobby 243",
    winner:"p30",attendees:["p30","p02","p04","p01"],
    placements:["p30","p02","p04","p01"],
    kills:{"p30":2}},

  {id:"s244",date:"2026-03-25",notes:"Lobby 244",
    winner:"p02",attendees:["p02","p01","p18","p31","p04","p03"],
    placements:["p02","p01","p18","p31","p04","p03"],
    kills:{"p02":1,"p01":2,"p18":1}},

  {id:"s245",date:"2026-03-25",notes:"Lobby 245",
    winner:"p02",attendees:["p02","p01","p03","p18","p04","p08","p06"],
    placements:["p02","p01","p03","p18","p04","p08","p06"],
    kills:{"p02":1,"p01":1,"p18":1,"p04":1,"p08":1}},

  {id:"s246",date:"2026-03-25",notes:"Lobby 246",
    winner:"p04",attendees:["p04","p06","p01","p18","p03","p02","p08"],
    placements:["p04","p06","p01","p18","p03","p02","p08"],
    kills:{"p04":1,"p06":1,"p01":1,"p18":1,"p03":1}},

  {id:"s247",date:"2026-03-25",notes:"Lobby 247",
    winner:"p02",attendees:["p02","p31","p18","p04","p09","p01","p08"],
    placements:["p02","p31","p18","p04","p09","p01","p08"],
    kills:{"p02":2,"p18":2,"p09":1,"p01":1}},

  {id:"s248",date:"2026-03-25",notes:"Lobby 248",
    winner:"p08",attendees:["p08","p01","p09","p06","p04","p12","p18","p31"],
    placements:["p08","p01","p09","p06","p04","p12","p18","p31"],
    kills:{"p08":2,"p01":2,"p09":1,"p18":1}},

  {id:"s249",date:"2026-03-25",notes:"Lobby 249",
    winner:"p01",attendees:["p01","p04","p31","p08","p06","p09","p02","p18","p03"],
    placements:["p01","p04","p31","p08","p06","p09","p02","p18","p03"],
    kills:{"p01":4,"p04":1,"p31":1}},

  {id:"s250",date:"2026-03-25",notes:"Lobby 250",
    winner:"p01",attendees:["p01","p02","p03","p06","p31","p18","p09","p08","p04"],
    placements:["p01","p02","p03","p06","p31","p18","p09","p08","p04"],
    kills:{"p01":2,"p02":2,"p03":2,"p06":2}},

  {id:"s251",date:"2026-03-25",notes:"Lobby 251",
    winner:"p04",attendees:["p04","p06","p02","p03","p18","p08","p01"],
    placements:["p04","p06","p02","p03","p18","p08","p01"],
    kills:{"p04":1,"p02":1}},

  {id:"s252",date:"2026-03-25",notes:"Lobby 252",
    winner:"p02",attendees:["p02","p14","p18","p04","p06","p01","p12","p03"],
    placements:["p02","p14","p18","p04","p06","p01","p12","p03"],
    kills:{"p02":4,"p01":1}},

  {id:"s253",date:"2026-03-25",notes:"Lobby 253",
    winner:"p02",attendees:["p02","p01","p34","p07","p09","p04","p05","p03","p18"],
    placements:["p02","p01","p34","p07","p09","p04","p05","p03","p18"],
    kills:{"p02":2,"p01":2,"p07":2}},

  {id:"s254",date:"2026-03-25",notes:"Lobby 254",
    winner:"p07",attendees:["p07","p12","p04","p02","p03","p05","p34","p18","p09","p01"],
    placements:["p07","p12","p04","p02","p03","p05","p34","p18","p09","p01"],
    kills:{"p07":6,"p02":2,"p05":1}},

  {id:"s255",date:"2026-03-25",notes:"Lobby 255",
    winner:"p30",attendees:["p30","p07","p01","p05","p02","p35","p18","p09","p34","p04"],
    placements:["p30","p07","p01","p05","p02","p35","p18","p09","p34","p04"],
    kills:{"p30":7,"p07":1,"p01":1}},

  {id:"s256",date:"2026-03-25",notes:"Lobby 256",
    winner:"p07",attendees:["p07","p34","p04","p30","p01","p14","p35","p18","p09","p02"],
    placements:["p07","p34","p04","p30","p01","p14","p35","p18","p09","p02"],
    kills:{"p07":2,"p34":2,"p30":1,"p01":2}},

  {id:"s257",date:"2026-03-25",notes:"Lobby 257",
    winner:"p07",attendees:["p07","p34","p05","p04","p18","p30","p02","p16","p01","p35","p06"],
    placements:["p07","p34","p05","p04","p18","p30","p02","p16","p01","p35","p06"],
    kills:{"p07":2,"p05":4,"p04":2,"p30":1}},

  {id:"s258",date:"2026-03-25",notes:"Lobby 258",
    winner:"p01",attendees:["p01","p14","p02","p05","p06","p34","p07","p16","p04"],
    placements:["p01","p14","p02","p05","p06","p34","p07","p16","p04"],
    kills:{"p01":1,"p14":4,"p02":1,"p05":1}},

  {id:"s259",date:"2026-03-26",notes:"Lobby 259",
    winner:"p02",attendees:["p02","p07","p01","p11","p14","p04","p18","p08"],
    placements:["p02","p07","p01","p11","p14","p04","p18","p08"],
    kills:{"p02":2,"p07":3,"p01":2}},

  {id:"s260",date:"2026-03-26",notes:"Lobby 260",
    winner:"p02",attendees:["p02","p11","p04","p09","p18","p12","p01","p07","p08"],
    placements:["p02","p11","p04","p09","p18","p12","p01","p07","p08"],
    kills:{"p02":3,"p11":3,"p01":1}},

  {id:"s261",date:"2026-03-26",notes:"Lobby 261",
    winner:"p07",attendees:["p07","p08","p11","p02","p01","p04","p09","p18"],
    placements:["p07","p08","p11","p02","p01","p04","p09","p18"],
    kills:{"p07":4,"p01":2}},

  {id:"s262",date:"2026-03-26",notes:"Lobby 262",
    winner:"p18",attendees:["p18","p02","p01","p08","p03","p12","p04","p11"],
    placements:["p18","p02","p01","p08","p03","p12","p04","p11"],
    kills:{"p18":1,"p02":1,"p01":1,"p12":2}},

  {id:"s263",date:"2026-03-26",notes:"Lobby 263",
    winner:"p07",attendees:["p07","p01","p11","p03","p04","p08","p02","p12","p18","p09"],
    placements:["p07","p01","p11","p03","p04","p08","p02","p12","p18","p09"],
    kills:{"p07":2,"p01":3,"p03":1,"p04":2}},

  {id:"s264",date:"2026-03-26",notes:"Lobby 264",
    winner:"p01",attendees:["p01","p07","p18","p03","p12","p02","p04","p11","p08","p16"],
    placements:["p01","p07","p18","p03","p12","p02","p04","p11","p08","p16"],
    kills:{"p01":6,"p07":1,"p18":1}},

  {id:"s265",date:"2026-03-26",notes:"Lobby 265",
    winner:"p11",attendees:["p11","p07","p06","p04","p01","p08","p12","p18","p03","p16","p02"],
    placements:["p11","p07","p06","p04","p01","p08","p12","p18","p03","p16","p02"],
    kills:{"p11":2,"p07":4,"p06":1,"p04":1,"p12":1}},

  {id:"s266",date:"2026-03-26",notes:"Lobby 266",
    winner:"p01",attendees:["p01","p07","p18","p11","p04","p03"],
    placements:["p01","p07","p18","p11","p04","p03"],
    kills:{"p01":4,"p07":1}},

  {id:"s267",date:"2026-03-26",notes:"Lobby 267",
    winner:"p07",attendees:["p07","p04","p01","p18","p08","p03","p11"],
    placements:["p07","p04","p01","p18","p08","p03","p11"],
    kills:{"p07":2,"p04":1,"p01":2}},

  {id:"s268",date:"2026-03-26",notes:"Lobby 268",
    winner:"p07",attendees:["p07","p14","p01","p04","p18","p02"],
    placements:["p07","p14","p01","p04","p18","p02"],
    kills:{"p07":2,"p14":3}},

  {id:"s269",date:"2026-03-26",notes:"Lobby 269",
    winner:"p14",attendees:["p14","p01","p02","p04","p07","p18"],
    placements:["p14","p01","p02","p04","p07","p18"],
    kills:{"p14":1,"p01":3,"p02":1}},

  {id:"s270",date:"2026-03-26",notes:"Lobby 270",
    winner:"p02",attendees:["p02","p04","p14","p07","p06","p18","p01"],
    placements:["p02","p04","p14","p07","p06","p18","p01"],
    kills:{"p02":3,"p14":2,"p06":1}},

  {id:"s271",date:"2026-03-26",notes:"Lobby 271",
    winner:"p15",attendees:["p15","p07","p01","p18","p02","p04","p14"],
    placements:["p15","p07","p01","p18","p02","p04","p14"],
    kills:{"p15":1,"p07":1,"p01":1,"p18":1,"p02":1}},

  {id:"s272",date:"2026-03-26",notes:"Lobby 272",
    winner:"p04",attendees:["p04","p07","p18","p05","p01","p02"],
    placements:["p04","p07","p18","p05","p01","p02"],
    kills:{"p04":1,"p07":1,"p18":2,"p01":1}},

  {id:"s273",date:"2026-03-27",notes:"Lobby 273",
    winner:"p02",attendees:["p02","p11","p01","p14","p04","p09","p08","p12"],
    placements:["p02","p11","p01","p14","p04","p09","p08","p12"],
    kills:{"p11":1,"p01":1,"p14":2}},

  {id:"s274",date:"2026-03-27",notes:"Lobby 274",
    winner:"p02",attendees:["p02","p30","p18","p14","p35","p08","p01","p09"],
    placements:["p02","p30","p18","p14","p35","p08","p01","p09"],
    kills:{"p02":1,"p30":2,"p18":1,"p14":3}},

  {id:"s275",date:"2026-03-27",notes:"Lobby 275",
    winner:"p14",attendees:["p14","p04","p02","p06","p09","p01","p08","p18"],
    placements:["p14","p04","p02","p06","p09","p01","p08","p18"],
    kills:{"p14":1,"p04":2,"p02":2,"p06":1}},

  {id:"s276",date:"2026-03-27",notes:"Lobby 276",
    winner:"p14",attendees:["p14","p05","p18","p02","p12","p09","p03","p08","p04","p11","p01"],
    placements:["p14","p05","p18","p02","p12","p09","p03","p08","p04","p11","p01"],
    kills:{"p14":1,"p05":4,"p18":1,"p02":2,"p12":1,"p09":1}},

  {id:"s277",date:"2026-03-27",notes:"Lobby 277",
    winner:"p02",attendees:["p02","p04","p14","p11","p01","p06","p05","p09","p18","p12","p08"],
    placements:["p02","p04","p14","p11","p01","p06","p05","p09","p18","p12","p08"],
    kills:{"p02":2,"p04":1,"p14":1,"p11":2,"p01":3}},

  {id:"s278",date:"2026-03-27",notes:"Lobby 278",
    winner:"p14",attendees:["p14","p02","p01","p06","p05","p08","p18","p04"],
    placements:["p14","p02","p01","p06","p05","p08","p18","p04"],
    kills:{"p14":5,"p02":1,"p01":1}},

  {id:"s279",date:"2026-03-27",notes:"Lobby 279",
    winner:"p14",attendees:["p14","p18","p03","p11","p02","p05","p04","p01","p08"],
    placements:["p14","p18","p03","p11","p02","p05","p04","p01","p08"],
    kills:{"p14":2,"p03":2,"p11":2,"p02":1,"p01":1}},

  {id:"s280",date:"2026-03-27",notes:"Lobby 280",
    winner:"p08",attendees:["p08","p04","p14","p01","p03","p02","p11","p18","p30","p05"],
    placements:["p08","p04","p14","p01","p03","p02","p11","p18","p30","p05"],
    kills:{"p08":1,"p04":1,"p01":1,"p02":3,"p11":1}},

  {id:"s281",date:"2026-03-27",notes:"Lobby 281",
    winner:"p07",attendees:["p07","p11","p18","p05","p04","p02","p14","p03","p01"],
    placements:["p07","p11","p18","p05","p04","p02","p14","p03","p01"],
    kills:{"p07":2,"p11":1,"p18":1,"p05":2}},

  {id:"s282",date:"2026-03-27",notes:"Lobby 282",
    winner:"p04",attendees:["p04","p02","p14","p11","p01","p07","p03","p18","p05","p09","p08"],
    placements:["p04","p02","p14","p11","p01","p07","p03","p18","p05","p09","p08"],
    kills:{"p04":3,"p02":2,"p14":1,"p01":2,"p07":1}},

  {id:"s283",date:"2026-03-27",notes:"Lobby 283",
    winner:"p02",attendees:["p02","p01","p03","p14","p04","p08","p06","p18","p11","p05"],
    placements:["p02","p01","p03","p14","p04","p08","p06","p18","p11","p05"],
    kills:{"p01":2,"p03":1,"p14":1,"p08":2,"p18":1}},

  {id:"s284",date:"2026-03-27",notes:"Lobby 284",
    winner:"p06",attendees:["p06","p04","p01","p03","p05","p07","p14","p18","p02","p11"],
    placements:["p06","p04","p01","p03","p05","p07","p14","p18","p02","p11"],
    kills:{"p06":2,"p04":2,"p01":2,"p05":1,"p07":1}},

  {id:"s285",date:"2026-03-27",notes:"Lobby 285",
    winner:"p14",attendees:["p14","p01","p15","p11","p06","p04","p03","p05","p07"],
    placements:["p14","p01","p15","p11","p06","p04","p03","p05","p07"],
    kills:{"p14":3,"p06":3}},

  {id:"s286",date:"2026-03-27",notes:"Lobby 286",
    winner:"p14",attendees:["p14","p04","p01","p02","p05"],
    placements:["p14","p04","p01","p02","p05"],
    kills:{"p14":1,"p04":1,"p01":2}},

  {id:"s287",date:"2026-03-27",notes:"Lobby 287",
    winner:"p14",attendees:["p14","p04","p02","p15","p01","p05","p18"],
    placements:["p14","p04","p02","p15","p01","p05","p18"],
    kills:{"p14":1,"p04":1,"p01":1}},

  // ── Sat 28 Mar 2026 — 15 lobbies ──
  {id:"s288",date:"2026-03-28",notes:"Lobby 288",
    winner:"p02",attendees:["p02","p06","p14","p08","p09","p18","p29","p01"],
    placements:["p02","p06","p14","p08","p09","p18","p29","p01"],
    kills:{"p02":1,"p06":3,"p14":1}},

  {id:"s289",date:"2026-03-28",notes:"Lobby 289",
    winner:"p02",attendees:["p02","p29","p04","p01","p06","p08","p14","p09","p05","p18"],
    placements:["p02","p29","p04","p01","p06","p08","p14","p09","p05","p18"],
    kills:{"p02":3,"p29":2,"p04":1,"p14":1,"p05":1}},

  {id:"s290",date:"2026-03-28",notes:"Lobby 290",
    winner:"p29",attendees:["p29","p01","p08","p14","p04","p02","p18","p06","p05","p09"],
    placements:["p29","p01","p08","p14","p04","p02","p18","p06","p05","p09"],
    kills:{"p29":4,"p01":2,"p02":1,"p06":1}},

  {id:"s291",date:"2026-03-28",notes:"Lobby 291",
    winner:"p29",attendees:["p29","p14","p01","p04","p02","p05","p07","p18"],
    placements:["p29","p14","p01","p04","p02","p05","p07","p18"],
    kills:{"p01":3,"p02":1}},

  {id:"s292",date:"2026-03-28",notes:"Lobby 292",
    winner:"p02",attendees:["p02","p04","p30","p29","p01","p08","p07","p05","p17","p06","p14"],
    placements:["p02","p04","p30","p29","p01","p08","p07","p05","p17","p06","p14"],
    kills:{"p02":2,"p04":1,"p30":1,"p05":1}},

  {id:"s293",date:"2026-03-28",notes:"Lobby 293",
    winner:"p29",attendees:["p29","p30","p05","p14","p18","p01","p04","p06","p02","p08"],
    placements:["p29","p30","p05","p14","p18","p01","p04","p06","p02","p08"],
    kills:{"p29":3,"p30":3,"p05":1,"p14":1,"p04":1}},

  {id:"s294",date:"2026-03-28",notes:"Lobby 294",
    winner:"p04",attendees:["p04","p07","p29","p01","p02","p05","p14","p18","p09","p03"],
    placements:["p04","p07","p29","p01","p02","p05","p14","p18","p09","p03"],
    kills:{"p04":2,"p07":2,"p01":3,"p14":1}},

  {id:"s295",date:"2026-03-28",notes:"Lobby 295",
    winner:"p29",attendees:["p29","p01","p07","p02","p05","p18","p04","p03","p06"],
    placements:["p29","p01","p07","p02","p05","p18","p04","p03","p06"],
    kills:{"p29":1,"p01":2,"p07":1,"p02":1,"p03":1}},

  {id:"s296",date:"2026-03-28",notes:"Lobby 296",
    winner:"p07",attendees:["p07","p03","p01","p04","p18","p29","p02","p14","p11"],
    placements:["p07","p03","p01","p04","p18","p29","p02","p14","p11"],
    kills:{"p01":1,"p04":3}},

  {id:"s297",date:"2026-03-28",notes:"Lobby 297",
    winner:"p29",attendees:["p29","p02","p04","p07","p01","p18"],
    placements:["p29","p02","p04","p07","p01","p18"],
    kills:{"p29":1,"p04":1,"p07":1,"p01":1}},

  {id:"s298",date:"2026-03-28",notes:"Lobby 298",
    winner:"p29",attendees:["p29","p02","p25","p01","p07","p35","p04"],
    placements:["p29","p02","p25","p01","p07","p35","p04"],
    kills:{"p29":1,"p02":1,"p01":2}},

  {id:"s299",date:"2026-03-28",notes:"Lobby 299",
    winner:"p25",attendees:["p25","p02","p29","p01","p04"],
    placements:["p25","p02","p29","p01","p04"],
    kills:{"p25":1,"p02":3}},

  {id:"s300",date:"2026-03-28",notes:"Lobby 300",
    winner:"p29",attendees:["p29","p04","p07","p01","p02"],
    placements:["p29","p04","p07","p01","p02"],
    kills:{"p29":1,"p07":2}},

  {id:"s301",date:"2026-03-28",notes:"Lobby 301",
    winner:"p02",attendees:["p02","p04","p29","p01","p07"],
    placements:["p02","p04","p29","p01","p07"],
    kills:{"p02":2,"p01":1}},

  {id:"s302",date:"2026-03-28",notes:"Lobby 302",
    winner:"p01",attendees:["p01","p29","p02","p04"],
    placements:["p01","p29","p02","p04"],
    kills:{"p01":2,"p29":1}},

  // ── Mon 30 Mar 2026 — 16 lobbies ──
  {id:"s303",date:"2026-03-30",notes:"Lobby 303",
    winner:"p02",attendees:["p02","p30","p11","p08","p36","p07","p04","p01"],
    placements:["p02","p30","p11","p08","p36","p07","p04","p01"],
    kills:{"p02":2,"p30":4,"p36":1}},

  {id:"s304",date:"2026-03-30",notes:"Lobby 304",
    winner:"p30",attendees:["p30","p08","p04","p01","p07","p14","p11","p02","p36"],
    placements:["p30","p08","p04","p01","p07","p14","p11","p02","p36"],
    kills:{"p30":5,"p01":3}},

  {id:"s305",date:"2026-03-30",notes:"Lobby 305",
    winner:"p01",attendees:["p01","p08","p14","p36","p11","p02","p04","p07","p18"],
    placements:["p01","p08","p14","p36","p11","p02","p04","p07","p18"],
    kills:{"p01":4,"p14":1,"p11":1,"p04":1}},

  {id:"s306",date:"2026-03-30",notes:"Lobby 306",
    winner:"p11",attendees:["p11","p02","p18","p01","p08","p14","p07","p36"],
    placements:["p11","p02","p18","p01","p08","p14","p07","p36"],
    kills:{"p18":2,"p01":1,"p14":1,"p07":1}},

  {id:"s307",date:"2026-03-30",notes:"Lobby 307",
    winner:"p02",attendees:["p02","p04","p01","p06","p08","p07","p36","p11"],
    placements:["p02","p04","p01","p06","p08","p07","p36","p11"],
    kills:{"p02":1,"p04":2,"p01":2,"p06":1}},

  {id:"s308",date:"2026-03-30",notes:"Lobby 308",
    winner:"p01",attendees:["p01","p04","p14","p11","p02","p36","p08","p18","p06"],
    placements:["p01","p04","p14","p11","p02","p36","p08","p18","p06"],
    kills:{"p01":5,"p14":1,"p02":1}},

  {id:"s309",date:"2026-03-30",notes:"Lobby 309",
    winner:"p02",attendees:["p02","p14","p11","p01","p04","p36","p18","p03"],
    placements:["p02","p14","p11","p01","p04","p36","p18","p03"],
    kills:{"p02":1,"p01":2,"p36":1}},

  {id:"s310",date:"2026-03-30",notes:"Lobby 310",
    winner:"p02",attendees:["p02","p04","p14","p01","p03","p18","p36"],
    placements:["p02","p04","p14","p01","p03","p18","p36"],
    kills:{"p02":3,"p04":1,"p14":1,"p01":1}},

  {id:"s311",date:"2026-03-30",notes:"Lobby 311",
    winner:"p02",attendees:["p02","p01","p14","p04","p18"],
    placements:["p02","p01","p14","p04","p18"],
    kills:{"p02":1,"p01":1,"p04":1,"p18":1}},

  {id:"s312",date:"2026-03-30",notes:"Lobby 312",
    winner:"p02",attendees:["p02","p04","p14","p03","p01","p05","p34","p18"],
    placements:["p02","p04","p14","p03","p01","p05","p34","p18"],
    kills:{"p02":2,"p04":1,"p14":1,"p03":1}},

  {id:"s313",date:"2026-03-30",notes:"Lobby 313",
    winner:"p01",attendees:["p01","p02","p03","p14","p05","p18","p11"],
    placements:["p01","p02","p03","p14","p05","p18","p11"],
    kills:{"p01":1,"p02":1,"p03":1,"p14":1}},

  {id:"s314",date:"2026-03-30",notes:"Lobby 314",
    winner:"p04",attendees:["p04","p03","p05","p01","p11","p02","p18"],
    placements:["p04","p03","p05","p01","p11","p02","p18"],
    kills:{"p04":1,"p01":2,"p11":1}},

  {id:"s315",date:"2026-03-30",notes:"Lobby 315",
    winner:"p04",attendees:["p04","p02","p11","p03","p18","p05","p01"],
    placements:["p04","p02","p11","p03","p18","p05","p01"],
    kills:{"p04":2,"p02":1,"p11":2,"p18":1}},

  {id:"s316",date:"2026-03-30",notes:"Lobby 316",
    winner:"p01",attendees:["p01","p11","p03","p04","p02","p18"],
    placements:["p01","p11","p03","p04","p02","p18"],
    kills:{"p01":2,"p11":1,"p03":1}},

  {id:"s317",date:"2026-03-30",notes:"Lobby 317",
    winner:"p02",attendees:["p02","p01","p03","p04","p21","p18","p11"],
    placements:["p02","p01","p03","p04","p21","p18","p11"],
    kills:{"p02":2,"p01":3}},

  {id:"s318",date:"2026-03-30",notes:"Lobby 318",
    winner:"p11",attendees:["p11","p04","p01","p02"],
    placements:["p11","p04","p01","p02"],
    kills:{"p11":1,"p01":1}},

  // ── Tue 31 Mar 2026 — 15 lobbies (Season 1 final day) ──
  {id:"s319",date:"2026-03-31",notes:"Lobby 319",
    winner:"p01",attendees:["p01","p14","p07","p02","p05","p08","p18","p06"],
    placements:["p01","p14","p07","p02","p05","p08","p18","p06"],
    kills:{"p01":4,"p14":1,"p07":2}},

  {id:"s320",date:"2026-03-31",notes:"Lobby 320",
    winner:"p07",attendees:["p07","p04","p03","p01","p02","p11","p18","p05","p14","p08"],
    placements:["p07","p04","p03","p01","p02","p11","p18","p05","p14","p08"],
    kills:{"p07":2,"p03":1,"p01":1,"p02":1,"p18":1,"p14":1}},

  {id:"s321",date:"2026-03-31",notes:"Lobby 321",
    winner:"p13",attendees:["p13","p14","p06","p11","p04","p02","p03","p07","p18","p01","p08","p05"],
    placements:["p13","p14","p06","p11","p04","p02","p03","p07","p18","p01","p08","p05"],
    kills:{"p13":2,"p14":2,"p06":1,"p11":2,"p04":1,"p02":0,"p03":0,"p07":0,"p18":0,"p01":0,"p08":0,"p05":0}},

  {id:"s322",date:"2026-03-31",notes:"Lobby 322",
    winner:"p07",attendees:["p07","p02","p11","p01","p13","p04","p14","p18","p03","p05","p06"],
    placements:["p07","p02","p11","p01","p13","p04","p14","p18","p03","p05","p06"],
    kills:{"p07":3,"p02":2,"p01":2,"p13":1,"p14":1}},

  {id:"s323",date:"2026-03-31",notes:"Lobby 323",
    winner:"p02",attendees:["p02","p01","p03","p07","p15","p08","p18","p13","p04","p14","p05","p11"],
    placements:["p02","p01","p03","p07","p15","p08","p18","p13","p04","p14","p05","p11"],
    kills:{"p02":3,"p01":5,"p03":1,"p08":1,"p13":1,"p04":0}},

  {id:"s324",date:"2026-03-31",notes:"Lobby 324",
    winner:"p02",attendees:["p02","p15","p14","p11","p01","p18","p07","p04","p03","p08","p13","p05"],
    placements:["p02","p15","p14","p11","p01","p18","p07","p04","p03","p08","p13","p05"],
    kills:{"p02":1,"p15":1,"p14":4,"p01":3,"p08":1,"p13":0}},

  {id:"s325",date:"2026-03-31",notes:"Lobby 325",
    winner:"p07",attendees:["p07","p04","p02","p03","p08","p01","p15","p14","p05","p09"],
    placements:["p07","p04","p02","p03","p08","p01","p15","p14","p05","p09"],
    kills:{"p07":3,"p04":1,"p02":1,"p03":1,"p01":1}},

  {id:"s326",date:"2026-03-31",notes:"Lobby 326",
    winner:"p07",attendees:["p07","p01","p02","p11","p04","p03","p18","p05","p35","p14"],
    placements:["p07","p01","p02","p11","p04","p03","p18","p05","p35","p14"],
    kills:{"p07":2,"p01":3,"p02":0,"p11":0,"p04":0,"p18":1,"p35":0}},

  {id:"s327",date:"2026-03-31",notes:"Lobby 327",
    winner:"p02",attendees:["p02","p07","p11","p01","p03","p14","p04","p18"],
    placements:["p02","p07","p11","p01","p03","p14","p04","p18"],
    kills:{"p02":1,"p07":1,"p01":0,"p14":1,"p18":1}},

  {id:"s328",date:"2026-03-31",notes:"Lobby 328",
    winner:"p02",attendees:["p02","p07","p14","p06","p11","p01","p04","p03","p18"],
    placements:["p02","p07","p14","p06","p11","p01","p04","p03","p18"],
    kills:{"p02":3,"p07":1,"p14":0,"p06":0,"p01":0,"p04":0}},

  {id:"s329",date:"2026-03-31",notes:"Lobby 329",
    winner:"p02",attendees:["p02","p07","p03","p14","p01","p06","p05","p18"],
    placements:["p02","p07","p03","p14","p01","p06","p05","p18"],
    kills:{"p02":1,"p07":1,"p01":2,"p06":1}},

  {id:"s330",date:"2026-03-31",notes:"Lobby 330",
    winner:"p04",attendees:["p04","p07","p14","p01","p11","p02","p03","p18"],
    placements:["p04","p07","p14","p01","p11","p02","p03","p18"],
    kills:{"p04":1,"p07":3,"p14":0,"p01":1,"p02":0}},

  {id:"s331",date:"2026-03-31",notes:"Lobby 331",
    winner:"p07",attendees:["p07","p02","p14","p01","p04","p18","p14"],
    placements:["p07","p02","p14","p01","p04","p18"],
    kills:{"p07":2,"p02":1,"p01":0,"p04":0}},

  {id:"s332",date:"2026-03-31",notes:"Lobby 332",
    winner:"p07",attendees:["p07","p02","p14","p18","p01","p04"],
    placements:["p07","p02","p14","p18","p01","p04"],
    kills:{"p07":2,"p02":1,"p01":0}},

  {id:"s333",date:"2026-03-31",notes:"Lobby 333",
    winner:"p01",attendees:["p01","p07","p02","p14","p18","p04"],
    placements:["p01","p07","p02","p14","p18","p04"],
    kills:{"p01":1,"p07":1,"p02":0,"p14":2}},

  // ── Wed 1 Apr 2026 — Season 2 Opening Night · 16 lobbies ──
  {id:"s334",date:"2026-04-01",notes:"Lobby 334",
    winner:"p11",attendees:["p11","p06","p04","p13","p01","p02","p18"],
    placements:["p11","p06","p04","p13","p01","p02","p18"],
    kills:{"p11":1,"p06":2,"p13":1,"p01":2}},

  {id:"s335",date:"2026-04-01",notes:"Lobby 335",
    winner:"p02",attendees:["p02","p14","p11","p08","p01","p07","p06","p18","p09"],
    placements:["p02","p14","p11","p08","p01","p07","p06","p18","p09"],
    kills:{"p02":3,"p14":1,"p01":3,"p07":1}},

  {id:"s336",date:"2026-04-01",notes:"Lobby 336",
    winner:"p02",attendees:["p02","p01","p14","p07","p11","p06","p15","p18","p09"],
    placements:["p02","p01","p14","p07","p11","p06","p15","p18","p09"],
    kills:{"p02":3,"p14":2,"p07":2}},

  {id:"s337",date:"2026-04-01",notes:"Lobby 337",
    winner:"p02",attendees:["p02","p04","p07","p14","p08","p09","p18","p01","p11"],
    placements:["p02","p04","p07","p14","p08","p09","p18","p01","p11"],
    kills:{"p02":4,"p04":2,"p14":1,"p09":1}},

  {id:"s338",date:"2026-04-01",notes:"Lobby 338",
    winner:"p01",attendees:["p01","p02","p07","p04","p14","p18","p08","p09","p06"],
    placements:["p01","p02","p07","p04","p14","p18","p08","p09","p06"],
    kills:{"p01":5,"p07":1}},

  {id:"s339",date:"2026-04-01",notes:"Lobby 339",
    winner:"p02",attendees:["p02","p01","p14","p03","p07","p18","p08","p04","p05"],
    placements:["p02","p01","p14","p03","p07","p18","p08","p04","p05"],
    kills:{"p02":2,"p01":2,"p14":2,"p03":1,"p08":1}},

  {id:"s340",date:"2026-04-01",notes:"Lobby 340",
    winner:"p14",attendees:["p14","p08","p07","p03","p04","p02","p05","p18","p01"],
    placements:["p14","p08","p07","p03","p04","p02","p05","p18","p01"],
    kills:{"p14":3,"p07":2,"p03":1,"p02":1}},

  {id:"s341",date:"2026-04-01",notes:"Lobby 341",
    winner:"p08",attendees:["p08","p02","p11","p07","p01","p14","p04","p03","p18","p05"],
    placements:["p08","p02","p11","p07","p01","p14","p04","p03","p18","p05"],
    kills:{"p08":1,"p02":1,"p11":3,"p01":2,"p04":1}},

  {id:"s342",date:"2026-04-01",notes:"Lobby 342",
    winner:"p18",attendees:["p18","p11","p04","p07","p08","p01","p14","p05","p02"],
    placements:["p18","p11","p04","p07","p08","p01","p14","p05","p02"],
    kills:{"p18":3,"p11":1,"p07":1,"p01":2}},

  {id:"s343",date:"2026-04-01",notes:"Lobby 343",
    winner:"p07",attendees:["p07","p14","p01","p03","p31","p18","p02","p08","p05","p11"],
    placements:["p07","p14","p01","p03","p31","p18","p02","p08","p05","p11"],
    kills:{"p07":4,"p14":1,"p01":2,"p18":1,"p02":1}},

  {id:"s344",date:"2026-04-01",notes:"Lobby 344",
    winner:"p02",attendees:["p02","p07","p04","p08","p11","p05","p09","p14","p18","p01"],
    placements:["p02","p07","p04","p08","p11","p05","p09","p14","p18","p01"],
    kills:{"p02":3,"p04":1,"p09":1}},

  {id:"s345",date:"2026-04-01",notes:"Lobby 345",
    winner:"p01",attendees:["p01","p11","p08","p04","p03","p14","p18","p05","p09","p02","p31"],
    placements:["p01","p11","p08","p04","p03","p14","p18","p05","p09","p02","p31"],
    kills:{"p01":4,"p11":1,"p04":1,"p03":1,"p14":1,"p05":1}},

  {id:"s346",date:"2026-04-01",notes:"Lobby 346",
    winner:"p14",attendees:["p14","p11","p31","p04","p02","p01","p18","p05","p09","p03"],
    placements:["p14","p11","p31","p04","p02","p01","p18","p05","p09","p03"],
    kills:{"p14":3,"p04":1,"p02":2,"p01":2}},

  {id:"s347",date:"2026-04-01",notes:"Lobby 347",
    winner:"p02",attendees:["p02","p01","p14","p04","p13","p31","p03","p18","p11"],
    placements:["p02","p01","p14","p04","p13","p31","p03","p18","p11"],
    kills:{"p01":2,"p14":2,"p13":2}},

  {id:"s348",date:"2026-04-01",notes:"Lobby 348",
    winner:"p14",attendees:["p14","p13","p02","p01","p03","p04","p18"],
    placements:["p14","p13","p02","p01","p03","p04","p18"],
    kills:{"p14":3,"p13":1,"p02":1}},

  {id:"s349",date:"2026-04-01",notes:"Lobby 349",
    winner:"p18",attendees:["p18","p11","p14","p04","p13","p20","p02","p01"],
    placements:["p18","p11","p14","p04","p13","p20","p02","p01"],
    kills:{"p18":2,"p11":2,"p13":1}},

  // ── Thu 2 Apr 2026 — Good Friday Eve · 15 lobbies ──
  {id:"s350",date:"2026-04-02",notes:"Lobby 350",
    winner:"p04",attendees:["p04","p07","p02","p01","p11","p18","p09","p24"],
    placements:["p04","p07","p02","p01","p11","p18","p09","p24"],
    kills:{"p04":2,"p07":1,"p01":2,"p11":1}},

  {id:"s351",date:"2026-04-02",notes:"Lobby 351",
    winner:"p08",attendees:["p08","p07","p02","p13","p14","p24","p04","p11","p18","p01","p09"],
    placements:["p08","p07","p02","p13","p14","p24","p04","p11","p18","p01","p09"],
    kills:{"p08":2,"p07":4,"p02":1,"p14":2}},

  {id:"s352",date:"2026-04-02",notes:"Lobby 352",
    winner:"p07",attendees:["p07","p30","p13","p14","p08","p18","p24","p20","p04","p01","p02","p11","p09"],
    placements:["p07","p30","p13","p14","p08","p18","p24","p20","p04","p01","p02","p11","p09"],
    kills:{"p07":4,"p30":3,"p13":1,"p20":2,"p01":1}},

  {id:"s353",date:"2026-04-02",notes:"Lobby 353",
    winner:"p08",attendees:["p08","p07","p20","p01","p09","p14","p11","p24","p02","p18","p04","p13"],
    placements:["p08","p07","p20","p01","p09","p14","p11","p24","p02","p18","p04","p13"],
    kills:{"p08":2,"p07":1,"p20":1,"p01":2,"p14":2,"p11":1}},

  {id:"s354",date:"2026-04-02",notes:"Lobby 354",
    winner:"p04",attendees:["p04","p18","p07","p01","p03","p24","p13","p20","p05","p02","p08","p11","p14","p30"],
    placements:["p04","p18","p07","p01","p03","p24","p13","p20","p05","p02","p08","p11","p14","p30"],
    kills:{"p04":4,"p18":1,"p07":3,"p01":1,"p24":1}},

  {id:"s355",date:"2026-04-02",notes:"Lobby 355",
    winner:"p30",attendees:["p30","p02","p11","p05","p18","p07","p04","p03","p01","p20","p08","p14"],
    placements:["p30","p02","p11","p05","p18","p07","p04","p03","p01","p20","p08","p14"],
    kills:{"p30":3,"p02":3,"p11":3,"p18":1,"p03":1}},

  {id:"s356",date:"2026-04-02",notes:"Lobby 356",
    winner:"p05",attendees:["p05","p01","p07","p02","p30","p08","p18","p04","p14","p11","p03"],
    placements:["p05","p01","p07","p02","p30","p08","p18","p04","p14","p11","p03"],
    kills:{"p05":4,"p01":3,"p07":1,"p02":1,"p30":1}},

  {id:"s357",date:"2026-04-02",notes:"Lobby 357",
    winner:"p04",attendees:["p04","p01","p02","p14","p07","p08","p11","p05","p18"],
    placements:["p04","p01","p02","p14","p07","p08","p11","p05","p18"],
    kills:{"p04":6,"p01":4,"p14":3}},

  {id:"s358",date:"2026-04-02",notes:"Lobby 358",
    winner:"p02",attendees:["p02","p08","p07","p01","p03","p20","p18","p05","p04"],
    placements:["p02","p08","p07","p01","p03","p20","p18","p05","p04"],
    kills:{"p02":1,"p01":1,"p03":1,"p05":1}},

  {id:"s359",date:"2026-04-02",notes:"Lobby 359",
    winner:"p02",attendees:["p02","p04","p18","p11","p14","p01","p08","p20"],
    placements:["p02","p04","p18","p11","p14","p01","p08","p20"],
    kills:{"p02":5,"p04":1,"p08":1}},

  {id:"s360",date:"2026-04-02",notes:"Lobby 360",
    winner:"p14",attendees:["p14","p20","p02","p30","p01","p04","p08"],
    placements:["p14","p20","p02","p30","p01","p04","p08"],
    kills:{"p14":2,"p20":1,"p30":2}},

  {id:"s361",date:"2026-04-02",notes:"Lobby 361",
    winner:"p14",attendees:["p14","p01","p30","p20","p18","p02"],
    placements:["p14","p01","p30","p20","p18","p02"],
    kills:{"p14":1,"p01":3}},

  {id:"s362",date:"2026-04-02",notes:"Lobby 362",
    winner:"p14",attendees:["p14","p08","p02","p11","p01","p20","p30","p18"],
    placements:["p14","p08","p02","p11","p01","p20","p30","p18"],
    kills:{"p14":1,"p02":2,"p11":2,"p01":2}},

  {id:"s363",date:"2026-04-02",notes:"Lobby 363",
    winner:"p14",attendees:["p14","p02","p20","p04","p01","p11","p18","p08"],
    placements:["p14","p02","p20","p04","p01","p11","p18","p08"],
    kills:{"p14":3,"p20":1,"p04":1,"p01":2}},

  {id:"s364",date:"2026-04-02",notes:"Lobby 364",
    winner:"p01",attendees:["p01","p14","p30","p20","p02","p08","p11","p18"],
    placements:["p01","p14","p30","p20","p02","p08","p11","p18"],
    kills:{"p01":2,"p14":1,"p30":2,"p02":1}},

  // ── Fri 3 Apr 2026 — Good Friday · 14 lobbies ──
  {id:"s365",date:"2026-04-03",notes:"Lobby 365",
    winner:"p29",attendees:["p29","p15","p04","p02","p18","p13","p08","p14","p37","p01"],
    placements:["p29","p15","p04","p02","p18","p13","p08","p14","p37","p01"],
    kills:{"p29":4,"p15":1,"p13":2,"p14":1}},

  {id:"s366",date:"2026-04-03",notes:"Lobby 366",
    winner:"p02",attendees:["p02","p01","p29","p13","p18","p12","p04","p14","p15"],
    placements:["p02","p01","p29","p13","p18","p12","p04","p14","p15"],
    kills:{"p02":3,"p01":2,"p13":1}},

  {id:"s367",date:"2026-04-03",notes:"Lobby 367",
    winner:"p02",attendees:["p02","p13","p08","p01","p15","p04","p11","p29","p18","p17","p12","p14"],
    placements:["p02","p13","p08","p01","p15","p04","p11","p29","p18","p17","p12","p14"],
    kills:{"p02":2,"p13":2,"p01":5}},

  {id:"s368",date:"2026-04-03",notes:"Lobby 368",
    winner:"p29",attendees:["p29","p14","p03","p02","p16","p15","p08","p17","p18","p13","p11","p12","p01"],
    placements:["p29","p14","p03","p02","p16","p15","p08","p17","p18","p13","p11","p12","p01"],
    kills:{"p29":2,"p14":3,"p03":2,"p17":1,"p18":1,"p13":2}},

  {id:"s369",date:"2026-04-03",notes:"Lobby 369",
    winner:"p29",attendees:["p29","p08","p01","p16","p04","p11","p15","p13","p02","p03","p21","p14","p18"],
    placements:["p29","p08","p01","p16","p04","p11","p15","p13","p02","p03","p21","p14","p18"],
    kills:{"p29":2,"p08":1,"p01":3,"p04":3,"p15":1,"p13":1}},

  {id:"s370",date:"2026-04-03",notes:"Lobby 370",
    winner:"p13",attendees:["p13","p29","p11","p04","p01","p03","p16","p02","p10","p08","p14","p18"],
    placements:["p13","p29","p11","p04","p01","p03","p16","p02","p10","p08","p14","p18"],
    kills:{"p13":2,"p29":3,"p04":0,"p01":2,"p16":1,"p10":1}},

  {id:"s371",date:"2026-04-03",notes:"Lobby 371",
    winner:"p29",attendees:["p29","p18","p02","p13","p04","p14","p01","p03","p11"],
    placements:["p29","p18","p02","p13","p04","p14","p01","p03","p11"],
    kills:{"p29":1,"p18":1,"p13":2,"p14":1}},

  {id:"s372",date:"2026-04-03",notes:"Lobby 372",
    winner:"p04",attendees:["p04","p29","p18","p16","p02","p11","p14","p03","p01"],
    placements:["p04","p29","p18","p16","p02","p11","p14","p03","p01"],
    kills:{"p04":3,"p18":1,"p16":1,"p11":1,"p14":1}},

  {id:"s373",date:"2026-04-03",notes:"Lobby 373",
    winner:"p01",attendees:["p01","p30","p04","p18","p03","p14","p15","p29","p02","p11","p16","p08","p09"],
    placements:["p01","p30","p04","p18","p03","p14","p15","p29","p02","p11","p16","p08","p09"],
    kills:{"p01":1,"p30":4,"p04":1,"p18":1,"p03":1,"p14":1}},

  {id:"s374",date:"2026-04-03",notes:"Lobby 374",
    winner:"p02",attendees:["p02","p15","p16","p08","p14","p01","p11","p04","p03","p18"],
    placements:["p02","p15","p16","p08","p14","p01","p11","p04","p03","p18"],
    kills:{"p02":2,"p15":1,"p16":3}},

  {id:"s375",date:"2026-04-03",notes:"Lobby 375",
    winner:"p05",attendees:["p05","p29","p04","p02","p18","p11","p14","p01","p30","p16"],
    placements:["p05","p29","p04","p02","p18","p11","p14","p01","p30","p16"],
    kills:{"p05":4,"p29":2,"p04":1,"p30":0}},

  {id:"s376",date:"2026-04-03",notes:"Lobby 376",
    winner:"p04",attendees:["p04","p05","p29","p01","p15","p02","p11","p18"],
    placements:["p04","p05","p29","p01","p15","p02","p11","p18"],
    kills:{"p04":1,"p05":3,"p29":2,"p15":0,"p02":0}},

  {id:"s377",date:"2026-04-03",notes:"Lobby 377",
    winner:"p15",attendees:["p15","p01","p29","p02","p05","p18","p30","p04"],
    placements:["p15","p01","p29","p02","p05","p18","p30","p04"],
    kills:{"p15":1,"p01":3,"p29":2,"p05":1}},

  {id:"s378",date:"2026-04-03",notes:"Lobby 378",
    winner:"p15",attendees:["p15","p29","p04","p01","p05","p30","p02","p18"],
    placements:["p15","p29","p04","p01","p05","p30","p02","p18"],
    kills:{"p15":1,"p29":0,"p04":1,"p01":4,"p05":1}},

  // ── Sat 4 Apr 2026 — Easter Saturday · 16 lobbies ──
  {id:"s379",date:"2026-04-04",notes:"Easter Saturday · Lobby 1",
    winner:"p02",attendees:["p02","p18","p30","p04","p01","p03","p14"],
    placements:["p02","p18","p30","p04","p01","p03","p14"],
    kills:{"p02":2,"p30":2}},

  {id:"s380",date:"2026-04-04",notes:"Easter Saturday · Lobby 2",
    winner:"p04",attendees:["p04","p02","p30","p14","p01","p18","p08"],
    placements:["p04","p02","p30","p14","p01","p18","p08"],
    kills:{"p04":1,"p02":2,"p30":1,"p01":2}},

  {id:"s381",date:"2026-04-04",notes:"Easter Saturday · Lobby 3",
    winner:"p08",attendees:["p08","p14","p01","p30","p04","p02","p03","p18"],
    placements:["p08","p14","p01","p30","p04","p02","p03","p18"],
    kills:{"p08":3,"p30":2,"p04":1}},

  {id:"s382",date:"2026-04-04",notes:"Easter Saturday · Lobby 4",
    winner:"p01",attendees:["p01","p30","p02","p04","p14","p21","p03","p18","p08"],
    placements:["p01","p30","p02","p04","p14","p21","p03","p18","p08"],
    kills:{"p01":4,"p30":2,"p02":1,"p21":1}},

  {id:"s383",date:"2026-04-04",notes:"Easter Saturday · Lobby 5",
    winner:"p30",attendees:["p30","p21","p01","p02","p14","p18","p08","p04"],
    placements:["p30","p21","p01","p02","p14","p18","p08","p04"],
    kills:{"p30":4,"p01":1,"p02":1}},

  {id:"s384",date:"2026-04-04",notes:"Easter Saturday · Lobby 6",
    winner:"p27",attendees:["p27","p08","p14","p04","p02","p01","p18"],
    placements:["p27","p08","p14","p04","p02","p01","p18"],
    kills:{"p27":3,"p14":3}},

  {id:"s385",date:"2026-04-04",notes:"Easter Saturday · Lobby 7",
    winner:"p01",attendees:["p01","p27","p02","p18","p14","p21","p04"],
    placements:["p01","p27","p02","p18","p14","p21","p04"],
    kills:{"p01":2,"p02":2,"p27":1}},

  {id:"s386",date:"2026-04-04",notes:"Easter Saturday · Lobby 8",
    winner:"p01",attendees:["p01","p14","p02","p27","p05","p30","p04","p18"],
    placements:["p01","p14","p02","p27","p05","p30","p04","p18"],
    kills:{"p01":5,"p14":1,"p04":1}},

  {id:"s387",date:"2026-04-04",notes:"Easter Saturday · Lobby 9",
    winner:"p30",attendees:["p30","p08","p04","p05","p27","p14","p02","p18","p01","p21"],
    placements:["p30","p08","p04","p05","p27","p14","p02","p18","p01","p21"],
    kills:{"p30":3,"p08":2,"p04":1,"p05":1,"p14":1}},

  {id:"s388",date:"2026-04-04",notes:"Easter Saturday · Lobby 10",
    winner:"p14",attendees:["p14","p05","p11","p01","p03","p02","p04","p08","p21","p30","p18","p27"],
    placements:["p14","p05","p11","p01","p03","p02","p04","p08","p21","p30","p18","p27"],
    kills:{"p14":3,"p11":2,"p01":3,"p21":1,"p30":1}},

  {id:"s389",date:"2026-04-04",notes:"Easter Saturday · Lobby 11",
    winner:"p02",attendees:["p02","p27","p11","p04","p03","p01","p08","p30","p18","p14","p21","p05"],
    placements:["p02","p27","p11","p04","p03","p01","p08","p30","p18","p14","p21","p05"],
    kills:{"p02":2,"p11":2,"p01":3,"p08":1,"p30":2,"p27":1}},

  {id:"s390",date:"2026-04-04",notes:"Easter Saturday · Lobby 12",
    winner:"p02",attendees:["p02","p27","p03","p08","p05","p01","p14","p04","p11","p21"],
    placements:["p02","p27","p03","p08","p05","p01","p14","p04","p11","p21"],
    kills:{"p02":2,"p03":2,"p01":1,"p14":1}},

  {id:"s391",date:"2026-04-04",notes:"Easter Saturday · Lobby 13",
    winner:"p05",attendees:["p05","p14","p01","p30","p04","p11","p02","p08","p03"],
    placements:["p05","p14","p01","p30","p04","p11","p02","p08","p03"],
    kills:{"p05":2,"p14":1,"p30":5}},

  {id:"s392",date:"2026-04-04",notes:"Easter Saturday · Lobby 14",
    winner:"p02",attendees:["p02","p05","p14","p30","p11","p01","p15","p18","p08"],
    placements:["p02","p05","p14","p30","p11","p01","p15","p18","p08"],
    kills:{"p02":2,"p05":2,"p14":2,"p30":2}},

  {id:"s393",date:"2026-04-04",notes:"Easter Saturday · Lobby 15",
    winner:"p30",attendees:["p30","p15","p04","p01","p02","p14","p11","p05","p18"],
    placements:["p30","p15","p04","p01","p02","p14","p11","p05","p18"],
    kills:{"p30":5,"p04":1,"p01":1,"p14":1}},

  {id:"s394",date:"2026-04-04",notes:"Easter Saturday · Lobby 16",
    winner:"p02",attendees:["p02","p15","p30","p14","p01","p04","p18"],
    placements:["p02","p15","p30","p14","p01","p04","p18"],
    kills:{"p02":2,"p15":1,"p30":3}},

];

// ═══════════════════════════════════════════════════
//  RANK TITLES FAQ
// ═══════════════════════════════════════════════════
const RANK_FAQ = [
  {icon:"👑",name:"The Champion",  color:"#FFD700",
   desc:"The player with the most wins overall. Only one person holds this title at a time — if someone overtakes you, they take the crown."},
  {icon:"💀",name:"The Reaper",    color:"#FF4D8F",
   desc:"The all-time kill leader. Raw damage output, no mercy. Whoever has the most total kills wears this title."},
  {icon:"🎯",name:"Sharpshooter",  color:"#00E5FF",
   desc:"The best Kill/Death ratio in the whole lobby (minimum 2 appearances). Efficient, precise, deadly."},
  {icon:"🎮",name:"Ride or Die",   color:"#FFAB40",
   desc:"The most loyal player — most appearances of anyone. Doesn't matter if you win or lose, you just keep showing up."},
  {icon:"⚡",name:"Legend",        color:"#C77DFF",
   desc:"10+ all-time wins. A rare title that very few will reach. Absolute gaming royalty."},
  {icon:"🔥",name:"Veteran",       color:"#FFAB40",
   desc:"6 or more wins. You've been around, you know the meta, and you've proven it multiple times."},
  {icon:"⭐",name:"Gunslinger",    color:"#40C4FF",
   desc:"3+ wins. You're past the rookie stage — a consistent threat who knows how to close out a lobby."},
  {icon:"🌟",name:"Rising Star",   color:"#00FF94",
   desc:"You've won at least 1 lobby. The first win is the hardest — this means you're officially on the board."},
  {icon:"🎮",name:"Rookie",        color:"#7a6eaa",
   desc:"Haven't won a lobby yet, but you're playing. Every legend started here — keep grinding."},
];

// ═══════════════════════════════════════════════════
//  BADGES CATALOGUE
// ═══════════════════════════════════════════════════
const BADGE_CATALOGUE = [
  {icon:"🏆",name:"Winner",      desc:"Won at least 1 lobby",                     how:"Win any game"},
  {icon:"👑",name:"The Champion", desc:"Currently the all-time win leader",        how:"Hold the most wins of anyone"},
  {icon:"💀",name:"The Reaper",   desc:"Currently the all-time kill leader",       how:"Hold the most kills of anyone"},
  {icon:"🎯",name:"Sharpshooter", desc:"Best K/D ratio (min 2 lobbies)",          how:"Keep your K/D highest across 2+ lobbies"},
  {icon:"🎮",name:"Ride or Die",  desc:"Most total appearances",                  how:"Show up more than anyone else"},
  {icon:"🔥",name:"Win Streak",   desc:"Won multiple games in a row",             how:"Win 3+ consecutive lobbies"},
  {icon:"⚡",name:"Legend",       desc:"10+ total wins",                          how:"Grind out 10 wins"},
  {icon:"🌟",name:"Veteran",      desc:"6+ total wins",                           how:"Reach 6 wins"},
  {icon:"⭐",name:"Gunslinger",   desc:"3+ total wins",                           how:"Reach 3 wins"},
  {icon:"🌟",name:"Rising Star",  desc:"First win earned",                        how:"Win your first ever lobby"},
  {icon:"📅",name:"Full House",   desc:"Attended every single lobby (min 4)",     how:"Never miss a Games Night"},
  {icon:"💥",name:"50 Kills",     desc:"50 total kills across all lobbies",       how:"Rack up 50 kills"},
  {icon:"🎖️",name:"100 Kills",   desc:"100 total kills — absolute menace",       how:"100 kills total. That's serious."},
  {icon:"💀",name:"500 Kills",   desc:"500 total kills — you live in this lobby", how:"500 kills all time. Pure damage."},
  {icon:"⚡",name:"2.0+ K/G",     desc:"Kill/Game ratio 2.0+ (min 2 lobbies)",  how:"Stay above 2.0 K/G across 2+ games"},
  {icon:"🌟",name:"Big Game",     desc:"10+ kills in a single lobby",             how:"Drop 10 kills in one game"},
  {icon:"🎯",name:"50% Win Rate", desc:"Won half or more of your lobbies (min 3)",how:"Win 50%+ of games with 3+ played"},
  {icon:"🗡️",name:"Assassin",     desc:"6+ kills in a single lobby",               how:"Drop 6 kills in one game"},
  {icon:"🧱",name:"Iron Wall",    desc:"Consistent top 3 finisher",               how:"Finish top 3 in 10+ lobbies total"},
  {icon:"📆",name:"Marathon",     desc:"15+ lobbies in one session day",           how:"Play 15 or more lobbies in one day"},
  {icon:"🤝",name:"Never 1st",    desc:"Loyal squad member — never wins",          how:"Play 20+ lobbies without a single win (respect)"},
  {icon:"☄️",name:"Rampage",      desc:"6+ kills in a single lobby — 3 or more times", how:"Drop 6+ kills in 3 separate lobbies"},
  {icon:"🌊",name:"Hot Hand",     desc:"3+ wins in a single session day",             how:"Win 3 or more lobbies in one day"},
  {icon:"🎂",name:"Day One",      desc:"Played in the first month of Games Night — Apr 4, 2026",     how:"Limited edition. You were there in month one."},
  {icon:"🥚",name:"Easter Egg",   desc:"Played on Easter Saturday — Apr 4, 2026",     how:"Limited edition. Show up on Easter Saturday."},
  {icon:"💪",name:"No Days Off",   desc:"Showed up on Good Friday — Apr 3, 2026",      how:"Limited edition. Frag on a public holiday."},
  {icon:"🚀",name:"First Blood S2", desc:"First win of Season 2 — Apr 2026",           how:"S2 exclusive. Win a lobby in Season 2 before anyone else."},
  {icon:"🌅",name:"Opening Night",  desc:"Played on the very first Season 2 session",  how:"S2 exclusive. Show up on April 1st, 2026."},
  {icon:"👑",name:"S2 Champion",    desc:"Most wins in Season 2",                      how:"Hold the most Season 2 wins of any player."},
  {icon:"🃏",name:"Fool's Crown",   desc:"Won a lobby on April Fools Day — Apr 1, 2026", how:"Limited edition. Won on the one day nobody saw it coming."},
  // ── Season 1 Legacy Badges ──
  {icon:"🏆",name:"S1 Champion",    desc:"Season 1 Champion — most wins in March 2026",    how:"Finished #1 by wins in Season 1. Permanent."},
  {icon:"💀",name:"S1 Reaper",      desc:"Season 1 Kill Leader — most kills in March 2026", how:"Led all players in total kills for Season 1. Permanent."},
  {icon:"🥈",name:"S1 Podium",      desc:"Finished top 3 in Season 1 standings",            how:"Placed 2nd, 3rd or 4th by wins in Season 1."},
  {icon:"☄️",name:"S1 Record Breaker",desc:"Best single game of Season 1 — 7K in one lobby",how:"EZEDINEYoutube holds the Season 1 single-game kill record."},
  {icon:"🛡️",name:"S1 Iron Man",    desc:"Most appearances in Season 1 — almost never missed", how:"Showed up more than anyone else across all of Season 1."},
];

// ═══════════════════════════════════════════════════
//  CSS
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
//  SEASONS
// ═══════════════════════════════════════════════════
const SEASONS = [
  {id:"s1",name:"Season 1",label:"Mar 2026",start:"2026-03-01",end:"2026-03-31",color:"#FFD700"},
  {id:"s2",name:"Season 2",label:"Apr 2026",start:"2026-04-01",end:"2026-04-30",color:"#00E5FF"},
  {id:"s3",name:"Season 3",label:"May 2026",start:"2026-05-01",end:"2026-05-31",color:"#FF4D8F"},
  {id:"s4",name:"Season 4",label:"Jun 2026",start:"2026-06-01",end:"2026-06-30",color:"#C77DFF"},
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Barlow+Condensed:wght@400;600;700;900&family=Nunito:wght@400;600;700;800;900&family=Share+Tech+Mono&display=swap');
  :root{
    --bg:#160d2e;--bg2:#1e1245;--card:#221650;--card2:#2a1c60;
    --border:rgba(255,255,255,.15);--border2:rgba(255,255,255,.25);
    --text:#ffffff;--text2:#c8baff;--text3:#7a6eaa;
    --orange:#FF6B35;--gold:#FFD700;--cyan:#00E5FF;
    --pink:#FF4D8F;--green:#00FF94;--purple:#C77DFF;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{background:var(--bg);font-family:'Nunito',sans-serif;color:var(--text);
    overflow-x:hidden;min-height:100vh;
    background-image:
      radial-gradient(ellipse at 15% 0%,rgba(199,125,255,.14) 0%,transparent 55%),
      radial-gradient(ellipse at 85% 100%,rgba(0,229,255,.09) 0%,transparent 55%);}
  input,textarea,select,button{font-family:'Nunito',sans-serif;}
  ::-webkit-scrollbar{width:6px;}
  ::-webkit-scrollbar-track{background:var(--bg2);}
  ::-webkit-scrollbar-thumb{background:var(--orange);border-radius:4px;}

  @keyframes fadeUp  {from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn   {0%{opacity:0;transform:scale(.5)}65%{transform:scale(1.07)}100%{opacity:1;transform:scale(1)}}
  @keyframes floatY  {0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes eggFloat  {0%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(-18px) rotate(8deg)}100%{transform:translateY(0) rotate(-8deg)}}
  @keyframes eggSpin   {0%{transform:rotate(0deg) scale(1)}50%{transform:rotate(180deg) scale(1.15)}100%{transform:rotate(360deg) scale(1)}}
  @keyframes eggDrift  {0%{transform:translateX(0) translateY(0) rotate(0deg)}33%{transform:translateX(8px) translateY(-14px) rotate(15deg)}66%{transform:translateX(-6px) translateY(-8px) rotate(-10deg)}100%{transform:translateX(0) translateY(0) rotate(0deg)}}
  @keyframes eggBounce {0%,100%{transform:translateY(0)}25%{transform:translateY(-28px) rotate(-12deg)}55%{transform:translateY(-8px) rotate(6deg)}}
  @keyframes easterShimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}
  @keyframes easterScan{0%{transform:translateY(-100%)}100%{transform:translateY(800%)}}
  @keyframes hudBlink{0%,100%{opacity:1}48%{opacity:1}50%{opacity:.15}52%{opacity:1}}
  @keyframes typeIn{from{max-width:0;opacity:1}to{max-width:100%;opacity:1}}
  @keyframes briefingReveal{
    0%{opacity:0;transform:translateX(-8px);}
    100%{opacity:1;transform:translateX(0);}
  }
  @keyframes briefingType{
    from{width:0;}
    to{width:100%;}
  }
  @keyframes briefingCursor{
    0%,100%{opacity:1;}
    50%{opacity:0;}
  }
  @keyframes cursorPulse{0%,100%{border-color:var(--tw-color,#00E5FF)}49%{border-color:var(--tw-color,#00E5FF)}51%,99%{border-color:transparent}}
  .typewriter-wrap{overflow:hidden;}
  .typewriter-text{
    display:block;overflow:hidden;max-width:0;
    white-space:pre-wrap;word-break:break-word;
    border-right:2px solid;
    animation:typeIn var(--tw-dur,2s) steps(var(--tw-steps,60),end) forwards,
              cursorPulse .8s step-end var(--tw-dur,2s) infinite;
  }
  @keyframes easterRain{0%{transform:translateY(-20px) rotate(0deg);opacity:.9}100%{transform:translateY(340px) rotate(540deg);opacity:0}}
  @keyframes borderRun{0%{background-position:0 0,100% 0,100% 100%,0 100%}100%{background-position:300px 0,100% 300px,-300px 100%,0 -300px}}
  @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;}}

  /* ── V74 GAME-FEEL SYSTEM ─────────────────────────────────── */

  /* Typography utilities */
  .bc{font-family:"Barlow Condensed",sans-serif!important;}
  .bc9{font-family:"Barlow Condensed",sans-serif!important;font-weight:900!important;}
  .bc7{font-family:"Barlow Condensed",sans-serif!important;font-weight:700!important;}
  .mono{font-family:"Share Tech Mono",monospace!important;}

  /* Zone panel — hard left edge, no left radius */
  .zone-panel{
    background:rgba(255,255,255,.025);
    border:1px solid rgba(255,255,255,.06);
    border-left:3px solid var(--panel-accent,rgba(255,255,255,.15));
    border-radius:0 6px 6px 0;
  }
  .zone-panel-accent{
    background:linear-gradient(135deg,var(--panel-accent-bg,rgba(255,255,255,.05)),rgba(0,0,0,.4));
    border:1px solid var(--panel-accent-border,rgba(255,255,255,.1));
    border-left:3px solid var(--panel-accent,rgba(255,255,255,.3));
    border-radius:0 6px 6px 0;
  }

  /* Intel hover card */
  .intel-card{
    position:absolute;bottom:calc(100% + 10px);left:50%;
    transform:translateX(-50%);
    z-index:9000;pointer-events:none;
    background:#1e1245;
    border-radius:4px 8px 8px 8px;
    padding:10px 14px;min-width:160px;max-width:220px;white-space:nowrap;
    box-shadow:0 12px 32px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.06);
  }
  @keyframes intelIn{from{opacity:0;transform:translateX(-50%) translateY(4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
  .av-wrap{position:relative;display:inline-flex;flex-shrink:0;}
  .av-wrap .intel-card{
    opacity:0;pointer-events:none;
    transition:opacity .12s ease,transform .12s ease;
    transform:translateX(-50%) translateY(4px);
  }
  .av-wrap:hover .intel-card{
    opacity:1;pointer-events:auto;
    transform:translateX(-50%) translateY(0);
  }

  /* Badge flip card */
  .badge-flip-wrap{width:118px;height:64px;cursor:pointer;perspective:900px;flex-shrink:0;}
  .badge-flip-inner{
    width:100%;height:100%;position:relative;
    transform-style:preserve-3d;
    transition:transform .42s cubic-bezier(.4,0,.2,1);
  }
  .badge-flip-wrap.flipped .badge-flip-inner{transform:rotateY(180deg);}
  .badge-flip-front,.badge-flip-back{
    position:absolute;inset:0;backface-visibility:hidden;
    border-radius:4px;
    display:flex;align-items:center;justify-content:center;padding:5px 8px;gap:5px;
  }
  .badge-flip-back{transform:rotateY(180deg);background:var(--card2);}

  /* Weekly mission board */
  .mission-board{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
    gap:6px;
    margin-bottom:22px;
  }
  .mission-item{
    padding:14px 16px;
    background:rgba(255,255,255,.025);
    border-radius:0 6px 6px 0;
    border-left:3px solid var(--m-color,rgba(255,255,255,.2));
    border-top:1px solid rgba(255,255,255,.05);
    border-right:1px solid rgba(255,255,255,.05);
    border-bottom:1px solid rgba(255,255,255,.05);
  }
  .mission-bar-track{height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;margin-top:8px;}
  .mission-bar-fill{height:100%;border-radius:2px;transition:width .6s ease;}

  /* Arena row upgrades */
  .arena-row-v74{
    transition:transform .1s,background .1s;
    cursor:default;
  }
  .arena-row-v74:hover{transform:translateX(3px);}

  /* Records vault grid */
  .vault-grid{
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
    gap:8px;
  }
  .vault-card{
    padding:18px 18px;
    border-radius:0 6px 6px 0;
    border-left:3px solid var(--vc,rgba(255,255,255,.2));
    border-top:1px solid rgba(255,255,255,.04);
    border-right:1px solid rgba(255,255,255,.04);
    border-bottom:1px solid rgba(255,255,255,.04);
  }

  /* Zone ambient glow */
  .zone-glow-orb{
    position:fixed;top:-18%;left:50%;transform:translateX(-50%);
    width:75vw;height:40vh;z-index:0;pointer-events:none;
    transition:background .9s ease;
  }
  .easter-hud{display:inline-flex;align-items:center;gap:6px;background:rgba(255,107,53,.1);border:1px solid rgba(255,107,53,.35);border-radius:4px;padding:3px 12px;font-family:"Barlow Condensed",sans-serif;font-size:.72rem;font-weight:700;letter-spacing:3px;color:#ff6b35;text-transform:uppercase;animation:hudBlink 4s ease-in-out infinite;margin-bottom:12px;}
  .easter-hud-dot{width:6px;height:6px;border-radius:50%;background:#ff6b35;flex-shrink:0;}
  .easter-logo-zone{position:relative;display:inline-block;padding:20px 48px 14px;}
  .easter-logo-zone::before{content:"";position:absolute;inset:0;border-radius:12px;background:linear-gradient(90deg,#ffd700 50%,transparent 50%) top/8px 1.5px repeat-x,linear-gradient(90deg,#ffd700 50%,transparent 50%) bottom/8px 1.5px repeat-x,linear-gradient(0deg,#ffd700 50%,transparent 50%) left/1.5px 8px repeat-y,linear-gradient(0deg,#ffd700 50%,transparent 50%) right/1.5px 8px repeat-y;opacity:.35;animation:borderRun 4s linear infinite;}
  h1.hero-h1.easter-h1{font-family:"Barlow Condensed",sans-serif;font-weight:900;font-size:clamp(3.2rem,13vw,5.6rem);letter-spacing:-.02em;line-height:.86;background:linear-gradient(160deg,#FFE566 0%,#FF9D4D 25%,#FF5E8A 50%,#C97BFF 72%,#5BE8FF 88%,#6BFF9E 100%);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:easterShimmer 5s linear infinite;filter:none;}
  .easter-sub{font-family:"Barlow Condensed",sans-serif;font-size:.88rem;font-weight:700;letter-spacing:5px;color:rgba(255,255,255,.25);text-transform:uppercase;margin-top:4px;}
  .easter-banner-wrap{background:rgba(8,6,18,.94);border:1.5px solid rgba(255,215,0,.28);border-radius:16px;margin-bottom:32px;overflow:hidden;position:relative;}
  .easter-scanline{position:absolute;top:0;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,rgba(255,215,0,.18),transparent);animation:easterScan 5s linear infinite;pointer-events:none;z-index:3;}
  .easter-rain-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
  .easter-drop{position:absolute;animation:easterRain linear infinite;}
  .easter-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:36px 36px;pointer-events:none;}
  .easter-banner-inner{padding:22px 20px 20px;text-align:center;position:relative;z-index:2;}
  .easter-b-emojis{font-size:1.6rem;letter-spacing:8px;margin-bottom:10px;}
  .easter-b-title{font-family:"Barlow Condensed",sans-serif;font-weight:900;font-size:clamp(1.5rem,5vw,2.1rem);letter-spacing:.02em;background:linear-gradient(135deg,#FFE566,#FF9D4D,#FF6B9D);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:10px;line-height:1.1;}
  .easter-b-text{color:rgba(200,186,255,.75);font-size:.86rem;font-weight:700;max-width:380px;margin:0 auto 14px;line-height:1.6;}
  .easter-b-tags{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;}
  .easter-btag{border-radius:4px;padding:5px 12px;font-family:"Barlow Condensed",sans-serif;font-size:.76rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
  .easter-bt1{background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.4);color:#FFD700;}
  .easter-bt2{background:rgba(0,229,255,.08);border:1px solid rgba(0,229,255,.3);color:#00E5FF;}

  @media(max-width:640px){
    .hide-mob{display:none!important;} .show-mob{display:flex!important;}
    .hof-grid{grid-template-columns:1fr!important;}
    .stats-4{grid-template-columns:repeat(2,1fr)!important;}
    .lb-table{display:none!important;} .lb-cards{display:flex!important;}
    .hero-h1{font-size:clamp(2.4rem,14vw,4.5rem)!important;}
    .cd-wrap{gap:6px!important;} .cd-seg{padding:10px 8px!important;min-width:56px!important;}
    .comm-row{flex-direction:column!important;}
    .nav-desktop{display:none!important;} .ham-btn{display:flex!important;}
    .rival-grid{grid-template-columns:1fr!important;}
    .profile-2col{grid-template-columns:1fr!important;}
    .mvp-grid{grid-template-columns:1fr!important;}
    .grid-awards{grid-template-columns:1fr!important;}
    .grid-recap{grid-template-columns:1fr!important;}
    .grid-stats6{grid-template-columns:repeat(2,1fr)!important;}
    .grid-ranks{grid-template-columns:1fr!important;}
    .season-recap-grid{grid-template-columns:1fr!important;}
    .h2h-grid{grid-template-columns:1fr!important;}
    .badge-grid{grid-template-columns:repeat(2,1fr)!important;}
    .mission-board{grid-template-columns:1fr!important;}
    .vault-grid{grid-template-columns:1fr!important;}
    .fade-up{width:100%!important;max-width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important;}
    .card-h,.lb-card,.rival-card,.comm-card{min-width:0!important;width:100%!important;}
    main{padding-left:8px!important;padding-right:8px!important;overflow-x:hidden!important;}
    .combat-selector{gap:3px!important;}
    .combat-selector button{font-size:.6rem!important;padding:4px 8px!important;}
    .stat-strip-mob{grid-template-columns:repeat(2,1fr)!important;}
    .arena-row .mob-hide{display:none!important;}
    .badge-flip-wrap{width:calc(50% - 3px)!important;height:58px!important;}
    .records-grid{grid-template-columns:1fr!important;}
    .kill-king-grid{grid-template-columns:72px 1fr!important;}
  }
  @media(max-width:400px){
    .bc9.hero-big{font-size:clamp(2.8rem,16vw,5rem)!important;}
  }

  .records-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}
  .chart-bar{transition:height .4s cubic-bezier(.34,1.56,.64,1),background .2s;}
  .chart-bar:hover{filter:brightness(1.2);}
  .heat-cell{border-radius:4px;transition:transform .15s,filter .15s;}
  .heat-cell:hover{transform:scale(1.15);filter:brightness(1.3);}
  .potw-card{background:linear-gradient(135deg,rgba(255,215,0,.12),rgba(255,107,53,.08));
    border:2px solid rgba(255,215,0,.4);border-radius:20px;padding:28px 24px;
    animation:popIn .5s ease;}
  .s1-finale{background:linear-gradient(135deg,rgba(255,215,0,.15),rgba(255,107,53,.08),rgba(199,125,255,.1));
    border:2px solid rgba(255,215,0,.5);border-radius:20px;padding:24px;
    animation:liveGlo 2s ease-in-out infinite;}
  @media(min-width:641px){
    .lb-cards{display:none!important;} .mob-menu{display:none!important;}
    .ham-btn{display:none!important;} .show-mob{display:none!important;}
  }

  /* ── Nav & Mobile Menu ── */
  .mob-menu{
    position:sticky;top:60px;z-index:99;
    background:rgba(14,8,32,.98);
    border-bottom:1px solid rgba(255,255,255,.1);
    display:flex;flex-direction:column;
    padding:8px 0 12px;
    backdrop-filter:blur(20px);
    animation:fadeUp .2s ease both;
  }
  .mob-item{
    display:block;width:100%;padding:12px 20px;
    background:none;border:none;
    color:rgba(200,186,255,.8);font-weight:800;font-size:.9rem;
    text-align:left;cursor:pointer;font-family:inherit;
    border-left:3px solid transparent;
    transition:background .1s,border-color .1s,color .1s;
  }
  .mob-item:hover{background:rgba(255,255,255,.05);color:#fff;}
  .mob-item.active{color:#FF6B35;border-left-color:#FF6B35;background:rgba(255,107,53,.07);}

  .pill{background:none;border:none;cursor:pointer;font-family:inherit;}
  .scroll-top{
    position:fixed;bottom:22px;right:18px;z-index:200;
    width:40px;height:40px;border-radius:50%;
    background:rgba(255,107,53,.85);border:none;
    color:#fff;font-size:1.1rem;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 16px rgba(255,107,53,.45);
    transition:opacity .2s,transform .2s;
  }
  .scroll-top:hover{opacity:.9;transform:translateY(-2px);}

  @keyframes spinA{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  @keyframes pulseA{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes slideR{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
  @keyframes ticker{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
  @keyframes liveGlo{0%,100%{box-shadow:0 0 18px rgba(255,215,0,.25),0 0 0 2px rgba(255,215,0,.4)}50%{box-shadow:0 0 32px rgba(255,107,53,.4),0 0 0 2px rgba(255,107,53,.6)}}
  @keyframes foolsShimmer{0%{border-color:rgba(255,215,0,.5)}25%{border-color:rgba(255,77,143,.5)}50%{border-color:rgba(199,125,255,.5)}75%{border-color:rgba(0,229,255,.5)}100%{border-color:rgba(255,215,0,.5)}}
  @keyframes foolsSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}

  /* ── GAME BOOT ── */
  @keyframes bootBar{0%{width:0%}100%{width:100%}}
  @keyframes bootFade{0%{opacity:0;transform:scale(.94)}40%{opacity:1;transform:scale(1.01)}100%{opacity:1;transform:scale(1)}}
  @keyframes bootScan{0%{transform:translateY(-100%)}100%{transform:translateY(900%)}  }
  @keyframes bootBlink{0%,100%{opacity:1}45%{opacity:1}50%{opacity:0}55%{opacity:1}}
  @keyframes bootPulse{0%,100%{text-shadow:0 0 20px rgba(255,215,0,.6)}50%{text-shadow:0 0 50px rgba(255,215,0,1),0 0 80px rgba(255,107,53,.6)}}

  /* ── LEVEL TITLE CARD ── */
  @keyframes lvlSweep{0%{transform:translateX(-100%)}60%{transform:translateX(0%)}100%{transform:translateX(0%)}}
  @keyframes lvlText{0%{opacity:0;letter-spacing:1.5em;transform:scale(.85)}60%{opacity:1;letter-spacing:.05em;transform:scale(1.02)}100%{opacity:1;letter-spacing:.04em;transform:scale(1)}}
  @keyframes lvlSub{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
  @keyframes lvlOut{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.04)}}
  @keyframes lvlLine{0%{width:0}100%{width:100%}}
  @keyframes lvlFlicker{0%,100%{opacity:1}30%{opacity:.7}32%{opacity:1}60%{opacity:.85}62%{opacity:1}}

  /* ── HUD / ARENA ── */
  @keyframes hudIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
  @keyframes rankGlow{0%,100%{box-shadow:0 0 12px var(--c,rgba(255,215,0,.3))}50%{box-shadow:0 0 28px var(--c,rgba(255,215,0,.7)),0 0 60px var(--c,rgba(255,215,0,.2))}}
  @keyframes countUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scanline{0%{background-position:0 0}100%{background-position:0 100px}}
  @keyframes cornerPulse{0%,100%{opacity:.4}50%{opacity:.8}}
  @keyframes arenaRow{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes crownSpin{0%{transform:rotate(-8deg) scale(1)}50%{transform:rotate(8deg) scale(1.15)}100%{transform:rotate(-8deg) scale(1)}}

  /* ── JESTER + SEASON 1 (existing) ── */
  @keyframes jesterFloat{0%{transform:translateY(0) rotate(-8deg) scale(1)}33%{transform:translateY(-22px) rotate(10deg) scale(1.1)}66%{transform:translateY(-8px) rotate(-12deg) scale(.95)}100%{transform:translateY(0) rotate(-8deg) scale(1)}}
  @keyframes jesterDrift{0%{transform:translateX(0) translateY(0) rotate(0deg)}25%{transform:translateX(12px) translateY(-18px) rotate(20deg)}50%{transform:translateX(-8px) translateY(-28px) rotate(-15deg)}75%{transform:translateX(6px) translateY(-10px) rotate(12deg)}100%{transform:translateX(0) translateY(0) rotate(0deg)}}
  @keyframes jesterSpin{0%{transform:rotate(0deg) scale(1)}50%{transform:rotate(180deg) scale(1.2)}100%{transform:rotate(360deg) scale(1)}}
  @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
  @keyframes glitchShift{0%,95%,100%{transform:translate(0,0)}96%{transform:translate(-3px,1px)}97%{transform:translate(2px,-2px)}98%{transform:translate(-1px,2px)}99%{transform:translate(3px,-1px)}}
  @keyframes numberRoll{0%{opacity:0;transform:scale(.6)}60%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}

  /* ── HUD CLASSES ── */
  .hud-bg{
    background-image:
      linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),
      linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);
    background-size:40px 40px;
  }
  .arena-row{
    animation:arenaRow .3s ease both;
    transition:background .12s,transform .1s,box-shadow .15s;
    position:relative;
  }
  .arena-row:hover{
    background:rgba(255,255,255,.05)!important;
    transform:translateX(3px);
  }
  .arena-row-1{
    background:linear-gradient(90deg,rgba(255,215,0,.07),transparent)!important;
    border-left:3px solid #FFD700!important;
  }
  .arena-row-1:hover{background:linear-gradient(90deg,rgba(255,215,0,.12),transparent)!important;}
  .rank-num{
    font-family:"Barlow Condensed",sans-serif;
    font-weight:900;
    letter-spacing:.04em;
  }
  .stat-hud{
    font-family:"Barlow Condensed",sans-serif;
    font-weight:700;
    letter-spacing:.06em;
    animation:countUp .4s ease both;
  }
  .corner-bracket::before,.corner-bracket::after{
    content:"";position:absolute;width:10px;height:10px;
    border-color:currentColor;border-style:solid;opacity:.5;
  }
  .corner-bracket::before{top:4px;left:4px;border-width:1.5px 0 0 1.5px;}
  .corner-bracket::after{bottom:4px;right:4px;border-width:0 1.5px 1.5px 0;}
  .lvl-card{
    position:fixed;inset:0;z-index:9990;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    background:#0a061c;
    pointer-events:none;
  }
  .boot-screen{
    position:fixed;inset:0;z-index:9995;
    background:#080516;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:0;
  }
  .jester-zone{position:relative;display:inline-block;}
  .confetti-piece{position:fixed;width:8px;height:8px;border-radius:2px;animation:confettiFall linear forwards;pointer-events:none;z-index:9998;}
  .stat-roll{animation:numberRoll .5s cubic-bezier(.34,1.56,.64,1) both;}

  .spin-a{animation:spinA 1.1s linear infinite;display:inline-block;}
  .pulse-a{animation:pulseA 1.4s ease-in-out infinite;display:inline-block;}
  .fire{display:inline-block;}
  .live-glo{animation:popIn .4s ease both;}
  .nav-btn{background:none;border:none;cursor:pointer;font-family:inherit;transition:color .15s;}
  .nav-btn:hover{color:#FF6B35!important;}
  .nav-desktop::-webkit-scrollbar{display:none;}
  .nav-desktop{scrollbar-width:none;}

  /* ── FAQ accordion ── */
  .faq-item{border-bottom:1px solid rgba(255,255,255,.07);}
  .faq-item:last-child{border-bottom:none;}
  .faq-q{
    display:flex;align-items:center;justify-content:space-between;
    padding:14px 4px;cursor:pointer;gap:12px;
    font-weight:700;font-size:.92rem;color:var(--text);
    transition:color .15s;
    user-select:none;
  }
  .faq-q:hover{color:#FF6B35;}
  .faq-a{
    padding:4px 4px 16px;
    font-size:.86rem;color:var(--text2);
    line-height:1.65;
  }

  /* ── Leaderboard period tabs ── */
  .period-tab{
    padding:7px 16px;border-radius:50px;
    font-weight:800;font-size:.8rem;cursor:pointer;
    background:var(--card);color:var(--text2);
    border:1.5px solid var(--border);
    transition:background .15s,color .15s,border-color .15s,box-shadow .15s;
    font-family:inherit;
  }
  .period-tab:hover{color:#fff;border-color:rgba(255,255,255,.35);}
  .period-tab.active{
    background:var(--orange);color:#fff;
    border-color:var(--orange);
    box-shadow:0 0 18px rgba(255,107,53,.45);
  }

  /* ── Leaderboard table rows ── */
  .lb-row{transition:background .12s;}
  .lb-row:hover{background:rgba(255,255,255,.04)!important;}

  /* ── Search input ── */
  .search-inp{
    width:100%;padding:11px 14px 11px 40px;
    border-radius:12px;border:2px solid var(--border);
    background:var(--card);color:#fff;
    font-size:.9rem;outline:none;
    transition:border-color .2s,box-shadow .2s;
    font-family:inherit;
  }
  /* ── Rivals progress bar ── */
  .rival-bar{
    height:6px;border-radius:50px;
    background:rgba(255,255,255,.08);
    overflow:hidden;
    margin-top:6px;
  }
  .rival-fill{
    height:100%;border-radius:50px;
    transition:width .5s cubic-bezier(.34,1.56,.64,1);
    min-width:4px;
  }

  .search-inp:focus{border-color:var(--orange);box-shadow:0 0 0 3px rgba(255,107,53,.18);}
  .search-inp::placeholder{color:var(--text3);}

  /* ── Touch target improvements ── */
  /* Nav buttons need minimum 44px touch height */
  .nav-btn{min-height:36px;display:inline-flex;align-items:center;}
  /* Period tabs */
  .period-tab{min-height:38px;}
  /* General interactive feedback */
  button:active{opacity:.8;}
  a:active{opacity:.8;}

  /* ── Wide screen container guard ── */
  main{width:100%;box-sizing:border-box;}

  /* ── Table overflow on mobile ── */
  .table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}

  /* ── Prevent text overflow globally ── */
  .truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

  /* ── Safe area for notched phones ── */
  footer{padding-bottom:max(28px,env(safe-area-inset-bottom));}

  /* ── Mobile: reduce hero padding ── */
  @media(max-width:400px){
    .hero-h1{font-size:clamp(2.2rem,13vw,4rem)!important;}
    .cd-seg{padding:10px 8px!important;min-width:54px!important;}
    .period-tab{padding:6px 10px!important;font-size:.74rem!important;}
  }

  /* ── Lobbies table column readability on mobile ── */
  @media(max-width:480px){
    .lb-table th,.lb-table td{padding:8px 10px!important;}
  }

  /* ── Select elements styling ── */
  select{
    -webkit-appearance:none;
    appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a6eaa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat;
    background-position:right 12px center;
    padding-right:36px!important;
  }

  /* ── Smooth scroll on iOS ── */
  *{-webkit-overflow-scrolling:touch;}
  .nav-desktop{-webkit-overflow-scrolling:touch;}
`;

// ═══════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════
const pad = n => String(n).padStart(2,"0");
const todayStr = () => new Date().toISOString().split("T")[0];
const weekAgoStr = () => new Date(Date.now()-7*24*60*60*1000).toISOString().split("T")[0];

// ── April Fools ──
const isFoolsDay=()=>{
  const d=new Date();
  return d.getUTCMonth()===3&&d.getUTCDate()===1; // April 1 UTC
};
const scrambleName=(name)=>{
  if(!name)return name;
  // Reverse the characters but keep numbers at end, shift first char to end
  const chars=[...name];
  if(chars.length<=2)return chars.reverse().join("");
  // swap first and last half
  const mid=Math.floor(chars.length/2);
  return [...chars.slice(mid),...chars.slice(0,mid)].join("");
};

function getNextSession(){
  const now=new Date(),d=new Date(now);
  d.setUTCHours(SESSION_START_HOUR,0,0,0);
  for(let i=0;i<9;i++){
    if(SESSION_DAYS.includes(d.getUTCDay())&&d>now) return d;
    d.setUTCDate(d.getUTCDate()+1);d.setUTCHours(SESSION_START_HOUR,0,0,0);
  }
  return d;
}
function isLiveNow(){
  const n=new Date();
  return SESSION_DAYS.includes(n.getUTCDay())&&n.getUTCHours()>=SESSION_START_HOUR&&n.getUTCHours()<SESSION_END_HOUR;
}

// ═══════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════

// ── useTyping hook ──────────────────────────────────────────────────────────
function useTyping(text, speed=18) {
  const [out, setOut] = React.useState("");
  const [done, setDone] = React.useState(false);
  React.useEffect(()=>{
    setOut(""); setDone(false); let i=0;
    const t=setInterval(()=>{
      if(i<text.length){ setOut(text.slice(0,++i)); }
      else{ setDone(true); clearInterval(t); }
    }, speed);
    return()=>clearInterval(t);
  },[text]);
  return [out, done];
}

// ── TypingText component ─────────────────────────────────────────────────────
function TypingText({text, speed=18, color="var(--text3)", style:s={}}) {
  const [out, done] = useTyping(text, speed);
  const [blink, setBlink] = React.useState(true);
  React.useEffect(()=>{ const t=setInterval(()=>setBlink(x=>!x),520); return()=>clearInterval(t); },[]);
  return (
    <span style={s}>
      {out}
      {!done && <span style={{color, opacity:blink?1:0, transition:"opacity .1s"}}>█</span>}
    </span>
  );
}

// ── BadgeFlip — module-level so useState/useEffect are stable ──
// Mobile was double-firing (touchstart + click) causing instant open-close.
// Debounce lock blocks the second event within 400ms.
function BadgeFlip({b,playerColor}){
  const bc=BADGE_CATALOGUE.find(x=>x.name===b.label)||{how:"Earned through gameplay"};
  const [flipped,setFlipped]=useState(false);
  const [locked,setLocked]=useState(false);

  useEffect(()=>{
    if(!flipped)return;
    const t=setTimeout(()=>setFlipped(false),5000);
    return()=>clearTimeout(t);
  },[flipped]);

  const handle=(e)=>{
    e.preventDefault();
    if(locked)return;
    setLocked(true);
    setTimeout(()=>setLocked(false),400);
    setFlipped(f=>!f);
  };

  return(
    <div className={`badge-flip-wrap${flipped?" flipped":""}`}
      title={flipped?"":"Tap to reveal"}
      onClick={handle}
      onTouchEnd={handle}
      style={{touchAction:"manipulation",WebkitTapHighlightColor:"transparent"}}>
      <div className="badge-flip-inner">
        <div className="badge-flip-front" style={{
          background:`${playerColor}14`,border:`1px solid ${playerColor}33`}}>
          <span style={{fontSize:"1rem",flexShrink:0}}>{b.icon}</span>
          <span className="bc7" style={{fontSize:".62rem",color:playerColor,
            letterSpacing:".04em",lineHeight:1.3,overflow:"hidden",
            display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
            {b.label}
          </span>
        </div>
        <div className="badge-flip-back" style={{border:`1px solid ${playerColor}44`}}>
          <span style={{fontFamily:"Nunito",fontWeight:700,fontSize:".6rem",
            color:"#c8baff",lineHeight:1.4,textAlign:"center"}}>
            {bc.how}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── DailyVotePanel — session MVP vote, resets each session day, shared for all visitors ──
function DailyVotePanel({players,latestDate,latestSess,store,dn,Av,goProfile}){
  const voteKey=`gn-daily-vote-${latestDate}`;
  const winnerKey=`gn-daily-winner-${latestDate}`;
  const myVoteKey=`gn-my-vote-${latestDate}`;

  const [voteCounts,setVoteCounts]=useState({});
  const [myVote,setMyVote]=useState(null);
  const [phase,setPhase]=useState("voting"); // "voting" | "results"
  const [prevWinner,setPrevWinner]=useState(null);

  // Players who attended the latest session
  const eligible=[...new Set((latestSess||[]).flatMap(s=>s.attendees||[]))]
    .map(pid=>players.find(p=>p.id===pid)).filter(Boolean);

  useEffect(()=>{
    const load=async()=>{
      try{
        // Load my vote from local storage
        const mv=typeof window!=="undefined"?window.localStorage?.getItem(myVoteKey):null;
        if(mv)setMyVote(mv);
        // Load shared vote counts
        const r=typeof window!=="undefined"&&window.storage?.get
          ?await window.storage.get(voteKey,true).catch(()=>null)
          :await store.get(voteKey);
        if(r?.value)setVoteCounts(JSON.parse(r.value));
        // Load previous day winner
        const days=[...new Set((latestSess||[]).map(s=>s.date))].sort().reverse();
        const prevDate=days[1];
        if(prevDate){
          const pr=typeof window!=="undefined"&&window.storage?.get
            ?await window.storage.get(`gn-daily-winner-${prevDate}`,true).catch(()=>null)
            :await store.get(`gn-daily-winner-${prevDate}`);
          if(pr?.value)setPrevWinner(JSON.parse(pr.value));
        }
      }catch{}
    };
    load();
    const iv=setInterval(load,14000);
    return()=>clearInterval(iv);
  },[latestDate]);

  const castVote=async(pid)=>{
    if(myVote)return;
    setMyVote(pid);
    try{
      window.localStorage?.setItem(myVoteKey,pid);
      const counts={...voteCounts};
      counts[pid]=(counts[pid]||0)+1;
      setVoteCounts(counts);
      const str=JSON.stringify(counts);
      if(typeof window!=="undefined"&&window.storage?.set){
        await window.storage.set(voteKey,str,true).catch(()=>{});
        // Save winner (highest voted) to shared storage
        const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
        if(top)await window.storage.set(winnerKey,JSON.stringify({pid:top[0],votes:top[1],date:latestDate}),true).catch(()=>{});
      }
      await store.set(voteKey,str);
    }catch{}
  };

  const totalVotes=Object.values(voteCounts).reduce((a,b)=>a+b,0);
  const topPid=Object.entries(voteCounts).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const topP=topPid?players.find(p=>p.id===topPid):null;
  const prevWinP=prevWinner?.pid?players.find(p=>p.id===prevWinner.pid):null;

  if(!eligible.length)return null;

  return(
    <div style={{marginBottom:22}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        marginBottom:10,flexWrap:"wrap",gap:6}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div className="bc9" style={{fontSize:".62rem",letterSpacing:".3em",
            color:"rgba(255,215,0,.7)"}}>▸ SESSION MVP VOTE</div>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#FFD700",
            flexShrink:0,boxShadow:"0 0 8px #FFD700",
            animation:"hudBlink 1.4s ease-in-out infinite"}}/>
        </div>
        {totalVotes>0&&<div className="bc7" style={{fontSize:".6rem",
          color:"var(--text3)",letterSpacing:".1em"}}>{totalVotes} vote{totalVotes===1?"":"s"} in</div>}
      </div>

      <div style={{background:"rgba(255,255,255,.02)",
        border:"1px solid rgba(255,215,0,.18)",
        borderLeft:"3px solid rgba(255,215,0,.5)",
        borderRadius:"0 8px 8px 0",padding:"14px 16px"}}>

        {/* Previous day winner banner */}
        {prevWinP&&(
          <div onClick={()=>goProfile(prevWinP.id)} style={{
            display:"flex",alignItems:"center",gap:10,
            background:"rgba(255,215,0,.07)",
            border:"1px solid rgba(255,215,0,.2)",
            borderRadius:6,padding:"8px 12px",marginBottom:14,cursor:"pointer"}}>
            <span style={{fontSize:"1.1rem"}}>🏅</span>
            <div style={{flex:1,minWidth:0}}>
              <div className="bc7" style={{fontSize:".56rem",letterSpacing:".2em",
                color:"rgba(255,215,0,.6)",marginBottom:2}}>LAST SESSION MVP WINNER</div>
              <div className="bc9" style={{fontSize:".82rem",color:"#FFD700",
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {dn(prevWinP.username)}
                <span className="bc7" style={{fontSize:".65rem",color:"var(--text3)",
                  marginLeft:8}}>{prevWinner.votes} vote{prevWinner.votes===1?"":"s"}</span>
              </div>
            </div>
            <span style={{fontSize:"1.4rem"}}>👑</span>
          </div>
        )}

        {/* Live leader if votes exist */}
        {totalVotes>0&&topP&&(
          <div style={{marginBottom:12}}>
            <div className="bc7" style={{fontSize:".56rem",letterSpacing:".18em",
              color:"var(--text3)",marginBottom:6}}>CURRENT LEADER</div>
            {Object.entries(voteCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([pid,count])=>{
              const vp=players.find(p=>p.id===pid);
              if(!vp)return null;
              const pct=Math.round((count/totalVotes)*100);
              const isTop=pid===topPid;
              return(
                <div key={pid} style={{marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",
                    alignItems:"center",marginBottom:2}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <Av p={vp} size={18}/>
                      <span className="bc9" style={{fontSize:".72rem",
                        color:isTop?"#FFD700":"var(--text2)"}}>
                        {isTop?"👑 ":""}{dn(vp.username)}
                      </span>
                    </div>
                    <span className="bc7" style={{fontSize:".66rem",
                      color:isTop?"#FFD700":"var(--text3)"}}>
                      {count}v · {pct}%
                    </span>
                  </div>
                  <div style={{height:3,background:"rgba(255,255,255,.08)",
                    borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",
                      background:isTop?"linear-gradient(90deg,rgba(255,215,0,.6),#FFD700)":"rgba(255,255,255,.2)",
                      width:`${pct}%`,borderRadius:2,transition:"width .5s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Vote prompt or locked */}
        {myVote?(
          <div className="bc7" style={{fontSize:".7rem",color:"var(--text3)",
            textAlign:"center",padding:"4px 0"}}>
            Your vote is in.
            {players.find(p=>p.id===myVote)&&(
              <span style={{color:players.find(p=>p.id===myVote).color,marginLeft:6}}>
                {dn(players.find(p=>p.id===myVote).username)}
              </span>
            )}
          </div>
        ):(
          <>
            <div className="bc7" style={{fontSize:".64rem",color:"var(--text3)",
              marginBottom:8,letterSpacing:".06em"}}>
              Who ran the session last night?
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {eligible.map(player=>(
                <button key={player.id} onClick={()=>castVote(player.id)} style={{
                  display:"flex",alignItems:"center",gap:6,
                  background:`${player.color}0a`,
                  border:`1px solid ${player.color}22`,
                  borderRadius:5,padding:"6px 10px",cursor:"pointer",
                  outline:"none",transition:"all .1s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${player.color}1a`;e.currentTarget.style.borderColor=`${player.color}55`;}}
                  onMouseLeave={e=>{e.currentTarget.style.background=`${player.color}0a`;e.currentTarget.style.borderColor=`${player.color}22`;}}>
                  <Av p={player} size={22}/>
                  <span className="bc9" style={{fontSize:".7rem",color:player.color,
                    whiteSpace:"nowrap"}}>
                    {player.host?"👑 ":""}{dn(player.username)}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── LeaderSlideshow — auto-cycles through season leader cards ──
function LeaderSlideshow({slides}){
  const [idx,setIdx]=useState(0);
  const [animDir,setAnimDir]=useState("in");

  useEffect(()=>{
    if(!slides.length)return;
    // Reset to first slide when slide list changes
    setIdx(0);
    setAnimDir("in");
  },[slides.length]);

  useEffect(()=>{
    if(!slides.length)return;
    let timeout=null;
    const iv=setInterval(()=>{
      setAnimDir("out");
      timeout=setTimeout(()=>{
        setIdx(i=>(i+1)%slides.length);
        setAnimDir("in");
      },340);
    },5000);
    return()=>{
      clearInterval(iv);
      if(timeout)clearTimeout(timeout);
    };
  },[slides.length]);

  const goTo=(i)=>{
    if(i===idx)return;
    setAnimDir("out");
    setTimeout(()=>{setIdx(i);setAnimDir("in");},280);
  };

  if(!slides.length)return null;
  const s=slides[idx]||slides[0];
  if(!s||!s.player)return null;

  const slideStyle={
    opacity:animDir==="in"?1:0,
    transform:animDir==="in"?"translateX(0)":"translateX(14px)",
    transition:"opacity .3s ease, transform .3s ease",
  };

  return(
    <div style={{marginBottom:20}}>
      <div style={{
        background:`linear-gradient(135deg,${s.player.color}0e,rgba(0,0,0,.55))`,
        border:`1px solid ${s.player.color}33`,
        borderLeft:`3px solid ${s.player.color}`,
        borderRadius:"0 8px 8px 0",padding:"18px 20px",
        position:"relative",overflow:"hidden",minHeight:92}}>
        <div style={{position:"absolute",right:-6,top:-8,fontFamily:"Barlow Condensed",
          fontWeight:900,fontSize:"7rem",color:s.player.color,opacity:.05,
          lineHeight:1,pointerEvents:"none",userSelect:"none"}}>{s.player.username[0]}</div>
        <div style={{display:"flex",alignItems:"center",gap:16,...slideStyle}}>
          <div style={{flexShrink:0,width:58,height:58,borderRadius:"50%",
            background:`linear-gradient(135deg,${s.player.color},${s.player.color}88)`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:"Barlow Condensed",fontWeight:900,
            fontSize:"1.5rem",color:"#fff",
            boxShadow:`0 0 22px ${s.player.color}55`}}>
            {s.player.username[0].toUpperCase()}
          </div>
          <div style={{flex:1,minWidth:0,position:"relative",zIndex:1}}>
            <div className="bc7" style={{fontSize:".58rem",letterSpacing:".3em",
              color:`${s.player.color}66`,marginBottom:4}}>
              ▸ {s.label}
            </div>
            <div className="bc9" style={{fontSize:"clamp(1.2rem,5vw,1.9rem)",
              letterSpacing:".06em",color:s.player.color,
              textShadow:`0 0 18px ${s.player.color}44`,lineHeight:1,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {s.player.host?"👑 ":""}{s.player.username.toUpperCase()}
            </div>
            <div className="bc7" style={{fontSize:".75rem",color:"var(--text2)",
              marginTop:5,letterSpacing:".05em"}}>{s.stat}</div>
            {s.sub&&<div className="bc7" style={{fontSize:".62rem",
              color:"var(--text3)",marginTop:2}}>{s.sub}</div>}
          </div>
          <div style={{fontSize:"clamp(1.8rem,5vw,2.8rem)",flexShrink:0,
            textShadow:`0 0 20px ${s.player.color}55`}}>{s.icon}</div>
        </div>
        <div style={{display:"flex",gap:5,justifyContent:"center",marginTop:12,
          position:"relative",zIndex:2}}>
          {slides.map((_,i)=>(
            <div key={i} onClick={()=>goTo(i)} style={{
              width:i===idx?18:6,height:6,borderRadius:3,cursor:"pointer",
              background:i===idx?s.player.color:"rgba(255,255,255,.18)",
              transition:"all .3s ease",
              boxShadow:i===idx?`0 0 8px ${s.player.color}77`:"none"}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── VotePanel — module-level so hooks are stable ──
function VotePanel({players,allStats,s2Prediction,setS2Prediction,store,showToast,dn,Av}){
  const voteKey="gn-s2-vote-mvp";
  const [voteCounts,setVoteCounts]=useState({});

  useEffect(()=>{
    const load=async()=>{
      try{
        const r=typeof window!=="undefined"&&window.storage?.get
          ?await window.storage.get(voteKey,true).catch(()=>null)
          :await store.get(voteKey);
        if(r?.value)setVoteCounts(JSON.parse(r.value));
      }catch{}
    };
    load();
    const iv=setInterval(load,12000);
    return()=>clearInterval(iv);
  },[]);

  const castVote=async(pid)=>{
    if(s2Prediction)return;
    setS2Prediction(pid);
    try{
      const counts={...voteCounts};
      counts[pid]=(counts[pid]||0)+1;
      setVoteCounts(counts);
      const str=JSON.stringify(counts);
      if(typeof window!=="undefined"&&window.storage?.set){
        await window.storage.set(voteKey,str,true).catch(()=>{});
      }
      await store.set(voteKey,str);
    }catch{}
    const name=players.find(p=>p.id===pid)?.username||"?";
    showToast(`Vote locked in for ${dn(name)}!`);
  };

  const votePlayers=allStats().filter(p=>p.appearances>=3)
    .sort((a,b)=>b.wins-a.wins||b.kills-a.kills)
    .slice(0,16)
    .map(s=>players.find(p=>p.id===s.id))
    .filter(Boolean);

  const totalVotes=Object.values(voteCounts).reduce((a,b)=>a+b,0);
  const topVotedId=Object.entries(voteCounts).sort((a,b)=>b[1]-a[1])[0]?.[0];

  return(
    <div style={{
      background:"linear-gradient(135deg,rgba(199,125,255,.08),rgba(0,229,255,.04))",
      border:"1px solid rgba(199,125,255,.3)",
      borderLeft:"3px solid rgba(199,125,255,.6)",
      borderRadius:"0 12px 12px 0",padding:"20px 20px",marginBottom:20}}>
      <div style={{marginBottom:14}}>
        <div style={{fontFamily:"Barlow Condensed",fontWeight:900,fontSize:".72rem",
          letterSpacing:".25em",color:"rgba(199,125,255,.8)",marginBottom:6}}>
          🗳️ S2 MVP VOTE · LIVE
        </div>
        <div style={{fontFamily:"Fredoka One",fontSize:"1.1rem",color:"#fff",marginBottom:4}}>
          Who is the MVP of Season 2 so far?
        </div>
        <div style={{fontFamily:"Barlow Condensed",fontWeight:700,fontSize:".7rem",
          color:"var(--text3)",letterSpacing:".04em"}}>
          {totalVotes>0
            ?`${totalVotes} vote${totalVotes===1?"":"s"} in. Results refresh every 12 seconds.`
            :"Cast your vote. Everyone sees the count in real time."}
          {s2Prediction?" Your vote is locked in.":""}
        </div>
      </div>

      {totalVotes>0&&(
        <div style={{marginBottom:14}}>
          {Object.entries(voteCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([pid,count])=>{
            const vp=players.find(p=>p.id===pid);
            if(!vp)return null;
            const pct=Math.round((count/totalVotes)*100);
            const isTop=pid===topVotedId;
            return(
              <div key={pid} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",
                  alignItems:"center",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <Av p={vp} size={20}/>
                    <span style={{fontFamily:"Barlow Condensed",fontWeight:900,
                      fontSize:".75rem",color:isTop?vp.color:"var(--text2)"}}>
                      {isTop?"👑 ":""}{dn(vp.username)}
                    </span>
                  </div>
                  <span style={{fontFamily:"Barlow Condensed",fontWeight:700,
                    fontSize:".72rem",color:isTop?vp.color:"var(--text3)"}}>
                    {count}v · {pct}%
                  </span>
                </div>
                <div style={{height:4,background:"rgba(255,255,255,.08)",
                  borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",
                    background:isTop?`linear-gradient(90deg,${vp.color}77,${vp.color})`:`${vp.color}44`,
                    width:`${pct}%`,borderRadius:2,transition:"width .6s ease",
                    boxShadow:isTop?`0 0 8px ${vp.color}55`:"none"}}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))",gap:5}}>
        {votePlayers.map(player=>{
          const isVoted=s2Prediction===player.id;
          const vcount=voteCounts[player.id]||0;
          return(
            <button key={player.id} onClick={()=>castVote(player.id)}
              disabled={!!s2Prediction} style={{
                display:"flex",alignItems:"center",gap:8,
                background:isVoted?`${player.color}20`:`${player.color}08`,
                border:isVoted?`1.5px solid ${player.color}66`:`1px solid ${player.color}1a`,
                borderRadius:6,padding:"8px 10px",cursor:s2Prediction?"default":"pointer",
                textAlign:"left",transition:"all .12s",outline:"none",
                opacity:s2Prediction&&!isVoted?.5:1}}>
              <Av p={player} size={26}/>
              <div style={{minWidth:0}}>
                <div style={{fontFamily:"Barlow Condensed",fontWeight:900,fontSize:".72rem",
                  color:player.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {player.host?"👑 ":""}{dn(player.username)}{isVoted?" ✓":""}
                </div>
                <div style={{fontFamily:"Barlow Condensed",fontWeight:700,
                  fontSize:".58rem",color:"var(--text3)"}}>
                  {vcount>0?`${vcount} vote${vcount===1?"":"s"}`:"no votes yet"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── TypedBio — module-level component so its reference is stable ──
// Must be outside GameNight or React remounts it on every parent render,
// killing the interval before it finishes.
function TypedBio({text,color}){
  const [out,setOut]=useState("");
  const [done,setDone]=useState(false);
  useEffect(()=>{
    setOut("");
    setDone(false);
    if(!text)return;
    let i=0;
    const id=setInterval(()=>{
      i++;
      if(i<=text.length){
        setOut(text.slice(0,i));
        if(i===text.length)setDone(true);
      } else {
        clearInterval(id);
      }
    },20);
    return()=>clearInterval(id);
  },[text]);
  return(
    <div style={{padding:"12px 16px",marginBottom:12,
      background:"rgba(255,255,255,.02)",
      borderLeft:`3px solid ${color}33`,
      borderRadius:"0 6px 6px 0",minHeight:52}}>
      <span style={{
        fontFamily:"'Share Tech Mono',monospace",
        fontSize:".77rem",lineHeight:1.9,
        color:"var(--text3)",letterSpacing:".04em",
        display:"block",wordBreak:"break-word"}}>
        {out}
        {!done&&<span style={{color,opacity:.9,
          animation:"hudBlink 0.8s step-end infinite"}}>█</span>}
      </span>
    </div>
  );
}

export default function GameNight(){
  const [view,       setView]      = useState("home");
  const [players,    setPlayers]   = useState([]);
  const [sessions,   setSessions]  = useState([]);
  const [loaded,     setLoaded]    = useState(false);
  const [adminMode,  setAdminMode] = useState(false);
  const [showLogin,  setShowLogin] = useState(false);
  const [adminInput, setAdminInput]= useState("");
  const [adminTab,   setAdminTab]  = useState("session");
  const [sortBy,     setSortBy]    = useState("wins");
  const [lbPeriod,   setLbPeriod]  = useState("all");
  const [toast,      setToast]     = useState("");
  const [cd,         setCd]        = useState({d:0,h:0,m:0,s:0});
  const [live,       setLive]      = useState(false);
  const [mobileOpen, setMobileOpen]= useState(false);
  const [showScroll, setShowScroll]= useState(false);
  const [lbSearch,   setLbSearch]  = useState("");
  const [spotlight,  setSpotlight] = useState(null);
  const [faqOpen,    setFaqOpen]   = useState(null);
  const [rivalSearch,setRivalSearch]= useState("");
  const [profileId,  setProfileId]  = useState(null);
  const [expandedSid,setExpandedSid]= useState(null);
  const [lbSeason,   setLbSeason]   = useState("all");
  const [h2hA,       setH2hA]       = useState("");
  const [h2hB,       setH2hB]       = useState("");
  const [editingSess,setEditingSess] = useState(null);
  const [lobbyFilter,setLobbyFilter] = useState("");
  const [lobbyDate,  setLobbyDate]   = useState("");
  const [pollVote,   setPollVote]     = useState(null);
  const [pollClosed, setPollClosed]   = useState(false);
  const [prevView,   setPrevView]     = useState("home");
  const [showCeremony,setShowCeremony]= useState(false);
  const [s2Prediction,setS2Prediction]= useState(null); // pid voted for S2 winner
  const [s2CdClock,  setS2CdClock]   = useState({d:0,h:0,m:0,s:0});

  const emptyForm=()=>({date:todayStr(),attendees:[],winner:"",kills:{},deaths:{},notes:"",placements:[],clip:""});
  const [sf,setSf]=useState(emptyForm());
  const [np,setNp]=useState({username:"",color:"#FFD700"});
  const [chartPid,setChartPid]=useState("");
  const [shareCard,setShareCard]=useState(null); // {sid, visible}
  const [confetti,setConfetti]=useState([]);
  const [foolsToast,setFoolsToast]=useState(0); // 0=hidden 1=warning 2=reveal
  const [lvlCard,setLvlCard]=useState(null); // {label, icon, color, phase:'in'|'out'}
  const [bootPhase,setBootPhase]=useState(0); // 0=logo 1=bar 2=done

  // ── Dual storage: window.storage (artifact) + localStorage (Netlify) ──
  const hasWS=typeof window!=="undefined"&&!!window.storage&&typeof window.storage.get==="function";
  const store={
    async get(k){if(hasWS)return window.storage.get(k).catch(()=>null);const v=window.localStorage?.getItem(k);return v?{value:v}:null;},
    async set(k,v){if(hasWS)return window.storage.set(k,v).catch(()=>null);window.localStorage?.setItem(k,v);return{value:v};},
  };
  const loadData=async()=>{
    try{
      // Version check — clears stale data from older builds
      const vr=await store.get("gn-version");
      const currentVer=vr?.value||null;
      if(currentVer!==STORAGE_VERSION){
        await store.set("gn-version",STORAGE_VERSION);
        await store.set("gn-players",JSON.stringify(INITIAL_PLAYERS));
        await store.set("gn-sessions",JSON.stringify(INITIAL_SESSIONS));
        setPlayers(INITIAL_PLAYERS);setSessions(INITIAL_SESSIONS);
      } else {
        const pr=await store.get("gn-players");
        const sr=await store.get("gn-sessions");
        setPlayers(pr?JSON.parse(pr.value):INITIAL_PLAYERS);
        const saved=sr?JSON.parse(sr.value):null;
        setSessions(saved&&saved.length>0?saved:INITIAL_SESSIONS);
        const today=todayStr();
        const pollKey=`gn-poll-${today}`;
        const pv=await store.get(pollKey);
        if(pv?.value){setPollVote(pv.value);}
        // S2 prediction vote
        const s2pv=await store.get("gn-s2-prediction");
        if(s2pv?.value){setS2Prediction(s2pv.value);}
        // Season 2 transition ceremony — fires once on April 1+
        if(today>="2026-04-01"){
          const seen=await store.get("gn-s2-ceremony-seen");
          if(!seen?.value){setShowCeremony(true);}
        }
      }
    }catch{setPlayers(INITIAL_PLAYERS);setSessions(INITIAL_SESSIONS);}
    setLoaded(true);
  };

  // ── load ──
  useEffect(()=>{loadData();},[]);
  const persist=async(p,s)=>{
    try{
      await store.set("gn-players",JSON.stringify(p));
      await store.set("gn-sessions",JSON.stringify(s));
    }catch{}
  };

  // ── clock ──
  useEffect(()=>{
    const tick=()=>{
      const isLive=isLiveNow();setLive(isLive);
      if(!isLive){const diff=getNextSession()-new Date();
        if(diff>0){const t=Math.floor(diff/1000);
          setCd({d:Math.floor(t/86400),h:Math.floor((t%86400)/3600),m:Math.floor((t%3600)/60),s:t%60});}}
    };
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[]);

  // ── S2 launch countdown ──
  useEffect(()=>{
    if(todayStr()>="2026-04-01")return;
    const tick=()=>{
      const s2Launch=new Date("2026-04-01T17:00:00Z"); // 5PM UTC, first session
      const diff=s2Launch-new Date();
      if(diff<=0){setS2CdClock({d:0,h:0,m:0,s:0});return;}
      const t=Math.floor(diff/1000);
      setS2CdClock({d:Math.floor(t/86400),h:Math.floor((t%86400)/3600),m:Math.floor((t%3600)/60),s:t%60});
    };
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[]);

  // ── Game boot sequence ──
  useEffect(()=>{
    // Phase 0 → 1 after 600ms (logo visible, start bar)
    const t1=setTimeout(()=>setBootPhase(1),600);
    // Phase 1 → 2 after 1800ms (bar fills, fade out)
    const t2=setTimeout(()=>setBootPhase(2),1800);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);

  // ── April Fools: confetti burst + fake alert ──
  useEffect(()=>{
    if(!isFoolsDay())return;
    // Confetti — 20 pieces, different colors and timings
    const colors=["#FF4D8F","#FFD700","#C77DFF","#00E5FF","#FF6B35","#00FF94","#FF6B6B","#4ECDC4"];
    const pieces=Array.from({length:20},(_,i)=>({
      id:i,
      color:colors[i%colors.length],
      left:Math.random()*100,
      delay:Math.random()*1.5,
      duration:2+Math.random()*2,
      size:6+Math.random()*8,
    }));
    setConfetti(pieces);
    const t=setTimeout(()=>setConfetti([]),4000);
    // Fake alert — shows at 2s, changes at 5s, gone at 8s
    const t1=setTimeout(()=>setFoolsToast(1),2000);
    const t2=setTimeout(()=>setFoolsToast(2),5000);
    const t3=setTimeout(()=>setFoolsToast(0),8000);
    return()=>{clearTimeout(t);clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[]);

  useEffect(()=>{
    if(typeof window==="undefined")return;
    const h=()=>setShowScroll(window.scrollY>320);
    window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);
  },[]);

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),3000);};
  const LEVEL_MAP={
    home:     {label:"HOME BASE",     icon:"⚡",color:"#FF6B35"},
    leaderboard:{label:"THE ARENA",   icon:"⚔️", color:"#FFD700"},
    lobbies:  {label:"WAR ROOM",      icon:"🎮",color:"#FF4D8F"},
    hof:      {label:"LEGENDS WING",  icon:"🏛️",color:"#C77DFF"},
    rivals:   {label:"RIVALS",        icon:"⚔️", color:"#FF4D8F"},
    records:  {label:"THE VAULT",     icon:"🏅",color:"#C77DFF"},
    charts:   {label:"INTEL",         icon:"📈",color:"#00FF94"},
    season1:  {label:"S1 ARCHIVE",    icon:"🏆",color:"#FFD700"},
    season2:  {label:"SEASON 2",      icon:"🚀",color:"#00E5FF"},
    faq:      {label:"BRIEFING ROOM", icon:"❓",color:"#7B8CDE"},
    profile:  {label:"COMBAT FILE",   icon:"👤",color:"#FF6B35"},
    admin:    {label:"COMMAND",       icon:"⚙️",color:"#FF5252"},
  };
  const go=v=>{
    setPrevView(view);
    setMobileOpen(false);
    const lv=LEVEL_MAP[v];
    if(lv&&v!==view){
      setLvlCard({...lv,phase:"in"});
      setTimeout(()=>{
        setView(v);
        if(typeof window!=="undefined")window.scrollTo({top:0,behavior:"instant"});
        setLvlCard(c=>c?{...c,phase:"out"}:null);
        setTimeout(()=>setLvlCard(null),500);
      },700);
    } else {
      setView(v);
      if(typeof window!=="undefined")window.scrollTo({top:0,behavior:"smooth"});
    }
  };

  // ── stats engine ──
  // "latest" = the most recent date that has sessions (not necessarily calendar today)
  const getLatestSessionDate = (src=sessions) => {
    if(!src.length) return todayStr();
    return [...src].sort((a,b)=>b.date.localeCompare(a.date))[0].date;
  };

  const getPeriodSessions = (period=lbPeriod) => {
    if(period==="today") return sessions.filter(s=>s.date===getLatestSessionDate());
    if(period==="week"){
      // Calendar week — Monday to latest session date, same logic as getWeeklyAwards
      const latestDate=getLatestSessionDate();
      if(!latestDate)return[];
      const d=new Date(latestDate+"T12:00:00Z");
      const weekStart=new Date(d);
      weekStart.setDate(d.getDate()-((d.getDay()+6)%7));
      const ws=weekStart.toISOString().split("T")[0];
      return sessions.filter(s=>s.date>=ws&&s.date<=latestDate);
    }
    return sessions;
  };

  const getStats=(pid, src=sessions)=>{
    const ps=src.filter(s=>s.attendees?.includes(pid));
    const kills=ps.reduce((n,s)=>n+(s.kills?.[pid]||0),0);
    const deaths=ps.reduce((n,s)=>n+(s.deaths?.[pid]||0),0);
    const wins=ps.filter(s=>s.winner===pid).length;
    const appearances=ps.length;
    const biggestGame=ps.length?Math.max(...ps.map(s=>s.kills?.[pid]||0)):0;
    // K/G (kills per game) — deaths not tracked so K/D would be meaningless
    const kd=appearances>0?parseFloat((kills/appearances).toFixed(2)):0;
    const winRate=appearances>0?Math.round((wins/appearances)*100):0;
    return{kills,deaths,wins,appearances,biggestGame,kd,winRate};
  };

  const allStats=(src=sessions)=>players.map(p=>({...p,...getStats(p.id,src)}));

  const getRank=pid=>{
    const st=getStats(pid),all=allStats();
    const byW=[...all].sort((a,b)=>b.wins-a.wins);
    const byK=[...all].sort((a,b)=>b.kills-a.kills);
    const champion=byW.find(p=>p.wins>0);
    const reaper=byK.find(p=>p.kills>0&&p.id!==champion?.id);
    // Sharpshooter = best K/G (min 5 appearances), not already Champion or Reaper
    const byKD=[...all].filter(p=>p.appearances>=5).sort((a,b)=>b.kd-a.kd);
    const sharpshooter=byKD.find(p=>p.id!==champion?.id&&p.id!==reaper?.id);
    // Ride or Die = most appearances, not already holding a special title
    const byA=[...all].sort((a,b)=>b.appearances-a.appearances||b.wins-a.wins);
    const rideordie=byA.find(p=>p.id!==champion?.id&&p.id!==reaper?.id&&p.id!==sharpshooter?.id&&p.appearances>0);
    if(champion?.id===pid)    return{title:"👑 The Champion",  color:"#FFD700"};
    if(reaper?.id===pid)      return{title:"💀 The Reaper",    color:"#FF4D8F"};
    if(sharpshooter?.id===pid)return{title:"🎯 Sharpshooter", color:"#00E5FF"};
    if(rideordie?.id===pid)   return{title:"🎮 Ride or Die",   color:"#FFAB40"};
    if(st.wins>=10)return{title:"⚡ Legend",      color:"#C77DFF"};
    if(st.wins>=6) return{title:"🔥 Veteran",     color:"#FFAB40"};
    if(st.wins>=3) return{title:"⭐ Gunslinger",  color:"#40C4FF"};
    if(st.wins>=1) return{title:"🌟 Rising Star", color:"#00FF94"};
    return{title:"🎮 Rookie",color:"#7a6eaa"};
  };

  const getStreak=pid=>{
    // Best consecutive win streak within a SINGLE day — no cross-day rollover.
    const sorted=[...sessions].sort((a,b)=>new Date(a.date)-new Date(b.date)||parseInt(a.id.slice(1))-parseInt(b.id.slice(1)));
    const played=sorted.filter(s=>s.attendees?.includes(pid));
    let best=0,cur=0,lastDate="";
    for(const s of played){
      if(s.date!==lastDate){cur=0;lastDate=s.date;}
      if(s.winner===pid){cur++;if(cur>best)best=cur;}else cur=0;
    }
    return best;
  };

  const getBadges=pid=>{
    const st=getStats(pid),b=[];
    const streak=getStreak(pid);
    if(streak>=3)b.push({icon:"🔥",label:`${streak} Streak`,hot:true});
    else if(streak>=2)b.push({icon:"🔥",label:`${streak} Streak`});
    if(st.wins>0)b.push({icon:"🏆",label:"Winner"});
    if(st.appearances>=sessions.length&&sessions.length>=4)b.push({icon:"📅",label:"Full House"});
    if(st.kills>=500)b.push({icon:"💀",label:"500 Kills"});
    if(st.kills>=100)b.push({icon:"🎖️",label:"100 Kills"});
    else if(st.kills>=50)b.push({icon:"💥",label:"50 Kills"});
    if(st.kd>=2&&st.appearances>=2)b.push({icon:"⚡",label:"2.0+ K/G"});
    if(st.biggestGame>=10)b.push({icon:"🌟",label:"Big Game"});
    else if(st.biggestGame>=6)b.push({icon:"🗡️",label:"Assassin"});
    if(st.winRate>=50&&st.appearances>=3)b.push({icon:"🎯",label:"50% WR"});
    // Iron Wall: top 3 in 10+ lobbies
    const top3=sessions.filter(s=>s.attendees?.includes(pid)&&(s.placements||s.attendees).slice(0,3).includes(pid)).length;
    if(top3>=10)b.push({icon:"🧱",label:"Iron Wall"});
    // Marathon: 15+ lobbies in any single day
    const byDay={};sessions.filter(s=>s.attendees?.includes(pid)).forEach(s=>{byDay[s.date]=(byDay[s.date]||0)+1;});
    if(Object.values(byDay).some(v=>v>=15))b.push({icon:"📆",label:"Marathon"});
    // Hot Hand: 3+ wins in a single day
    const dayWins={};
    sessions.filter(s=>s.attendees?.includes(pid)&&s.winner===pid).forEach(s=>{
      dayWins[s.date]=(dayWins[s.date]||0)+1;
    });
    if(Object.values(dayWins).some(v=>v>=3))b.push({icon:"🌊",label:"Hot Hand",hot:true});
    // Never 1st: 20+ appearances, 0 wins
    if(st.appearances>=20&&st.wins===0)b.push({icon:"🤝",label:"Never 1st"});
    // Rampage: 6+ kills in a single lobby, 3+ times
    const rampageGames=sessions.filter(s=>s.attendees?.includes(pid)&&(s.kills?.[pid]||0)>=6).length;
    if(rampageGames>=3)b.push({icon:"☄️",label:"Rampage",hot:true});
    // Easter Egg: played on Apr 4, 2026
    const playedEaster=sessions.some(s=>s.date==="2026-04-04"&&s.attendees?.includes(pid));
    if(playedEaster)b.push({icon:"🥚",label:"Easter Egg"});
    // Day One: played at any point during month one (March or first week of April 2026)
    if(st.appearances>=1)b.push({icon:"🎂",label:"Day One"});
    // No Days Off: played on Good Friday Apr 3, 2026
    const playedGoodFriday=sessions.some(s=>s.date==="2026-04-03"&&s.attendees?.includes(pid));
    if(playedGoodFriday)b.push({icon:"💪",label:"No Days Off"});
    // ── Season 2 exclusive badges ──
    const s2=SEASONS.find(x=>x.id==="s2");
    if(s2){
      const s2Sessions=sessions.filter(s=>s.date>=s2.start&&s.date<=s2.end);
      // Opening Night: played on first S2 session day
      const s2Days=[...new Set(s2Sessions.map(s=>s.date))].sort();
      if(s2Days.length>0&&s2Sessions.some(s=>s.date===s2Days[0]&&s.attendees?.includes(pid)))
        b.push({icon:"🌅",label:"Opening Night"});
      // First Blood S2: first player to win a S2 lobby
      const s2Wins=[...s2Sessions].sort((a,z)=>parseInt(a.id.slice(1))-parseInt(z.id.slice(1))).filter(s=>s.winner);
      if(s2Wins.length>0&&s2Wins[0].winner===pid)
        b.push({icon:"🚀",label:"First Blood S2",hot:true});
      // S2 Champion: most wins in S2
      const s2WinMap={};
      s2Sessions.forEach(s=>{if(s.winner)s2WinMap[s.winner]=(s2WinMap[s.winner]||0)+1;});
      const topS2Winner=Object.entries(s2WinMap).sort((a,z)=>z[1]-a[1])[0];
      if(topS2Winner&&topS2Winner[0]===pid&&topS2Winner[1]>0)
        b.push({icon:"👑",label:"S2 Champion",hot:true});
    }
    // Fool's Crown: won a lobby on April Fools Day
    const wonAprilFools=sessions.some(s=>s.date==="2026-04-01"&&s.winner===pid);
    if(wonAprilFools)b.push({icon:"🃏",label:"Fool's Crown",hot:true});

    // ── Season 1 Legacy Badges ──
    const s1Sessions=sessions.filter(s=>s.date>="2026-03-01"&&s.date<="2026-03-31");
    if(s1Sessions.length>0){
      // S1 Champion: most wins in S1
      const s1WinMap={};
      s1Sessions.forEach(s=>{if(s.winner)s1WinMap[s.winner]=(s1WinMap[s.winner]||0)+1;});
      const s1Champion=Object.entries(s1WinMap).sort((a,z)=>z[1]-a[1])[0];
      if(s1Champion&&s1Champion[0]===pid)
        b.push({icon:"🏆",label:"S1 Champion",hot:true});

      // S1 Reaper: most kills in S1
      const s1KillMap={};
      s1Sessions.forEach(s=>Object.entries(s.kills||{}).forEach(([p,k])=>{s1KillMap[p]=(s1KillMap[p]||0)+k;}));
      const s1Reaper=Object.entries(s1KillMap).sort((a,z)=>z[1]-a[1])[0];
      if(s1Reaper&&s1Reaper[0]===pid)
        b.push({icon:"💀",label:"S1 Reaper",hot:true});

      // S1 Podium: top 2nd/3rd/4th by wins (champion excluded — they get the better badge)
      const s1Standings=Object.entries(s1WinMap).sort((a,z)=>z[1]-a[1]);
      const podiumPids=s1Standings.slice(1,4).map(x=>x[0]); // positions 2,3,4
      if(podiumPids.includes(pid))
        b.push({icon:"🥈",label:"S1 Podium"});

      // S1 Record Breaker: best single game of S1
      let s1BestGame={pid:"",k:0};
      s1Sessions.forEach(s=>Object.entries(s.kills||{}).forEach(([p,k])=>{if(k>s1BestGame.k)s1BestGame={pid:p,k};}));
      if(s1BestGame.pid===pid)
        b.push({icon:"☄️",label:"S1 Record Breaker",hot:true});

      // S1 Iron Man: most appearances in S1
      const s1AppMap={};
      s1Sessions.forEach(s=>(s.attendees||[]).forEach(p=>{s1AppMap[p]=(s1AppMap[p]||0)+1;}));
      const s1IronMan=Object.entries(s1AppMap).sort((a,z)=>z[1]-a[1])[0];
      if(s1IronMan&&s1IronMan[0]===pid)
        b.push({icon:"🛡️",label:"S1 Iron Man"});
    }

    return b;
  };

  // ── latest session day MVP ──
  // ── Player Level — XP: appearances×1, wins×3, kills×0.5, badges×10, seasons×25 ──
  const getPlayerLevel=(pid)=>{
    const st=getStats(pid);
    const badges=getBadges(pid);
    const seasonsPlayed=SEASONS.filter(s=>sessions.some(x=>x.date>=s.start&&x.date<=s.end&&x.attendees?.includes(pid))).length;
    const xp=Math.floor(
      st.appearances*1 +
      st.wins*3 +
      st.kills*0.5 +
      badges.length*10 +
      seasonsPlayed*25
    );
    const lvl=Math.max(1,Math.floor(Math.sqrt(xp/8)));
    const xpForNext=Math.pow(lvl+1,2)*8;
    const xpForCurrent=Math.pow(lvl,2)*8;
    const progress=Math.min(100,Math.round(((xp-xpForCurrent)/(xpForNext-xpForCurrent))*100));
    return{xp,lvl,progress,xpForNext};
  };

  // ── Daily MVP ──
  const getDailyMVP=()=>{
    const latestDate=getLatestSessionDate();
    const latestSess=sessions.filter(s=>s.date===latestDate);
    if(!latestSess.length)return null;
    const ts=allStats(latestSess).filter(p=>p.appearances>0);
    if(!ts.length)return null;
    // Kill king = highest kills in a SINGLE lobby today (handles ties)
    let killKingK=0;
    latestSess.forEach(s=>{
      Object.values(s.kills||{}).forEach(k=>{if(k>killKingK)killKingK=k;});
    });
    // Collect ALL players who hit that max in any lobby
    const killKings=[];
    if(killKingK>0){
      latestSess.forEach(s=>{
        Object.entries(s.kills||{}).forEach(([pid,k])=>{
          if(k===killKingK){
            const p=ts.find(x=>x.id===pid);
            if(p&&!killKings.find(x=>x.id===pid))
              killKings.push({...p,killKingK,killKingSid:s.id});
          }
        });
      });
    }
    return{
      date:latestDate,
      topWinner:[...ts].sort((a,b)=>b.wins-a.wins||b.kills-a.kills)[0],
      topKiller:[...ts].sort((a,b)=>b.kills-a.kills||b.wins-a.wins)[0],
      topAppear:[...ts].sort((a,b)=>b.appearances-a.appearances)[0],
      killKing:killKings.length>0?killKings[0]:null,
      killKings,
    };
  };

  // ── 1st vs 2nd duels (true head-to-head) ──
  const getRivals=()=>{
    const duels={};
    sessions.forEach(s=>{
      const pl=s.placements||s.attendees;
      if(!pl||pl.length<2)return;
      const first=pl[0],second=pl[1];
      const key=[first,second].sort().join(":");
      if(!duels[key]){
        const ids=key.split(":");
        duels[key]={p1:ids[0],p2:ids[1],p1wins:0,p2wins:0,total:0};
      }
      // whoever finished 1st wins the duel
      if(duels[key].p1===first) duels[key].p1wins++;
      else duels[key].p2wins++;
      duels[key].total++;
    });
    return Object.values(duels).sort((a,b)=>b.total-a.total);
  };


  // ── go to player profile ──
  const goProfile=pid=>{
    setPrevView(view);
    setProfileId(pid);
    const lv=LEVEL_MAP["profile"];
    if(lv&&view!=="profile"){
      setLvlCard({...lv,phase:"in"});
      setTimeout(()=>{
        setView("profile");
        if(typeof window!=="undefined")window.scrollTo({top:0,behavior:"instant"});
        setLvlCard(c=>c?{...c,phase:"out"}:null);
        setTimeout(()=>setLvlCard(null),500);
      },700);
    } else {
      setView("profile");
      if(typeof window!=="undefined")window.scrollTo({top:0,behavior:"smooth"});
    }
  };

  // ── season sessions ──
  const getSeasonSessions=sid=>{
    if(sid==="all")return sessions;
    const s=SEASONS.find(x=>x.id===sid);
    return s?sessions.filter(x=>x.date>=s.start&&x.date<=s.end):sessions;
  };

  // ── activity feed ──
  const getActivityFeed=()=>{
    const events=[];
    const sorted=[...sessions].sort((a,b)=>new Date(a.date)-new Date(b.date)||parseInt(a.id.slice(1))-parseInt(b.id.slice(1)));
    players.forEach(p=>{
      let cur=0,lastD="";
      sorted.filter(s=>s.attendees?.includes(p.id)).forEach(s=>{
        if(s.date!==lastD){cur=0;lastD=s.date;}
        if(s.winner===p.id){cur++;if(cur===3||cur===5||cur===7)events.push({type:"streak",pid:p.id,val:cur,date:s.date,sid:s.id});}
        else cur=0;
      });
    });
    players.forEach(p=>{
      let total=0;
      sorted.filter(s=>s.attendees?.includes(p.id)).forEach(s=>{
        const prev=total;total+=s.kills?.[p.id]||0;
        [50,100,150,200].forEach(m=>{if(prev<m&&total>=m)events.push({type:"kills",pid:p.id,val:m,date:s.date,sid:s.id});});
      });
    });
    players.forEach(p=>{
      let total=0;
      sorted.filter(s=>s.attendees?.includes(p.id)&&s.winner===p.id).forEach(s=>{
        total++;
        if(total===1)events.push({type:"firstwin",pid:p.id,val:1,date:s.date,sid:s.id});
        [5,10,15,20].forEach(m=>{if(total===m)events.push({type:"wins",pid:p.id,val:m,date:s.date,sid:s.id});});
      });
    });
    players.forEach(p=>{
      let maxK=0;
      sorted.filter(s=>s.attendees?.includes(p.id)).forEach(s=>{
        const k=s.kills?.[p.id]||0;
        if(k>maxK){if(k>=8)events.push({type:"record",pid:p.id,val:k,date:s.date,sid:s.id});maxK=k;}
      });
    });
    return events.sort((a,b)=>new Date(b.date)-new Date(a.date)||parseInt(b.sid?.slice(1)||0)-parseInt(a.sid?.slice(1)||0)).slice(0,8);
  };

  // ── weekly awards ──
  const getWeeklyAwards=()=>{
    const latestDate=getLatestSessionDate();
    if(!latestDate)return null;
    const d=new Date(latestDate+"T12:00:00Z");
    const weekStart=new Date(d);weekStart.setDate(d.getDate()-((d.getDay()+6)%7));
    const ws=weekStart.toISOString().split("T")[0];
    const wSess=sessions.filter(s=>s.date>=ws&&s.date<=latestDate);
    if(!wSess.length)return null;
    const wSt=allStats(wSess).filter(p=>p.appearances>0);
    const byW=[...wSt].sort((a,b)=>b.wins-a.wins||b.kills-a.kills);
    const byK=[...wSt].sort((a,b)=>b.kills-a.kills||b.wins-a.wins);
    const byKD=[...wSt].filter(p=>p.appearances>=3).sort((a,b)=>b.kd-a.kd);
    const byA=[...wSt].sort((a,b)=>b.appearances-a.appearances);
    const ice=[...wSt].filter(p=>p.wins===0&&p.appearances>=5).sort((a,b)=>b.appearances-a.appearances);
    return{week:ws,end:latestDate,lobbies:wSess.length,mvpWins:byW[0],mvpKills:byK[0],mvpKD:byKD[0],mvpActive:byA[0],iceCold:ice[0]||null};
  };
  // ── Weekly Missions — auto-generated from current week data ──
  const getWeeklyMissions=()=>{
    const weekSess=getPeriodSessions("week");
    const weekKills=weekSess.reduce((n,s)=>n+Object.values(s.kills||{}).reduce((a,b)=>a+b,0),0);
    const weekWinners=[...new Set(weekSess.filter(s=>s.winner).map(s=>s.winner))].length;
    const lobbiesTarget=15,killsTarget=60,winnersTarget=4;
    return[
      {icon:"🎮",color:"#00E5FF",label:"FULL DEPLOYMENT",
       desc:"15 lobbies played this week",
       progress:Math.min(weekSess.length,lobbiesTarget),target:lobbiesTarget,
       unit:`${weekSess.length} of ${lobbiesTarget} lobbies`},
      {icon:"💀",color:"#FF4D8F",label:"KILL QUOTA",
       desc:"Community racks up 60 kills",
       progress:Math.min(weekKills,killsTarget),target:killsTarget,
       unit:`${weekKills} of ${killsTarget} kills`},
      {icon:"👑",color:"#FFD700",label:"THRONE CONTESTED",
       desc:"4 different winners claim a lobby",
       progress:Math.min(weekWinners,winnersTarget),target:winnersTarget,
       unit:`${weekWinners} of ${winnersTarget} winners`},
    ];
  };

  // ── All-Time Records ──
  const getRecords=()=>{
    if(!sessions.length)return null;
    // Highest kills in a single game
    let topGame={pid:"",k:0,sid:"",date:""};
    sessions.forEach(s=>{
      Object.entries(s.kills||{}).forEach(([pid,k])=>{if(k>topGame.k)topGame={pid,k,sid:s.id,date:s.date};});
    });
    // Biggest single-day (most lobbies played in one day by anyone)
    const dayMap={};
    sessions.forEach(s=>{
      Object.keys(s.kills||{}).forEach(pid=>{
        const key=`${pid}|${s.date}`;
        dayMap[key]=(dayMap[key]||0)+1;
      });
    });
    let topDay={pid:"",count:0,date:""};
    Object.entries(dayMap).forEach(([key,n])=>{
      const[pid,date]=key.split("|");
      if(n>topDay.count)topDay={pid,count:n,date};
    });
    // Longest win streak (already computed per player — find best overall)
    let bestStreak={pid:"",streak:0};
    players.forEach(p=>{
      const s=getStreak(p.id);
      if(s>bestStreak.streak)bestStreak={pid:p.id,streak:s};
    });
    // Most wins all time
    const winMap={};
    sessions.forEach(s=>{if(s.winner)winMap[s.winner]=(winMap[s.winner]||0)+1;});
    const topWinner=Object.entries(winMap).sort((a,b)=>b[1]-a[1])[0]||["",0];
    // First ever session
    const first=[...sessions].sort((a,b)=>parseInt(a.id.slice(1))-parseInt(b.id.slice(1)))[0];
    // Most kills all time
    const killMap={};
    sessions.forEach(s=>Object.entries(s.kills||{}).forEach(([pid,k])=>{killMap[pid]=(killMap[pid]||0)+k;}));
    const topKiller=Object.entries(killMap).sort((a,b)=>b[1]-a[1])[0]||["",0];
    // Most kills in a single day by one player
    const dayKillMap2={};
    sessions.forEach(s=>{
      Object.entries(s.kills||{}).forEach(([pid,k])=>{
        const key=`${pid}|${s.date}`;
        dayKillMap2[key]=(dayKillMap2[key]||0)+k;
      });
    });
    let topDayKill={pid:"",k:0,date:""};
    Object.entries(dayKillMap2).forEach(([key,k])=>{
      const[pid,date]=key.split("|");
      if(k>topDayKill.k)topDayKill={pid,k,date};
    });
    return{topGame,topDay,bestStreak,topWinner,topKiller,topDayKill,first,totalSessions:sessions.length,totalKills:Object.values(killMap).reduce((a,b)=>a+b,0)};
  };

  // ── Performance chart data (per player, per week) ──
  const getChartData=(pid)=>{
    const sorted=[...sessions].sort((a,b)=>a.date.localeCompare(b.date)||parseInt(a.id.slice(1))-parseInt(b.id.slice(1)));
    const played=sorted.filter(s=>s.attendees?.includes(pid));
    if(!played.length)return[];
    // Group by date
    const byDate={};
    played.forEach(s=>{
      if(!byDate[s.date])byDate[s.date]={date:s.date,wins:0,kills:0,games:0};
      byDate[s.date].wins+=(s.winner===pid?1:0);
      byDate[s.date].kills+=(s.kills?.[pid]||0);
      byDate[s.date].games++;
    });
    return Object.values(byDate).sort((a,b)=>a.date.localeCompare(b.date));
  };

  // ── Player of the Week ──
  const getPOTW=()=>{
    const wa=getWeeklyAwards();
    if(!wa||!wa.mvpWins)return null;
    const p=players.find(x=>x.id===wa.mvpWins.id);
    if(!p)return null;
    const st=wa.mvpWins;
    return{player:p,wins:st.wins,kills:st.kills,games:st.appearances,kd:st.kd,week:wa.week};
  };

  // ── Heatmap data ──
  const getHeatmap=()=>{
    const map={};
    sessions.forEach(s=>{map[s.date]=(map[s.date]||0)+1;});
    return map;
  };

  // ── Live streak tracker — active streaks as of latest session day ──
  const getLiveStreaks=()=>{
    const latestDate=getLatestSessionDate();
    if(!latestDate)return[];
    const daySess=[...sessions]
      .filter(s=>s.date===latestDate)
      .sort((a,b)=>parseInt(a.id.slice(1))-parseInt(b.id.slice(1)));
    const streaks={};
    daySess.forEach(s=>{
      players.forEach(p=>{
        if(!s.attendees?.includes(p.id))return;
        if(!streaks[p.id])streaks[p.id]=0;
        if(s.winner===p.id)streaks[p.id]++;
        else streaks[p.id]=0;
      });
    });
    return players
      .filter(p=>(streaks[p.id]||0)>=2)
      .map(p=>({...p,streak:streaks[p.id]}))
      .sort((a,b)=>b.streak-a.streak);
  };

  // ── Day recap — full breakdown for a given date ──
  const getDayRecap=(date)=>{
    const daySess=[...sessions]
      .filter(s=>s.date===date)
      .sort((a,b)=>parseInt(a.id.slice(1))-parseInt(b.id.slice(1)));
    if(!daySess.length)return null;
    const totalKills=daySess.reduce((n,s)=>n+Object.values(s.kills||{}).reduce((a,b)=>a+b,0),0);
    const uniquePlayers=[...new Set(daySess.flatMap(s=>s.attendees||[]))];
    const winMap={};
    daySess.forEach(s=>{if(s.winner)winMap[s.winner]=(winMap[s.winner]||0)+1;});
    const topWinnerEntry=Object.entries(winMap).sort((a,b)=>b[1]-a[1])[0];
    let killKingK=0;
    daySess.forEach(s=>{
      Object.entries(s.kills||{}).forEach(([pid,k])=>{if(k>killKingK)killKingK=k;});
    });
    const killKingsList=[];
    daySess.forEach(s=>{
      Object.entries(s.kills||{}).forEach(([pid,k])=>{
        if(k===killKingK&&killKingK>0&&!killKingsList.find(x=>x.pid===pid))
          killKingsList.push({pid,k,sid:s.id,player:players.find(p=>p.id===pid)});
      });
    });
    const killKing=killKingsList[0]||{pid:"",k:0,sid:"",player:null};
    const winnersList=Object.entries(winMap)
      .sort((a,b)=>b[1]-a[1])
      .map(([pid,wins])=>({pid,wins,player:players.find(p=>p.id===pid)}));
    return{date,sessions:daySess,totalKills,uniquePlayers:uniquePlayers.length,
      topWinner:topWinnerEntry?{pid:topWinnerEntry[0],wins:topWinnerEntry[1],player:players.find(p=>p.id===topWinnerEntry[0])}:null,
      killKing:{...killKing,player:killKing.player||null},
      killKingsList,
      lobbies:daySess.length,winnersList};
  };

  // ── Form guide — last N results for a player ──
  const getFormGuide=(pid,n=5)=>{
    return [...sessions]
      .filter(s=>s.attendees?.includes(pid))
      .sort((a,b)=>new Date(b.date)-new Date(a.date)||parseInt(b.id.slice(1))-parseInt(a.id.slice(1)))
      .slice(0,n)
      .reverse() // oldest→newest so dots read left-to-right
      .map(s=>({win:s.winner===pid,sid:s.id,date:s.date,kills:s.kills?.[pid]||0}));
  };

  // ── Carry Score — wins where you also top-fragged that lobby ──
  const getCarryScore=(pid,src=sessions)=>{
    return src
      .filter(s=>s.attendees?.includes(pid)&&s.winner===pid)
      .filter(s=>{
        const topK=Math.max(0,...Object.values(s.kills||{}).map(Number));
        return topK>0&&(s.kills?.[pid]||0)>=topK;
      }).length;
  };

  // ── Drought Counter — lobbies since last win (0 if most recent game was a win) ──
  const getDrought=(pid)=>{
    const pSess=[...sessions]
      .filter(s=>s.attendees?.includes(pid))
      .sort((a,b)=>new Date(b.date)-new Date(a.date)||parseInt(b.id.slice(1))-parseInt(a.id.slice(1)));
    if(!pSess.length)return 0;
    if(pSess[0].winner===pid)return 0;
    const lastWinIdx=pSess.findIndex(s=>s.winner===pid);
    return lastWinIdx===-1?pSess.length:lastWinIdx;
  };

  // ── Consistency Rating — % of lobbies where you finished top half ──
  const getConsistency=(pid,src=sessions)=>{
    const pSess=src.filter(s=>s.attendees?.includes(pid));
    if(!pSess.length)return 0;
    const topHalf=pSess.filter(s=>{
      const pl=s.placements||s.attendees||[];
      const pos=pl.indexOf(pid);
      if(pos===-1)return false;
      return pos<Math.ceil(pl.length/2);
    }).length;
    return Math.round((topHalf/pSess.length)*100);
  };

  // ── Milestone alerts — upcoming badges/ranks this player is close to ──
  const getMilestones=(pid)=>{
    const st=getStats(pid);
    const alerts=[];
    // Kill milestones
    for(const [m,label] of [[50,"50 Kills"],[100,"100 Kills"],[150,"150 Kills"],[200,"200 Kills"]]){
      const gap=m-st.kills;
      if(gap>0&&gap<=15){alerts.push({icon:"💀",text:`${gap} kill${gap===1?"":"s"} from ${label}`,gap,color:"#FF4D8F"});break;}
    }
    // Win rank milestones
    for(const [m,rank,icon] of [[10,"Legend","⚡"],[6,"Veteran","🔥"],[3,"Gunslinger","⭐"],[1,"Rising Star","🌟"]]){
      const gap=m-st.wins;
      if(gap>0&&gap<=3){alerts.push({icon,text:`${gap} win${gap===1?"":"s"} away from ${rank}`,gap,color:"#C77DFF"});break;}
    }
    // Consistency milestone
    const cons=getConsistency(pid);
    if(cons>=45&&cons<50&&st.appearances>=5)alerts.push({icon:"🧱",text:`${50-cons}% consistency away from top-half badge`,gap:1,color:"#00FF94"});
    // Carry milestone
    const carry=getCarryScore(pid);
    if(carry>=1&&carry<5){const g=5-carry;alerts.push({icon:"🎖️",text:`${g} more carry win${g===1?"":"s"}: proving it means doing the damage too`,gap:g,color:"#FF6B35"});}
    return alerts.slice(0,2);
  };

  // ── Benchmark — who is this player chasing on the leaderboard ──
  const getBenchmark=(pid)=>{
    const sorted=allStats().filter(p=>p.wins>0).sort((a,b)=>b.wins-a.wins||b.kills-a.kills);
    const myIdx=sorted.findIndex(p=>p.id===pid);
    if(myIdx<=0)return null; // already first or not ranked
    const myStats=sorted[myIdx];
    const target=sorted[myIdx-1];
    const targetPlayer=players.find(p=>p.id===target.id);
    if(!targetPlayer)return null;
    const winGap=target.wins-myStats.wins;
    const killGap=target.kills-myStats.kills;
    return{target:targetPlayer,rank:myIdx+1,winGap,killGap,sameWins:winGap===0};
  };

  // ── Last Seen — most recent session date for a player ──
  const getLastSeen=(pid)=>{
    const pSess=sessions.filter(s=>s.attendees?.includes(pid));
    if(!pSess.length)return null;
    return pSess.reduce((latest,s)=>s.date>latest?s.date:latest,"");
  };

  // ── Days Active — distinct session days played ──
  const getDaysActive=(pid)=>{
    return[...new Set(sessions.filter(s=>s.attendees?.includes(pid)).map(s=>s.date))].length;
  };

  // ── Storylines engine — 8 lines, human, passionate, varied, no em dashes ──
  const getStorylines=()=>{
    if(!sessions.length||!players.length)return[];
    const allSt=allStats();
    const s2Sess=sessions.filter(s=>s.date>="2026-04-01");
    const s2St=allStats(s2Sess).filter(p=>p.appearances>0);
    const latestDate=getLatestSessionDate();
    const latestSess=sessions.filter(s=>s.date===latestDate);
    const seed=parseInt(latestDate.replace(/-/g,"").slice(-3),10)||0;
    const candidates=[];

    // S2 standings tension
    if(s2St.length>=2){
      const [first,second]=s2St.sort((a,b)=>b.wins-a.wins||b.kills-a.kills);
      const fp=players.find(p=>p.id===first.id);
      const sp=players.find(p=>p.id===second.id);
      const gap=first.wins-second.wins;
      if(fp&&sp){
        if(gap===0)
          candidates.push({icon:"👑",text:`${dn(fp.username)} and ${dn(sp.username)} are sitting on the same win count in Season 2. Dead level. The next person to win a lobby takes the lead outright.`,color:"#FFD700",w:6});
        else if(gap===1)
          candidates.push({icon:"👑",text:`${dn(fp.username)} leads Season 2 by a single win. ${dn(sp.username)} is right there and this season is nowhere near over.`,color:"#FFD700",w:6});
        else if(gap<=3)
          candidates.push({icon:"👑",text:`${dn(fp.username)} is ${gap} wins clear in Season 2 with ${first.wins} on the board. ${dn(sp.username)} needs a strong session to get back in the race.`,color:"#FFD700",w:5});
        else
          candidates.push({icon:"👑",text:`${dn(fp.username)} has opened up a ${gap}-win lead in Season 2. That kind of gap does not build by accident.`,color:"#FFD700",w:4});
      }
    }

    // All-time kill gap story
    const byKills=[...allSt].sort((a,b)=>b.kills-a.kills);
    const [k1,k2]=byKills;
    const kp1=k1?players.find(p=>p.id===k1.id):null;
    const kp2=k2?players.find(p=>p.id===k2.id):null;
    if(kp1&&k1.kills>0){
      const gap=k2?k1.kills-k2.kills:k1.kills;
      if(gap<15&&kp2)
        candidates.push({icon:"💀",text:`${dn(kp1.username)} still leads the all-time kill chart but ${dn(kp2.username)} is only ${gap} behind. That is one good session away from a new kill leader.`,color:"#FF4D8F",w:5});
      else if(gap<50&&kp2)
        candidates.push({icon:"💀",text:`${dn(kp1.username)} sits on ${k1.kills} all-time kills. ${dn(kp2.username)} is the closest challenger at ${k2.kills}. The gap is real but killable.`,color:"#FF4D8F",w:4});
      else
        candidates.push({icon:"💀",text:`${dn(kp1.username)} has ${k1.kills} all-time kills. Nobody else is close. Session after session, the damage adds up.`,color:"#FF4D8F",w:3});
    }

    // Last session big winner
    if(latestSess.length>0){
      const lastWinMap={};
      latestSess.forEach(s=>{if(s.winner)lastWinMap[s.winner]=(lastWinMap[s.winner]||0)+1;});
      const topLast=Object.entries(lastWinMap).sort((a,b)=>b[1]-a[1])[0];
      if(topLast){
        const tp=players.find(p=>p.id===topLast[0]);
        if(tp&&topLast[1]>=3)
          candidates.push({icon:"🔥",text:`${dn(tp.username)} won ${topLast[1]} lobbies last session. Not a fluke, not luck. That was a controlled performance.`,color:"#FF6B35",w:6});
        else if(tp&&topLast[1]>=2)
          candidates.push({icon:"🔥",text:`${dn(tp.username)} took ${topLast[1]} wins in the last session. Starting to build something.`,color:"#FF6B35",w:4});
      }
      // Last session kill highlight
      let topKid="",topKv=0,topKsid="";
      latestSess.forEach(s=>Object.entries(s.kills||{}).forEach(([pid,k])=>{if(k>topKv){topKv=k;topKid=pid;topKsid=s.id;}}));
      const tkp=topKid?players.find(p=>p.id===topKid):null;
      if(tkp&&topKv>=4)
        candidates.push({icon:"☄️",text:`${dn(tkp.username)} dropped ${topKv} kills in a single lobby last session (${topKsid}). That is the kind of game that gets talked about.`,color:"#FF6B35",w:5});
    }

    // Drought with personality
    let worstDrought={pid:"",gap:0};
    players.forEach(p=>{
      const pSess=[...sessions].filter(s=>s.attendees?.includes(p.id))
        .sort((a,b)=>new Date(b.date)-new Date(a.date)||parseInt(b.id.slice(1))-parseInt(a.id.slice(1)));
      if(!pSess.length||pSess[0].winner===p.id)return;
      const lastWin=pSess.findIndex(s=>s.winner===p.id);
      const gap=lastWin===-1?pSess.length:lastWin;
      if(gap>=5&&gap>worstDrought.gap)worstDrought={pid:p.id,gap};
    });
    if(worstDrought.gap>0){
      const dp=players.find(p=>p.id===worstDrought.pid);
      const dSt=dp?getStats(dp.id):null;
      if(dp&&dSt){
        if(dSt.wins===0)
          candidates.push({icon:"🤝",text:`${dn(dp.username)} has played ${dSt.appearances} lobbies and has not won one yet. But they keep coming back, which already puts them ahead of most.`,color:"#FFAB40",w:2});
        else if(worstDrought.gap>=12)
          candidates.push({icon:"🌵",text:`${dn(dp.username)} is ${worstDrought.gap} games deep into a rough stretch. They have ${dSt.wins} wins in this lobby. The drought ends when they decide it does.`,color:"#FFAB40",w:4});
        else
          candidates.push({icon:"🌵",text:`${dn(dp.username)} has not won in ${worstDrought.gap} games. Someone with that many career wins knows how to turn it around.`,color:"#FFAB40",w:3});
      }
    }

    // Streak going into next session
    const streamers=getLiveStreaks();
    if(streamers.length>0){
      const top=streamers[0];
      if(top.streak>=4)
        candidates.push({icon:"🔥",text:`${dn(top.username)} is on fire. ${top.streak} wins in a row to close the last session. Walk into the next lobby expecting them to keep going.`,color:"#FF6B35",w:5});
      else if(top.streak>=2)
        candidates.push({icon:"🔥",text:`${dn(top.username)} closed the last session winning ${top.streak} straight. There is momentum there and the lobby knows it.`,color:"#FF6B35",w:4});
    }

    // Kill milestone right there
    const killMilestones=[50,100,150,200,300,400,500];
    let bestChase={pid:"",gap:999,milestone:0};
    players.forEach(p=>{
      const st=getStats(p.id);
      for(const m of killMilestones){
        const gap=m-st.kills;
        if(gap>0&&gap<=8&&gap<bestChase.gap)bestChase={pid:p.id,gap,milestone:m};
      }
    });
    if(bestChase.pid){
      const cp=players.find(p=>p.id===bestChase.pid);
      if(cp)candidates.push({icon:"💥",text:`${dn(cp.username)} is ${bestChase.gap} kill${bestChase.gap===1?"":"s"} away from ${bestChase.milestone} total. That could happen in one lobby tonight.`,color:"#00E5FF",w:4});
    }

    // Win rank milestone
    for(const [m,rank,icon] of [[100,"100 wins","👑"],[50,"50 wins","🏆"],[25,"25 wins","⭐"],[10,"Legend","⚡"]]){
      let closest={pid:"",gap:999};
      players.forEach(p=>{
        const st=getStats(p.id);
        const gap=m-st.wins;
        if(gap>0&&gap<=3&&gap<closest.gap)closest={pid:p.id,gap};
      });
      if(closest.pid){
        const wp=players.find(p=>p.id===closest.pid);
        if(wp){
          candidates.push({icon,text:`${dn(wp.username)} is ${closest.gap} win${closest.gap===1?"":"s"} away from ${rank}. That is within reach tonight.`,color:"#C77DFF",w:4});
          break;
        }
      }
    }

    // H2H rivalry
    const rivalData=getRivals().filter(r=>r.total>=6);
    if(rivalData.length>0){
      const r=rivalData[seed%rivalData.length];
      const rp1=players.find(p=>p.id===r.p1),rp2=players.find(p=>p.id===r.p2);
      if(rp1&&rp2){
        const leader=r.p1wins>r.p2wins?rp1:r.p2wins>r.p1wins?rp2:null;
        const trailer=leader?.id===rp1.id?rp2:rp1;
        const lW=Math.max(r.p1wins,r.p2wins),tW=Math.min(r.p1wins,r.p2wins);
        if(leader&&trailer&&lW!==tW)
          candidates.push({icon:"⚔️",text:`When ${dn(leader.username)} and ${dn(trailer.username)} land 1st and 2nd in the same lobby, ${dn(leader.username)} has come out on top ${lW} times versus ${tW}. ${dn(trailer.username)} is not done trying.`,color:"#FF4D8F",w:3});
        else if(rp1&&rp2)
          candidates.push({icon:"⚔️",text:`${dn(rp1.username)} versus ${dn(rp2.username)}. Exactly ${r.total} times they have finished 1st and 2nd in the same lobby. Still level. Still running it back.`,color:"#FF4D8F",w:3});
      }
    }

    // Efficiency angle
    const highEff=[...allSt].filter(p=>p.appearances>=10&&p.winRate>=25).sort((a,b)=>b.winRate-a.winRate)[0];
    const hep=highEff?players.find(p=>p.id===highEff.id):null;
    if(hep)candidates.push({icon:"📊",text:`${dn(hep.username)} wins ${highEff.winRate}% of the lobbies they enter. Out of ${highEff.appearances} games, ${highEff.wins} wins. That rate puts them in a different bracket.`,color:"#00FF94",w:2});

    // Rising S2 player
    const rising=s2St.filter(p=>p.appearances>=3&&p.wins>=2)
      .sort((a,b)=>b.wins-a.wins)
      .find(p=>allSt.find(x=>x.id===p.id&&x.wins<=8));
    if(rising){
      const rp=players.find(p=>p.id===rising.id);
      if(rp)candidates.push({icon:"🎯",text:`${dn(rp.username)} is one of the stories of Season 2 so far with ${rising.wins}W already. Getting better every session and people are starting to notice.`,color:"#00E5FF",w:3});
    }

    // Sort by weight, use seed offset as tiebreaker for variety
    candidates.sort((a,b)=>b.w-a.w||(a.text.charCodeAt(2)+seed)%7-(b.text.charCodeAt(2)+seed)%7);
    return candidates.slice(0,8).map(({icon,text,color})=>({icon,text,color}));
  };
    const lines=[];
    if(!sessions.length||!players.length)return lines;
    const allSt=allStats();
    const s2Sess=sessions.filter(s=>s.date>="2026-04-01");
    const s2St=allStats(s2Sess).filter(p=>p.appearances>0);
    const latestDate=getLatestSessionDate();
    const latestSess=sessions.filter(s=>s.date===latestDate);
    const allDays=[...new Set(sessions.map(s=>s.date))].sort();
    // Seed rotation from date so it changes each session day
    const seed=latestDate.replace(/-/g,"").slice(-3);
    const rotate=(arr,n)=>arr.slice(n%arr.length).concat(arr.slice(0,n%arr.size));
    const offset=parseInt(seed,10)||0;

  const getShareData=(sid)=>{
    const s=sessions.find(x=>x.id===sid);
    if(!s)return null;
    const winner=players.find(p=>p.id===s.winner);
    const topKiller=s.attendees?.reduce((best,pid)=>
      (s.kills?.[pid]||0)>(s.kills?.[best]||0)?pid:best, s.attendees?.[0]);
    const tkPlayer=players.find(p=>p.id===topKiller);
    const tkKills=s.kills?.[topKiller]||0;
    const totalKills=Object.values(s.kills||{}).reduce((a,b)=>a+b,0);
    const players_count=s.attendees?.length||0;
    const dd=new Date(s.date+"T12:00:00Z");
    const dateLabel=dd.toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    const winnerKills=s.kills?.[s.winner]||0;
    const sessionNum=parseInt(sid.replace("s","").replace("es",""));
    return{s,winner,tkPlayer,tkKills,totalKills,players_count,dateLabel,winnerKills,sessionNum:isNaN(sessionNum)?sid:sessionNum};
  };

  // ── Season 1 wrap data ──
  const getS1Wrap=()=>{
    const s1=getSeasonSessions("s1");
    if(!s1.length)return null;
    const s1Stats=allStats(s1).filter(p=>p.appearances>0);
    const byWins=[...s1Stats].sort((a,b)=>b.wins-a.wins||b.kills-a.kills);
    const byKills=[...s1Stats].sort((a,b)=>b.kills-a.kills);
    const byKD=[...s1Stats].filter(p=>p.appearances>=5).sort((a,b)=>b.kd-a.kd);
    const byApp=[...s1Stats].sort((a,b)=>b.appearances-a.appearances);
    // Most improved: highest win rate gain in last 4 weeks vs first 2 weeks
    const midDate="2026-03-14";
    const early=allStats(s1.filter(s=>s.date<midDate)).filter(p=>p.appearances>=3);
    const late=allStats(s1.filter(s=>s.date>=midDate)).filter(p=>p.appearances>=3);
    let mostImproved=null,bestGain=-99;
    early.forEach(e=>{
      const l=late.find(x=>x.id===e.id);
      if(l){const gain=l.winRate-e.winRate;if(gain>bestGain){bestGain=gain;mostImproved={player:players.find(p=>p.id===e.id),earlyWR:e.winRate,lateWR:l.winRate,gain};}}
    });
    // Biggest single game
    let topGame={pid:"",k:0,sid:"",date:""};
    s1.forEach(s=>{Object.entries(s.kills||{}).forEach(([pid,k])=>{if(k>topGame.k)topGame={pid,k,sid:s.id,date:s.date};});});
    // Most kills in a single day (per player)
    const dayKillMap={};
    s1.forEach(s=>{
      Object.entries(s.kills||{}).forEach(([pid,k])=>{
        const key=`${pid}|${s.date}`;
        dayKillMap[key]=(dayKillMap[key]||0)+k;
      });
    });
    const topDayKillsRaw=Object.entries(dayKillMap)
      .map(([key,k])=>{const[pid,date]=key.split("|");return{pid,date,k};})
      .sort((a,b)=>b.k-a.k);
    const topDayKill=topDayKillsRaw[0]||null;
    // Top 5 for the leaderboard
    const topDayKillsTop5=topDayKillsRaw.slice(0,5).map(e=>({
      ...e,player:players.find(p=>p.id===e.pid)
    }));
    // Total stats
    const totalKills=s1.reduce((n,s)=>n+Object.values(s.kills||{}).reduce((a,b)=>a+b,0),0);
    const uniqueWins=[...new Set(s1.filter(s=>s.winner).map(s=>s.winner))].length;
    const days=[...new Set(s1.map(s=>s.date))].length;
    return{
      sessions:s1.length,totalKills,uniqueWins,days,
      champion:byWins[0],topKiller:byKills[0],
      sharpshooter:byKD[0],loyalist:byApp[0],
      mostImproved,topGame,
      topGamePlayer:players.find(p=>p.id===topGame.pid),
      topDayKill,topDayKillPlayer:topDayKill?players.find(p=>p.id===topDayKill.pid):null,
      topDayKillsTop5,
      podium:byWins.slice(0,3),
    };
  };

  // ── head-to-head ──
  const getH2H=(pA,pB)=>{
    if(!pA||!pB||pA===pB)return null;
    const shared=sessions.filter(s=>s.attendees?.includes(pA)&&s.attendees?.includes(pB));
    const aW=shared.filter(s=>s.winner===pA).length;
    const bW=shared.filter(s=>s.winner===pB).length;
    const aK=shared.reduce((n,s)=>n+(s.kills?.[pA]||0),0);
    const bK=shared.reduce((n,s)=>n+(s.kills?.[pB]||0),0);
    const duels=shared.filter(s=>{const pl=s.placements||s.attendees;return(pl[0]===pA&&pl[1]===pB)||(pl[0]===pB&&pl[1]===pA);});
    const aD=duels.filter(s=>(s.placements||s.attendees)[0]===pA).length;
    return{shared:shared.length,aWins:aW,bWins:bW,aKills:aK,bKills:bK,duels:duels.length,aDuels:aD,bDuels:duels.length-aD};
  };

  // ── top 3 stats in a lobby ──
  const getTopN=(pid,field="kills",n=3)=>{
    return [...sessions].filter(s=>s.attendees?.includes(pid))
      .sort((a,b)=>(b.kills?.[pid]||0)-(a.kills?.[pid]||0)).slice(0,n);
  };

  // ── leaderboard ──
  const getSortedLB=()=>{
    let src=sessions;
    if(lbSeason==="s1"){src=sessions.filter(x=>x.date>="2026-03-01"&&x.date<="2026-03-31");}
    else if(lbSeason==="s2"){src=sessions.filter(x=>x.date>="2026-04-01"&&x.date<="2026-04-30");}
    else if(lbSeason!=="all"){const s=SEASONS.find(x=>x.id===lbSeason);if(s)src=src.filter(x=>x.date>=s.start&&x.date<=s.end);}
    // For season/period views show only players who actually appeared; for all-time show everyone
    const base=allStats(src);
    const ranked= lbSeason==="all"&&lbPeriod==="all"
      ? base  // all time — show all
      : base.filter(p=>p.appearances>0);  // season/period — only who played
    return ranked.sort((a,b)=>{
      if(sortBy==="wins")       return b.wins-a.wins||b.kills-a.kills||b.appearances-a.appearances;
      if(sortBy==="kills")      return b.kills-a.kills||b.wins-a.wins;
      if(sortBy==="kd")         return b.kd-a.kd;
      if(sortBy==="winrate")    return b.winRate-a.winRate;
      if(sortBy==="appearances")return b.appearances-a.appearances;
      if(sortBy==="carry")      return getCarryScore(b.id,src)-getCarryScore(a.id,src);
      if(sortBy==="consistency")return getConsistency(b.id,src)-getConsistency(a.id,src);
      if(sortBy==="drought")    return getDrought(a.id)-getDrought(b.id);
      return b.wins-a.wins||b.kills-a.kills||b.appearances-a.appearances;
    });
  };

  const totalKills=sessions.reduce((n,s)=>n+Object.values(s.kills||{}).reduce((a,b)=>a+b,0),0);
  const uniqueWinners=[...new Set(sessions.filter(s=>s.winner).map(s=>s.winner))].length;
  const mvps=getDailyMVP();
  const latest=[...sessions].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  const foolsDay=isFoolsDay();

  // ── admin ──
  const handleLogin=()=>{
    if(adminInput===ADMIN_PASSWORD){setAdminMode(true);setShowLogin(false);go("admin");setAdminInput("");showToast("✅ Admin access granted!");}
    else showToast("❌ Wrong password!");
  };
  const toggleAtt=pid=>{
    const isIn=sf.attendees.includes(pid);
    const att=isIn?sf.attendees.filter(x=>x!==pid):[...sf.attendees,pid];
    const k={...sf.kills},d={...sf.deaths};
    if(isIn){delete k[pid];delete d[pid];}else{k[pid]=0;d[pid]=0;}
    setSf({...sf,attendees:att,kills:k,deaths:d,winner:isIn&&sf.winner===pid?"":sf.winner});
  };
  const postToDiscord=async(sess)=>{
    if(!DISCORD_WEBHOOK)return;
    const winner=players.find(p=>p.id===sess.winner);
    const tkPid=sess.attendees?.reduce((b,pid)=>(sess.kills?.[pid]||0)>(sess.kills?.[b]||0)?pid:b,sess.attendees?.[0]);
    const tkP=players.find(p=>p.id===tkPid);
    const tkK=sess.kills?.[tkPid]||0;
    const placements=(sess.placements||sess.attendees).slice(0,3).map((pid,i)=>{
      const p=players.find(x=>x.id===pid);
      const k=sess.kills?.[pid]||0;
      return `${["🥇","🥈","🥉"][i]} **${p?.username||pid}**${k>0?" ("+k+"K)":""}`;
    }).join("\n");
    const body={embeds:[{
      title:"🎮 Games Night · Lobby Result",
      color:0xFF6B35,
      fields:[
        {name:"🏆 Winner",value:winner?.username||"?",inline:true},
        {name:"💀 Top Fragger",value:tkP&&tkK>0?`${tkP.username} (${tkK}K)`:"—",inline:true},
        {name:"📅 Date",value:sess.date,inline:true},
        {name:"🏅 Top 3",value:placements,inline:false},
      ],
      footer:{text:`${SITE_TITLE} · ${sess.notes||sess.id}`},
      timestamp:new Date().toISOString(),
    }]};
    try{await fetch(DISCORD_WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});}
    catch(e){console.warn("Webhook failed",e);}
  };
  const handleSaveSession=()=>{
    if(!sf.date||!sf.winner||sf.attendees.length<2){showToast("⚠️ Need date, winner & 2+ players");return;}
    const placements=[sf.winner,...sf.attendees.filter(x=>x!==sf.winner)];
    if(editingSess){
      // Edit mode — replace existing session
      const updated={...editingSess,...sf,placements};
      const ns=sessions.map(s=>s.id===editingSess.id?updated:s);
      setSessions(ns);persist(players,ns);setEditingSess(null);setSf(emptyForm());showToast("✅ Lobby updated!");
    } else {
      // New session
      const ns=[{id:"ses"+Date.now(),...sf,placements},...sessions];
      setSessions(ns);persist(players,ns);postToDiscord({id:"ses"+Date.now(),...sf,placements});
      setSf(emptyForm());showToast("✅ Lobby saved!");
    }
  };
  const handleEditSession=s=>{
    setEditingSess(s);
    setSf({date:s.date,attendees:s.attendees||[],winner:s.winner||"",kills:s.kills||{},deaths:s.deaths||{},notes:s.notes||"",placements:s.placements||[],clip:s.clip||""});
    setAdminTab("session");setView("admin");(typeof window!=="undefined"&&window.scrollTo({top:0,behavior:"smooth"}));
    showToast("✏️ Editing lobby. Make changes and save");
  };
  const handleAddPlayer=()=>{
    if(!np.username.trim()){showToast("Enter a username!");return;}
    if(players.find(p=>p.username.toLowerCase()===np.username.trim().toLowerCase())){showToast("Already exists!");return;}
    const newP=[...players,{id:"pl"+Date.now(),username:np.username.trim(),color:np.color}];
    setPlayers(newP);persist(newP,sessions);setNp({username:"",color:"#FFD700"});
    showToast(`🎮 ${np.username.trim()} added!`);
  };
  const handleDelSession=id=>{
    if(!confirm("Delete this lobby?"))return;
    const ns=sessions.filter(s=>s.id!==id);setSessions(ns);persist(players,ns);showToast("Deleted.");
  };
  const handleDelPlayer=id=>{
    const p=players.find(x=>x.id===id);
    if(!confirm(`Remove ${p?.username}?`))return;
    const np2=players.filter(x=>x.id!==id);setPlayers(np2);persist(np2,sessions);showToast("Removed.");
  };

  // ── style atoms ──
  const card=(ex={})=>({background:"var(--card)",borderRadius:18,border:"1.5px solid var(--border)",...ex});
  const lbl={display:"block",color:"var(--text3)",fontWeight:800,fontSize:".72rem",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8};
  const inp=(ex={})=>({padding:"10px 14px",borderRadius:9,border:"2px solid var(--border)",background:"#190f3d",color:"#fff",fontSize:"1rem",outline:"none",...ex});
  const primaryBtn=(ex={})=>({border:"none",borderRadius:11,cursor:"pointer",fontFamily:"Fredoka One",fontSize:"1rem",padding:"13px 26px",color:"#fff",background:"linear-gradient(135deg,#FF6B35,#FF4D8F)",boxShadow:"0 4px 22px rgba(255,107,53,.5)",...ex});

  const navItems=[
    {id:"home",      l:"HOME BASE"},
    {id:"leaderboard",l:"THE ARENA"},
    {id:"profile",   l:"COMBAT FILE"},
    {id:"lobbies",   l:"WAR ROOM"},
    {id:"hof",       l:"LEGENDS WING"},
    {id:"rivals",    l:"RIVALS"},
    {id:"records",   l:"THE VAULT"},
    {id:"charts",    l:"INTEL"},
    {id:"season1",   l:"S1 ARCHIVE"},
    {id:"season2",   l:todayStr()<"2026-04-01"?`S2 ${s2CdClock.d>0?s2CdClock.d+"d":s2CdClock.h+"h"}`:"SEASON 2"},
    {id:"faq",       l:"BRIEFING"},
  ];

  // ── April Fools display name — scrambles on Apr 1 ──
  const dn=(username)=>foolsDay?scrambleName(username):username;

  // ── avatar ──
  // ── Intel hover card ──
  const IntelCard=({p})=>{
    const st=getStats(p.id);
    const rk=getRank(p.id);
    const form=getFormGuide(p.id,5);
    const dr=getDrought(p.id);
    return(
      <div className="intel-card" style={{border:`1px solid ${p.color}44`,borderTop:`2px solid ${p.color}`}}>
        <div className="bc9" style={{fontSize:".72rem",color:p.color,letterSpacing:".07em",marginBottom:4}}>
          {rk.title}
        </div>
        <div style={{display:"flex",gap:3,marginBottom:6}}>
          {form.map((f,i)=>(
            <div key={i} style={{width:8,height:8,borderRadius:"50%",
              background:f.win?p.color:"rgba(255,255,255,.2)",
              boxShadow:f.win?`0 0 5px ${p.color}88`:"none"}}/>
          ))}
        </div>
        <div className="bc7" style={{fontSize:".68rem",color:"#c8baff",letterSpacing:".05em"}}>
          {st.wins}W · {st.kills}K
          {dr>3&&<span style={{color:"#FF6B35",marginLeft:6}}>{dr}G drought</span>}
        </div>
      </div>
    );
  };

  // ── Avatar — intel card shown via CSS hover, zero hooks ──
  const Av=({p,size=44,glow=false,intel=false})=>(
    <div className="av-wrap">
      <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,
        background:`linear-gradient(135deg,${p.color},${p.color}88)`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontFamily:"Barlow Condensed",fontWeight:900,fontSize:size*.38+"px",color:"#fff",
        textShadow:"0 1px 4px rgba(0,0,0,.6)",
        boxShadow:glow?`0 0 24px ${p.color}66`:"none"}}>
        {p.username[0].toUpperCase()}
      </div>
      {intel&&<IntelCard p={p}/>}
    </div>
  );

  // ── TypedBio — proper component so it can use hooks ──
  // ── Badge flip — DOM classList toggle, no hooks ──

  // ── Game boot screen ──
  if(!loaded||bootPhase<2)return(
    <div className="boot-screen" style={{
      opacity:bootPhase===2?0:1,
      transition:"opacity .5s ease",
      pointerEvents:bootPhase===2?"none":"all"
    }}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      {/* Scanline */}
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",left:0,right:0,height:"2px",
          background:"linear-gradient(90deg,transparent,rgba(255,215,0,.15),transparent)",
          animation:"bootScan 2.5s linear infinite"}}/>
        <div style={{position:"absolute",inset:0,
          backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.08) 2px,rgba(0,0,0,.08) 4px)",
          pointerEvents:"none"}}/>
      </div>
      {/* Logo block */}
      <div style={{textAlign:"center",animation:"bootFade .6s ease both",marginBottom:48}}>
        <div style={{fontSize:"clamp(3rem,12vw,5rem)",marginBottom:8,
          animation:"bootPulse 2s ease-in-out infinite",lineHeight:1}}>🎯</div>
        <div style={{fontFamily:"Barlow Condensed",fontWeight:900,
          fontSize:"clamp(2.2rem,10vw,4rem)",letterSpacing:".12em",
          color:"#FFD700",lineHeight:1,textTransform:"uppercase",
          textShadow:"0 0 40px rgba(255,215,0,.5)"}}>
          GAMES NIGHT
        </div>
        <div style={{fontFamily:"Barlow Condensed",fontWeight:700,
          fontSize:"clamp(.7rem,2vw,1rem)",letterSpacing:".4em",
          color:"rgba(255,255,255,.3)",marginTop:8,textTransform:"uppercase"}}>
          BULLET LEAGUE · HOSTED BY MEKULA
        </div>
      </div>
      {/* Boot messages + bar */}
      <div style={{width:"min(320px,80vw)"}}>
        <div style={{fontFamily:"Barlow Condensed",fontSize:".75rem",
          letterSpacing:".15em",color:"rgba(0,229,255,.6)",
          marginBottom:10,animation:"bootBlink 1.8s ease-in-out infinite",
          textTransform:"uppercase"}}>
          {bootPhase===0?"Initialising arena…":bootPhase===1?"Loading player data…":"Ready."}
        </div>
        <div style={{height:3,background:"rgba(255,255,255,.08)",borderRadius:2,overflow:"hidden"}}>
          {bootPhase>=1&&<div style={{
            height:"100%",borderRadius:2,
            background:"linear-gradient(90deg,#FFD700,#FF6B35,#FF4D8F)",
            animation:"bootBar 1.1s cubic-bezier(.4,0,.2,1) forwards",
            boxShadow:"0 0 12px rgba(255,215,0,.6)"
          }}/>}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:8,
          fontFamily:"Barlow Condensed",fontSize:".65rem",
          letterSpacing:".1em",color:"rgba(255,255,255,.2)"}}>
          <span>S2 · ACTIVE</span>
          <span>v72</span>
          <span>mekulasgn.netlify.app</span>
        </div>
      </div>
    </div>
  );

  const sortedLB=foolsDay?[...getSortedLB()].reverse():getSortedLB();
  const filteredLB=lbSearch.trim()?sortedLB.filter(p=>p.username.toLowerCase().includes(lbSearch.toLowerCase())):sortedLB;
  const rivals=getRivals();
  const filteredRivals=rivalSearch.trim()
    ?rivals.filter(r=>{
        const p1=players.find(x=>x.id===r.p1),p2=players.find(x=>x.id===r.p2);
        return p1?.username.toLowerCase().includes(rivalSearch.toLowerCase())||p2?.username.toLowerCase().includes(rivalSearch.toLowerCase());
      })
    :rivals;

  // ════════════════════════════════════════════════════
  return(<>
    <style dangerouslySetInnerHTML={{__html:CSS}}/>
    {/* Global HUD scanline */}
    <div style={{
      position:"fixed",inset:0,zIndex:1,pointerEvents:"none",
      backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.04) 3px,rgba(0,0,0,.04) 4px)",
      mixBlendMode:"multiply",
    }}/>
    {/* Ambient zone glow — shifts colour per zone */}
    <div className="zone-glow-orb" style={{
      background:`radial-gradient(ellipse,${(LEVEL_MAP[view]||LEVEL_MAP.home).color}0d 0%,transparent 70%)`,
    }}/>
    {showScroll&&<button className="scroll-top" onClick={()=>(typeof window!=="undefined"&&window.scrollTo({top:0,behavior:"smooth"}))}>↑</button>}

    {/* TOAST */}
    {toast&&(
      <div style={{position:"fixed",top:20,right:20,zIndex:9999,
        background:"var(--card2)",border:"2px solid var(--orange)",color:"#fff",
        padding:"12px 22px",borderRadius:14,fontWeight:700,
        boxShadow:"0 6px 32px rgba(0,0,0,.7)",animation:"popIn .3s ease",
        maxWidth:"calc(100vw - 40px)"}}>
        {toast}
      </div>
    )}

    {/* ── Season 2 Transition Ceremony — fires once on April 1+ ── */}
    {showCeremony&&(
      <div onClick={async()=>{
        setShowCeremony(false);
        try{await store.set("gn-s2-ceremony-seen","1");}catch{}
      }} style={{
        position:"fixed",inset:0,zIndex:10000,
        background:"rgba(0,0,0,.97)",
        display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",
        cursor:"pointer",padding:24,
        animation:"popIn .4s ease"}}>
        {/* Particle ring */}
        <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
          {["🏆","💀","⚔️","🎮","🔥","⭐","💀","🏆","🎯","⚡"].map((e,i)=>(
            <span key={i} style={{
              position:"absolute",
              left:`${8+i*9}%`,
              top:`${10+((i*37)%70)}%`,
              fontSize:`${1+((i*3)%3)*.4}rem`,
              opacity:.07+((i%4)*.04),
              animation:`pulseA ${2+((i*0.3)%2)}s ease-in-out ${i*.2}s infinite`,
              pointerEvents:"none",userSelect:"none"
            }}>{e}</span>
          ))}
        </div>
        {/* Content */}
        <div style={{textAlign:"center",position:"relative",zIndex:1,maxWidth:520}}>
          <div style={{
            fontFamily:"Fredoka One",
            fontSize:".72rem",color:"#FFD700",
            letterSpacing:5,textTransform:"uppercase",
            marginBottom:24,opacity:.8}}>
            March 2026 · Closed
          </div>
          <div style={{
            fontFamily:"Fredoka One",
            fontSize:"clamp(2rem,10vw,4rem)",
            lineHeight:.95,marginBottom:24,
            background:"linear-gradient(135deg,#FFD700 0%,#FF6B35 35%,#FF4D8F 65%,#C77DFF 100%)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
            filter:"drop-shadow(0 0 60px rgba(255,107,53,.4))"}}>
            Season 1<br/>is over.
          </div>
          <div style={{
            fontFamily:"Fredoka One",
            fontSize:"clamp(1.2rem,5vw,2rem)",
            color:"rgba(255,255,255,.35)",
            marginBottom:32,letterSpacing:2}}>
            Rankings wiped. Scores reset.
          </div>
          <div style={{
            fontFamily:"Fredoka One",
            fontSize:"clamp(1.6rem,7vw,3rem)",
            lineHeight:1,marginBottom:36,
            background:"linear-gradient(135deg,#00E5FF,#00FF94,#C77DFF)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
            filter:"drop-shadow(0 0 40px rgba(0,229,255,.5))"}}>
            🚀 Season 2 begins.
          </div>
          <div style={{fontSize:".8rem",color:"rgba(255,255,255,.25)",fontWeight:700,letterSpacing:2}}>
            Tap anywhere to continue
          </div>
        </div>
      </div>
    )}

    {/* LOGIN MODAL */}
    {showLogin&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",
        display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
        <div style={{...card({border:"2px solid rgba(255,107,53,.4)"}),padding:32,width:"100%",maxWidth:320,animation:"popIn .3s ease"}}>
          <h3 style={{fontFamily:"Fredoka One",color:"#FFD700",fontSize:"1.5rem",marginBottom:18}}>🔐 Admin</h3>
          <input type="password" placeholder="Password…" value={adminInput}
            onChange={e=>setAdminInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            style={{...inp(),width:"100%",marginBottom:14}}/>
          <div style={{display:"flex",gap:10}}>
            <button onClick={handleLogin} style={{...primaryBtn(),flex:1,padding:"11px"}}>Login</button>
            <button onClick={()=>setShowLogin(false)} style={{flex:1,padding:"11px",borderRadius:9,
              border:"1.5px solid var(--border)",background:"transparent",color:"var(--text2)",cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      </div>
    )}

    {/* LIVE TICKER */}
    {live&&(
      <div style={{
        background:foolsDay?"linear-gradient(90deg,#1a0630,#300820,#1a0630)":"linear-gradient(90deg,#062516,#041a0f,#062516)",
        overflow:"hidden",height:34,display:"flex",alignItems:"center",
        borderBottom:foolsDay?"1px solid rgba(255,77,143,.4)":"1px solid rgba(0,255,148,.3)"}}>
        <div style={{whiteSpace:"nowrap",animation:"ticker 22s linear infinite",
          color:foolsDay?"#FF4D8F":"#00FF94",fontWeight:800,fontSize:".8rem",letterSpacing:2}}>
          {foolsDay
            ? "🃏 GAMES NIGHT LIVE · APRIL FOOLS EDITION · Nobody knows what's real anymore · 🃏 TUNE IN IF YOU DARE ·"
            : `🔴 GAMES NIGHT LIVE \u00a0·\u00a0 ${FEATURED_GAME} \u00a0·\u00a0 Hosted by ${HOSTED_BY} \u00a0·\u00a0 5–7 PM UTC \u00a0·\u00a0 📺 TUNE IN ON TWITCH \u00a0·\u00a0`
          }
        </div>
      </div>
    )}

    {/* NAV */}
    <nav style={{background:"rgba(22,13,46,.97)",backdropFilter:"blur(20px)",
      borderBottom:foolsDay?"1px solid rgba(255,77,143,.5)":"1px solid rgba(255,255,255,.08)",
      animation:foolsDay?"foolsShimmer 3s ease-in-out infinite":undefined,
      position:"sticky",top:0,zIndex:100,padding:"0 16px",height:58,
      display:"flex",alignItems:"center",gap:6}}>
      <div onClick={()=>go("home")} style={{cursor:"pointer",
        fontFamily:"Barlow Condensed",fontWeight:900,letterSpacing:".12em",
        fontSize:"1.1rem",color:"#FFD700",marginRight:8,flexShrink:0,
        textShadow:"0 0 16px rgba(255,215,0,.4)"}}>
        {foolsDay?"🃏":"⚡"} GN{foolsDay?" 🃏":""}
      </div>
      <div style={{width:1,height:22,background:"rgba(255,255,255,.1)",marginRight:4,flexShrink:0}}/>
      <div className="nav-desktop" style={{flex:1,display:"flex",gap:2,overflowX:"auto",scrollbarWidth:"none"}}>
        {navItems.map(item=>(
          <button key={item.id} className="nav-btn" onClick={()=>go(item.id)} style={{
            padding:"5px 10px",borderRadius:0,fontWeight:700,fontSize:".66rem",
            fontFamily:"Barlow Condensed",letterSpacing:".16em",
            color:view===item.id?(LEVEL_MAP[item.id]||LEVEL_MAP.home).color:"rgba(255,255,255,.3)",
            background:"none",border:"none",
            borderBottom:view===item.id?`2px solid ${(LEVEL_MAP[item.id]||LEVEL_MAP.home).color}`:"2px solid transparent",
            cursor:"pointer",height:58,transition:"color .13s",whiteSpace:"nowrap"}}>
            {item.l}
          </button>
        ))}
      </div>
      <div style={{flex:1}} className="show-mob"></div>
      <div className="hide-mob" style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
        <a href={DISCORD_URL} target="_blank" rel="noreferrer" style={{
          display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,
          background:"rgba(88,101,242,.25)",border:"1px solid rgba(88,101,242,.5)",
          color:"#a0aaff",fontWeight:700,fontSize:".76rem",textDecoration:"none"}}>💬 Discord</a>
        <a href={TWITCH_URL} target="_blank" rel="noreferrer" style={{
          display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,
          background:"rgba(145,71,255,.25)",border:"1px solid rgba(145,71,255,.5)",
          color:"#cc99ff",fontWeight:700,fontSize:".76rem",textDecoration:"none"}}>📺 Twitch</a>
      </div>
      {live&&<div className="live-glo hide-mob" style={{display:"flex",alignItems:"center",gap:6,
        background:"rgba(0,255,148,.1)",border:"1px solid rgba(0,255,148,.45)",
        borderRadius:50,padding:"4px 11px",flexShrink:0}}>
        <span className="pulse-a" style={{width:7,height:7,borderRadius:"50%",background:"#00FF94",display:"inline-block"}}></span>
        <span style={{color:"#00FF94",fontFamily:"Barlow Condensed",fontWeight:800,fontSize:".74rem",letterSpacing:".15em"}}>LIVE</span>
      </div>}
      {adminMode
        ?<button className="pill hide-mob" onClick={()=>go("admin")} style={{
            padding:"5px 11px",borderRadius:4,flexShrink:0,
            background:view==="admin"?"#FF4D8F":"rgba(255,77,143,.18)",
            border:"1px solid rgba(255,77,143,.5)",
            color:view==="admin"?"#fff":"#ff99c4",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:".72rem",letterSpacing:".1em"}}>⚙ COMMAND</button>
        :<button className="pill hide-mob" onClick={()=>setShowLogin(true)} style={{
            padding:"5px 10px",borderRadius:4,flexShrink:0,
            border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.05)",
            color:"rgba(255,255,255,.35)",fontFamily:"Barlow Condensed",fontWeight:700,fontSize:".72rem",letterSpacing:".1em"}}>🔒</button>
      }
      <button className="ham-btn" onClick={()=>setMobileOpen(v=>!v)} style={{
        padding:"6px 9px",background:"rgba(255,255,255,.08)",border:"1.5px solid var(--border)",
        borderRadius:8,color:"#fff",cursor:"pointer",fontSize:"1.15rem",
        display:"none",flexShrink:0,lineHeight:1}}>
        {mobileOpen?"✕":"☰"}
      </button>
    </nav>
    {/* Bottom zone accent line */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,height:2,zIndex:50,pointerEvents:"none",
      background:`linear-gradient(90deg,transparent,${(LEVEL_MAP[view]||LEVEL_MAP.home).color}66,transparent)`,
      transition:"background .7s ease"}}/>

    {/* MOBILE MENU */}
    {mobileOpen&&(
      <div className="mob-menu">
        {navItems.map(item=>(
          <button key={item.id} className={`mob-item${view===item.id?" active":""}`}
            onClick={()=>go(item.id)}>{item.l}</button>
        ))}
        {adminMode&&<button className={`mob-item${view==="admin"?" active":""}`} onClick={()=>go("admin")}>⚙️ Admin</button>}
        {!adminMode&&<button className="mob-item" onClick={()=>{setMobileOpen(false);setShowLogin(true);}}>🔒 Admin Login</button>}
        <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="mob-item"
          style={{textDecoration:"none",color:"#a0aaff",borderColor:"rgba(88,101,242,.4)"}}>💬 Discord</a>
        <a href={TWITCH_URL} target="_blank" rel="noreferrer" className="mob-item"
          style={{textDecoration:"none",color:"#cc99ff",borderColor:"rgba(145,71,255,.4)"}}>📺 Twitch</a>
      </div>
    )}

    {/* ════ MAIN ════ */}
    <main style={{maxWidth:1100,margin:"0 auto",padding:"clamp(12px,4vw,28px) clamp(8px,3vw,14px)",position:"relative",zIndex:2}}>

      {/* ═══════════════ HOME ═══════════════ */}
      {view==="home"&&(
        <div className="fade-up" style={{minHeight:"calc(100vh - 120px)"}}>
          {/* ── April Fools floating jesters ── */}
          {foolsDay&&(
            <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:5}}>
              {[{e:"🃏",t:"10%",l:"5%",delay:"0s",dur:"3.2s",anim:"jesterFloat"},
                {e:"🃏",t:"20%",r:"6%",delay:".7s",dur:"2.8s",anim:"jesterDrift"},
                {e:"🃏",t:"60%",l:"3%",delay:"1.1s",dur:"3.6s",anim:"jesterFloat"},
                {e:"🃏",t:"70%",r:"4%",delay:".4s",dur:"4.0s",anim:"jesterSpin"},
              ].map((j,ji)=>(
                <span key={ji} style={{position:"absolute",fontSize:"clamp(1.2rem,3vw,1.8rem)",
                  top:j.t,left:j.l||undefined,right:j.r||undefined,
                  animation:`${j.anim} ${j.dur} ease-in-out ${j.delay} infinite`,
                  userSelect:"none",filter:"drop-shadow(0 0 10px rgba(255,77,143,.6))"}}>{j.e}</span>
              ))}
            </div>
          )}

          {/* ── Season / date row ── */}
          {(()=>{
            const latestDate=getLatestSessionDate();
            const s2Sess=sessions.filter(s=>s.date>="2026-04-01");
            const s2Kills=s2Sess.reduce((n,s)=>n+Object.values(s.kills||{}).reduce((a,b)=>a+b,0),0);
            const allKills=sessions.reduce((n,s)=>n+Object.values(s.kills||{}).reduce((a,b)=>a+b,0),0);
            const currentSeason=SEASONS.find(s=>latestDate>=s.start&&latestDate<=s.end)||SEASONS[1];
            const seasonSess=sessions.filter(s=>s.date>=currentSeason.start&&s.date<=currentSeason.end);
            const allStats_lb=allStats();
            const champion=allStats_lb.sort((a,b)=>b.wins-a.wins||b.kills-a.kills)[0];
            const championP=champion?players.find(p=>p.id===champion.id):null;
            const s2Champion_stats=allStats(seasonSess).sort((a,b)=>b.wins-a.wins||b.kills-a.kills)[0];
            const s2ChampP=s2Champion_stats?players.find(p=>p.id===s2Champion_stats.id):null;
            const leaderP=s2ChampP||championP;
            const leaderSt=leaderP?getStats(leaderP.id):null;
            const s2LeaderSt=leaderP?getStats(leaderP.id,seasonSess):null;
            const allStatsForLB=allStats();
            const byS2W=allStats(seasonSess).filter(p=>p.appearances>0).sort((a,b)=>b.wins-a.wins||b.kills-a.kills);
            const secondP=byS2W[1]?players.find(p=>p.id===byS2W[1].id):null;
            const gapW=byS2W[1]?(byS2W[0].wins-byS2W[1].wins):0;
            const missions=getWeeklyMissions();

            // ── Slideshow data — 4 slides (hoisted before return so esbuild stays in JS mode) ──
            const s2StatsSorted=allStats(seasonSess).filter(p=>p.appearances>0);
            const slide1P=s2ChampP;
            const slide1St=slide1P?getStats(slide1P.id,seasonSess):null;
            const slide1Sub=slide1P&&secondP&&gapW>=0?`${dn(secondP.username)} is ${gapW}W behind`:null;
            const s2KillsLeader=[...s2StatsSorted].sort((a,b)=>b.kills-a.kills)[0];
            const slide2P=s2KillsLeader?players.find(p=>p.id===s2KillsLeader.id):null;
            const s2KillsTwo=[...s2StatsSorted].sort((a,b)=>b.kills-a.kills)[1];
            const slide2SubP=s2KillsTwo?players.find(p=>p.id===s2KillsTwo.id):null;
            const slide2Sub=slide2SubP?`${dn(slide2SubP.username)} has ${s2KillsTwo.kills}K`:null;
            let s2BestPid="",s2BestK=0,s2BestSid="";
            for(let _si=0;_si<seasonSess.length;_si++){
              const _s=seasonSess[_si];const _ks=Object.keys(_s.kills||{});
              for(let _ki=0;_ki<_ks.length;_ki++){const _p=_ks[_ki];const _k=_s.kills[_p];if(_k>s2BestK){s2BestK=_k;s2BestPid=_p;s2BestSid=_s.id;}}
            }
            const slide3P=s2BestPid?players.find(p=>p.id===s2BestPid):null;
            const s2AppLeader=[...s2StatsSorted].sort((a,b)=>b.appearances-a.appearances)[0];
            const slide4P=s2AppLeader?players.find(p=>p.id===s2AppLeader.id):null;
            const slide4St=slide4P?getStats(slide4P.id,seasonSess):null;
            // Slide 5: best current streak in S2 (most consecutive wins)
            let s2BestStreakPid="",s2BestStreakV=0;
            players.forEach(pl=>{
              const v=getStreak(pl.id);
              if(v>s2BestStreakV){s2BestStreakV=v;s2BestStreakPid=pl.id;}
            });
            const slide5P=s2BestStreakPid&&s2BestStreakV>=2?players.find(p=>p.id===s2BestStreakPid):null;
            const slide5St=slide5P?getStats(slide5P.id,seasonSess):null;
            const leaderSlides=[
              slide1P&&slide1St&&{label:`${currentSeason.name.toUpperCase()} WINS LEADER`,player:slide1P,stat:`${slide1St.wins}W this season · ${getStats(slide1P.id).wins}W all time`,sub:slide1Sub,icon:"🏆"},
              slide2P&&s2KillsLeader&&{label:`${currentSeason.name.toUpperCase()} KILL LEADER`,player:slide2P,stat:`${s2KillsLeader.kills} kills this season · ${s2KillsLeader.appearances} lobbies`,sub:slide2Sub,icon:"💀"},
              slide3P&&s2BestK>0&&{label:"BEST SINGLE GAME THIS SEASON",player:slide3P,stat:`${s2BestK} kills in one lobby`,sub:`Lobby ${s2BestSid}`,icon:"☄️"},
              slide4P&&slide4St&&{label:`${currentSeason.name.toUpperCase()} MOST APPEARANCES`,player:slide4P,stat:`${slide4St.appearances} lobbies · ${slide4St.wins}W`,sub:"Most committed player this season",icon:"📅"},
              slide5P&&slide5St&&{label:"BEST WIN STREAK THIS SEASON",player:slide5P,stat:`${s2BestStreakV} consecutive wins`,sub:`${slide5St.wins}W from ${slide5St.appearances} lobbies in ${currentSeason.name}`,icon:"🔥"},
            ].filter(Boolean);
            return(<>
              {/* Status row */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                marginBottom:14,flexWrap:"wrap",gap:8}}>
                <span className="bc7" style={{fontSize:".62rem",letterSpacing:".3em",
                  color:`rgba(255,107,53,.7)`}}>
                  {currentSeason.name.toUpperCase()} · {currentSeason.label.toUpperCase()} · ACTIVE
                </span>
                <span className="bc7" style={{fontSize:".62rem",letterSpacing:".2em",color:"var(--text3)"}}>
                  {seasonSess.length} SESSIONS · {sessions.length} ALL TIME
                </span>
              </div>

              {/* Hero title — Easter / Fools / default */}
              <div style={{marginBottom:26,position:"relative"}}>
                {(()=>{
                  const isEaster=isEventActive();
                  if(isEaster) return(
                    <>
                      <div style={{marginBottom:10}}>
                        <span className="easter-hud">
                          <span className="easter-hud-dot"/>Easter 2026
                        </span>
                      </div>
                      <div className="easter-logo-zone" style={{display:"inline-block"}}>
                        {[
                          {e:"🥚",top:"-14px",left:"4px",  delay:"0s",  dur:"3.0s",anim:"eggBounce"},
                          {e:"🐣",top:"-18px",right:"2px", delay:".6s", dur:"2.6s",anim:"eggFloat"},
                          {e:"🥚",bottom:"-8px",left:"12px",delay:"1.0s",dur:"3.4s",anim:"eggDrift"},
                          {e:"🐰",bottom:"-6px",right:"6px",delay:".3s",dur:"4.0s",anim:"eggSpin"},
                          {e:"🌸",top:"28%",left:"-16px",  delay:"1.3s",dur:"2.8s",anim:"eggFloat"},
                          {e:"🥚",top:"26%",right:"-14px", delay:".8s", dur:"3.2s",anim:"eggBounce"},
                        ].map((eg,ei)=>(
                          <span key={ei} style={{
                            position:"absolute",fontSize:"clamp(1.1rem,3vw,1.6rem)",
                            top:eg.top||"auto",bottom:eg.bottom||"auto",
                            left:eg.left||"auto",right:eg.right||"auto",
                            animation:`${eg.anim} ${eg.dur} ease-in-out ${eg.delay} infinite`,
                            pointerEvents:"none",zIndex:2,userSelect:"none",
                            filter:"drop-shadow(0 0 8px rgba(255,215,0,.45))",
                          }}>{eg.e}</span>
                        ))}
                        <h1 className="hero-h1 easter-h1" style={{
                          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                          backgroundClip:"text",filter:"none",position:"relative",zIndex:1,
                          margin:"0 0 12px"}}>
                          🐣 GAMES<br/>NIGHT
                        </h1>
                      </div>
                      <div className="bc7" style={{fontSize:".72rem",letterSpacing:".26em",color:"var(--text3)"}}>
                        {FEATURED_GAME} · EASTER BREAK · DOOM ISLAND
                      </div>
                    </>
                  );
                  return(
                    <>
                      <h1 className="bc9" style={{
                        fontSize:"clamp(3.5rem,14vw,7rem)",letterSpacing:".05em",lineHeight:.82,
                        background:"linear-gradient(160deg,#FFD700 0%,#FF6B35 40%,#FF4D8F 70%,#C77DFF 100%)",
                        WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
                        margin:"0 0 12px",
                        ...(foolsDay?{filter:"hue-rotate(180deg)"}:{})}}>
                        {foolsDay?"🃏 GAMES":"GAMES"}<br/>NIGHT
                      </h1>
                      <div className="bc7" style={{fontSize:".72rem",letterSpacing:".26em",color:"var(--text3)"}}>
                        {FEATURED_GAME} · MON–SAT · 5PM UTC · HOSTED BY {HOSTED_BY.toUpperCase()}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* 1-month anniversary banner — shows from Apr 4, 2026 based on real date */}
              {todayStr()>="2026-04-04"&&(
                <div style={{
                  marginBottom:20,
                  background:"linear-gradient(135deg,rgba(255,215,0,.1),rgba(255,107,53,.07),rgba(199,125,255,.08))",
                  border:"1px solid rgba(255,215,0,.3)",
                  borderLeft:"3px solid #FFD700",
                  borderRadius:"0 10px 10px 0",
                  padding:"18px 20px",
                  position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",right:12,top:"50%",
                    transform:"translateY(-50%)",fontSize:"3.5rem",opacity:.07,
                    pointerEvents:"none",userSelect:"none"}}>🎂</div>
                  <div className="bc7" style={{fontSize:".58rem",letterSpacing:".3em",
                    color:"rgba(255,215,0,.65)",marginBottom:6}}>▸ ONE MONTH IN · APRIL 4, 2026</div>
                  <div className="bc9" style={{fontSize:"clamp(1rem,4vw,1.35rem)",
                    color:"#FFD700",lineHeight:1.25,marginBottom:8}}>
                    Games Night is officially one month old.
                  </div>
                  <div className="bc7" style={{fontSize:".8rem",color:"var(--text2)",
                    lineHeight:1.7,maxWidth:520}}>
                    What started as a daily lobby has turned into {sessions.length} sessions, {players.filter(p=>getStats(p.id).appearances>0).length} players
                    on the board, and a real community that keeps showing up every single week.
                    Thank you to everyone who played, who watched, who kept coming back after a bad night.
                    This is only the start. Every player who was part of month one gets the Day One badge permanently.
                  </div>
                  <div style={{display:"flex",gap:7,marginTop:10,flexWrap:"wrap",alignItems:"center"}}>
                    {["🎂","🏆","💀","🔥","⚡","🥚"].map((e,i)=>(
                      <span key={i} style={{fontSize:"1.1rem",
                        animation:`eggBounce ${1.8+i*.25}s ease-in-out ${i*.12}s infinite`,
                        display:"inline-block"}}>{e}</span>
                    ))}
                    <span className="bc7" style={{fontSize:".68rem",color:"rgba(255,215,0,.5)",
                      marginLeft:4,letterSpacing:".1em"}}>MEKULA · GAMES NIGHT</span>
                  </div>
                </div>
              )}

              {/* Season stat strip */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(76px,1fr))",
                gap:1,marginBottom:24,border:"1px solid rgba(255,215,0,.12)",borderRadius:2,overflow:"hidden"}}>
                {[
                  {l:"S2 SESSIONS",v:seasonSess.length,   c:"#00E5FF"},
                  {l:"S2 KILLS",   v:s2Kills,              c:"#FF4D8F"},
                  {l:"S1 LOBBIES", v:332,                  c:"#FFD700"},
                  {l:"ALL KILLS",  v:allKills.toLocaleString(), c:"#FF6B35"},
                  {l:"PLAYERS",    v:players.length,       c:"#C77DFF"},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"14px 8px",textAlign:"center",
                    background:"rgba(255,255,255,.02)",borderRight:"1px solid rgba(255,255,255,.04)"}}>
                    <div className="bc9" style={{fontSize:"clamp(1.1rem,4vw,1.8rem)",color:s.c,
                      lineHeight:1,textShadow:`0 0 14px ${s.c}33`}}>{s.v}</div>
                    <div className="bc7" style={{fontSize:".53rem",letterSpacing:".18em",
                      color:"var(--text3)",marginTop:5}}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Leader slideshow */}
              <LeaderSlideshow slides={leaderSlides}/>

              {/* Intelligence Briefing — terminal typewriter */}
              {(()=>{
                const stories=getStorylines();
                return(
                  <div style={{marginBottom:22}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <div className="bc7" style={{fontSize:".6rem",letterSpacing:".3em",
                        color:"var(--text3)"}}>▸ INTELLIGENCE BRIEFING</div>
                      <div style={{width:6,height:6,borderRadius:"50%",background:"#00FF94",
                        flexShrink:0,boxShadow:"0 0 8px #00FF94",
                        animation:"hudBlink 1.4s ease-in-out infinite"}}/>
                    </div>
                    <div style={{
                      background:"rgba(0,0,0,.45)",
                      border:"1px solid rgba(255,255,255,.08)",
                      borderTop:"2px solid rgba(0,255,148,.3)",
                      borderRadius:"0 6px 6px 0",
                      borderLeft:"3px solid rgba(0,255,148,.35)",
                      padding:"14px 16px",
                      fontFamily:"'Share Tech Mono',monospace",
                      overflow:"hidden"}}>
                      {stories.map((s,i)=>(
                        <div key={i} style={{
                          display:"flex",gap:10,alignItems:"flex-start",
                          marginBottom:i<stories.length-1?10:0,
                          opacity:0,
                          animation:`briefingReveal .3s ease both`,
                          animationDelay:`${0.4+i*0.55}s`}}>
                          <span style={{fontSize:".8rem",flexShrink:0,marginTop:1,
                            opacity:0,
                            animation:`briefingReveal .2s ease both`,
                            animationDelay:`${0.4+i*0.55}s`}}>{s.icon}</span>
                          <div style={{flex:1,minWidth:0,position:"relative",overflow:"hidden"}}>
                            <div style={{
                              fontSize:".78rem",lineHeight:1.65,
                              color:"rgba(200,186,255,.85)",
                              letterSpacing:".02em",
                              display:"inline-block",
                              whiteSpace:"pre-wrap",wordBreak:"break-word",
                              width:0,overflow:"hidden",
                              animation:`briefingType ${Math.max(0.8,s.text.length*0.018)}s steps(${Math.min(s.text.length,150)},end) both`,
                              animationDelay:`${0.55+i*0.55}s`,
                              borderRight:`1.5px solid ${s.color}`,
                              animationFillMode:"forwards",maxWidth:"100%",
                            }}>
                              {s.text}
                            </div>
                            <div style={{
                              position:"absolute",bottom:0,right:0,
                              width:8,height:"1.2em",
                              background:s.color,opacity:.7,
                              animation:`briefingCursor .65s step-end infinite`,
                              animationDelay:`${0.55+i*0.55}s`,
                            }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ── LAST SESSION · Recap + MVP merged ── */}
              {(()=>{
                const mvp=getDailyMVP();
                const recap=getDayRecap(latestDate);
                if(!recap||!recap.lobbies)return null;
                const dd=new Date(latestDate+"T12:00:00Z");
                const dateLabel=dd.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
                const specialTag=latestDate==="2026-04-03"?"🌅 Good Friday · "
                  :latestDate==="2026-04-01"?"🃏 April Fools · "
                  :latestDate==="2026-04-04"?"🥚 Easter Saturday · ":"";
                const tw=mvp&&mvp.topWinner?players.find(p=>p.id===mvp.topWinner.id):null;
                const tk=mvp&&mvp.topKiller?players.find(p=>p.id===mvp.topKiller.id):null;
                const ta=mvp&&mvp.topAppear?players.find(p=>p.id===mvp.topAppear.id):null;
                const kk=mvp&&mvp.killKing?players.find(p=>p.id===mvp.killKing.id):null;
                const mvpCards=[
                  {icon:"🏆",label:"MOST WINS",       player:tw,stat:mvp?.topWinner?.wins+"W",       sub:"lobbies won",     c:"#FFD700"},
                  {icon:"💀",label:"MOST KILLS",       player:tk,stat:mvp?.topKiller?.kills+"K",      sub:"total kills",     c:"#FF4D8F"},
                  {icon:"☄️",label:"BEST SINGLE GAME", player:kk,stat:mvp?.killKing?.killKingK+"K",   sub:mvp?.killKing?.killKingSid||"", c:"#FF6B35"},
                  {icon:"📅",label:"MOST APPEARANCES", player:ta,stat:mvp?.topAppear?.appearances+"G",sub:"lobbies played",  c:"#00E5FF"},
                ].filter(c=>c.player);
                return(
                  <div style={{marginBottom:22,
                    background:"rgba(255,255,255,.02)",
                    border:"1px solid rgba(255,255,255,.07)",
                    borderLeft:"3px solid rgba(255,215,0,.4)",
                    borderRadius:"0 8px 8px 0",padding:"16px 18px"}}>
                    {/* Header */}
                    <div style={{display:"flex",justifyContent:"space-between",
                      alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:6}}>
                      <div className="bc9" style={{fontSize:".62rem",letterSpacing:".3em",
                        color:"rgba(255,215,0,.7)"}}>
                        ▸ {specialTag}LAST SESSION
                      </div>
                      <div className="bc7" style={{fontSize:".6rem",letterSpacing:".15em",
                        color:"var(--text3)"}}>{dateLabel.toUpperCase()}</div>
                    </div>
                    {/* Stat strip */}
                    <div style={{display:"grid",
                      gridTemplateColumns:"repeat(4,1fr)",
                      gap:1,border:"1px solid rgba(255,255,255,.06)",
                      borderRadius:2,overflow:"hidden",marginBottom:14}}>
                      {[
                        {l:"LOBBIES", v:recap.lobbies,         c:"#00E5FF"},
                        {l:"PLAYERS", v:recap.uniquePlayers,   c:"#C77DFF"},
                        {l:"KILLS",   v:recap.totalKills,      c:"#FF4D8F"},
                        {l:"WINNERS", v:recap.winnersList?.length||0,c:"#FFD700"},
                      ].map((s,i)=>(
                        <div key={i} style={{padding:"9px 6px",textAlign:"center",
                          background:"rgba(255,255,255,.025)"}}>
                          <div className="bc9" style={{fontSize:"clamp(.9rem,3vw,1.3rem)",
                            color:s.c,lineHeight:1}}>{s.v}</div>
                          <div className="bc7" style={{fontSize:".5rem",letterSpacing:".15em",
                            color:"var(--text3)",marginTop:3}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    {/* MVP cards */}
                    {mvpCards.length>0&&(
                      <div style={{display:"grid",
                        gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:5}}>
                        {mvpCards.map((c,i)=>(
                          <div key={i} onClick={()=>goProfile(c.player.id)} style={{
                            padding:"10px 12px",cursor:"pointer",
                            background:`${c.c}08`,
                            border:`1px solid ${c.c}1a`,
                            borderLeft:`2px solid ${c.c}55`,
                            borderRadius:"0 4px 4px 0",
                            transition:"transform .1s"}}
                            onMouseEnter={e=>e.currentTarget.style.transform="translateX(2px)"}
                            onMouseLeave={e=>e.currentTarget.style.transform="translateX(0)"}>
                            <div className="bc7" style={{fontSize:".54rem",letterSpacing:".2em",
                              color:`${c.c}77`,marginBottom:6}}>{c.icon} {c.label}</div>
                            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                              <Av p={c.player} size={24}/>
                              <div className="bc9" style={{fontSize:".78rem",
                                color:c.player.color,overflow:"hidden",
                                textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>
                                {dn(c.player.username)}
                              </div>
                            </div>
                            <div className="bc9" style={{fontSize:"1.1rem",color:c.c,
                              lineHeight:1,textShadow:`0 0 10px ${c.c}44`}}>{c.stat}</div>
                            {c.sub&&<div className="bc7" style={{fontSize:".56rem",
                              color:"var(--text3)",marginTop:3,letterSpacing:".08em"}}>{c.sub}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* All winners line */}
                    {recap.winnersList&&recap.winnersList.length>1&&(
                      <div className="bc7" style={{fontSize:".7rem",color:"var(--text3)",
                        lineHeight:1.8,marginTop:12,paddingTop:12,
                        borderTop:"1px solid rgba(255,255,255,.06)"}}>
                        {recap.winnersList.slice(0,6).map((w,i)=>(
                          <span key={i}>
                            {i>0?" · ":""}
                            <span style={{color:w.player?.color||"#fff",cursor:"pointer"}}
                              onClick={()=>w.player&&goProfile(w.player.id)}>
                              {dn(w.player?.username||"?")}{w.wins>1?` ×${w.wins}`:""}
                            </span>
                          </span>
                        ))} won lobbies
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Weekly Mission Board */}
              <div style={{marginBottom:22}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  marginBottom:10,flexWrap:"wrap",gap:8}}>
                  <div className="bc9" style={{fontSize:".62rem",letterSpacing:".3em",
                    color:"rgba(199,125,255,.6)"}}>▸ WEEKLY MISSIONS</div>
                  <div className="bc7" style={{fontSize:".6rem",letterSpacing:".2em",color:"var(--text3)"}}>
                    AUTO-GENERATED · RESETS MONDAY
                  </div>
                </div>
                <div className="mission-board">
                  {missions.map((m,i)=>{
                    const pct=m.target>0?Math.round((m.progress/m.target)*100):0;
                    const done=m.progress>=m.target;
                    return(
                      <div key={i} className="mission-item" style={{"--m-color":m.color}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                          <span style={{fontSize:"1.1rem",flexShrink:0}}>{m.icon}</span>
                          <div>
                            <div className="bc9" style={{fontSize:".72rem",
                              color:done?"#00FF94":m.color,letterSpacing:".1em"}}>
                              {done?"✓ ":""}{m.label}
                            </div>
                            <div className="bc7" style={{fontSize:".64rem",color:"var(--text3)",
                              letterSpacing:".04em",marginTop:2}}>{m.desc}</div>
                          </div>
                        </div>
                        <div className="mission-bar-track">
                          <div className="mission-bar-fill" style={{
                            width:`${pct}%`,
                            background:done?`linear-gradient(90deg,#00FF94,${m.color})`:`linear-gradient(90deg,${m.color}88,${m.color})`,
                            boxShadow:done?"0 0 8px rgba(0,255,148,.5)":`0 0 6px ${m.color}44`,
                          }}/>
                        </div>
                        <div className="bc7" style={{fontSize:".6rem",
                          color:done?"#00FF94":"var(--text3)",letterSpacing:".1em",marginTop:5}}>
                          {done?"MISSION COMPLETE":`${m.unit} · ${pct}%`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next session countdown — big and bold */}
              {!live&&(
                <div style={{marginBottom:4}}>
                  <div className="bc7" style={{fontSize:".6rem",letterSpacing:".35em",
                    color:"rgba(0,229,255,.5)",marginBottom:12}}>
                    ▸ NEXT SESSION IN
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"flex-end",flexWrap:"wrap"}}>
                    {[
                      {v:String(cd.d).padStart(2,"0"), l:"DAYS",    show:cd.d>0},
                      {v:String(cd.d>0?cd.h:cd.h).padStart(2,"0"),l:"HOURS", show:true},
                      {v:String(cd.m).padStart(2,"0"), l:"MINUTES", show:true},
                      {v:String(cd.s).padStart(2,"0"), l:"SECONDS", show:true},
                    ].filter(d=>d.show||d.l==="HOURS"||d.l==="MINUTES"||d.l==="SECONDS").map((d,i)=>(
                      <div key={i} style={{textAlign:"center",minWidth:cd.d>0?60:70}}>
                        <div className="bc9" style={{
                          fontSize:cd.d>0?"clamp(2.4rem,8vw,4rem)":"clamp(2.8rem,10vw,5rem)",
                          color:"#00E5FF",lineHeight:1,
                          textShadow:"0 0 24px rgba(0,229,255,.5),0 0 48px rgba(0,229,255,.2)",
                          letterSpacing:"-.01em"}}>
                          {d.v}
                        </div>
                        <div className="bc7" style={{fontSize:".55rem",letterSpacing:".22em",
                          color:"rgba(0,229,255,.45)",marginTop:5}}>{d.l}</div>
                        {i<3&&cd.d>0===false&&<div style={{position:"absolute"}}/>}
                      </div>
                    ))}
                  </div>
                  <div className="bc7" style={{fontSize:".68rem",color:"var(--text3)",
                    marginTop:10,letterSpacing:".08em"}}>
                    MON–SAT · 5PM UTC · HOSTED BY {HOSTED_BY.toUpperCase()}
                  </div>
                </div>
              )}
            </>);
          })()}
        </div>
      )}

      {/* ═══════════════ HALL OF FAME ═══════════════ */}
      {view==="hof"&&(
        <div className="fade-up" style={{minHeight:"calc(100vh - 120px)"}}>
          {/* Legends Wing header */}
          <div style={{marginBottom:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
              <span className="bc7" style={{fontSize:".62rem",letterSpacing:".3em",
                color:"rgba(255,215,0,.5)",textTransform:"uppercase"}}>SECTOR: LEGENDS WING · HALL OF FAME</span>
              <span className="bc7" style={{fontSize:".62rem",letterSpacing:".2em",
                color:"var(--text3)",textTransform:"uppercase"}}>{players.length} combatants · {sessions.length} lobbies</span>
            </div>
            <h2 className="bc9" style={{fontSize:"clamp(2rem,8vw,4rem)",letterSpacing:".08em",lineHeight:.9,
              color:"#FFD700",textShadow:"0 0 28px rgba(255,215,0,.25)",margin:"0 0 10px"}}>
              LEGENDS WING
            </h2>
            <div style={{height:1,background:"linear-gradient(90deg,rgba(255,215,0,.44),transparent)",marginBottom:8}}/>
            <div className="bc7" style={{fontSize:".72rem",letterSpacing:".12em",color:"var(--text3)"}}>
              Season archive · All-time elite · Permanent legacy
            </div>
          </div>


          {/* Season Recaps */}
          {SEASONS.map(season=>{
            const sSess=sessions.filter(s=>s.date>=season.start&&s.date<=season.end);
            if(!sSess.length)return null;
            const sStats=allStats(sSess).filter(p=>p.appearances>0);
            const champ=sStats.sort((a,b)=>b.wins-a.wins||b.kills-a.kills)[0];
            const topK=[...sStats].sort((a,b)=>b.kills-a.kills)[0];
            const mostActive=[...sStats].sort((a,b)=>b.appearances-a.appearances)[0];
            const now=new Date().toISOString().split("T")[0];
            const ended=season.end<now;
            return(
              <div key={season.id} style={{...card({border:`2px solid ${season.color}44`,
                background:`linear-gradient(135deg,${season.color}0c,var(--card))`}),
                padding:20,marginBottom:14,animation:"fadeUp .4s ease both"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                  <div>
                    <span style={{fontSize:".68rem",color:season.color,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase"}}>{ended?"🏁 Final Results":"📅 In Progress"}</span>
                    <h3 style={{fontFamily:"Fredoka One",color:"#fff",fontSize:"1.2rem",marginTop:2}}>{season.name}: {season.label}</h3>
                    <p style={{color:"var(--text3)",fontSize:".76rem",marginTop:2}}>{sSess.length} lobbies · {sStats.length} players</p>
                  </div>
                  {ended&&champ&&<div style={{textAlign:"center"}}>
                    <div style={{fontSize:".66rem",color:"#FFD700",fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>👑 Champion</div>
                    <div style={{fontFamily:"Fredoka One",color:"#FFD700",fontSize:"1.1rem"}}>{champ.username}</div>
                    <div style={{fontSize:".72rem",color:"var(--text3)"}}>{champ.wins}W · {champ.winRate}%WR</div>
                  </div>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
                  {[
                    {icon:"🏆",label:"Most Wins",     p:champ,   val:champ?.wins+"W"},
                    {icon:"💀",label:"Top Fragger",   p:topK,    val:topK?.kills+"K"},
                    {icon:"📅",label:"Most Active",   p:mostActive,val:mostActive?.appearances+"G"},
                  ].filter(a=>a.p).map((a,i)=>(
                    <div key={i} onClick={()=>a.p&&goProfile(a.p.id)} style={{
                      background:"rgba(0,0,0,.35)",borderRadius:10,padding:"10px 12px",cursor:"pointer"}}>
                      <div style={{fontSize:".62rem",color:"var(--text3)",fontWeight:700,marginBottom:5}}>{a.icon} {a.label}</div>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <Av p={a.p} size={26}/>
                        <div>
                          <div style={{fontFamily:"Fredoka One",color:season.color,fontSize:".84rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:90}}>{a.p.username}</div>
                          <div style={{fontFamily:"Fredoka One",color:"#fff",fontSize:".9rem"}}>{a.val}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="hof-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))",gap:16,marginBottom:36}}>
            {allStats().sort((a,b)=>b.wins-a.wins||b.kills-a.kills).map((player,idx)=>{
              const rank=getRank(player.id);
              const badges=getBadges(player.id);
              const streak=getStreak(player.id);
              const podCl=idx===0?"podium-1":idx===1?"podium-2":idx===2?"podium-3":"";
              return(
                <div key={player.id} className={`card-h${podCl?" "+podCl:""}`}
                onClick={()=>goProfile(player.id)}
                style={{
                  ...card({borderTop:`4px solid ${player.color}`,boxShadow:`0 0 28px ${player.color}14`}),
                  padding:20,position:"relative",overflow:"hidden",cursor:"pointer",
                  animation:`fadeUp .38s ease ${Math.min(idx,8)*.04}s both`}}>
                  {idx<3&&(
                    <div style={{position:"absolute",top:8,right:10,fontSize:"1.5rem",
                      animation:idx===0?"floatY 3s ease-in-out infinite":"none"}}>
                      {["👑","🥈","🥉"][idx]}
                    </div>
                  )}
                  {streak>=3&&(
                    <div className="fire" style={{position:"absolute",top:8,left:10,
                      fontSize:".8rem",background:"rgba(255,107,53,.2)",borderRadius:50,padding:"2px 7px",
                      border:"1px solid rgba(255,107,53,.4)",color:"#FF6B35",fontWeight:800}}>
                      🔥 {streak} streak
                    </div>
                  )}
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,marginTop:streak>=3?20:0}}>
                    <Av p={player} size={52} glow/>
                    <div>
                      <div style={{fontFamily:"Fredoka One",color:"#fff",fontSize:"1.05rem"}}>{player.host?"👑 ":""}{dn(player.username)}</div>
                      <div style={{fontSize:".72rem",color:rank.color,fontWeight:700,marginTop:2}}>{rank.title}</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
                    {[
                      {l:"Wins",     v:player.wins,           c:"#FFD700",i:"🏆"},
                      {l:"Kills",    v:player.kills,          c:"#FF4D8F",i:"💀"},
                      {l:"K/G",      v:player.kd,             c:"#00E5FF",i:"⚡"},
                      {l:"Win Rate", v:player.winRate+"%",    c:"#00FF94",i:"🎯"},
                      {l:"Lobbies",  v:player.appearances,    c:"#FFAB40",i:"📅"},
                      {l:"Best Game",v:player.biggestGame+"k",c:"#C77DFF",i:"🌟"},
                    ].map((s,i)=>(
                      <div key={i} style={{background:"rgba(0,0,0,.38)",borderRadius:8,padding:"7px 10px"}}>
                        <div style={{fontSize:".6rem",color:"var(--text3)",fontWeight:700,marginBottom:1}}>{s.i} {s.l}</div>
                        <div style={{fontFamily:"Fredoka One",color:s.c,fontSize:"1.08rem"}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {badges.length>0&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {badges.map((b,i)=>(
                        <span key={i} style={{background:"rgba(255,255,255,.09)",borderRadius:50,
                          padding:"3px 9px",fontSize:".68rem",fontWeight:700,
                          color:"#fff",border:"1px solid rgba(255,255,255,.18)"}}>
                          {b.hot?<span className="fire" style={{display:"inline-block"}}>{b.icon}</span>:b.icon} {b.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {player.appearances===0&&(
                    <p style={{fontSize:".72rem",color:"var(--text3)",fontStyle:"italic",marginTop:6}}>Awaiting first battle…</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rank Titles FAQ */}
          <div style={{...card({border:"2px solid rgba(199,125,255,.25)"}),padding:24,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <span style={{fontSize:"1.4rem"}}>🏅</span>
              <div>
                <h3 style={{fontFamily:"Fredoka One",color:"#C77DFF",fontSize:"1.2rem"}}>Rank Titles Explained</h3>
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>What does each player title actually mean?</p>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
              {RANK_FAQ.map((r,i)=>(
                <div key={i} style={{background:"rgba(0,0,0,.3)",borderRadius:12,padding:"13px 16px",
                  border:`1px solid ${r.color}33`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontSize:"1.2rem"}}>{r.icon}</span>
                    <span style={{fontFamily:"Fredoka One",color:r.color,fontSize:"1rem"}}>{r.name}</span>
                  </div>
                  <p style={{color:"var(--text2)",fontSize:".78rem",lineHeight:1.55}}>{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Badges FAQ */}
          <div style={{...card({border:"2px solid rgba(255,215,0,.25)"}),padding:24}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <span style={{fontSize:"1.4rem"}}>🎖️</span>
              <div>
                <h3 style={{fontFamily:"Fredoka One",color:"#FFD700",fontSize:"1.2rem"}}>How Badges Work</h3>
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>Tap any badge to see how to earn it</p>
              </div>
            </div>
            <div>
              {BADGE_CATALOGUE.map((b,i)=>(
                <div key={i} className="faq-item">
                  <div className="faq-q" onClick={()=>setFaqOpen(faqOpen===i?null:i)}>
                    <span>{b.icon} <strong>{b.name}</strong>: <span style={{color:"var(--text3)",fontWeight:600}}>{b.desc}</span></span>
                    <span style={{color:"var(--text3)",marginLeft:8,flexShrink:0}}>{faqOpen===i?"▲":"▼"}</span>
                  </div>
                  {faqOpen===i&&(
                    <div className="faq-a">
                      <span style={{color:"#00FF94",fontWeight:800}}>How to earn:</span> {b.how}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ LEADERBOARD ═══════════════ */}
      {view==="leaderboard"&&(
        <div className="fade-up" style={{minHeight:"calc(100vh - 120px)"}}>
          {/* Arena header */}
          <div style={{marginBottom:28,position:"relative"}}>
            {/* Top coordinate bar */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              marginBottom:12,padding:"0 2px"}}>
              <span style={{fontFamily:"Barlow Condensed",fontWeight:700,fontSize:".7rem",
                letterSpacing:".25em",color:"rgba(255,215,0,.4)",textTransform:"uppercase"}}>
                SECTOR: THE ARENA
              </span>
              <span style={{fontFamily:"Barlow Condensed",fontWeight:700,fontSize:".7rem",
                letterSpacing:".2em",color:"rgba(255,255,255,.2)",textTransform:"uppercase"}}>
                {sessions.length} SESSIONS LOGGED
              </span>
            </div>
            <div style={{textAlign:"center"}}>
              <h2 style={{
                fontFamily:"Barlow Condensed",fontWeight:900,
                fontSize:"clamp(2.4rem,10vw,4.2rem)",
                letterSpacing:".1em",lineHeight:.9,
                background:"linear-gradient(135deg,#FFD700,#FF6B35,#FF4D8F)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
                textShadow:"none",
                ...(foolsDay?{transform:"scaleY(-1)",display:"inline-block"}:{})
              }}>
                THE ARENA
              </h2>
              <div style={{fontFamily:"Barlow Condensed",fontWeight:700,
                fontSize:".8rem",letterSpacing:".3em",
                color:"rgba(255,255,255,.2)",marginTop:6,textTransform:"uppercase"}}>
                SEASON 2 · ACTIVE · RANKINGS LIVE
              </div>
            </div>
            {foolsDay&&(
              <div style={{textAlign:"center",fontFamily:"Fredoka One",color:"#FF4D8F",
                fontSize:".82rem",marginTop:8,letterSpacing:1}}>
                🃏 Upside Down Edition. Last place is first today
              </div>
            )}
          </div>

          {/* View tabs — All Time / Season 1 / Season 2 */}
          <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
            {[
              {id:"all",  l:"🌐 ALL TIME",  sub:"Every lobby ever",       c:"#C77DFF"},
              {id:"s2",   l:"🚀 SEASON 2",  sub:"Apr 2026 · Active",      c:"#00E5FF"},
              {id:"s1",   l:"🏆 SEASON 1",  sub:"Mar 2026 · Closed",      c:"#FFD700"},
            ].map(t=>{
              const active=lbSeason===t.id;
              const sid=t.id==="all"?"all":t.id==="s2"?"s2":"s1";
              return(
                <button key={t.id} onClick={()=>{setLbSeason(sid);setLbPeriod("all");}} style={{
                  padding:"8px 16px",cursor:"pointer",outline:"none",
                  background:active?`${t.c}18`:"rgba(255,255,255,.03)",
                  border:active?`1px solid ${t.c}55`:"1px solid rgba(255,255,255,.08)",
                  borderBottom:active?`2px solid ${t.c}`:"2px solid transparent",
                  borderRadius:"4px 4px 0 0",
                  fontFamily:"Barlow Condensed",fontWeight:900,
                  fontSize:".72rem",letterSpacing:".15em",
                  color:active?t.c:"var(--text3)",transition:"all .12s"}}>
                  <div>{t.l}</div>
                  <div style={{fontFamily:"Barlow Condensed",fontWeight:700,
                    fontSize:".55rem",letterSpacing:".12em",opacity:.6,marginTop:2}}>{t.sub}</div>
                </button>
              );
            })}
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span className="bc7" style={{fontSize:".6rem",letterSpacing:".2em",color:"var(--text3)"}}>SORT</span>
              {[
                {id:"wins",l:"WINS"},{id:"kills",l:"KILLS"},
                {id:"winrate",l:"WIN%"},{id:"kd",l:"K/G"},
              ].map(s=>(
                <button key={s.id} onClick={()=>setSortBy(s.id)} style={{
                  padding:"4px 10px",cursor:"pointer",outline:"none",
                  background:sortBy===s.id?"rgba(255,255,255,.08)":"none",
                  border:sortBy===s.id?"1px solid rgba(255,255,255,.2)":"1px solid transparent",
                  borderRadius:3,fontFamily:"Barlow Condensed",fontWeight:700,
                  fontSize:".62rem",letterSpacing:".1em",color:sortBy===s.id?"#fff":"var(--text3)"}}>
                  {s.l}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{position:"relative",marginBottom:16}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:"1rem",pointerEvents:"none"}}>🔍</span>
            <input className="search-inp" placeholder="Search your gamertag…"
              value={lbSearch} onChange={e=>{
                setLbSearch(e.target.value);
                if(!e.target.value.trim()){setSpotlight(null);return;}
                const m=players.find(p=>p.username.toLowerCase()===e.target.value.trim().toLowerCase());
                setSpotlight(m?m.id:null);
              }}/>
            {lbSearch&&<button onClick={()=>{setLbSearch("");setSpotlight(null);}} style={{
              position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
              background:"rgba(255,255,255,.12)",border:"none",borderRadius:50,
              width:22,height:22,cursor:"pointer",color:"#fff",fontSize:".72rem"}}>✕</button>}
          </div>

          {/* Spotlight card */}
          {spotlight&&(()=>{
            const p=players.find(x=>x.id===spotlight);if(!p)return null;
            const st=getStats(p.id,getPeriodSessions());
            const rank=getRank(p.id);
            const badges=getBadges(p.id);
            const streak=getStreak(p.id);
            return(
              <div style={{...card({border:`2px solid ${p.color}`,background:`linear-gradient(135deg,${p.color}16,var(--card))`}),
                padding:22,marginBottom:18,animation:"popIn .3s ease both"}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,flexWrap:"wrap"}}>
                  <Av p={p} size={60} glow/>
                  <div>
                    <div style={{fontFamily:"Fredoka One",fontSize:"1.5rem",color:p.color}}>{p.host?"👑 ":""}{dn(p.username)}</div>
                    <div style={{fontSize:".82rem",color:rank.color,fontWeight:700}}>{rank.title}</div>
                    {streak>=2&&<div style={{fontSize:".76rem",color:"#FF6B35",fontWeight:800,marginTop:2}} className="fire">🔥 {streak}-game streak!</div>}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:9,marginBottom:12}}>
                  {[
                    {l:"Wins",     v:st.wins,           c:"#FFD700",i:"🏆"},
                    {l:"Kills",    v:st.kills,          c:"#FF4D8F",i:"💀"},
                    {l:"K/G",      v:st.kd,             c:"#00E5FF",i:"⚡"},
                    {l:"Win Rate", v:st.winRate+"%",    c:"#00FF94",i:"🎯"},
                    {l:"Lobbies",  v:st.appearances,    c:"#FFAB40",i:"📅"},
                    {l:"Carry",    v:getCarryScore(p.id),c:"#FF6B35",i:"🎖️"},
                    {l:"Consistency",v:getConsistency(p.id)+"%",c:"#00FF94",i:"🧱"},
                  ].map((s,i)=>(
                    <div key={i} style={{background:"rgba(0,0,0,.35)",borderRadius:9,padding:"8px 12px"}}>
                      <div style={{fontSize:".62rem",color:"var(--text3)",fontWeight:700,marginBottom:1}}>{s.i} {s.l}</div>
                      <div style={{fontFamily:"Fredoka One",color:s.c,fontSize:"1.2rem"}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                {badges.length>0&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {badges.map((b,i)=>(
                      <span key={i} style={{background:"rgba(255,255,255,.09)",borderRadius:50,padding:"3px 9px",fontSize:".7rem",fontWeight:700,color:"#fff",border:"1px solid rgba(255,255,255,.18)"}}>{b.icon} {b.label}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Sort pills */}
          <div style={{display:"flex",gap:7,marginBottom:16,flexWrap:"wrap"}}>
            {[
              {id:"wins",l:"🏆 Wins"},
              {id:"kills",l:"💀 Kills"},
              {id:"kd",l:"⚡ K/G"},
              {id:"winrate",l:"🎯 Win%"},
              {id:"appearances",l:"📅 Lobbies"},
              {id:"carry",l:"🎖️ Carry"},
              {id:"consistency",l:"🧱 Consistency"},
            ].map(s=>(
              <button key={s.id} className="pill" onClick={()=>setSortBy(s.id)} style={{
                padding:"7px 14px",borderRadius:50,fontWeight:700,fontSize:".78rem",
                background:sortBy===s.id?"var(--orange)":"var(--card)",
                color:sortBy===s.id?"#fff":"var(--text2)",
                border:sortBy===s.id?"none":"1.5px solid var(--border)",
                boxShadow:sortBy===s.id?"0 0 18px rgba(255,107,53,.42)":"none"}}>
                {s.l}
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="lb-table hud-bg" style={{...card(),overflow:"hidden",border:"1.5px solid rgba(255,255,255,.1)"}}>
            {/* Arena header */}
            <div style={{display:"grid",gridTemplateColumns:"46px 1fr 60px 60px 60px 60px 60px 52px",
              padding:"10px 18px",
              background:"linear-gradient(90deg,rgba(0,0,0,.7),rgba(0,0,0,.4))",
              borderBottom:"1px solid rgba(255,255,255,.08)"}}>
              {["#","PLAYER","W","K","K/G","WIN%","G","LVL"].map((h,i)=>(
                <span key={i} style={{
                  fontFamily:"Barlow Condensed",fontWeight:700,fontSize:".72rem",
                  letterSpacing:".15em",color:"rgba(255,255,255,.3)",
                  textAlign:i>1?"center":"left",textTransform:"uppercase"
                }}>{h}</span>
              ))}
            </div>
            {filteredLB.map((player,i)=>{
              const globalRank=sortedLB.findIndex(p=>p.id===player.id);
              const medals=["🥇","🥈","🥉"];
              const rank=getRank(player.id);
              const isHL=spotlight===player.id;
              const isFirst=globalRank===0&&sessions.length>0&&!foolsDay;
              const streak=getStreak(player.id);
              const lvl=getPlayerLevel(player.id);
              return(
                <div key={player.id}
                  className={`arena-row${isFirst?" arena-row-1":""}`}
                  onClick={()=>goProfile(player.id)}
                  style={{
                    display:"grid",gridTemplateColumns:"46px 1fr 60px 60px 60px 60px 60px 52px",
                    padding:"11px 18px",alignItems:"center",cursor:"pointer",
                    borderTop:"1px solid rgba(255,255,255,.04)",
                    background:isHL?`${player.color}14`:isFirst?"linear-gradient(90deg,rgba(255,215,0,.07),transparent)":"transparent",
                    outline:isHL?`2px solid ${player.color}44`:"none",
                    borderRadius:isHL?6:0,
                    animationDelay:`${Math.min(i,.25)*i*.025}s`,
                  }}>
                  {/* Rank number */}
                  <span className="rank-num" style={{
                    fontSize:globalRank<3?"1.3rem":".95rem",
                    color:isFirst?"#FFD700":globalRank===1?"#C0C0C0":globalRank===2?"#CD7F32":"rgba(255,255,255,.25)",
                    animation:isFirst?"crownSpin 3s ease-in-out infinite":undefined,
                    display:"inline-block",
                  }}>
                    {globalRank<3?medals[globalRank]:globalRank+1}
                  </span>
                  {/* Player info */}
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{position:"relative"}}>
                      <Av p={player} size={34} glow={isHL||isFirst} intel/>
                      {isFirst&&<div style={{
                        position:"absolute",inset:-2,borderRadius:"50%",
                        border:"1.5px solid rgba(255,215,0,.5)",
                        boxShadow:"0 0 12px rgba(255,215,0,.4)",
                        animation:"rankGlow 2s ease-in-out infinite",
                        pointerEvents:"none"
                      }}/>}
                    </div>
                    <div>
                      <div style={{
                        fontFamily:isFirst?"Barlow Condensed":"Fredoka One",
                        fontWeight:isFirst?900:400,
                        letterSpacing:isFirst?".04em":0,
                        color:isFirst?"#FFD700":"#fff",
                        fontSize:".9rem",
                        maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"
                      }}>
                        {player.host?"👑 ":""}{dn(player.username)}
                      </div>
                      <div style={{fontSize:".63rem",color:rank.color,fontWeight:700,letterSpacing:".02em"}}>
                        {rank.title}{streak>=2?` 🔥×${streak}`:""}
                      </div>
                      {/* Form dots */}
                      {(()=>{
                        const form=getFormGuide(player.id,5);
                        if(!form.length)return null;
                        return(
                          <div style={{display:"flex",gap:3,marginTop:4}}>
                            {form.map((f,fi)=>(
                              <div key={fi} style={{
                                width:7,height:7,borderRadius:"50%",
                                background:f.win?player.color:"rgba(255,255,255,.18)",
                                boxShadow:f.win?`0 0 5px ${player.color}88`:"none",
                                flexShrink:0}}/>
                            ))}
                          </div>
                        );
                      })()}
                      {/* Benchmark */}
                      {(()=>{
                        const bm=getBenchmark(player.id);
                        if(!bm)return null;
                        return(
                          <div style={{fontSize:".57rem",color:"var(--text3)",fontWeight:700,
                            marginTop:3,display:"flex",alignItems:"center",gap:3,
                            fontFamily:"Barlow Condensed",letterSpacing:".05em"}}>
                            <span style={{opacity:.5}}>↑</span>
                            <span style={{color:bm.target.color,opacity:.75}}>{bm.target.username}</span>
                            <span style={{opacity:.4}}>{bm.sameWins?`${bm.killGap}K`:` ${bm.winGap}W`}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  {/* HUD stats */}
                  {[
                    {v:player.wins,       c:"#FFD700"},
                    {v:player.kills,      c:"#FF4D8F"},
                    {v:player.kd,         c:"#00E5FF"},
                    {v:player.winRate+"%",c:"#00FF94"},
                    {v:player.appearances,c:"#FFAB40"},
                  ].map((s,si)=>(
                    <span key={si} className="stat-hud" style={{
                      textAlign:"center",
                      fontSize:isFirst?"1.1rem":".98rem",
                      color:isFirst?s.c:`${s.c}cc`,
                      animationDelay:`${si*.04+i*.02}s`,
                      textShadow:isFirst?`0 0 12px ${s.c}66`:"none",
                    }}>{s.v}</span>
                  ))}
                  {/* Level */}
                  <div style={{textAlign:"center"}}>
                    <div className="bc9" style={{fontSize:".88rem",
                      color:`${player.color}cc`,lineHeight:1}}>{lvl.lvl}</div>
                    <div style={{height:2,background:"rgba(255,255,255,.08)",
                      borderRadius:1,overflow:"hidden",marginTop:3}}>
                      <div style={{height:"100%",borderRadius:1,
                        background:player.color,width:`${lvl.progress}%`,
                        transition:"width .4s ease"}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile cards */}
          <div className="lb-cards" style={{flexDirection:"column",gap:9}}>
            {filteredLB.map((player,i)=>{
              const globalRank=sortedLB.findIndex(p=>p.id===player.id);
              const medals=["🥇","🥈","🥉"];
              const rank=getRank(player.id);
              const isHL=spotlight===player.id;
              const streak=getStreak(player.id);
              return(
                <div key={player.id} onClick={()=>goProfile(player.id)} style={{...card({border:isHL?`2px solid ${player.color}`:`1.5px solid ${player.color}2a`}),
                  padding:"12px 14px",display:"flex",alignItems:"center",gap:11,cursor:"pointer",
                  background:isHL?`${player.color}10`:"var(--card)",
                  animation:`slideR .3s ease ${i*.03}s both`}}>
                  <span style={{fontFamily:"Fredoka One",fontSize:globalRank<3?"1.25rem":"1rem",
                    color:globalRank<3?"#fff":"var(--text3)",minWidth:26,textAlign:"center"}}>
                    {globalRank<3?medals[globalRank]:globalRank+1}
                  </span>
                  <Av p={player} size={36} glow={isHL}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"Fredoka One",color:"#fff",fontSize:".9rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {player.host?"👑 ":""}{dn(player.username)}
                    </div>
                    <div style={{fontSize:".65rem",color:rank.color,fontWeight:700}}>
                      {rank.title}{streak>=2?` 🔥×${streak}`:""}
                    </div>
                    {/* Form guide dots */}
                    {(()=>{
                      const form=getFormGuide(player.id,5);
                      if(!form.length)return null;
                      return(
                        <div style={{display:"flex",gap:3,marginTop:4}}>
                          {form.map((f,fi)=>(
                            <div key={fi} title={f.win?"W":"L"} style={{
                              width:7,height:7,borderRadius:"50%",
                              background:f.win?player.color:"rgba(255,255,255,.18)",
                              boxShadow:f.win?`0 0 4px ${player.color}77`:"none",
                              flexShrink:0}}/>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{display:"flex",gap:5,flexShrink:0}}>
                    {[
                      {v:player.wins,         c:"#FFD700",l:"W"},
                      {v:player.kills,        c:"#FF4D8F",l:"K"},
                      {v:player.winRate+"%",  c:"#00FF94",l:"WR"},
                      {v:player.appearances,  c:"#FFAB40",l:"G"},
                      {v:"LV"+getPlayerLevel(player.id).lvl, c:"#C77DFF",l:"LVL"},
                    ].map((s,j)=>(
                      <div key={j} className="mob-hide" style={{textAlign:"center",minWidth:28}}>
                        <div className="bc9" style={{color:s.c,fontSize:".9rem",lineHeight:1}}>{s.v}</div>
                        <div className="bc7" style={{fontSize:".48rem",color:"var(--text3)",letterSpacing:".1em"}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {getPeriodSessions().length===0&&(
            <div style={{textAlign:"center",padding:"48px 0"}}>
              <div style={{fontSize:"2.2rem",marginBottom:10}}>📊</div>
              <p style={{fontWeight:700,color:"var(--text2)"}}>
                {lbPeriod==="today"?"No lobbies today yet!":`No lobbies this ${lbPeriod==="week"?"week":"time"}`}
              </p>
              <p style={{fontSize:".82rem",color:"var(--text3)",marginTop:5}}>Check back after the next session!</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ RIVALS ═══════════════ */}
      {view==="rivals"&&(
        <div className="fade-up" style={{minHeight:"calc(100vh - 120px)"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <p style={{color:"var(--text3)",fontWeight:800,fontSize:".7rem",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>Who dominates who</p>
            <h2 style={{fontFamily:"Fredoka One",fontSize:"clamp(2rem,8vw,3.2rem)",
              background:"linear-gradient(135deg,#FF4D8F,#FFD700,#FF6B35)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
              ⚔️ Rivalries
            </h2>
            <p style={{color:"var(--text2)",marginTop:8,fontSize:".86rem"}}>
              Head-to-head when they finished 1st & 2nd in the same lobby · {sessions.length} lobbies tracked
            </p>
          </div>

          <div style={{position:"relative",marginBottom:18}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:"1rem",pointerEvents:"none"}}>🔍</span>
            <input className="search-inp" placeholder="Search a player's name…"
              value={rivalSearch} onChange={e=>setRivalSearch(e.target.value)}/>
          </div>

          {/* Head-to-Head tool */}
          <div className="h2h-scroll" style={{...card({border:"2px solid rgba(0,229,255,.25)"}),padding:22,marginBottom:22}}>
            <h3 style={{fontFamily:"Fredoka One",color:"#00E5FF",fontSize:"1.1rem",marginBottom:14}}>🆚 Head-to-Head Comparison</h3>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
              {[{val:h2hA,set:setH2hA,label:"Player A"},{val:h2hB,set:setH2hB,label:"Player B"}].map((s,i)=>(
                <div key={i} style={{flex:1,minWidth:160}}>
                  <label style={{display:"block",color:"var(--text3)",fontWeight:800,fontSize:".7rem",letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>{s.label}</label>
                  <select value={s.val} onChange={e=>s.set(e.target.value)} style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"2px solid var(--border)",background:"#190f3d",color:"#fff",fontSize:".9rem",outline:"none"}}>
                    <option value="">Select player…</option>
                    {players.map(p=><option key={p.id} value={p.id}>{p.username}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {(()=>{
              const h=getH2H(h2hA,h2hB);
              const pA=players.find(x=>x.id===h2hA);
              const pB=players.find(x=>x.id===h2hB);
              if(!h||!pA||!pB)return(
                <p style={{color:"var(--text3)",fontSize:".84rem",textAlign:"center",padding:"12px 0"}}>Select two players to compare them head-to-head</p>
              );
              const stA=getStats(h2hA),stB=getStats(h2hB);
              return(
                <div style={{animation:"popIn .25s ease"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,alignItems:"center",marginBottom:14}}>
                    <div style={{textAlign:"center"}}>
                      <Av p={pA} size={52} glow/>
                      <div style={{fontFamily:"Fredoka One",color:pA.color,fontSize:"1rem",marginTop:6}}>{pA.username}</div>
                      <div style={{fontSize:".72rem",color:getRank(h2hA).color,fontWeight:700}}>{getRank(h2hA).title}</div>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontFamily:"Fredoka One",color:"var(--text3)",fontSize:"1.4rem"}}>vs</div>
                      <div style={{fontSize:".68rem",color:"var(--text3)",fontWeight:700,marginTop:4}}>{h.shared} shared lobbies</div>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <Av p={pB} size={52} glow/>
                      <div style={{fontFamily:"Fredoka One",color:pB.color,fontSize:"1rem",marginTop:6}}>{pB.username}</div>
                      <div style={{fontSize:".72rem",color:getRank(h2hB).color,fontWeight:700}}>{getRank(h2hB).title}</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8,marginBottom:12}}>
                    {[
                      {l:"Wins (shared)",aV:h.aWins,bV:h.bWins,c:"#FFD700"},
                      {l:"Kills (shared)",aV:h.aKills,bV:h.bKills,c:"#FF4D8F"},
                      {l:"1v1 Duels",aV:h.aDuels,bV:h.bDuels,c:"#C77DFF"},
                      {l:"All-time Wins",aV:stA.wins,bV:stB.wins,c:"#FFD700"},
                      {l:"All-time Kills",aV:stA.kills,bV:stB.kills,c:"#FF4D8F"},
                      {l:"Win Rate",aV:stA.winRate+"%",bV:stB.winRate+"%",c:"#00FF94"},
                    ].map((row,i)=>{
                      const aNum=parseFloat(row.aV)||0,bNum=parseFloat(row.bV)||0;
                      const aWin=aNum>bNum,tie=aNum===bNum;
                      return(
                        <div key={i} style={{background:"rgba(0,0,0,.35)",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                          <div style={{fontSize:".6rem",color:"var(--text3)",fontWeight:700,marginBottom:6,letterSpacing:.5}}>{row.l}</div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontFamily:"Fredoka One",color:aWin?row.c:tie?"var(--text2)":"var(--text3)",fontSize:"1.1rem"}}>{row.aV}</span>
                            <span style={{color:"var(--text3)",fontSize:".7rem"}}>–</span>
                            <span style={{fontFamily:"Fredoka One",color:!aWin&&!tie?row.c:tie?"var(--text2)":"var(--text3)",fontSize:"1.1rem"}}>{row.bV}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {h.shared>0&&(
                    <div style={{textAlign:"center",padding:"10px",background:`linear-gradient(135deg,${h.aWins>h.bWins?pA.color:pB.color}12,rgba(0,0,0,.2))`,borderRadius:10,fontSize:".82rem",fontWeight:700,color:"var(--text2)"}}>
                      {h.aWins===h.bWins?"🤝 Dead even in shared games":
                        `${(h.aWins>h.bWins?pA:pB).username} dominates shared lobbies ${Math.max(h.aWins,h.bWins)}–${Math.min(h.aWins,h.bWins)}`}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Top 3 marquee */}
          {rivals.slice(0,3).map((r,idx)=>{
            const p1=players.find(x=>x.id===r.p1),p2=players.find(x=>x.id===r.p2);
            if(!p1||!p2)return null;
            const p1Leading=r.p1wins>=r.p2wins;
            const leader=p1Leading?p1:p2;
            const lWins=p1Leading?r.p1wins:r.p2wins;
            const tWins=p1Leading?r.p2wins:r.p1wins;
            const diffPct=((lWins-tWins)/r.total)*100;
            const labels=["🔥 Hottest Rivalry","⚔️ #2 Rivalry","💥 #3 Rivalry"];
            const accent=idx===0?"#FF4D8F":idx===1?"#FFD700":"#FF6B35";
            return(
              <div key={r.p1+r.p2} style={{...card({border:`2px solid ${accent}44`,
                background:`linear-gradient(135deg,${accent}0a,var(--card))`}),
                padding:22,marginBottom:14,animation:`fadeUp .38s ease ${idx*.08}s both`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:6}}>
                  <span style={{fontSize:".68rem",color:accent,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase"}}>{labels[idx]}</span>
                  <span style={{fontSize:".74rem",color:"var(--text3)",fontWeight:700}}>{r.total} meetings total</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                  <div style={{textAlign:"center",flexShrink:0}}>
                    <Av p={p1} size={50} glow={p1Leading}/>
                    <div style={{fontFamily:"Fredoka One",color:p1.color,fontSize:".88rem",marginTop:5,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p1.username}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontFamily:"Fredoka One",color:p1.color,fontSize:"1.8rem"}}>{r.p1wins}</span>
                      <span style={{color:"var(--text3)",fontWeight:800,fontSize:".8rem",alignSelf:"center"}}>vs</span>
                      <span style={{fontFamily:"Fredoka One",color:p2.color,fontSize:"1.8rem"}}>{r.p2wins}</span>
                    </div>
                    <div className="rival-bar">
                      <div className="rival-fill" style={{width:`${(r.p1wins/r.total)*100}%`,
                        background:`linear-gradient(90deg,${p1.color},${p1.color}66)`}}></div>
                    </div>
                    <div style={{textAlign:"center",marginTop:8}}>
                      <span style={{color:leader.color,fontWeight:800,fontSize:".84rem"}}>{leader.username}</span>
                      <span style={{color:"var(--text3)",fontSize:".8rem"}}> leads {lWins}–{tWins}</span>
                      {r.p1wins===r.p2wins&&<span style={{color:"#FFD700",fontWeight:700,fontSize:".8rem"}}> · Dead even! 🤝</span>}
                    </div>
                  </div>
                  <div style={{textAlign:"center",flexShrink:0}}>
                    <Av p={p2} size={50} glow={!p1Leading}/>
                    <div style={{fontFamily:"Fredoka One",color:p2.color,fontSize:".88rem",marginTop:5,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p2.username}</div>
                  </div>
                </div>
                {diffPct>40&&(
                  <div style={{textAlign:"center",fontSize:".76rem",color:leader.color,fontWeight:700}}>
                    🔥 {leader.username} is absolutely dominating this rivalry
                  </div>
                )}
              </div>
            );
          })}

          {/* All matchups grid */}
          <h3 style={{fontFamily:"Fredoka One",color:"var(--text2)",fontSize:"1rem",marginBottom:14,marginTop:22}}>
            All 1st-vs-2nd Duels · {filteredRivals.length} matchups
          </h3>
          <div className="rival-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>
            {filteredRivals.map((r,i)=>{
              const p1=players.find(x=>x.id===r.p1),p2=players.find(x=>x.id===r.p2);
              if(!p1||!p2)return null;
              const p1Leading=r.p1wins>r.p2wins,tied=r.p1wins===r.p2wins;
              return(
                <div key={r.p1+r.p2} style={{...card(),padding:"14px 16px",
                  animation:`fadeUp .32s ease ${Math.min(i,.6)*.04}s both`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Av p={p1} size={36} glow={p1Leading}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                        <span style={{fontFamily:"Fredoka One",color:p1.color,fontSize:".88rem",
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:90}}>{p1.username}</span>
                        <div style={{display:"flex",gap:5,alignItems:"center"}}>
                          <span style={{fontFamily:"Fredoka One",color:p1.color,fontSize:"1.1rem"}}>{r.p1wins}</span>
                          <span style={{color:"var(--text3)",fontSize:".72rem"}}>–</span>
                          <span style={{fontFamily:"Fredoka One",color:p2.color,fontSize:"1.1rem"}}>{r.p2wins}</span>
                        </div>
                        <span style={{fontFamily:"Fredoka One",color:p2.color,fontSize:".88rem",
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:90,textAlign:"right"}}>{p2.username}</span>
                      </div>
                      <div className="rival-bar">
                        <div className="rival-fill" style={{width:`${(r.p1wins/r.total)*100}%`,
                          background:`linear-gradient(90deg,${p1.color},${p1.color}77)`}}></div>
                      </div>
                      <div style={{textAlign:"center",marginTop:4,fontSize:".65rem",color:"var(--text3)",fontWeight:700}}>
                        {r.total} games · {tied?"Tied 🤝":p1Leading?p1.username+" leads":p2.username+" leads"}
                      </div>
                    </div>
                    <Av p={p2} size={36} glow={!p1Leading&&!tied}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════ LOBBIES ═══════════════ */}
      {view==="lobbies"&&(
        <div className="fade-up" style={{minHeight:"calc(100vh - 120px)"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <h2 style={{fontFamily:"Fredoka One",fontSize:"clamp(2rem,8vw,3.2rem)",
              background:"linear-gradient(135deg,#FF4D8F,#C77DFF)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
              🎮 Lobby History
            </h2>
            <p style={{color:"var(--text2)",marginTop:8,fontSize:".86rem"}}>{sessions.length} lobbies on record</p>
          </div>
          {/* Filters */}
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <div style={{position:"relative",flex:1,minWidth:160}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:".9rem",pointerEvents:"none"}}>👤</span>
              <select value={lobbyFilter} onChange={e=>setLobbyFilter(e.target.value)}
                style={{width:"100%",padding:"9px 12px 9px 34px",borderRadius:10,border:"2px solid var(--border)",background:"#190f3d",color:"#fff",fontSize:".86rem",outline:"none"}}>
                <option value="">All players</option>
                {players.map(p=><option key={p.id} value={p.id}>{p.username}</option>)}
              </select>
            </div>
            <input type="date" value={lobbyDate} onChange={e=>setLobbyDate(e.target.value)}
              style={{padding:"9px 12px",borderRadius:10,border:"2px solid var(--border)",background:"#190f3d",color:"#fff",fontSize:".86rem",outline:"none",flexShrink:0}}/>
            {(lobbyFilter||lobbyDate)&&(
              <button onClick={()=>{setLobbyFilter("");setLobbyDate("");}} style={{
                padding:"9px 14px",borderRadius:10,border:"1.5px solid var(--border)",
                background:"rgba(255,255,255,.07)",color:"var(--text2)",cursor:"pointer",fontWeight:700,fontSize:".82rem",flexShrink:0}}>
                Clear ✕
              </button>
            )}
          </div>
          {(()=>{
            let filtered=[...sessions].sort((a,b)=>new Date(b.date)-new Date(a.date)||parseInt(b.id.slice(1))-parseInt(a.id.slice(1)));
            if(lobbyFilter)filtered=filtered.filter(s=>s.attendees?.includes(lobbyFilter));
            if(lobbyDate)filtered=filtered.filter(s=>s.date===lobbyDate);
            return(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {(lobbyFilter||lobbyDate)&&<p style={{color:"var(--text3)",fontSize:".8rem",fontWeight:700,marginBottom:4}}>
              {filtered.length} lobby{filtered.length!==1?"s":""} found
            </p>}
            {filtered.map((s,idx)=>{
              const winner=players.find(p=>p.id===s.winner);
              const tkPid=s.attendees?.reduce((best,pid)=>
                (s.kills?.[pid]||0)>(s.kills?.[best]||0)?pid:best,s.attendees?.[0]);
              const tkP=players.find(p=>p.id===tkPid);
              const tkK=s.kills?.[tkPid]||0;
              const totalLobbyKills=Object.values(s.kills||{}).reduce((a,b)=>a+b,0);
              return(
                <div key={s.id} style={{...card(),padding:20,position:"relative",cursor:"pointer",
                  animation:`fadeUp .35s ease ${Math.min(idx,.5)*.06}s both`,
                  border:`1.5px solid ${expandedSid===s.id?"rgba(255,107,53,.6)":"var(--border)"}`}}
                  onClick={e=>{if(e.target.tagName==="BUTTON")return;setExpandedSid(v=>v===s.id?null:s.id);}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:12}}>
                    <div>
                      <div style={{fontFamily:"Fredoka One",color:"#FFAB40",fontSize:".88rem",marginBottom:3}}>
                        📅 {new Date(s.date+"T12:00:00Z").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}{s.date==="2026-04-04"&&<span style={{marginLeft:6,fontSize:".8rem"}}>🥚 Easter</span>}{s.date==="2026-04-03"&&<span style={{marginLeft:6,fontSize:".8rem"}}>💪 Good Friday</span>}{s.date==="2026-04-01"&&<span style={{marginLeft:6,fontSize:".8rem"}}>🃏 April Fools</span>}
                        <span style={{color:"var(--text3)",fontSize:".76rem",fontWeight:700,marginLeft:8}}>· {s.notes}</span>
                      </div>
                      {s.notes&&s.notes!==("Lobby "+s.id?.replace("s",""))&&<p style={{color:"var(--text2)",fontSize:".8rem",fontStyle:"italic"}}>"{s.notes}"</p>}
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <div style={{fontSize:".62rem",color:"var(--text3)",fontWeight:700,
                        background:"rgba(255,255,255,.06)",borderRadius:7,padding:"4px 8px"}}>
                        💀 {totalLobbyKills} kills
                      </div>
                      <div style={{fontSize:".62rem",color:"var(--text3)",fontWeight:700,
                        background:"rgba(255,255,255,.06)",borderRadius:7,padding:"4px 8px"}}>
                        👥 {s.attendees?.length||0} players
                      </div>
                    </div>
                  </div>
                  {/* Placements */}
                  {s.placements&&s.placements.length>0&&(
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                      {s.placements.slice(0,5).map((pid,pi)=>{
                        const p=players.find(x=>x.id===pid);if(!p)return null;
                        const k=s.kills?.[pid]||0;
                        const medals=["🥇","🥈","🥉"];
                        return(
                          <div key={pid} style={{display:"flex",alignItems:"center",gap:5,
                            background:`${p.color}14`,border:`1px solid ${p.color}44`,
                            borderRadius:8,padding:"4px 9px"}}>
                            <span style={{fontSize:".78rem"}}>{pi<3?medals[pi]:`${pi+1}.`}</span>
                            <Av p={p} size={22}/>
                            <span style={{fontFamily:"Fredoka One",color:p.color,fontSize:".8rem"}}>{p.username}</span>
                            {k>0&&<span style={{color:"#FF4D8F",fontSize:".72rem",fontWeight:700}}>{k}k</span>}
                          </div>
                        );
                      })}
                      {s.placements.length>5&&(
                        <div style={{display:"flex",alignItems:"center",padding:"4px 9px",
                          background:"rgba(255,255,255,.06)",borderRadius:8,color:"var(--text3)",fontSize:".76rem",fontWeight:700}}>
                          +{s.placements.length-5} more
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    {winner&&(
                      <div style={{background:"rgba(255,215,0,.08)",border:"1px solid rgba(255,215,0,.25)",
                        borderRadius:8,padding:"5px 11px",display:"flex",alignItems:"center",gap:7}}>
                        <span style={{fontSize:".7rem",color:"var(--text3)"}}>🏆 Winner</span>
                        <Av p={winner} size={22}/>
                        <span style={{fontFamily:"Fredoka One",color:winner.color,fontSize:".86rem"}}>{winner.username}</span>
                      </div>
                    )}
                    {tkP&&tkK>0&&(
                      <div style={{background:"rgba(255,77,143,.08)",border:"1px solid rgba(255,77,143,.25)",
                        borderRadius:8,padding:"5px 11px",display:"flex",alignItems:"center",gap:7}}>
                        <span style={{fontSize:".7rem",color:"var(--text3)"}}>💀 Top Fragger</span>
                        <Av p={tkP} size={22}/>
                        <span style={{fontFamily:"Fredoka One",color:tkP.color,fontSize:".86rem"}}>{tkP.username} ({tkK}k)</span>
                      </div>
                    )}
                  </div>
                  {/* Expanded detail */}
                  {expandedSid===s.id&&s.placements&&s.placements.length>0&&(
                    <div style={{marginTop:14,borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:14}}
                      onClick={e=>e.stopPropagation()}>
                      <div style={{fontSize:".72rem",color:"var(--text3)",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Full Placement</div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {s.placements.map((pid,pi)=>{
                          const p=players.find(x=>x.id===pid);if(!p)return null;
                          const k=s.kills?.[pid]||0;
                          const medals=["🥇","🥈","🥉"];
                          const isWin=pi===0;
                          return(
                            <div key={pid} onClick={()=>goProfile(pid)} style={{
                              display:"flex",alignItems:"center",gap:10,
                              background:isWin?"rgba(255,215,0,.08)":`${p.color}08`,
                              border:`1px solid ${isWin?"rgba(255,215,0,.3)":`${p.color}22`}`,
                              borderRadius:9,padding:"7px 12px",cursor:"pointer"}}>
                              <span style={{fontFamily:"Fredoka One",fontSize:pi<3?"1.1rem":".9rem",minWidth:26,textAlign:"center",color:pi<3?"#fff":"var(--text3)"}}>{pi<3?medals[pi]:`${pi+1}`}</span>
                              <Av p={p} size={28}/>
                              <span style={{fontFamily:"Fredoka One",color:p.color,fontSize:".88rem",flex:1}}>{p.username}</span>
                              <span style={{fontFamily:"Fredoka One",color:k>0?"#FF4D8F":"var(--text3)",fontSize:".9rem"}}>{k>0?`${k}K`:"–"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div style={{position:"absolute",top:12,right:adminMode?44:12,color:"var(--text3)",fontSize:".72rem",fontWeight:700}}>
                    {expandedSid===s.id?"▲":"▼"}
                  </div>
                  {/* Clip link */}
                  {s.clip&&(
                    <div style={{marginTop:8}}>
                      <a href={s.clip} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{
                        display:"inline-flex",alignItems:"center",gap:6,
                        padding:"4px 12px",borderRadius:8,textDecoration:"none",
                        background:"rgba(145,71,255,.18)",border:"1px solid rgba(145,71,255,.4)",
                        color:"#cc99ff",fontWeight:700,fontSize:".74rem"}}>
                        🎬 Watch Clip
                      </a>
                    </div>
                  )}
                  {/* Share Card Button */}
                  {expandedSid===s.id&&(
                    <div style={{marginTop:10}}>
                      <button onClick={e=>{e.stopPropagation();setShareCard({sid:s.id,visible:true});}}
                        style={{display:"inline-flex",alignItems:"center",gap:6,
                          padding:"5px 14px",borderRadius:8,cursor:"pointer",
                          background:"rgba(0,229,255,.12)",border:"1px solid rgba(0,229,255,.4)",
                          color:"#00E5FF",fontWeight:700,fontSize:".78rem"}}>
                        📤 Share Result
                      </button>
                    </div>
                  )}

                  {adminMode&&(
                    <div style={{position:"absolute",top:10,right:10,display:"flex",gap:5}}>
                      <button onClick={e=>{e.stopPropagation();handleEditSession(s);}} style={{
                        background:"rgba(255,215,0,.15)",border:"1px solid rgba(255,215,0,.5)",
                        color:"#FFD700",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:".7rem"}}>✏️</button>
                      <button onClick={e=>{e.stopPropagation();handleDelSession(s.id);}} style={{
                        background:"rgba(231,76,60,.15)",border:"1px solid #E74C3C",
                        color:"#E74C3C",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:".7rem"}}>✕</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )})()}
        </div>
      )}

      {/* ═══════════════ ADMIN ═══════════════ */}
      {view==="admin"&&adminMode&&(
        <div className="fade-up">
          <div style={{marginBottom:22}}>
            <h2 style={{fontFamily:"Fredoka One",fontSize:"2rem",color:"#FF4D8F"}}>⚙️ Admin Panel</h2>
            <p style={{color:"var(--text2)",marginTop:4,fontSize:".84rem"}}>Record lobbies · manage the roster</p>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
            {[{id:"session",l:"🎮 Record Lobby"},{id:"player",l:"👾 Add Player"},{id:"manage",l:"🗂️ Roster"}].map(t=>(
              <button key={t.id} className="pill" onClick={()=>setAdminTab(t.id)} style={{
                padding:"10px 18px",borderRadius:10,fontWeight:700,fontSize:".86rem",
                background:adminTab===t.id?"#FF4D8F":"var(--card)",
                color:adminTab===t.id?"#fff":"var(--text2)",
                border:adminTab===t.id?"none":"1.5px solid var(--border)",
                boxShadow:adminTab===t.id?"0 4px 18px rgba(255,77,143,.4)":"none"}}>
                {t.l}
              </button>
            ))}
          </div>

          {adminTab==="session"&&(
            <div style={{...card(),padding:26,maxWidth:720}}>
              {editingSess&&(
                <div style={{background:"rgba(255,107,53,.15)",border:"2px solid rgba(255,107,53,.4)",borderRadius:10,padding:"10px 16px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                  <span style={{color:"#FF6B35",fontWeight:800,fontSize:".9rem"}}>✏️ Editing: {editingSess.notes||editingSess.id}</span>
                  <button onClick={()=>{setEditingSess(null);setSf(emptyForm());}} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",color:"#fff",borderRadius:7,padding:"4px 12px",cursor:"pointer",fontSize:".8rem"}}>✕ Cancel Edit</button>
                </div>
              )}
              <h3 style={{fontFamily:"Fredoka One",color:"#FFD700",fontSize:"1.1rem",marginBottom:20}}>{editingSess?"✏️ Edit Lobby":"🎮 Record a Lobby"}</h3>
              <div style={{marginBottom:16}}>
                <label style={lbl}>Date</label>
                <input type="date" value={sf.date} onChange={e=>setSf({...sf,date:e.target.value})} style={{...inp(),width:200}}/>
              </div>
              <div style={{marginBottom:16}}>
                <label style={lbl}>Who played?</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:190,overflowY:"auto",padding:4,background:"rgba(0,0,0,.18)",borderRadius:8}}>
                  {players.map(p=>(
                    <button key={p.id} onClick={()=>toggleAtt(p.id)} style={{
                      padding:"4px 12px",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:".76rem",
                      background:sf.attendees.includes(p.id)?`${p.color}28`:"rgba(255,255,255,.05)",
                      border:`1.5px solid ${sf.attendees.includes(p.id)?p.color:"rgba(255,255,255,.14)"}`,
                      color:sf.attendees.includes(p.id)?p.color:"var(--text2)"}}>
                      {sf.attendees.includes(p.id)?"✓ ":""}{p.username}
                    </button>
                  ))}
                </div>
              </div>
              {sf.attendees.length>=2&&(
                <>
                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Winner 🏆</label>
                    <select value={sf.winner} onChange={e=>setSf({...sf,winner:e.target.value})} style={{...inp(),width:220}}>
                      <option value="">Select winner…</option>
                      {sf.attendees.map(pid=>{const p=players.find(x=>x.id===pid);return<option key={pid} value={pid}>{p?.username}</option>;})}
                    </select>
                  </div>
                  <div style={{marginBottom:16}}>
                    <label style={lbl}>Kills & Deaths</label>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:8}}>
                      {sf.attendees.map(pid=>{
                        const p=players.find(x=>x.id===pid);
                        return(
                          <div key={pid} style={{background:"rgba(0,0,0,.38)",borderRadius:9,padding:11}}>
                            <div style={{fontFamily:"Fredoka One",color:p?.color,fontSize:".86rem",marginBottom:7}}>
                              {pid===sf.winner?"👑 ":""}{p?.username}
                            </div>
                            <div style={{display:"flex",gap:8}}>
                              {[["💀","kills"],["💔","deaths"]].map(([icon,key])=>(
                                <div key={key} style={{display:"flex",alignItems:"center",gap:4}}>
                                  <label style={{color:"var(--text3)",fontSize:".68rem"}}>{icon}</label>
                                  <input type="number" min="0" value={sf[key][pid]||0}
                                    onChange={e=>setSf({...sf,[key]:{...sf[key],[pid]:parseInt(e.target.value)||0}})}
                                    style={{...inp(),width:52,padding:"4px 6px",fontSize:".86rem"}}/>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              <div style={{marginBottom:20}}>
                <label style={lbl}>Notes (optional)</label>
                <textarea value={sf.notes} onChange={e=>setSf({...sf,notes:e.target.value})}
                  rows={2} placeholder="Any highlights?" style={{...inp(),width:"100%",resize:"vertical"}}/>
              </div>
              <div style={{marginBottom:20}}>
                <label style={lbl}>🎬 Twitch Clip URL (optional)</label>
                <input type="url" placeholder="https://clips.twitch.tv/…" value={sf.clip||""}
                  onChange={e=>setSf({...sf,clip:e.target.value})}
                  style={{...inp(),width:"100%"}}/>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={handleSaveSession} style={primaryBtn()}>{editingSess?"✏️ Update Lobby":"💾 Save Lobby"}</button>
                {editingSess&&<button onClick={()=>{setEditingSess(null);setSf(emptyForm());}} style={{...primaryBtn({background:"rgba(255,255,255,.12)",boxShadow:"none",border:"1.5px solid var(--border)",color:"var(--text2)"})}}> Cancel</button>}
              </div>
            </div>
          )}

          {adminTab==="player"&&(
            <div style={{...card(),padding:26,maxWidth:360}}>
              <h3 style={{fontFamily:"Fredoka One",color:"#FFD700",fontSize:"1.1rem",marginBottom:18}}>👾 Add Player</h3>
              <div style={{marginBottom:14}}>
                <label style={lbl}>Gamertag</label>
                <input type="text" placeholder="Username…" value={np.username}
                  onChange={e=>setNp({...np,username:e.target.value})}
                  onKeyDown={e=>e.key==="Enter"&&handleAddPlayer()}
                  style={{...inp(),width:"100%"}}/>
              </div>
              <div style={{marginBottom:18}}>
                <label style={lbl}>Colour</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {ACCENT_COLORS.map(c=>(
                    <button key={c} onClick={()=>setNp({...np,color:c})} style={{
                      width:27,height:27,borderRadius:"50%",background:c,cursor:"pointer",
                      border:np.color===c?"3px solid #fff":"3px solid transparent",
                      boxShadow:np.color===c?`0 0 10px ${c}`:"none",transition:"all .15s"}}/>
                  ))}
                </div>
              </div>
              <div style={{background:"rgba(0,0,0,.35)",borderRadius:11,padding:12,marginBottom:18,display:"flex",alignItems:"center",gap:10}}>
                <Av p={{username:np.username||"?",color:np.color}} size={38}/>
                <div>
                  <div style={{fontFamily:"Fredoka One",color:"#fff"}}>{np.username||"Preview"}</div>
                  <div style={{fontSize:".68rem",color:"var(--text3)"}}>🎮 Rookie</div>
                </div>
              </div>
              <button onClick={handleAddPlayer} style={{...primaryBtn({background:"linear-gradient(135deg,#00E5FF,#3498DB)",boxShadow:"0 4px 16px rgba(0,229,255,.32)",width:"100%",textAlign:"center"})}}>
                ➕ Add to Roster
              </button>
            </div>
          )}

          {adminTab==="manage"&&(
            <div style={{...card(),padding:22,maxWidth:580}}>
              <h3 style={{fontFamily:"Fredoka One",color:"#FFD700",fontSize:"1.1rem",marginBottom:14}}>🗂️ Roster · {players.length} Players</h3>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {players.map((p,i)=>{
                  const st=getStats(p.id);
                  return(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,
                      background:"rgba(0,0,0,.32)",borderRadius:9,padding:"9px 12px",
                      animation:`fadeUp .28s ease ${i*.025}s both`}}>
                      <Av p={p} size={30}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"Fredoka One",color:"#fff",fontSize:".88rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {p.host?"👑 ":""}{dn(p.username)}
                        </div>
                        <div style={{fontSize:".62rem",color:"var(--text3)"}}>
                          {st.wins}W · {st.kills}K · {st.winRate}%WR · {st.appearances}G
                        </div>
                      </div>
                      {!p.host&&(
                        <button onClick={()=>handleDelPlayer(p.id)} style={{
                          background:"rgba(231,76,60,.14)",border:"1px solid #E74C3C",
                          color:"#E74C3C",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:".68rem",flexShrink:0}}>Remove</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}


      {/* ═══════════════ PROFILE / COMBAT FILE ═══════════════ */}
      {view==="profile"&&(()=>{
        // resolve active player — default to first if none set
        const p=profileId?players.find(x=>x.id===profileId)||players[0]:players[0];
        if(!p)return null;
        const st=getStats(p.id);
        const rank=getRank(p.id);
        const badges=getBadges(p.id);
        const streak=getStreak(p.id);
        const s2Sess=sessions.filter(s=>s.date>="2026-04-01");
        const s2St=getStats(p.id,s2Sess);
        const form=getFormGuide(p.id,5);
        const drought=getDrought(p.id);
        const carry=getCarryScore(p.id);
        const consistency=getConsistency(p.id);
        const lastSeen=getLastSeen(p.id);
        const daysActive=getDaysActive(p.id);
        // Primary rival — highest meeting count from H2H data
        const pRivals=getRivals().filter(r=>r.p1===p.id||r.p2===p.id);
        const topRival=pRivals[0];
        const rivalId=topRival?(topRival.p1===p.id?topRival.p2:topRival.p1):null;
        const rivalP=rivalId?players.find(x=>x.id===rivalId):null;
        const rivalSt=rivalP?getStats(rivalP.id):null;
        const rivalWins=topRival?(topRival.p1===p.id?topRival.p1wins:topRival.p2wins):0;
        const rivalLoss=topRival?(topRival.p1===p.id?topRival.p2wins:topRival.p1wins):0;
        // Career milestones
        const milestones=[
          {l:"1W",  done:st.wins>=1},
          {l:"3W",  done:st.wins>=3},
          {l:"10W", done:st.wins>=10},
          {l:"25W", done:st.wins>=25},
          {l:"50W", done:st.wins>=50},
          {l:"100W",done:st.wins>=100},
        ];
        // ── Per-player bios — human, direct, no filler ──
        const getBio=(pid)=>{
          const s=st;
          const kpg=s.appearances>0?parseFloat((s.kills/s.appearances).toFixed(1)):0;
          const dr=drought;
          const sk=streak;
          const droughtNote=dr>5?` ${dr} games without a win right now.`:dr>2?` A few dry games lately.`:"";
          const streakNote=sk>=3?` Coming in on a ${sk}-game streak.`:"";
          const s2Note=s2St.wins>0?` ${s2St.wins}W in Season 2 so far.`:"";

          const bios={
            p01:`Mekula runs the whole thing and still leads the all-time kill chart. ${s.kills} kills. That number does not happen by accident. He is in every fight, every lobby, every night. The wins do not always come but the damage always does.${s2Note}${streakNote}`,
            p02:`${s.wins} wins. That is the number. Teriqstp has been the most consistent player in this lobby from the start and Season 1 was not even close. They ran it wire to wire. Everyone who sits down across from them knows what they are getting into.${s2Note}`,
            p03:`Sanctus. ${s.appearances} lobbies in, one win on the board. The big performances are there if you look back through the records. They just do not come every night.${droughtNote}`,
            p04:`DjxHunter can take over a lobby completely when the mood is right. ${s.wins} wins, a 6-kill best game, Season 1 podium. The issue is consistency. Some nights it all clicks, other nights it just does not.${droughtNote}${streakNote}`,
            p05:`Bohdanmain shows up, says nothing, and sometimes wins four lobbies in a row. ${s.wins} wins from ${s.appearances} games. The quiet ones are always the ones you forget to watch.${s2Note}`,
            p06:`One of the early guys. 8 wins, ${s.appearances} lobbies, helped set the tone in the first weeks before a lot of the regulars found their way in. The record is there.`,
            p07:`${s.wins} wins and ${s.kills} kills. Dhemo is probably the most well-rounded player in the lobby. Wins consistently, kills consistently, shows up consistently. Hard to find a weakness on paper.${droughtNote}`,
            p08:`${s.wins} wins across ${s.appearances} lobbies and counting. Chugrud grinds every session without making a fuss about it. Not the flashiest player but they close out lobbies and that is what the record shows.${s2Note}`,
            p09:`${s.appearances} lobbies played. Zero wins. SirHaazy99 has been in more games than players who have five wins. Pure loyalty to the lobby. The first one is going to feel different when it comes.`,
            p10:`Dipped in for ${s.appearances} games and made an impression. Izzyboi is in the archive now.`,
            p11:`Loudmouth has ${s.wins} wins from ${s.appearances} lobbies and has been part of some of the best sessions this league has had. The win rate looks modest but the nights when they go off, everyone remembers.${droughtNote}`,
            p12:`${s.wins}W and ${s.kills}K from ${s.appearances} games. Michkyle comes and goes but when they are in the lobby they compete properly. The record would look different with more appearances.`,
            p13:`${s.wins} wins from ${s.appearances} lobbies. TheLostOG has one of the better win rates among the new faces and is building something in Season 2.${s2Note} Less time in the lobby but they make it count.`,
            p14:`${s.wins} wins, ${s.kills} kills, and a legitimate case for being the most dangerous player in Season 2 right now. Hackqam went from showing up occasionally to being one of the more dangerous players in the lobby over the last few weeks.${s2Note}`,
            p15:`${s.wins} wins and Nellywaz is still finding another gear. The Season 2 run has been the best stretch of their time in the lobby so far.${s2Note}${streakNote} Quiet player who lets the results speak.`,
            p16:`${s.wins} wins from ${s.appearances} games. Zakipro has one of the better win rates in the lobby relative to time spent, just does not log as many sessions as the regulars.${s2Note}`,
            p17:`ZapGrupoBulletBR. ${s.appearances} games logged. Longest name in the lobby by a mile and still shows up.`,
            p18:`${s.appearances} lobbies. CelesteHI5 has played more games than most people realise. Been here since the first few weeks. ${s.wins} wins, ${s.kills} kills, here every week.${s2Note}`,
            p19:`6 games played and a win among them. xLilithx left a mark quickly and has a better win rate than a lot of players with five times the appearances.`,
            p20:`${s.wins}W from ${s.appearances} lobbies. DeadlySoaringSeagull6 competes properly when they are in the room. Not a regular yet but the record is respectable.`,
            p21:`${s.appearances} lobbies in, first win still to come. Beedee4PF keeps showing up. That counts for something in a lobby this competitive.`,
            p22:`On the roster. Bxdguy's first lobby is the only thing standing between a blank record and a story.`,
            p23:`One lobby. One kill. ReyzinhoPL has a record in this league now and that is permanent.`,
            p24:`${s.wins} wins, best game of 4 kills, ${s.appearances} lobbies. Web3guy brings proper competition when they show up. The sessions where they are in the lobby are usually livelier.`,
            p25:`12 wins from 33 lobbies and the best win rate among the regulars. FKxKingLurius is not a kills player. They manage lobbies and close them out. That is a specific kind of good.`,
            p26:`Web3hustlre is on the books. First game writes the first line.`,
            p27:`FKxPhanteon is registered. Everything else is still to happen.`,
            p28:`Lazerine is on the roster. Waiting.`,
            p29:`${s.wins} wins from ${s.appearances} lobbies at a 35% win rate. ElderRovingWorm81 walked into Season 2 and immediately started collecting wins. Efficient, dangerous, and clearly been practising.${s2Note}`,
            p30:`7 kills in a single lobby. That is the all-time record and EZEDINEYoutube owns it. ${s.wins} wins, ${s.kills} kills, and the kind of ceiling that makes other players nervous when they see the name in the lobby.${s2Note}`,
            p31:`${s.appearances} games logged. Ironlover keeps coming back. The record grows every session they are in.`,
            p32:`One lobby. KhingPilot is in the archive.`,
            p33:`One lobby. iVimXGF is in the archive.`,
            p34:`${s.wins} wins and ${s.kills} kills from ${s.appearances} games. TMIyc does not play many sessions but shows up ready when they do.`,
            p35:`${s.appearances} lobbies and still going. Demejii55 keeps turning up. The first win is the one that changes everything.`,
            p36:`${s.appearances} games logged. 0netwoo is building it slowly.`,
            p37:`First lobby in the books. FKxVanBR is part of the record now.`,
          };
          return bios[pid]||`${s.wins}W and ${s.kills}K across ${s.appearances} lobbies.`;
        };
        const bio=getBio(p.id);
        const lvlData=getPlayerLevel(p.id);
        // Sparkline
        const pSess=[...sessions].filter(s=>s.attendees?.includes(p.id))
          .sort((a,b)=>new Date(b.date)-new Date(a.date)||parseInt(b.id.slice(1))-parseInt(a.id.slice(1)));
        const sparkRaw=[...pSess].reverse().slice(-20);
        const spark=sparkRaw.map(s=>s.kills?.[p.id]||0);
        const sparkMax=Math.max(...spark,1);
        const yTicks=(()=>{const step=sparkMax<=5?1:sparkMax<=10?2:5;const t=[];for(let v=0;v<=sparkMax;v+=step)t.push(v);if(t[t.length-1]<sparkMax)t.push(t[t.length-1]+step);return t;})();
        const axisMax=yTicks[yTicks.length-1];
        const PAD_L=24,PAD_T=6,PAD_B=18,PAD_R=6,W=260,H=80;
        const CW=W-PAD_L-PAD_R,CH=H-PAD_T-PAD_B;
        const xPos=i=>PAD_L+Math.round((i/(spark.length-1||1))*CW);
        const yPos=v=>PAD_T+Math.round(CH-(v/axisMax)*CH);
        const pts=spark.map((v,i)=>`${xPos(i)},${yPos(v)}`).join(" ");
        const diffDays=lastSeen?Math.floor((new Date()-new Date(lastSeen+"T12:00:00Z"))/(1000*60*60*24)):null;
        const lastSeenLabel=diffDays===0?"Today":diffDays===1?"Yesterday":diffDays!=null?`${diffDays}d ago`:"—";

        return(
          <div className="fade-up" style={{minHeight:"calc(100vh - 120px)"}}>
            {/* Zone header */}
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                marginBottom:8,flexWrap:"wrap",gap:8}}>
                <span className="bc7" style={{fontSize:".62rem",letterSpacing:".3em",
                  color:"rgba(0,229,255,.5)"}}>SECTOR: BARRACKS · COMBAT FILES</span>
                <span className="bc7" style={{fontSize:".62rem",letterSpacing:".2em",
                  color:"var(--text3)"}}>{players.length} COMBATANTS REGISTERED</span>
              </div>
              <h2 className="bc9" style={{fontSize:"clamp(2rem,8vw,3.5rem)",letterSpacing:".08em",
                lineHeight:.9,color:"#00E5FF",textShadow:"0 0 28px rgba(0,229,255,.3)",
                margin:"0 0 8px"}}>COMBAT FILE</h2>
              <div style={{height:1,background:"linear-gradient(90deg,rgba(0,229,255,.44),transparent)"}}/>
            </div>

            {/* SELECT COMBATANT */}
            <div style={{marginBottom:18}}>
              <div className="bc7" style={{fontSize:".6rem",letterSpacing:".3em",
                color:"var(--text3)",marginBottom:10}}>SELECT COMBATANT</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {players.map(pl=>(
                  <button key={pl.id} onClick={()=>{setProfileId(pl.id);}} style={{
                    background:p.id===pl.id?`${pl.color}18`:"rgba(255,255,255,.02)",
                    border:p.id===pl.id?`1px solid ${pl.color}55`:"1px solid rgba(255,255,255,.06)",
                    borderBottom:p.id===pl.id?`2px solid ${pl.color}`:"2px solid transparent",
                    color:p.id===pl.id?pl.color:"var(--text3)",
                    fontFamily:"Barlow Condensed",fontWeight:900,
                    fontSize:".67rem",letterSpacing:".1em",padding:"5px 11px",
                    cursor:"pointer",outline:"none",transition:"all .12s"}}>
                    {dn(pl.username).slice(0,8).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Identity hero */}
            <div style={{
              background:`linear-gradient(135deg,${p.color}0e,rgba(0,0,0,.5))`,
              border:`1px solid ${p.color}33`,borderLeft:`4px solid ${p.color}`,
              borderRadius:"0 8px 8px 0",padding:"16px 16px",marginBottom:12,
              position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",right:-8,top:-8,fontFamily:"Barlow Condensed",
                fontWeight:900,fontSize:"7rem",color:p.color,opacity:.05,lineHeight:1,
                pointerEvents:"none"}}>{p.username[0]}</div>
              <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"nowrap",
                position:"relative",zIndex:1}}>
                <Av p={p} size={60} glow intel/>
                <div style={{flex:1,minWidth:0}}>
                  {/* Rank + optional streak badge — inline, never overlaps */}
                  <div style={{display:"flex",alignItems:"center",gap:8,
                    flexWrap:"wrap",marginBottom:4}}>
                    <div className="bc7" style={{fontSize:".58rem",letterSpacing:".3em",
                      color:`${p.color}66`,whiteSpace:"nowrap"}}>
                      COMBAT FILE · {rank.title}
                    </div>
                    {streak>=3&&(
                      <div className="bc7" style={{
                        fontSize:".6rem",background:"rgba(255,107,53,.18)",borderRadius:3,
                        padding:"2px 8px",border:"1px solid rgba(255,107,53,.4)",
                        color:"#FF6B35",letterSpacing:".08em",whiteSpace:"nowrap"}}>
                        🔥 {streak}-GAME STREAK
                      </div>
                    )}
                  </div>
                  <div className="bc9" style={{color:p.color,
                    fontSize:"clamp(1.2rem,5vw,1.9rem)",letterSpacing:".06em",
                    textShadow:`0 0 20px ${p.color}44`,lineHeight:1,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {p.host?"👑 ":""}{dn(p.username).toUpperCase()}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6,flexWrap:"wrap"}}>
                    <div className="bc7" style={{fontSize:".65rem",color:"var(--text3)",
                      letterSpacing:".06em",whiteSpace:"nowrap"}}>
                      LAST SEEN {lastSeenLabel} · {daysActive}D
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <div className="bc9" style={{fontSize:".78rem",
                        color:p.color,letterSpacing:".1em",whiteSpace:"nowrap"}}>
                        LVL {lvlData.lvl}
                      </div>
                      <div style={{width:44,height:3,background:"rgba(255,255,255,.12)",
                        borderRadius:2,overflow:"hidden",flexShrink:0}}>
                        <div style={{height:"100%",background:p.color,
                          width:`${lvlData.progress}%`,borderRadius:2,
                          boxShadow:`0 0 6px ${p.color}88`,transition:"width .5s ease"}}/>
                      </div>
                      <div className="bc7" style={{fontSize:".58rem",color:"var(--text3)",
                        whiteSpace:"nowrap"}}>
                        {lvlData.xp}XP
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio — proper typed animation via TypedBio component */}
            <TypedBio text={bio} color={p.color}/>

            {/* Stat grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",
              gap:1,border:`1px solid ${p.color}14`,borderRadius:2,overflow:"hidden",marginBottom:12}}>
              {(()=>{
                // Max appearances in a single session day
                const dayMap={};
                sessions.filter(s=>s.attendees?.includes(p.id)).forEach(s=>{
                  dayMap[s.date]=(dayMap[s.date]||0)+1;
                });
                const maxDay=Object.values(dayMap).length?Math.max(...Object.values(dayMap)):0;
                return[
                  {l:"S2 WINS",    v:s2St.wins,         c:"#00E5FF"},
                  {l:"ALL WINS",   v:st.wins,            c:"#FFD700"},
                  {l:"KILLS",      v:st.kills,           c:"#FF4D8F"},
                  {l:"BEST GAME",  v:st.biggestGame+"K", c:"#FF6B35"},
                  {l:"WIN RATE",   v:st.winRate+"%",     c:"#00FF94"},
                  {l:"K/G",        v:st.kd,              c:"#00E5FF"},
                  {l:"MAX/DAY",    v:maxDay+"G",         c:"#C77DFF"},
                  {l:"CARRY",      v:carry,              c:"#FF6B35"},
                  {l:"CONSISTENCY",v:consistency+"%",    c:"#00FF94"},
                  {l:"DROUGHT",    v:drought>0?drought+"G":"ACTIVE",
                    c:drought>5?"#FF6B35":drought>0?"#FFD700":"#00FF94"},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"10px 6px",textAlign:"center",
                    background:"rgba(255,255,255,.025)",borderRight:"1px solid rgba(255,255,255,.04)"}}>
                    <div className="bc9" style={{fontSize:"clamp(.9rem,3vw,1.35rem)",color:s.c,
                      lineHeight:1,textShadow:`0 0 12px ${s.c}33`}}>{s.v}</div>
                    <div className="bc7" style={{fontSize:".5rem",letterSpacing:".14em",
                      color:"var(--text3)",marginTop:4}}>{s.l}</div>
                  </div>
                ));
              })()}
            </div>

            {/* Form + Rival */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              {/* Recent form */}
              <div style={{padding:"12px 14px",background:"rgba(255,255,255,.02)",
                border:"1px solid rgba(255,255,255,.05)",borderRadius:"0 6px 6px 0",
                borderLeft:`3px solid ${p.color}33`}}>
                <div className="bc7" style={{fontSize:".58rem",letterSpacing:".22em",
                  color:"var(--text3)",marginBottom:10}}>RECENT FORM</div>
                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                  {form.map((f,i)=>(
                    <div key={i} style={{flex:1,height:6,borderRadius:1,
                      background:f.win?p.color:"rgba(255,255,255,.1)",
                      boxShadow:f.win?`0 0 7px ${p.color}66`:"none"}}/>
                  ))}
                  <span className="bc7" style={{fontSize:".65rem",color:"var(--text3)",
                    flexShrink:0,marginLeft:4}}>
                    {form.filter(f=>f.win).length}/5
                  </span>
                </div>
                <div className="bc7" style={{fontSize:".6rem",color:"var(--text3)",
                  marginTop:8,letterSpacing:".06em"}}>
                  {form.filter(f=>f.win).length>=4?"Strong form":
                   form.filter(f=>f.win).length>=2?"Decent form":"Rough patch"}
                </div>
              </div>
              {/* Primary rival */}
              {rivalP?(
                <div style={{padding:"12px 14px",
                  background:"linear-gradient(135deg,rgba(255,77,143,.07),rgba(0,0,0,.4))",
                  border:"1px solid rgba(255,77,143,.2)",borderRadius:"0 6px 6px 0",
                  borderLeft:"3px solid rgba(255,77,143,.5)"}}>
                  <div className="bc7" style={{fontSize:".58rem",letterSpacing:".22em",
                    color:"rgba(255,77,143,.6)",marginBottom:8}}>⚔️ PRIMARY RIVAL</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <Av p={rivalP} size={28} intel/>
                    <div style={{minWidth:0}}>
                      <div className="bc9" style={{fontSize:".82rem",color:rivalP.color,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {dn(rivalP.username)}
                      </div>
                      <div className="bc7" style={{fontSize:".6rem",color:"var(--text3)"}}>
                        {rivalSt?.wins||0}W · {rivalSt?.kills||0}K
                      </div>
                    </div>
                  </div>
                  <div className="bc7" style={{fontSize:".62rem",color:"rgba(255,255,255,.35)",
                    letterSpacing:".06em"}}>
                    {rivalWins}–{rivalLoss} in {topRival?.total||0} meetings
                  </div>
                </div>
              ):(
                <div style={{padding:"12px 14px",background:"rgba(255,255,255,.02)",
                  border:"1px solid rgba(255,255,255,.05)",borderRadius:"0 6px 6px 0",
                  borderLeft:"3px solid rgba(255,255,255,.1)",display:"flex",
                  alignItems:"center",justifyContent:"center"}}>
                  <div className="bc7" style={{fontSize:".7rem",color:"var(--text3)",
                    textAlign:"center",letterSpacing:".08em"}}>NO RIVAL DATA YET</div>
                </div>
              )}
            </div>

            {/* Career Progress */}
            <div style={{padding:"14px 16px",background:"rgba(255,255,255,.02)",
              border:"1px solid rgba(255,255,255,.05)",borderRadius:"0 6px 6px 0",
              borderLeft:`3px solid ${p.color}33`,marginBottom:12}}>
              <div className="bc7" style={{fontSize:".58rem",letterSpacing:".22em",
                color:"var(--text3)",marginBottom:14}}>
                CAREER PROGRESS · {milestones.filter(m=>m.done).length}/{milestones.length} MILESTONES
              </div>
              <div style={{display:"flex",gap:0}}>
                {milestones.map((m,i)=>(
                  <div key={i} style={{flex:1,position:"relative"}}>
                    {m.done&&<div style={{position:"absolute",bottom:10,left:"50%",
                      transform:"translateX(-50%)",fontFamily:"Barlow Condensed",fontWeight:700,
                      fontSize:".48rem",color:p.color,whiteSpace:"nowrap",letterSpacing:".08em"}}>
                      {m.l}</div>}
                    <div style={{height:4,
                      background:m.done?p.color:"rgba(255,255,255,.1)",
                      borderRadius:i===0?"2px 0 0 2px":i===milestones.length-1?"0 2px 2px 0":0,
                      boxShadow:m.done?`0 0 6px ${p.color}55`:"none",
                      transition:"background .3s"}}/>
                    <div style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",
                      fontFamily:"Barlow Condensed",fontWeight:700,fontSize:".5rem",
                      color:m.done?p.color:"var(--text3)",whiteSpace:"nowrap"}}>
                      {m.done?"✓":"·"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestone alerts */}
            {(()=>{
              const alerts=getMilestones(p.id);
              if(!alerts.length)return null;
              return(
                <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:12}}>
                  {alerts.map((m,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:7,
                      background:`${m.color}12`,border:`1px solid ${m.color}33`,
                      borderRadius:4,padding:"6px 12px"}}>
                      <span style={{fontSize:".95rem"}}>{m.icon}</span>
                      <span className="bc7" style={{fontSize:".72rem",color:"var(--text2)",
                        letterSpacing:".04em"}}>{m.text}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Badge flip collection */}
            {badges.length>0&&(
              <div style={{marginBottom:16}}>
                <div className="bc7" style={{fontSize:".58rem",letterSpacing:".22em",
                  color:"var(--text3)",marginBottom:10}}>
                  COMMENDATIONS · CLICK ANY BADGE TO REVEAL UNLOCK CONDITION
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {badges.map((b,bi)=><BadgeFlip key={bi} b={b} playerColor={p.color}/>)}
                </div>
              </div>
            )}

            {/* Kill sparkline */}
            {spark.length>1&&(
              <div style={{padding:"14px 16px",background:"rgba(0,0,0,.3)",
                border:"1px solid rgba(255,255,255,.06)",borderRadius:"0 6px 6px 0",
                borderLeft:`3px solid ${p.color}33`,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",
                  alignItems:"center",marginBottom:10}}>
                  <div className="bc7" style={{fontSize:".6rem",letterSpacing:".22em",
                    color:"var(--text3)"}}>KILLS PER LOBBY · LAST {spark.length}</div>
                  <div className="bc7" style={{fontSize:".7rem",color:p.color}}>
                    PEAK {sparkMax}K
                  </div>
                </div>
                <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block",overflow:"visible"}}>
                  <defs>
                    <linearGradient id={`grad-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={p.color} stopOpacity="0.35"/>
                      <stop offset="100%" stopColor={p.color} stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {yTicks.map(t=>(
                    <g key={t}>
                      <line x1={PAD_L} y1={yPos(t)} x2={W-PAD_R} y2={yPos(t)}
                        stroke="rgba(255,255,255,.07)" strokeWidth="1"
                        strokeDasharray={t===0?"0":"3 3"}/>
                      <text x={PAD_L-4} y={yPos(t)+3.5} textAnchor="end"
                        fill="rgba(255,255,255,.3)" fontSize="8"
                        fontFamily="Barlow Condensed" fontWeight="700">{t}</text>
                    </g>
                  ))}
                  {spark.length>1&&(
                    <>
                      <polygon
                        points={`${xPos(0)},${PAD_T+CH} ${pts} ${xPos(spark.length-1)},${PAD_T+CH}`}
                        fill={`url(#grad-${p.id})`}/>
                      <polyline points={pts} fill="none"
                        stroke={p.color} strokeWidth="1.8" strokeLinejoin="round"/>
                      {spark.map((v,i)=>(
                        <circle key={i} cx={xPos(i)} cy={yPos(v)} r="2.5"
                          fill={v===sparkMax?p.color:"var(--bg)"}
                          stroke={p.color} strokeWidth="1.5"/>
                      ))}
                    </>
                  )}
                </svg>
              </div>
            )}

            {/* Rivals shortcut */}
            {!p.host&&(
              <button onClick={()=>{setH2hA(p.id);setH2hB("");go("rivals");
                setTimeout(()=>document.querySelector(".h2h-scroll")?.scrollIntoView({behavior:"smooth"}),300);}}
                style={{display:"flex",alignItems:"center",gap:6,
                  background:"rgba(0,229,255,.08)",border:"1px solid rgba(0,229,255,.25)",
                  borderRadius:4,padding:"8px 16px",color:"#00E5FF",cursor:"pointer",
                  fontFamily:"Barlow Condensed",fontWeight:700,fontSize:".72rem",
                  letterSpacing:".15em",marginBottom:12}}>
                ⚔️ OPEN FULL H2H COMPARISON
              </button>
            )}
          </div>
        );
      })()}


      {/* ═══════════════ RECORDS / THE VAULT ═══════════════ */}
      {view==="records"&&(
        <div className="fade-up" style={{minHeight:"calc(100vh - 120px)"}}>
          {/* Vault header */}
          <div style={{marginBottom:28}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              marginBottom:8,flexWrap:"wrap",gap:8}}>
              <span className="bc7" style={{fontSize:".62rem",letterSpacing:".3em",
                color:"rgba(199,125,255,.5)"}}>SECTOR: THE VAULT · PERMANENT ARCHIVE</span>
              <span className="bc7" style={{fontSize:".62rem",letterSpacing:".2em",
                color:"var(--text3)"}}>{sessions.length} SESSIONS · S1 FINALISED</span>
            </div>
            <h2 className="bc9" style={{fontSize:"clamp(2rem,8vw,4rem)",letterSpacing:".08em",
              lineHeight:.9,color:"#C77DFF",textShadow:"0 0 28px rgba(199,125,255,.3)",
              margin:"0 0 10px"}}>THE VAULT</h2>
            <div style={{height:1,background:"linear-gradient(90deg,rgba(199,125,255,.44),transparent)",
              marginBottom:8}}/>
            <div className="bc7" style={{fontSize:".72rem",letterSpacing:".12em",color:"var(--text3)"}}>
              All-time records · Numbers that do not move
            </div>
          </div>
          {(()=>{
            const rec=getRecords();
            if(!rec)return <p style={{color:"var(--text3)",textAlign:"center"}}>No data yet.</p>;
            const topWinP=players.find(p=>p.id===rec.topWinner[0]);
            const topKillP=players.find(p=>p.id===rec.topKiller[0]);
            const topGameP=players.find(p=>p.id===rec.topGame.pid);
            const topDayP=players.find(p=>p.id===rec.topDay.pid);
            const streakP=players.find(p=>p.id===rec.bestStreak.pid);
            const firstWinP=players.find(p=>p.id===rec.first?.winner);
            const topDayKillP=players.find(p=>p.id===rec.topDayKill?.pid);
            const records=[
              {icon:"🏆",color:"#FFD700",title:"Most Wins All Time",  player:topWinP,  stat:`${rec.topWinner[1]} wins`,    sub:"All-time win leader"},
              {icon:"💀",color:"#FF4D8F",title:"Most Kills All Time",  player:topKillP, stat:`${rec.topKiller[1]} kills`,   sub:"All-time kill leader"},
              {icon:"☄️",color:"#FF6B35",title:"Highest Single Game",  player:topGameP, stat:`${rec.topGame.k}K`,           sub:`${rec.topGame.sid} · ${rec.topGame.date}`},
              {icon:"🔥",color:"#FF6B35",title:"Longest Win Streak",   player:streakP,  stat:`${rec.bestStreak.streak} in a row`, sub:"Best consecutive wins · one day"},
              {icon:"🌋",color:"#FF4D8F",title:"Most Kills in a Day",  player:topDayKillP, stat:`${rec.topDayKill?.k||0}K`, sub:rec.topDayKill?.date||""},
              {icon:"📆",color:"#00E5FF",title:"Most Lobbies in a Day",player:topDayP,  stat:`${rec.topDay.count} lobbies`, sub:rec.topDay.date},
              {icon:"🎮",color:"#00FF94",title:"Total Sessions",       player:null,     stat:rec.totalSessions,             sub:`${[...new Set(sessions.map(s=>s.date))].length} session days`},
              {icon:"⚡",color:"#C77DFF",title:"First Ever Win",       player:firstWinP,stat:rec.first?.date||"—",          sub:`In ${rec.first?.id||"—"}`},
            ];
            return(
              <div>
                <div className="vault-grid" style={{marginBottom:28}}>
                  {records.map((r,i)=>(
                    <div key={i} className="vault-card" style={{
                      "--vc":r.color,
                      background:`linear-gradient(135deg,${r.color}0a,rgba(0,0,0,.4))`,
                      animation:`fadeUp .4s ease both`,animationDelay:`${i*.06}s`,
                      cursor:r.player?"pointer":"default"}}
                      onClick={()=>r.player&&goProfile(r.player.id)}>
                      <div className="bc7" style={{fontSize:".58rem",letterSpacing:".22em",
                        color:`${r.color}66`,marginBottom:8,textTransform:"uppercase"}}>
                        {r.title}
                      </div>
                      {r.player&&(
                        <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:8}}>
                          <Av p={r.player} size={28} intel/>
                          <div className="bc9" style={{fontSize:".85rem",color:r.player.color,
                            letterSpacing:".04em",overflow:"hidden",textOverflow:"ellipsis",
                            whiteSpace:"nowrap"}}>
                            {r.player.host?"👑 ":""}{dn(r.player.username)}
                          </div>
                        </div>
                      )}
                      <div className="bc9" style={{fontSize:"clamp(1.4rem,4vw,2rem)",
                        color:r.color,lineHeight:1,marginBottom:4,
                        textShadow:`0 0 16px ${r.color}44`}}>
                        {r.icon} {r.stat}
                      </div>
                      <div className="bc7" style={{fontSize:".64rem",color:"var(--text3)",
                        letterSpacing:".05em"}}>{r.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Kill King by Day — full session day breakdown */}
                <div style={{padding:"18px 18px",marginBottom:20,
                  background:"rgba(255,255,255,.02)",
                  border:"1px solid rgba(255,77,143,.15)",
                  borderLeft:"3px solid rgba(255,77,143,.5)",
                  borderRadius:"0 8px 8px 0"}}>
                  <div className="bc9" style={{fontSize:".88rem",color:"#FF4D8F",
                    letterSpacing:".06em",marginBottom:4}}>💀 KILL KING BY SESSION DAY</div>
                  <div className="bc7" style={{fontSize:".7rem",color:"var(--text3)",
                    marginBottom:16,letterSpacing:".06em"}}>
                    Highest kills in a single lobby per session night
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    {(()=>{
                      const allDays=[...new Set(sessions.map(s=>s.date))].sort().reverse();
                      return allDays.map((date,i)=>{
                        const daySess=sessions.filter(s=>s.date===date);
                        // Kill King — highest kills in ONE single lobby
                        let kkMax=0,kkPid=null,kkSid="";
                        daySess.forEach(s=>{
                          Object.entries(s.kills||{}).forEach(([pid,k])=>{
                            if(k>kkMax){kkMax=k;kkPid=pid;kkSid=s.id;}
                          });
                        });
                        const kkP=kkPid?players.find(x=>x.id===kkPid):null;
                        const dd=new Date(date+"T12:00:00Z");
                        const dayLabel=dd.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
                        const specialTag=date==="2026-04-01"?"🃏 ":date==="2026-04-03"?"🌅 ":date==="2026-04-04"?"🥚 ":"";
                        const isLatest=i===0;
                        return(
                          <div key={date} style={{
                            display:"flex",alignItems:"center",gap:10,
                            padding:"9px 12px",
                            background:isLatest?"rgba(255,255,255,.04)":"rgba(0,0,0,.18)",
                            borderLeft:`2px solid ${isLatest?"rgba(255,77,143,.55)":kkP?kkP.color+"22":"rgba(255,255,255,.05)"}`,
                            borderRadius:"0 4px 4px 0"}}>
                            {/* Date */}
                            <div style={{minWidth:78,flexShrink:0}}>
                              <div className="bc7" style={{fontSize:".68rem",
                                color:isLatest?"#FF4D8F":"var(--text3)",
                                letterSpacing:".06em"}}>{specialTag}{dayLabel}</div>
                              <div className="bc7" style={{fontSize:".56rem",
                                color:"var(--text3)",opacity:.55,marginTop:1}}>
                                {daySess.length} lobbies
                              </div>
                            </div>
                            {/* Kill King */}
                            {kkP&&<Av p={kkP} size={26} intel/>}
                            <div style={{flex:1,minWidth:0}}>
                              <div className="bc9" style={{fontSize:".84rem",lineHeight:1.2,
                                color:kkP?.color||"var(--text3)",
                                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                                cursor:kkP?"pointer":"default"}}
                                onClick={()=>kkP&&goProfile(kkP.id)}>
                                {kkP?dn(kkP.username):"No kills recorded"}
                              </div>
                              {kkMax>0&&<div className="bc7" style={{
                                fontSize:".62rem",color:"#FF4D8F",lineHeight:1,marginTop:2}}>
                                {kkMax}K · {kkSid}
                              </div>}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Site totals */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",
                  gap:1,border:"1px solid rgba(199,125,255,.15)",
                  borderRadius:2,overflow:"hidden"}}>
                  {[
                    {l:"TOTAL SESSIONS",  v:rec.totalSessions,   c:"#FFD700"},
                    {l:"TOTAL KILLS",     v:rec.totalKills,      c:"#FF4D8F"},
                    {l:"ACTIVE PLAYERS",  v:players.filter(p=>getStats(p.id).appearances>0).length, c:"#00FF94"},
                    {l:"UNIQUE WINNERS",  v:[...new Set(sessions.filter(s=>s.winner).map(s=>s.winner))].length, c:"#FF6B35"},
                    {l:"SESSION DAYS",    v:[...new Set(sessions.map(s=>s.date))].length, c:"#00E5FF"},
                    {l:"AVG PER DAY",     v:rec.totalSessions?Math.round(rec.totalSessions/[...new Set(sessions.map(s=>s.date))].length):0, c:"#C77DFF"},
                  ].map((s,i)=>(
                    <div key={i} style={{padding:"14px 10px",textAlign:"center",
                      background:"rgba(255,255,255,.02)",borderRight:"1px solid rgba(255,255,255,.04)"}}>
                      <div className="bc9" style={{fontSize:"clamp(1.2rem,4vw,1.8rem)",
                        color:s.c,lineHeight:1,textShadow:`0 0 14px ${s.c}33`}}>{s.v}</div>
                      <div className="bc7" style={{fontSize:".52rem",letterSpacing:".18em",
                        color:"var(--text3)",marginTop:5}}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {view==="charts"&&(
        <div className="fade-up" style={{minHeight:"calc(100vh - 120px)"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <p style={{color:"var(--text3)",fontWeight:800,fontSize:".7rem",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>Per Player</p>
            <h2 style={{fontFamily:"Fredoka One",fontSize:"clamp(2rem,8vw,3.2rem)",
              background:"linear-gradient(135deg,#00E5FF,#C77DFF)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
              📈 Performance Charts
            </h2>
          </div>
          {(()=>{
            const activePlayers=players.filter(p=>getStats(p.id).appearances>=3)
              .map(p=>({...p,...getStats(p.id)}))
              .sort((a,b)=>b.wins-a.wins);
            // effectivePid state is managed at component level
            // Auto-select first active player if none selected
            const effectivePid=chartPid||activePlayers[0]?.id||"";
            const chartPlayer=players.find(p=>p.id===effectivePid);
            const chartData=getChartData(chartPid);
            const maxW=Math.max(1,...chartData.map(d=>d.wins));
            const maxK=Math.max(1,...chartData.map(d=>d.kills));
            return(
              <div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
                  {activePlayers.map(p=>(
                    <button key={p.id} onClick={()=>setChartPid(p.id)}
                      className="pill" style={{
                        padding:"6px 14px",borderRadius:50,fontWeight:800,fontSize:".78rem",
                        background:chartPid===p.id?p.color:"var(--card)",
                        color:chartPid===p.id?"#000":"var(--text2)",
                        border:chartPid===p.id?"none":`1.5px solid ${p.color}44`,
                        boxShadow:chartPid===p.id?`0 0 16px ${p.color}66`:"none"}}>
                      {p.host?"👑 ":""}{dn(p.username)}
                    </button>
                  ))}
                </div>
                {chartPlayer&&chartData.length>0?(
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
                      <div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,
                        background:`linear-gradient(135deg,${chartPlayer.color},${chartPlayer.color}88)`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontFamily:"Fredoka One",fontSize:"1.1rem",color:"#fff"}}>
                        {chartPlayer.username[0]}
                      </div>
                      <div>
                        <div style={{fontFamily:"Fredoka One",fontSize:"1.2rem",color:chartPlayer.color}}>
                          {chartPlayer.host?"👑 ":""}{chartPlayer.username}
                        </div>
                        <div style={{fontSize:".8rem",color:"var(--text2)"}}>
                          {(()=>{const st=getStats(chartPid);return `${st.wins}W · ${st.kills}K · ${st.appearances} lobbies · ${st.winRate}% WR`;})()}
                        </div>
                      </div>
                    </div>
                    <div style={{background:"rgba(0,0,0,.25)",borderRadius:16,padding:"20px 16px",marginBottom:20}}>
                      <div style={{fontSize:".75rem",color:"var(--text3)",fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>
                        🏆 Wins per day
                      </div>
                      <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120,overflowX:"auto",paddingBottom:4}}>
                        {chartData.map((d,i)=>{
                          const h=maxW>0?(d.wins/maxW)*100:0;
                          const dd=new Date(d.date+"T12:00:00Z");
                          const label=`${dd.toLocaleDateString("en",{month:"short",day:"numeric"})}: ${d.wins}W`;
                          return(
                            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:32,flex:"0 0 auto"}}>
                              <div style={{fontSize:".65rem",color:"var(--gold)",fontWeight:800,height:16,display:"flex",alignItems:"center"}}>
                                {d.wins>0?d.wins:""}
                              </div>
                              <div className="chart-bar" title={label} style={{
                                width:28,height:`${Math.max(4,h)}%`,minHeight:4,
                                background:d.wins>0?`linear-gradient(to top,${chartPlayer.color},${chartPlayer.color}88)`:"rgba(255,255,255,.08)",
                                borderRadius:"4px 4px 0 0",cursor:"default"}}>
                              </div>
                              <div style={{fontSize:".6rem",color:"var(--text3)",fontWeight:700,
                                transform:"rotate(-45deg)",transformOrigin:"top left",
                                whiteSpace:"nowrap",marginTop:4,height:24,overflow:"hidden"}}>
                                {dd.toLocaleDateString("en",{month:"short",day:"numeric"})}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{background:"rgba(0,0,0,.25)",borderRadius:16,padding:"20px 16px",marginBottom:20}}>
                      <div style={{fontSize:".75rem",color:"var(--text3)",fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>
                        💀 Kills per day
                      </div>
                      <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120,overflowX:"auto",paddingBottom:4}}>
                        {chartData.map((d,i)=>{
                          const h=maxK>0?(d.kills/maxK)*100:0;
                          const dd=new Date(d.date+"T12:00:00Z");
                          const label=`${dd.toLocaleDateString("en",{month:"short",day:"numeric"})}: ${d.kills}K`;
                          return(
                            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:32,flex:"0 0 auto"}}>
                              <div style={{fontSize:".65rem",color:"var(--pink)",fontWeight:800,height:16,display:"flex",alignItems:"center"}}>
                                {d.kills>0?d.kills:""}
                              </div>
                              <div className="chart-bar" title={label} style={{
                                width:28,height:`${Math.max(4,h)}%`,minHeight:4,
                                background:d.kills>0?"linear-gradient(to top,#FF4D8F,#FF4D8F88)":"rgba(255,255,255,.08)",
                                borderRadius:"4px 4px 0 0",cursor:"default"}}>
                              </div>
                              <div style={{fontSize:".6rem",color:"var(--text3)",fontWeight:700,
                                transform:"rotate(-45deg)",transformOrigin:"top left",
                                whiteSpace:"nowrap",marginTop:4,height:24,overflow:"hidden"}}>
                                {dd.toLocaleDateString("en",{month:"short",day:"numeric"})}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{background:"rgba(0,0,0,.25)",borderRadius:16,padding:"20px 16px"}}>
                      <div style={{fontSize:".75rem",color:"var(--text3)",fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>
                        📅 Daily Breakdown
                      </div>
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse",minWidth:320}}>
                          <thead>
                            <tr style={{borderBottom:"1.5px solid var(--border)"}}>
                              {["Date","Lobbies","Wins","Kills","K/G","Win%"].map((h,i)=>(
                                <th key={i} style={{padding:"8px 10px",textAlign:i===0?"left":"center",
                                  fontSize:".72rem",color:"var(--text3)",fontWeight:800,
                                  letterSpacing:1,textTransform:"uppercase"}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {chartData.map((d,i)=>(
                              <tr key={i} className="lb-row" style={{borderBottom:"1px solid rgba(255,255,255,.05)"}}>
                                <td style={{padding:"8px 10px",fontWeight:700,color:"var(--text2)",fontSize:".85rem"}}>
                                  {new Date(d.date+"T12:00:00Z").toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric"})}
                                </td>
                                <td style={{padding:"8px 10px",textAlign:"center",color:"var(--text)",fontSize:".9rem"}}>{d.games}</td>
                                <td style={{padding:"8px 10px",textAlign:"center",
                                  color:d.wins>0?"var(--gold)":"var(--text3)",fontFamily:"Fredoka One",fontSize:".95rem"}}>{d.wins}</td>
                                <td style={{padding:"8px 10px",textAlign:"center",
                                  color:d.kills>0?"var(--pink)":"var(--text3)",fontFamily:"Fredoka One",fontSize:".95rem"}}>{d.kills}</td>
                                <td style={{padding:"8px 10px",textAlign:"center",color:"var(--cyan)",fontSize:".85rem"}}>
                                  {d.games>0?(d.kills/d.games).toFixed(1):0}
                                </td>
                                <td style={{padding:"8px 10px",textAlign:"center",
                                  color:d.wins>0?"var(--green)":"var(--text3)",fontSize:".85rem"}}>
                                  {d.games>0?Math.round((d.wins/d.games)*100):0}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ):(
                  <div style={{textAlign:"center",padding:40,color:"var(--text3)"}}>
                    Select a player to see their performance chart
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {view==="season1"&&(
        <div className="fade-up" style={{minHeight:"calc(100vh - 120px)"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <p style={{color:"var(--gold)",fontWeight:800,fontSize:".7rem",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>March 2026</p>
            <h2 style={{fontFamily:"Fredoka One",fontSize:"clamp(2rem,8vw,3.4rem)",
              background:"linear-gradient(135deg,#FFD700,#FF6B35,#C77DFF)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
              marginBottom:8}}>
              🏆 Season 1 Wrap
            </h2>
            <p style={{color:"var(--text2)",fontSize:".88rem",fontWeight:600}}>
              The full story of Bullet League's first season
            </p>
          </div>

          {/* ── FINAL stamp — shows after March 31 ── */}
          {todayStr()>="2026-04-01"&&(
            <div style={{
              display:"flex",alignItems:"center",justifyContent:"center",
              background:"linear-gradient(135deg,rgba(255,215,0,.08),rgba(255,107,53,.06))",
              border:"2px solid rgba(255,215,0,.5)",borderRadius:16,
              padding:"14px 20px",marginBottom:24,flexWrap:"wrap",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:"1.5rem"}}>🔒</span>
                <div>
                  <div style={{fontFamily:"Fredoka One",fontSize:"1rem",color:"#FFD700",letterSpacing:1}}>
                    FINAL STANDINGS
                  </div>
                  <div style={{fontSize:".7rem",color:"var(--text3)",fontWeight:700}}>
                    Season closed March 31, 2026 · These results are permanent
                  </div>
                </div>
              </div>
              {s2Prediction&&(()=>{
                const pick=players.find(p=>p.id===s2Prediction);
                return pick?(
                  <div style={{
                    background:"rgba(199,125,255,.12)",border:"1px solid rgba(199,125,255,.3)",
                    borderRadius:10,padding:"6px 14px",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:".8rem"}}>🔮</span>
                    <div>
                      <div style={{fontSize:".64rem",color:"var(--text3)",fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>Your S2 Pick</div>
                      <div style={{fontFamily:"Fredoka One",color:pick.color,fontSize:".88rem"}}>{pick.username}</div>
                    </div>
                  </div>
                ):null;
              })()}
            </div>
          )}

          {(()=>{
            const w=getS1Wrap();
            if(!w)return <p style={{textAlign:"center",color:"var(--text3)"}}>Season 1 data loading…</p>;
            return(
              <div>
                {/* Season totals banner */}
                <div style={{
                  background:"linear-gradient(135deg,rgba(255,215,0,.15),rgba(255,107,53,.08),rgba(199,125,255,.1))",
                  border:"2px solid rgba(255,215,0,.4)",borderRadius:20,
                  padding:"24px 20px",marginBottom:28,textAlign:"center"}}>
                  <div style={{fontFamily:"Fredoka One",fontSize:"1.1rem",color:"var(--gold)",marginBottom:16}}>
                    Season 1 by the Numbers
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:12}}>
                    {[
                      {l:"Total Lobbies",v:w.sessions,c:"var(--gold)",i:"🎮"},
                      {l:"Total Kills",v:w.totalKills,c:"var(--pink)",i:"💀"},
                      {l:"Days Played",v:w.days,c:"var(--cyan)",i:"📅"},
                      {l:"Unique Winners",v:w.uniqueWins,c:"var(--green)",i:"🏆"},
                    ].map((s,i)=>(
                      <div key={i} style={{background:"rgba(0,0,0,.3)",borderRadius:12,padding:"12px 10px"}}>
                        <div style={{fontSize:"1.4rem",marginBottom:4}}>{s.i}</div>
                        <div style={{fontFamily:"Fredoka One",fontSize:"1.6rem",color:s.c,lineHeight:1}}>{s.v}</div>
                        <div style={{fontSize:".68rem",color:"var(--text3)",fontWeight:800,textTransform:"uppercase",letterSpacing:1,marginTop:4}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Season Podium */}
                <div style={{marginBottom:28}}>
                  <h3 style={{fontFamily:"Fredoka One",fontSize:"1.2rem",color:"var(--gold)",
                    marginBottom:16,textAlign:"center"}}>🥇 Season 1 Podium</h3>
                  <div style={{display:"flex",gap:12,justifyContent:"center",alignItems:"flex-end",flexWrap:"wrap"}}>
                    {w.podium.map((p,i)=>{
                      const player=players.find(x=>x.id===p.id);
                      if(!player)return null;
                      const medals=["🥇","🥈","🥉"];
                      const heights=["140px","110px","90px"];
                      const sizes=[68,54,46];
                      return(
                        <div key={i} style={{
                          display:"flex",flexDirection:"column",alignItems:"center",gap:8,
                          cursor:"pointer",animation:`popIn .4s ease ${i*.12}s both`}}
                          onClick={()=>goProfile(player.id)}>
                          <div style={{width:sizes[i],height:sizes[i],borderRadius:"50%",
                            background:`linear-gradient(135deg,${player.color},${player.color}88)`,
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:"Fredoka One",fontSize:i===0?"1.6rem":"1.2rem",color:"#fff",
                            boxShadow:`0 0 ${i===0?30:16}px ${player.color}66`,
                            border:`2px solid ${player.color}`}}>
                            {player.username[0]}
                          </div>
                          <div style={{fontFamily:"Fredoka One",fontSize:i===0?"1rem":".88rem",
                            color:player.color,textAlign:"center",maxWidth:90,
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {player.host?"👑 ":""}{dn(player.username)}
                          </div>
                          <div style={{
                            background:i===0?"linear-gradient(135deg,#FFD700,#FF6B35)":i===1?"rgba(192,192,192,.2)":"rgba(205,127,50,.2)",
                            border:`1.5px solid ${i===0?"#FFD700":i===1?"#C0C0C0":"#CD7F32"}`,
                            borderRadius:"12px 12px 0 0",
                            width:i===0?100:80,height:heights[i],
                            display:"flex",flexDirection:"column",alignItems:"center",
                            justifyContent:"flex-start",paddingTop:12,gap:4}}>
                            <div style={{fontSize:"1.6rem"}}>{medals[i]}</div>
                            <div style={{fontFamily:"Fredoka One",
                              color:i===0?"#160d2e":i===1?"#C0C0C0":"#CD7F32",
                              fontSize:i===0?"1.1rem":".9rem"}}>{p.wins}W</div>
                            <div style={{fontSize:".7rem",color:i===0?"rgba(22,13,46,.7)":"var(--text3)",fontWeight:700}}>{p.kills}K</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Award cards */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14,marginBottom:28}}>
                  {[
                    {icon:"👑",color:"#FFD700",title:"Season Champion",player:w.champion,stat:`${w.champion?.wins}W · ${w.champion?.kills}K`,desc:"Most wins in Season 1"},
                    {icon:"💀",color:"#FF4D8F",title:"Season Reaper",player:w.topKiller,stat:`${w.topKiller?.kills} total kills`,desc:"Most kills across all lobbies"},
                    {icon:"🎯",color:"#00E5FF",title:"Most Efficient",player:w.sharpshooter,stat:`${w.sharpshooter?.kd} K/G ratio`,desc:"Best kills per game (5+ lobbies)"},
                    {icon:"🎮",color:"#FFAB40",title:"Most Loyal",player:w.loyalist,stat:`${w.loyalist?.appearances} lobbies`,desc:"Showed up more than anyone"},
                    ...(w.mostImproved?[{icon:"📈",color:"#00FF94",title:"Most Improved",player:w.mostImproved.player,stat:`${w.mostImproved.earlyWR}% → ${w.mostImproved.lateWR}% WR`,desc:`+${w.mostImproved.gain}% win rate gain`}]:[]),
                    {icon:"☄️",color:"#FF6B35",title:"Best Single Game",player:w.topGamePlayer,stat:`${w.topGame.k} kills in ${w.topGame.sid}`,desc:w.topGame.date},
                    ...(w.topDayKillPlayer?[{icon:"🌋",color:"#FF4D8F",title:"Most Kills in a Day",player:w.topDayKillPlayer,stat:`${w.topDayKill.k} kills`,desc:new Date(w.topDayKill.date+"T12:00:00Z").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}]:[]),
                  ].map((a,i)=>{
                    if(!a.player)return null;
                    const pl=a.player.id?a.player:players.find(p=>p.id===a.player?.id)||a.player;
                    const playerObj=pl?.username?pl:players.find(p=>p.id===pl?.id);
                    if(!playerObj)return null;
                    return(
                      <div key={i} className="card-h" onClick={()=>goProfile(playerObj.id)}
                        style={{background:`linear-gradient(135deg,${a.color}12,var(--card))`,
                          border:`2px solid ${a.color}44`,borderRadius:16,padding:"18px 16px",
                          cursor:"pointer",animation:`fadeUp .4s ease ${i*.07}s both`}}>
                        <div style={{fontSize:"1.8rem",marginBottom:8}}>{a.icon}</div>
                        <div style={{fontSize:".68rem",color:a.color,fontWeight:800,
                          letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{a.title}</div>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                          <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,
                            background:`linear-gradient(135deg,${playerObj.color},${playerObj.color}88)`,
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:"Fredoka One",fontSize:".9rem",color:"#fff"}}>
                            {playerObj.username[0]}
                          </div>
                          <div style={{fontFamily:"Fredoka One",color:playerObj.color,fontSize:".95rem",
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {playerObj.host?"👑 ":""}{playerObj.username}
                          </div>
                        </div>
                        <div style={{fontFamily:"Fredoka One",fontSize:"1.1rem",color:a.color,marginBottom:2}}>{a.stat}</div>
                        <div style={{fontSize:".72rem",color:"var(--text3)"}}>{a.desc}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Most Kills in a Day — Top 5 */}
                {w.topDayKillsTop5?.length>0&&(
                  <div style={{marginBottom:28}}>
                    <h3 style={{fontFamily:"Fredoka One",fontSize:"1.2rem",color:"#FF4D8F",
                      marginBottom:6,textAlign:"center"}}>🌋 Most Kills in a Single Day</h3>
                    <p style={{textAlign:"center",color:"var(--text3)",fontSize:".76rem",
                      fontWeight:700,marginBottom:16}}>Total kills across all lobbies played that day</p>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {w.topDayKillsTop5.map((e,i)=>{
                        if(!e.player)return null;
                        const dd=new Date(e.date+"T12:00:00Z");
                        const dateLabel=dd.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
                        const isRecord=i===0;
                        return(
                          <div key={i} onClick={()=>goProfile(e.player.id)} style={{
                            display:"flex",alignItems:"center",gap:14,
                            background:isRecord
                              ?"linear-gradient(135deg,rgba(255,77,143,.14),rgba(255,107,53,.08))"
                              :"rgba(0,0,0,.25)",
                            border:`1.5px solid ${isRecord?"rgba(255,77,143,.45)":"rgba(255,255,255,.06)"}`,
                            borderRadius:14,padding:"12px 16px",cursor:"pointer",
                            animation:`fadeUp .35s ease ${i*.07}s both`}}>
                            <div style={{fontFamily:"Fredoka One",fontSize:i===0?"1.4rem":"1.1rem",
                              color:i===0?"#FF4D8F":i===1?"#C0C0C0":i===2?"#CD7F32":"var(--text3)",
                              width:28,textAlign:"center",flexShrink:0}}>
                              {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}
                            </div>
                            <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,
                              background:`linear-gradient(135deg,${e.player.color},${e.player.color}88)`,
                              display:"flex",alignItems:"center",justifyContent:"center",
                              fontFamily:"Fredoka One",fontSize:"1rem",color:"#fff",
                              boxShadow:isRecord?`0 0 16px ${e.player.color}66`:"none"}}>
                              {e.player.username[0]}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontFamily:"Fredoka One",color:e.player.color,
                                fontSize:".95rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                {e.player.host?"👑 ":""}{e.player.username}
                              </div>
                              <div style={{fontSize:".7rem",color:"var(--text3)",fontWeight:700,marginTop:2}}>
                                {dateLabel}
                              </div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontFamily:"Fredoka One",
                                fontSize:isRecord?"1.6rem":"1.2rem",
                                color:isRecord?"#FF4D8F":"var(--text2)",lineHeight:1}}>
                                {e.k}K
                              </div>
                              {isRecord&&<div style={{fontSize:".62rem",color:"#FF4D8F",
                                fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>
                                Season Record
                              </div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Final message */}
                <div style={{
                  background:"linear-gradient(135deg,rgba(199,125,255,.12),rgba(0,229,255,.08))",
                  border:"2px solid rgba(199,125,255,.3)",borderRadius:20,
                  padding:"24px 20px",textAlign:"center"}}>
                  <div style={{fontFamily:"Fredoka One",fontSize:"clamp(1.1rem,4vw,1.6rem)",
                    background:"linear-gradient(135deg,#C77DFF,#00E5FF)",
                    WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
                    marginBottom:8}}>
                    Season 2 starts April 1st ⚔️
                  </div>
                  <p style={{color:"var(--text2)",fontSize:".85rem",fontWeight:600,
                    maxWidth:460,margin:"0 auto",lineHeight:1.6}}>
                    The grind resets. Rankings are wiped. Every player starts at zero.
                    Who rises in Season 2?
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          SEASON 2 VIEW
      ══════════════════════════════════════════════ */}
      {view==="season2"&&(
        <div className="fade-up" style={{minHeight:"calc(100vh - 120px)"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <p style={{color:"#00E5FF",fontWeight:800,fontSize:".7rem",letterSpacing:3,
              textTransform:"uppercase",marginBottom:8}}>April 2026</p>
            <h2 style={{fontFamily:"Fredoka One",fontSize:"clamp(2rem,8vw,3.4rem)",
              background:"linear-gradient(135deg,#00E5FF,#C77DFF,#00FF94)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
              marginBottom:8}}>
              🚀 Season 2
            </h2>
            <p style={{color:"var(--text2)",fontSize:".88rem",fontWeight:600}}>
              {todayStr()<"2026-04-01"
                ? "Season 2 hasn't started yet. Check back April 1st."
                : "Fresh season, same arena. Rankings reset. Who owns April?"}
            </p>
          </div>
          {(()=>{
            const s2=SEASONS.find(x=>x.id==="s2");
            const s2Sessions=sessions.filter(s=>s.date>=s2.start&&s.date<=s2.end);
            const today=todayStr();
            // Hoist all data before any early return so esbuild stays in JS mode
            const s2Stats=allStats(s2Sessions).filter(p=>p.appearances>0);
            const byWins=[...s2Stats].sort((a,b)=>b.wins-a.wins||b.kills-a.kills);
            const byKills=[...s2Stats].sort((a,b)=>b.kills-a.kills);
            const byApp=[...s2Stats].sort((a,b)=>b.appearances-a.appearances);
            const totalKills=s2Sessions.reduce((n,s)=>n+Object.values(s.kills||{}).reduce((a,b)=>a+b,0),0);
            const uniqueWins=[...new Set(s2Sessions.filter(s=>s.winner).map(s=>s.winner))].length;
            const days=[...new Set(s2Sessions.map(s=>s.date))].length;
            const podium=byWins.slice(0,3);
            let topGame={pid:"",k:0,sid:"",date:""};
            s2Sessions.forEach(s=>{
              if(!s.kills)return;
              const entries=Object.keys(s.kills);
              for(let ei=0;ei<entries.length;ei++){
                const pid=entries[ei];const k=s.kills[pid];
                if(k>topGame.k){topGame.k=k;topGame.pid=pid;topGame.sid=s.id;topGame.date=s.date;}
              }
            });

            // Pre-season state
            if(today<s2.start) return(
              <div>
                {/* Live S2 countdown */}
                <div style={{
                  background:"linear-gradient(135deg,rgba(0,229,255,.1),rgba(199,125,255,.08))",
                  border:"2px solid rgba(0,229,255,.4)",borderRadius:20,
                  padding:"36px 24px",textAlign:"center",marginBottom:20,
                  animation:"popIn .4s ease"}}>
                  <div style={{fontFamily:"Fredoka One",fontSize:".72rem",color:"#00E5FF",
                    letterSpacing:4,textTransform:"uppercase",marginBottom:16,opacity:.8}}>
                    Season 2 launches in
                  </div>
                  <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:20,flexWrap:"wrap"}}>
                    {[{l:"Days",v:s2CdClock.d},{l:"Hours",v:s2CdClock.h},{l:"Mins",v:s2CdClock.m},{l:"Secs",v:s2CdClock.s}].map((seg,i)=>(
                      <div key={i} style={{background:"rgba(0,0,0,.4)",borderRadius:14,
                        padding:"16px 20px",minWidth:70,border:"1px solid rgba(0,229,255,.2)"}}>
                        <div style={{fontFamily:"Fredoka One",fontSize:"clamp(2rem,8vw,3rem)",
                          color:"#00E5FF",lineHeight:1}}>{String(seg.v).padStart(2,"0")}</div>
                        <div style={{fontSize:".62rem",color:"var(--text3)",fontWeight:800,
                          letterSpacing:1.5,textTransform:"uppercase",marginTop:4}}>{seg.l}</div>
                      </div>
                    ))}
                  </div>
                  <p style={{color:"var(--text2)",fontSize:".86rem",fontWeight:600,
                    maxWidth:420,margin:"0 auto 20px",lineHeight:1.6}}>
                    All rankings reset. Every player starts at zero.<br/>Be there on night one.
                  </p>
                  <button onClick={()=>go("season1")} style={{
                    background:"rgba(0,229,255,.12)",border:"1.5px solid rgba(0,229,255,.35)",
                    borderRadius:12,padding:"9px 22px",color:"#00E5FF",fontWeight:800,
                    fontSize:".84rem",cursor:"pointer"}}>
                    Review Season 1
                  </button>
                </div>
              </div>
            );

            // No data yet
            if(!s2Sessions.length) return(
              <div style={{
                background:"var(--card)",border:"1.5px solid var(--border)",
                borderRadius:20,padding:"40px 24px",textAlign:"center"}}>
                <div style={{fontSize:"2.5rem",marginBottom:12}}>🎮</div>
                <div style={{fontFamily:"Fredoka One",fontSize:"1.3rem",color:"#00E5FF",marginBottom:8}}>
                  No lobbies logged yet
                </div>
                <p style={{color:"var(--text3)",fontSize:".85rem",fontWeight:600}}>
                  Season 2 sessions will appear here after they are added.
                </p>
              </div>
            );

            return(
              <div>
                <VotePanel players={players} allStats={allStats} s2Prediction={s2Prediction} setS2Prediction={setS2Prediction} store={store} showToast={showToast} dn={dn} Av={Av}/>
                {/* ── Prediction tracker — how's your pick doing? ── */}
                {s2Prediction&&(()=>{
                  const pick=players.find(p=>p.id===s2Prediction);
                  if(!pick)return null;
                  const pickStats=s2Stats.find(p=>p.id===s2Prediction);
                  const pickRank=byWins.findIndex(p=>p.id===s2Prediction)+1;
                  const leader=byWins[0];
                  const leaderPlayer=players.find(p=>p.id===leader?.id);
                  const isLeading=pickRank===1&&leader?.wins>0;
                  const gapToFirst=leader&&pickStats?(leader.wins-pickStats.wins):null;
                  return(
                    <div style={{
                      background:isLeading
                        ?"linear-gradient(135deg,rgba(0,255,148,.12),rgba(0,229,255,.08))"
                        :"linear-gradient(135deg,rgba(199,125,255,.1),rgba(0,229,255,.06))",
                      border:`2px solid ${isLeading?"rgba(0,255,148,.4)":"rgba(199,125,255,.35)"}`,
                      borderRadius:18,padding:"18px 20px",marginBottom:24,
                      animation:"popIn .4s ease"}}>
                      <div style={{fontSize:".66rem",color:"var(--text3)",fontWeight:800,
                        letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>
                        🔮 Your Season 2 Prediction
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:46,height:46,borderRadius:"50%",flexShrink:0,
                            background:`linear-gradient(135deg,${pick.color},${pick.color}88)`,
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:"Fredoka One",fontSize:"1.2rem",color:"#fff",
                            boxShadow:`0 0 20px ${pick.color}55`}}>
                            {pick.username[0]}
                          </div>
                          <div>
                            <div style={{fontFamily:"Fredoka One",color:pick.color,fontSize:"1.05rem"}}>
                              {pick.host?"👑 ":""}{pick.username}
                            </div>
                            <div style={{fontSize:".7rem",color:"var(--text3)",fontWeight:700,marginTop:2}}>
                              {pickStats?`${pickStats.wins}W · ${pickStats.appearances} lobbies played`:"No S2 games yet"}
                            </div>
                          </div>
                        </div>
                        <div style={{flex:1,minWidth:120}}>
                          {isLeading?(
                            <div style={{fontFamily:"Fredoka One",color:"#00FF94",fontSize:"1rem"}}>
                              🔥 Currently leading S2. Good call.
                            </div>
                          ):pickRank>0&&leaderPlayer?(
                            <div>
                              <div style={{fontFamily:"Fredoka One",
                                color:"var(--text2)",fontSize:".9rem",marginBottom:2}}>
                                #{pickRank} right now
                              </div>
                              <div style={{fontSize:".74rem",color:"var(--text3)",fontWeight:700}}>
                                {gapToFirst>0?`${gapToFirst}W behind ${leaderPlayer.username}`:"Tied for the lead"}
                              </div>
                            </div>
                          ):(
                            <div style={{fontFamily:"Fredoka One",color:"var(--text3)",fontSize:".9rem"}}>
                              Waiting on their first game…
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Season 2 totals */}
                <div style={{
                  background:"linear-gradient(135deg,rgba(0,229,255,.12),rgba(0,255,148,.08),rgba(199,125,255,.1))",
                  border:"2px solid rgba(0,229,255,.35)",borderRadius:20,
                  padding:"24px 20px",marginBottom:28,textAlign:"center"}}>
                  <div style={{fontFamily:"Fredoka One",fontSize:"1.1rem",color:"#00E5FF",marginBottom:16}}>
                    Season 2 by the Numbers
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:12}}>
                    {[
                      {l:"Lobbies",v:s2Sessions.length,c:"#00E5FF",i:"🎮"},
                      {l:"Total Kills",v:totalKills,c:"#FF4D8F",i:"💀"},
                      {l:"Days Played",v:days,c:"#00FF94",i:"📅"},
                      {l:"Unique Winners",v:uniqueWins,c:"#C77DFF",i:"🏆"},
                    ].map((s,i)=>(
                      <div key={i} style={{background:"rgba(0,0,0,.3)",borderRadius:12,padding:"12px 10px"}}>
                        <div style={{fontSize:"1.4rem",marginBottom:4}}>{s.i}</div>
                        <div style={{fontFamily:"Fredoka One",fontSize:"1.6rem",color:s.c,lineHeight:1}}>{s.v}</div>
                        <div style={{fontSize:".68rem",color:"var(--text3)",fontWeight:800,
                          textTransform:"uppercase",letterSpacing:1,marginTop:4}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* S2 Podium */}
                {podium.length>=1&&(
                  <div style={{marginBottom:28}}>
                    <h3 style={{fontFamily:"Fredoka One",fontSize:"1.2rem",color:"#00E5FF",
                      marginBottom:16,textAlign:"center"}}>🥇 Season 2 Standings</h3>
                    <div style={{display:"flex",gap:12,justifyContent:"center",alignItems:"flex-end",flexWrap:"wrap"}}>
                      {podium.map((p,i)=>{
                        const player=players.find(x=>x.id===p.id);
                        if(!player)return null;
                        const medals=["🥇","🥈","🥉"];
                        const heights=["140px","110px","90px"];
                        const sizes=[68,54,46];
                        return(
                          <div key={i} style={{
                            display:"flex",flexDirection:"column",alignItems:"center",gap:8,
                            cursor:"pointer",animation:`popIn .4s ease ${i*.12}s both`}}
                            onClick={()=>goProfile(player.id)}>
                            <div style={{width:sizes[i],height:sizes[i],borderRadius:"50%",
                              background:`linear-gradient(135deg,${player.color},${player.color}88)`,
                              display:"flex",alignItems:"center",justifyContent:"center",
                              fontFamily:"Fredoka One",fontSize:i===0?"1.6rem":"1.2rem",color:"#fff",
                              boxShadow:`0 0 ${i===0?30:16}px ${player.color}66`,
                              border:`2px solid ${player.color}`}}>
                              {player.username[0]}
                            </div>
                            <div style={{fontFamily:"Fredoka One",fontSize:i===0?"1rem":".88rem",
                              color:player.color,textAlign:"center",maxWidth:90,
                              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {player.host?"👑 ":""}{dn(player.username)}
                            </div>
                            <div style={{
                              background:i===0?"linear-gradient(135deg,#00E5FF,#00FF94)":i===1?"rgba(192,192,192,.2)":"rgba(205,127,50,.2)",
                              border:`1.5px solid ${i===0?"#00E5FF":i===1?"#C0C0C0":"#CD7F32"}`,
                              borderRadius:"12px 12px 0 0",
                              width:i===0?100:80,height:heights[i],
                              display:"flex",flexDirection:"column",alignItems:"center",
                              justifyContent:"flex-start",paddingTop:12,gap:4}}>
                              <div style={{fontSize:"1.6rem"}}>{medals[i]}</div>
                              <div style={{fontFamily:"Fredoka One",
                                color:i===0?"#160d2e":i===1?"#C0C0C0":"#CD7F32",
                                fontSize:i===0?"1.1rem":".9rem"}}>{p.wins}W</div>
                              <div style={{fontSize:".7rem",color:i===0?"rgba(22,13,46,.7)":"var(--text3)",fontWeight:700}}>{p.kills}K</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* S2 Award cards */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14,marginBottom:28}}>
                  {[
                    {icon:"👑",color:"#00E5FF",title:"S2 Champion",player:byWins[0],stat:byWins[0]?`${byWins[0].wins}W · ${byWins[0].kills}K`:"—",desc:"Most wins in Season 2"},
                    {icon:"💀",color:"#FF4D8F",title:"S2 Reaper",player:byKills[0],stat:byKills[0]?`${byKills[0].kills} total kills`:"—",desc:"Most kills this season"},
                    {icon:"🎮",color:"#00FF94",title:"Most Loyal",player:byApp[0],stat:byApp[0]?`${byApp[0].appearances} lobbies`:"—",desc:"Most appearances in S2"},
                    ...(topGame.pid?[{icon:"☄️",color:"#C77DFF",title:"Best Single Game",player:players.find(p=>p.id===topGame.pid),stat:`${topGame.k} kills in ${topGame.sid}`,desc:topGame.date}]:[]),
                  ].map((a,i)=>{
                    if(!a.player)return null;
                    const playerObj=a.player.username?a.player:players.find(p=>p.id===a.player?.id);
                    if(!playerObj)return null;
                    return(
                      <div key={i} className="card-h" onClick={()=>goProfile(playerObj.id)}
                        style={{background:`linear-gradient(135deg,${a.color}12,var(--card))`,
                          border:`2px solid ${a.color}44`,borderRadius:16,padding:"18px 16px",
                          cursor:"pointer",animation:`fadeUp .4s ease ${i*.07}s both`}}>
                        <div style={{fontSize:"1.8rem",marginBottom:8}}>{a.icon}</div>
                        <div style={{fontSize:".68rem",color:a.color,fontWeight:800,
                          letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{a.title}</div>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                          <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,
                            background:`linear-gradient(135deg,${playerObj.color},${playerObj.color}88)`,
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:"Fredoka One",fontSize:".9rem",color:"#fff"}}>
                            {playerObj.username[0]}
                          </div>
                          <div style={{fontFamily:"Fredoka One",color:playerObj.color,fontSize:".95rem",
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {playerObj.host?"👑 ":""}{playerObj.username}
                          </div>
                        </div>
                        <div style={{fontFamily:"Fredoka One",fontSize:"1.1rem",color:a.color,marginBottom:2}}>{a.stat}</div>
                        <div style={{fontSize:".72rem",color:"var(--text3)"}}>{a.desc}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Full S2 leaderboard */}
                <div style={{marginBottom:8}}>
                  <h3 style={{fontFamily:"Fredoka One",fontSize:"1.15rem",color:"#00E5FF",marginBottom:14}}>
                    📊 Full Season 2 Leaderboard
                  </h3>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {byWins.map((p,i)=>{
                      const player=players.find(x=>x.id===p.id);
                      if(!player)return null;
                      return(
                        <div key={i} onClick={()=>goProfile(player.id)} style={{
                          display:"flex",alignItems:"center",gap:12,
                          background:"var(--card)",border:`1.5px solid ${i<3?"rgba(0,229,255,.3)":"var(--border)"}`,
                          borderRadius:13,padding:"10px 14px",cursor:"pointer",
                          animation:`fadeUp .3s ease ${i*.03}s both`}}>
                          <div style={{fontFamily:"Fredoka One",fontSize:"1rem",
                            color:i===0?"#00E5FF":i===1?"#C0C0C0":i===2?"#CD7F32":"var(--text3)",
                            width:22,textAlign:"center",flexShrink:0}}>
                            {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}
                          </div>
                          <Av p={player} size={34}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:"Fredoka One",color:player.color,fontSize:".92rem",
                              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {player.host?"👑 ":""}{dn(player.username)}
                            </div>
                          </div>
                          <div style={{display:"flex",gap:14,flexShrink:0}}>
                            {[
                              {l:"W",v:p.wins,c:"#FFD700"},
                              {l:"K",v:p.kills,c:"#FF4D8F"},
                              {l:"GP",v:p.appearances,c:"#00E5FF"},
                            ].map((s,j)=>(
                              <div key={j} style={{textAlign:"center",minWidth:28}}>
                                <div style={{fontFamily:"Fredoka One",fontSize:".95rem",color:s.c,lineHeight:1}}>{s.v}</div>
                                <div style={{fontSize:".6rem",color:"var(--text3)",fontWeight:800}}>{s.l}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {view==="faq"&&(
        <div className="fade-up" style={{minHeight:"calc(100vh - 120px)"}}>
          <div style={{textAlign:"center",marginBottom:36}}>
            <p style={{color:"var(--text3)",fontWeight:800,fontSize:".7rem",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>Everything you need to know</p>
            <h2 style={{fontFamily:"Fredoka One",fontSize:"clamp(2rem,8vw,3.2rem)",
              background:"linear-gradient(135deg,#FFD700,#C77DFF,#00E5FF)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
              ❓ FAQ
            </h2>
          </div>

          {/* ── Rank Titles ── */}
          <div style={{...card({border:"2px solid rgba(199,125,255,.3)"}),padding:26,marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <span style={{fontSize:"1.6rem"}}>🏅</span>
              <div>
                <h3 style={{fontFamily:"Fredoka One",color:"#C77DFF",fontSize:"1.3rem"}}>Rank Titles: What Do They Mean?</h3>
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>Titles appear under every player name. Only one person can hold each top title at a time.</p>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
              {RANK_FAQ.map((r,i)=>(
                <div key={i} style={{background:"rgba(0,0,0,.3)",borderRadius:12,padding:"14px 16px",border:`1px solid ${r.color}33`}}>
                  <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:7}}>
                    <span style={{fontSize:"1.3rem"}}>{r.icon}</span>
                    <span style={{fontFamily:"Fredoka One",color:r.color,fontSize:"1.05rem"}}>{r.name}</span>
                  </div>
                  <p style={{color:"var(--text2)",fontSize:".8rem",lineHeight:1.55}}>{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Badges ── */}
          <div style={{...card({border:"2px solid rgba(255,215,0,.3)"}),padding:26,marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <span style={{fontSize:"1.6rem"}}>🎖️</span>
              <div>
                <h3 style={{fontFamily:"Fredoka One",color:"#FFD700",fontSize:"1.3rem"}}>Badges: How to Earn Them</h3>
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>Badges stack. You can hold multiple at once. Tap to expand.</p>
              </div>
            </div>
            <div>
              {BADGE_CATALOGUE.map((b,i)=>(
                <div key={i} className="faq-item">
                  <div className="faq-q" onClick={()=>setFaqOpen(faqOpen===i?null:i)}>
                    <span style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:"1.1rem"}}>{b.icon}</span>
                      <strong style={{color:"var(--text)"}}>{b.name}</strong>
                      <span style={{color:"var(--text3)",fontWeight:600,fontSize:".84rem"}}>{b.desc}</span>
                    </span>
                    <span style={{color:"var(--text3)",marginLeft:8,flexShrink:0,fontSize:"1rem"}}>{faqOpen===i?"▲":"▼"}</span>
                  </div>
                  {faqOpen===i&&(
                    <div className="faq-a">
                      <span style={{color:"#00FF94",fontWeight:800}}>How to earn: </span>{b.how}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Stats Glossary ── */}
          <div style={{...card({border:"2px solid rgba(0,229,255,.25)"}),padding:26,marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <span style={{fontSize:"1.6rem"}}>📊</span>
              <div>
                <h3 style={{fontFamily:"Fredoka One",color:"#00E5FF",fontSize:"1.3rem"}}>Stats Glossary</h3>
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>What every number on the leaderboard means</p>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
              {[
                {icon:"🏆",term:"Wins",            color:"#FFD700",def:"Number of lobbies where you finished 1st place on the leaderboard."},
                {icon:"💀",term:"Kills",            color:"#FF4D8F",def:"Total kills across every lobby you've appeared in."},
                {icon:"⚡",term:"K/G (Kills/Game)", color:"#00E5FF",def:"Total kills ÷ total lobbies played. Shows how many kills you're averaging every game, win or lose."},
                {icon:"🎯",term:"Win Rate %",       color:"#00FF94",def:"Wins ÷ Appearances × 100. How often you actually close one out when you show up."},
                {icon:"📅",term:"Appearances",      color:"#FFAB40",def:"Total lobbies you've been present in, regardless of result. Showing up is the first step."},
                {icon:"🌟",term:"Best Game",        color:"#C77DFF",def:"Your highest single-lobby kill count ever. One lobby where you went off."},
                {icon:"🔥",term:"Win Streak",       color:"#FF6B35",def:"Consecutive wins within the same session day. Resets each new day, so a 5-streak in one night matters."},
                {icon:"⚔️",term:"Duels (Rivals)",   color:"#FF4D8F",def:"Times you and another player finished 1st and 2nd in the same lobby. The Rivals page tracks who wins those matchups."},
                {icon:"⚡",term:"Latest Day",       color:"#00E5FF",def:"Filters the leaderboard to the most recent session date. See who ran the table that night specifically."},
                {icon:"🎖️",term:"Carry Score",     color:"#FF6B35",def:"Wins where you also had the most kills in the lobby. You won it AND you did the damage. The complete performance."},
                {icon:"🧱",term:"Consistency",      color:"#00FF94",def:"% of lobbies where you finished in the top half. You don't have to win every game. You just have to not be mid. This rewards players who reliably perform."},
                {icon:"🌵",term:"Drought",          color:"#FFAB40",def:"How many lobbies since your last win. Zero means your most recent game was a W. The higher this gets, the more the community is watching."},
              ].map((s,i)=>(
                <div key={i} style={{background:"rgba(0,0,0,.3)",borderRadius:12,padding:"13px 16px",border:`1px solid ${s.color}22`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontSize:"1.1rem"}}>{s.icon}</span>
                    <span style={{fontFamily:"Fredoka One",color:s.color,fontSize:"1rem"}}>{s.term}</span>
                  </div>
                  <p style={{color:"var(--text2)",fontSize:".8rem",lineHeight:1.5}}>{s.def}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Level System ── */}
          <div style={{...card({border:"2px solid rgba(199,125,255,.25)"}),padding:26,marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <span style={{fontSize:"1.6rem"}}>⚡</span>
              <div>
                <h3 style={{fontFamily:"Fredoka One",color:"#C77DFF",fontSize:"1.3rem"}}>How Levels Work</h3>
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>
                  Every player earns XP just by playing. Your level shows on the Arena table and your Combat File.
                </p>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",
              gap:8,marginBottom:16}}>
              {[
                {icon:"📅",label:"1 XP",        desc:"Per lobby played"},
                {icon:"🏆",label:"3 XP",        desc:"Per lobby won"},
                {icon:"💀",label:"0.5 XP",      desc:"Per kill"},
                {icon:"🎖️",label:"10 XP",       desc:"Per badge earned"},
                {icon:"🚀",label:"25 XP",       desc:"Per season played in"},
              ].map((s,i)=>(
                <div key={i} style={{
                  background:"rgba(199,125,255,.06)",
                  border:"1px solid rgba(199,125,255,.18)",
                  borderRadius:8,padding:"12px 14px",
                  display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:"1.3rem",flexShrink:0}}>{s.icon}</span>
                  <div>
                    <div style={{fontFamily:"Barlow Condensed",fontWeight:900,
                      fontSize:"1rem",color:"#C77DFF",letterSpacing:".05em"}}>{s.label}</div>
                    <div style={{fontFamily:"Barlow Condensed",fontWeight:700,
                      fontSize:".72rem",color:"var(--text3)"}}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(0,0,0,.3)",borderRadius:8,padding:"12px 16px",
              borderLeft:"3px solid rgba(199,125,255,.4)"}}>
              <div className="bc7" style={{fontSize:".76rem",color:"var(--text2)",lineHeight:1.7}}>
                Level is calculated from total XP using a square root curve — so the early levels come fast but higher levels take real commitment.
                The mini progress bar in the Arena and your Combat File shows how close you are to the next level.
                Earning badges is one of the fastest ways to jump levels since each badge is worth 10 XP.
                The 500 Kills badge alone is worth 10 XP on top of the 250 XP you already earned from the kills themselves.
              </div>
            </div>
          </div>

          {/* ── General Questions ── */}
          <div style={{...card({border:"2px solid rgba(255,107,53,.25)"}),padding:26}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <span style={{fontSize:"1.6rem"}}>💬</span>
              <div>
                <h3 style={{fontFamily:"Fredoka One",color:"#FF6B35",fontSize:"1.3rem"}}>General Questions</h3>
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>Everything about how Games Night works. Tap to expand.</p>
              </div>
            </div>
            {[
              {q:"When do sessions run?",         a:"Mon–Sat, 5:00 PM – 7:00 PM UTC. Hosted by Mekula. Join the Discord to get pinged before each lobby starts."},
              {q:"How do I get added to the roster?",a:"Join the Discord and ask Mekula to add you. Once you're in the roster, your stats track automatically from the next session."},
              {q:"What is Bullet League?",        a:"Bullet League is the featured game for Games Night. A fast-paced multiplayer battle game. Players compete in friend lobbies every session."},
              {q:"How are winners determined?",   a:"The player who places 1st on the in-game leaderboard at the end of each round wins that lobby. Kills shown next to names are that lobby's kill count."},
              {q:"Why does my Win Rate show 0% even if I played?",a:"Win Rate only counts as meaningful once you've won at least once. Keep showing up. Your appearance count still grows."},
              {q:"What is the Rivals page?",      a:"Rivals tracks 1st-vs-2nd place finishes. Any time two players finish at the top of the same lobby, that's a duel. Who wins those head-to-head moments most often?"},
              {q:"How do I watch the stream?",   a:'Sessions are streamed on Twitch at twitch.tv/mekulavick. Click the Twitch button in the nav to go straight there.'},
            ].map((item,i)=>(
              <div key={i} className="faq-item">
                <div className="faq-q" onClick={()=>setFaqOpen(100+i===faqOpen?null:100+i)}>
                  <span>{item.q}</span>
                  <span style={{color:"var(--text3)",marginLeft:8,flexShrink:0,fontSize:"1rem"}}>{100+i===faqOpen?"▲":"▼"}</span>
                </div>
                {100+i===faqOpen&&<div className="faq-a">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

    </main>

    {/* ── Share Card Modal ── */}
    {shareCard?.visible&&(()=>{
      const isDayCard=shareCard.type==="day";

      // ── Day Recap Card ──
      if(isDayCard){
        const recap=getDayRecap(shareCard.date);
        if(!recap)return null;
        const dd=new Date(shareCard.date+"T12:00:00Z");
        const dateLabel=dd.toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
        const topWinner=recap.winnersList[0];
        return(
          <div onClick={()=>setShareCard(null)} style={{
            position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,
            display:"flex",alignItems:"center",justifyContent:"center",padding:16,
            backdropFilter:"blur(8px)"}}>
            <div onClick={e=>e.stopPropagation()} style={{
              width:"100%",maxWidth:440,borderRadius:24,overflow:"hidden",
              boxShadow:"0 0 60px rgba(0,0,0,.8)"}}>
              <div id="share-card" style={{
                background:"linear-gradient(135deg,#160d2e 0%,#0e1f3a 50%,#160d2e 100%)",
                padding:"26px 24px",position:"relative",overflow:"hidden"}}>
                {/* BG */}
                <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,
                  borderRadius:"50%",background:"radial-gradient(circle,rgba(0,229,255,.1),transparent)",pointerEvents:"none"}}/>
                {/* Header */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                  <div style={{fontFamily:"Fredoka One",fontSize:".76rem",color:"rgba(0,229,255,.6)",letterSpacing:2}}>
                    🎮 BULLET LEAGUE · GAMES NIGHT
                  </div>
                  <div style={{fontSize:".68rem",color:"rgba(255,255,255,.3)",fontWeight:700}}>
                    {dd.toLocaleDateString("en",{month:"short",day:"numeric"})}
                  </div>
                </div>
                {/* Session title */}
                <div style={{textAlign:"center",marginBottom:18}}>
                  <div style={{fontFamily:"Fredoka One",fontSize:"clamp(1.1rem,4vw,1.5rem)",
                    color:"#fff",marginBottom:4}}>Session Recap</div>
                  <div style={{fontSize:".76rem",color:"rgba(255,255,255,.4)",fontWeight:600}}>{dateLabel}</div>
                </div>
                {/* Stats banner */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:18}}>
                  {[
                    {l:"Lobbies",v:recap.lobbies,c:"#00E5FF"},
                    {l:"Total Kills",v:recap.totalKills,c:"#FF4D8F"},
                    {l:"Players",v:recap.uniquePlayers,c:"#00FF94"},
                  ].map((s,i)=>(
                    <div key={i} style={{background:"rgba(0,0,0,.4)",borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                      <div style={{fontFamily:"Fredoka One",fontSize:"1.5rem",color:s.c,lineHeight:1}}>{s.v}</div>
                      <div style={{fontSize:".6rem",color:"rgba(255,255,255,.35)",fontWeight:800,
                        textTransform:"uppercase",letterSpacing:1,marginTop:3}}>{s.l}</div>
                    </div>
                  ))}
                </div>
                {/* Winners list */}
                <div style={{marginBottom:recap.killKing?.k>0?14:0}}>
                  <div style={{fontSize:".62rem",color:"rgba(255,255,255,.3)",fontWeight:800,
                    letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>🏆 Winners</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {recap.winnersList.slice(0,6).map((w,i)=>{
                      if(!w.player)return null;
                      return(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,
                          background:`${w.player.color}14`,borderRadius:9,padding:"7px 11px"}}>
                          <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,
                            background:`linear-gradient(135deg,${w.player.color},${w.player.color}88)`,
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:"Fredoka One",fontSize:".75rem",color:"#fff"}}>
                            {w.player.username[0]}
                          </div>
                          <div style={{fontFamily:"Fredoka One",color:w.player.color,
                            fontSize:".88rem",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {w.player.host?"👑 ":""}{w.player.username}
                          </div>
                          <div style={{fontFamily:"Fredoka One",color:"#FFD700",fontSize:".84rem",flexShrink:0}}>
                            {w.wins}W
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Kill king */}
                {recap.killKing?.k>0&&(
                  <div style={{display:"flex",alignItems:"center",gap:10,
                    background:"rgba(255,107,53,.12)",border:"1px solid rgba(255,107,53,.3)",
                    borderRadius:10,padding:"9px 13px",marginBottom:4}}>
                    <span style={{fontSize:"1.1rem"}}>🔫</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:".6rem",color:"rgba(255,255,255,.3)",fontWeight:800,
                        textTransform:"uppercase",letterSpacing:1}}>
                        Kill King{recap.killKingsList?.length>1?" (Tied)":""}
                      </div>
                      <div style={{fontFamily:"Fredoka One",color:"#FF6B35",fontSize:".9rem"}}>
                        {recap.killKingsList?.length>1
                          ? recap.killKingsList.map(k=>k.player?.username).filter(Boolean).join(" & ")+" · "+recap.killKing.k+"K"
                          : recap.killKing.player?.username+" · "+recap.killKing.k+"K in one lobby"
                        }
                      </div>
                    </div>
                  </div>
                )}
                {/* Footer */}
                <div style={{textAlign:"center",borderTop:"1px solid rgba(255,255,255,.07)",
                  paddingTop:12,marginTop:12}}>
                  <div style={{fontSize:".65rem",color:"rgba(255,255,255,.25)",fontWeight:700}}>
                    mekulasgn.netlify.app
                  </div>
                </div>
              </div>
              <div style={{background:"rgba(22,13,46,.98)",padding:"14px 20px",
                display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                <p style={{width:"100%",textAlign:"center",fontSize:".78rem",
                  color:"var(--text3)",fontWeight:600,marginBottom:6}}>
                  📱 Screenshot this card to share
                </p>
                <button onClick={()=>setShareCard(null)} style={{
                  padding:"8px 22px",borderRadius:10,cursor:"pointer",
                  background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",
                  color:"var(--text2)",fontWeight:700,fontSize:".85rem"}}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      }

      // ── Single Lobby Card (original) ──
      const sd=getShareData(shareCard.sid);
      if(!sd)return null;
      const {winner,tkPlayer,tkKills,totalKills,players_count,dateLabel,winnerKills,sessionNum}=sd;
      return(
        <div onClick={()=>setShareCard(null)} style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,
          display:"flex",alignItems:"center",justifyContent:"center",padding:16,
          backdropFilter:"blur(8px)"}}>
          <div onClick={e=>e.stopPropagation()} style={{
            width:"100%",maxWidth:420,borderRadius:24,overflow:"hidden",
            boxShadow:"0 0 60px rgba(0,0,0,.8)"}}>
            {/* Card — styled for screenshotting */}
            <div id="share-card" style={{
              background:"linear-gradient(135deg,#160d2e 0%,#1e1245 50%,#160d2e 100%)",
              padding:"28px 24px",position:"relative",overflow:"hidden"}}>
              {/* BG decoration */}
              <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,
                borderRadius:"50%",background:winner?`radial-gradient(circle,${winner.color}22,transparent)`:"none",pointerEvents:"none"}}/>
              <div style={{position:"absolute",bottom:-30,left:-30,width:120,height:120,
                borderRadius:"50%",background:"radial-gradient(circle,rgba(0,229,255,.08),transparent)",pointerEvents:"none"}}/>
              {/* Site tag */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{fontFamily:"Fredoka One",fontSize:".78rem",color:"var(--text3)",letterSpacing:2}}>
                  🎮 BULLET LEAGUE
                </div>
                <div style={{fontSize:".72rem",color:"var(--text3)",fontWeight:700}}>
                  Lobby {sessionNum}
                </div>
              </div>
              {/* Winner */}
              <div style={{textAlign:"center",marginBottom:20}}>
                <div style={{fontSize:".7rem",color:"var(--text3)",fontWeight:800,
                  letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>🏆 Winner</div>
                {winner&&<>
                  <div style={{width:72,height:72,borderRadius:"50%",margin:"0 auto 10px",
                    background:`linear-gradient(135deg,${winner.color},${winner.color}88)`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontFamily:"Fredoka One",fontSize:"1.8rem",color:"#fff",
                    boxShadow:`0 0 30px ${winner.color}66`}}>
                    {winner.username[0]}
                  </div>
                  <div style={{fontFamily:"Fredoka One",fontSize:"clamp(1.4rem,5vw,2rem)",
                    color:winner.color,marginBottom:4}}>
                    {winner.host?"👑 ":""}{winner.username}
                  </div>
                  <div style={{fontFamily:"Fredoka One",fontSize:"1.1rem",color:"var(--gold)"}}>
                    {winnerKills} kills · 1st place
                  </div>
                </>}
              </div>
              {/* Stats row */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
                {[
                  {l:"Players",v:players_count,c:"var(--cyan)"},
                  {l:"Total Kills",v:totalKills,c:"var(--pink)"},
                  {l:"Kill King",v:tkKills+"K",c:"var(--orange)"},
                ].map((st,i)=>(
                  <div key={i} style={{background:"rgba(0,0,0,.4)",borderRadius:10,
                    padding:"10px 8px",textAlign:"center"}}>
                    <div style={{fontFamily:"Fredoka One",fontSize:"1.3rem",color:st.c}}>{st.v}</div>
                    <div style={{fontSize:".65rem",color:"var(--text3)",fontWeight:800,
                      textTransform:"uppercase",letterSpacing:1}}>{st.l}</div>
                  </div>
                ))}
              </div>
              {/* Kill king */}
              {tkPlayer&&tkKills>0&&<div style={{
                background:`rgba(255,107,53,.1)`,border:"1px solid rgba(255,107,53,.3)",
                borderRadius:10,padding:"8px 14px",display:"flex",alignItems:"center",
                gap:10,marginBottom:16}}>
                <span style={{fontSize:"1.1rem"}}>🔫</span>
                <div>
                  <div style={{fontSize:".66rem",color:"var(--text3)",fontWeight:800,
                    textTransform:"uppercase",letterSpacing:1}}>Lobby Kill King</div>
                  <div style={{fontFamily:"Fredoka One",color:"var(--orange)",fontSize:".95rem"}}>
                    {tkPlayer.username} {tkKills}K
                  </div>
                </div>
              </div>}
              {/* Date + site */}
              <div style={{textAlign:"center",borderTop:"1px solid rgba(255,255,255,.08)",
                paddingTop:12}}>
                <div style={{fontSize:".72rem",color:"var(--text3)",fontWeight:600}}>{dateLabel}</div>
                <div style={{fontSize:".68rem",color:"var(--text3)",marginTop:2}}>
                  mekulasgn.netlify.app
                </div>
              </div>
            </div>
            {/* Actions */}
            <div style={{background:"rgba(22,13,46,.98)",padding:"14px 20px",
              display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <p style={{width:"100%",textAlign:"center",fontSize:".78rem",
                color:"var(--text3)",fontWeight:600,marginBottom:6}}>
                📱 Screenshot this card to share
              </p>
              <button onClick={()=>setShareCard(null)} style={{
                padding:"8px 22px",borderRadius:10,cursor:"pointer",
                background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",
                color:"var(--text2)",fontWeight:700,fontSize:".85rem"}}>
                Close
              </button>
            </div>
          </div>
        </div>
      );
    })()}

    {/* ── LEVEL TITLE CARD ── */}
    {lvlCard&&(
      <div className="lvl-card" style={{
        opacity:lvlCard.phase==="out"?0:1,
        transform:lvlCard.phase==="out"?"scale(1.04)":"scale(1)",
        transition:"opacity .45s ease, transform .45s ease",
      }}>
        {/* BG grid */}
        <div style={{position:"absolute",inset:0,
          backgroundImage:"linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)",
          backgroundSize:"44px 44px",pointerEvents:"none"}}/>
        {/* Sweep bar */}
        <div style={{
          position:"absolute",left:0,top:0,bottom:0,
          background:`linear-gradient(90deg,${lvlCard.color}22,${lvlCard.color}08,transparent)`,
          animation:"lvlSweep .7s cubic-bezier(.16,1,.3,1) both",
          width:"100%",
          borderLeft:`3px solid ${lvlCard.color}`,
          pointerEvents:"none"
        }}/>
        {/* Scanline */}
        <div style={{position:"absolute",left:0,right:0,height:"1.5px",
          background:`linear-gradient(90deg,transparent,${lvlCard.color}44,transparent)`,
          animation:"bootScan 1.8s linear infinite",pointerEvents:"none"}}/>
        {/* Content */}
        <div style={{textAlign:"center",position:"relative",zIndex:2,padding:"0 20px"}}>
          <div style={{fontFamily:"Barlow Condensed",fontWeight:700,
            fontSize:"clamp(.7rem,2vw,.95rem)",letterSpacing:".5em",
            color:"rgba(255,255,255,.3)",marginBottom:14,textTransform:"uppercase",
            animation:"lvlSub .4s ease .1s both"}}>
            NOW ENTERING
          </div>
          <div style={{fontSize:"clamp(2rem,6vw,2.5rem)",marginBottom:10,
            animation:"lvlSub .4s ease .05s both"}}>{lvlCard.icon}</div>
          <div style={{
            fontFamily:"Barlow Condensed",fontWeight:900,
            fontSize:"clamp(2.8rem,12vw,6rem)",
            letterSpacing:".08em",lineHeight:.9,
            color:lvlCard.color,textTransform:"uppercase",
            textShadow:`0 0 60px ${lvlCard.color}88`,
            animation:"lvlFlicker .8s ease both",
          }}>
            {lvlCard.label}
          </div>
          {/* Animated line */}
          <div style={{height:2,marginTop:18,
            background:`linear-gradient(90deg,transparent,${lvlCard.color},transparent)`,
            animation:"lvlLine .6s ease .2s both",width:0,margin:"18px auto 0"}}>
          </div>
        </div>
      </div>
    )}

    {/* ── CONFETTI ── */}
    {confetti.map(p=>(
      <div key={p.id} className="confetti-piece" style={{
        left:`${p.left}%`,
        top:0,
        width:p.size,
        height:p.size,
        background:p.color,
        animationDuration:`${p.duration}s`,
        animationDelay:`${p.delay}s`,
      }}/>
    ))}

    {/* ── April Fools: Fake System Alert Toast ── */}
    {foolsToast>0&&(
      <div style={{
        position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",
        zIndex:9999,maxWidth:340,width:"calc(100% - 32px)",
        background:foolsToast===1?"rgba(255,107,53,.95)":"rgba(255,77,143,.95)",
        border:`1.5px solid ${foolsToast===1?"rgba(255,150,50,.8)":"rgba(255,100,143,.8)"}`,
        borderRadius:14,padding:"14px 18px",
        boxShadow:"0 8px 32px rgba(0,0,0,.5)",
        animation:"popIn .3s ease",
        backdropFilter:"blur(12px)",
      }}>
        <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
          <span style={{fontSize:"1.3rem",flexShrink:0}}>
            {foolsToast===1?"⚠️":"🃏"}
          </span>
          <div>
            <div style={{fontFamily:"Fredoka One",fontSize:".95rem",color:"#fff",marginBottom:3}}>
              {foolsToast===1?"System Warning":"April Fools 🎉"}
            </div>
            <div style={{fontSize:".78rem",color:"rgba(255,255,255,.85)",fontWeight:600,lineHeight:1.5}}>
              {foolsToast===1
                ?"Leaderboard data may be unreliable today. We are investigating."
                :"Just kidding. Happy April Fools. Now go win a lobby. 🃏"
              }
            </div>
          </div>
          <button onClick={()=>setFoolsToast(0)} style={{
            background:"none",border:"none",color:"rgba(255,255,255,.6)",
            cursor:"pointer",fontSize:".9rem",flexShrink:0,padding:2}}>✕</button>
        </div>
      </div>
    )}

    {/* FOOTER */}
    <footer style={{textAlign:"center",padding:"28px 16px",borderTop:"1px solid rgba(255,255,255,.07)",
      marginTop:48,position:"relative",zIndex:2,fontSize:".74rem",color:"var(--text3)"}}>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:14}}>
        <a href={DISCORD_URL} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:5,padding:"7px 16px",borderRadius:8,background:"rgba(88,101,242,.18)",border:"1px solid rgba(88,101,242,.38)",color:"#a0aaff",fontWeight:700,fontSize:".8rem",textDecoration:"none"}}>💬 Discord</a>
        <a href={TWITCH_URL} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:5,padding:"7px 16px",borderRadius:8,background:"rgba(145,71,255,.18)",border:"1px solid rgba(145,71,255,.38)",color:"#cc99ff",fontWeight:700,fontSize:".8rem",textDecoration:"none"}}>📺 Twitch</a>
      </div>
      <div style={{marginBottom:3}}>
        <span style={{fontFamily:"Fredoka One",color:"var(--orange)",fontSize:".86rem"}}>🎯 {SITE_TITLE}</span>
        {" · Hosted by "}{HOSTED_BY}{" · Mon–Sat 5–7 PM UTC · "}{FEATURED_GAME}
      </div>
      <div>Built for the community 💛</div>
    </footer>
  </>);
}
