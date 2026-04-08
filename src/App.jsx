import { useState, useEffect, useRef } from "react";
import {
  ACCENT_COLORS,
  ADMIN_PASSWORD,
  BADGE_CATALOGUE,
  DISCORD_WEBHOOK,
  DISCORD_URL,
  FEATURED_GAME,
  HOSTED_BY,
  RANK_FAQ,
  SEASONS,
  SITE_TITLE,
  STORAGE_VERSION,
  TWITCH_URL,
} from "./game/config";
import {
  allStats as selectAllStats,
  buildPlayerIndex,
  compareSessionsDesc,
  createNextSessionId,
  getBadges as selectGetBadges,
  getBenchmark as selectGetBenchmark,
  getCarryScore as selectGetCarryScore,
  getChartData as selectGetChartData,
  getConsistency as selectGetConsistency,
  getDailyMVP as selectGetDailyMVP,
  getDayRecap as selectGetDayRecap,
  getDaysActive as selectGetDaysActive,
  getDrought as selectGetDrought,
  getFormGuide as selectGetFormGuide,
  getHeadToHead as selectGetHeadToHead,
  getLastSeen as selectGetLastSeen,
  getLatestSessionDate as selectGetLatestSessionDate,
  getLiveStreaks as selectGetLiveStreaks,
  getMilestones as selectGetMilestones,
  getPeriodSessions as selectGetPeriodSessions,
  getPlayerLevel as selectGetPlayerLevel,
  getRank as selectGetRank,
  getRecords as selectGetRecords,
  getRivals as selectGetRivals,
  getSeasonOneWrap as selectGetSeasonOneWrap,
  getSeasonSessions as selectGetSeasonSessions,
  getSortedLeaderboard as selectGetSortedLeaderboard,
  getStats as selectGetStats,
  getStreak as selectGetStreak,
  getWeeklyMissions as selectGetWeeklyMissions,
  parseSessionIdNumber,
} from "./game/selectors";
import { createStorageAdapter, loadGameData, persistGameData } from "./game/storage";
import {
  getNextSession,
  isEventActive,
  isFoolsDay,
  isLiveNow,
  scrambleName,
  todayStr,
} from "./game/time";

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
  .zone-rail{
    position:sticky;top:58px;z-index:98;
    display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:8px 16px 9px;
    background:linear-gradient(90deg,var(--zonec,rgba(255,107,53,.16)),rgba(14,8,32,.94) 34%,rgba(14,8,32,.94));
    border-bottom:1px solid rgba(255,255,255,.06);
    backdrop-filter:blur(18px);
    box-shadow:inset 0 -1px 0 rgba(255,255,255,.04);
    animation:zoneRailRise .34s ease both;
  }
  .zone-rail.live{animation:zoneRailRise .34s ease both,zoneRailSweep .7s ease;}
  .zone-rail-chip{
    display:inline-flex;align-items:center;gap:10px;min-width:0;
  }
  .zone-rail-icon{
    width:24px;height:24px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;
    background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
    box-shadow:0 0 16px var(--zonec,rgba(255,107,53,.2));
    flex-shrink:0;
  }
  .zone-rail-copy{min-width:0;}
  .zone-rail-label{
    display:block;font-family:"Barlow Condensed",sans-serif;font-weight:900;font-size:.76rem;
    letter-spacing:.2em;text-transform:uppercase;color:var(--zonec,#FF6B35);
    white-space:nowrap;
  }
  .zone-rail-brief{
    display:block;font-size:.72rem;color:var(--text2);line-height:1.45;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  }
  .zone-rail-status{
    font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:.68rem;
    letter-spacing:.16em;text-transform:uppercase;color:var(--text3);
    white-space:nowrap;
  }
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
  @keyframes zoneRailRise{0%{opacity:0;transform:translateY(-8px)}100%{opacity:1;transform:translateY(0)}}
  @keyframes zoneRailSweep{0%{box-shadow:inset 0 -1px 0 rgba(255,255,255,.04),0 0 0 transparent}55%{box-shadow:inset 0 -1px 0 rgba(255,255,255,.04),0 8px 26px rgba(0,0,0,.18)}100%{box-shadow:inset 0 -1px 0 rgba(255,255,255,.04),0 0 0 transparent}}
  @keyframes navIncoming{0%{transform:translateY(-1px);opacity:.8}40%{transform:translateY(0)}100%{opacity:1}}

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
    transition:background .16s,transform .14s,box-shadow .16s,border-color .16s;
    position:relative;
  }
  .arena-row:hover{
    background:rgba(255,255,255,.06)!important;
    transform:translateX(4px);
    box-shadow:inset 3px 0 0 rgba(255,255,255,.08);
  }
  .arena-row-1{
    background:linear-gradient(90deg,rgba(255,215,0,.07),transparent)!important;
    border-left:3px solid #FFD700!important;
    box-shadow:inset 0 0 0 1px rgba(255,215,0,.08),0 0 22px rgba(255,215,0,.08);
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
  .nav-btn{
    background:none;border:none;cursor:pointer;font-family:inherit;transition:color .16s,background .16s,transform .16s,box-shadow .16s;
    position:relative;isolation:isolate;
  }
  .nav-btn::before{
    content:"";position:absolute;left:10px;right:10px;bottom:0;height:2px;border-radius:999px;
    background:var(--navc,transparent);opacity:0;transform:scaleX(.45);
    transition:opacity .18s ease,transform .18s ease,box-shadow .18s ease;
  }
  .nav-btn:hover{color:#FF6B35!important;background:rgba(255,255,255,.04);}
  .nav-btn.active{
    color:var(--navc,#FF6B35)!important;
    background:linear-gradient(180deg,var(--navc,rgba(255,107,53,.14)) 0%,rgba(255,255,255,0) 100%);
    text-shadow:0 0 12px rgba(255,255,255,.12);
  }
  .nav-btn.active::before{
    opacity:1;transform:scaleX(1);
    box-shadow:0 0 12px rgba(255,255,255,.18);
  }
  .nav-btn.incoming{animation:navIncoming .5s ease both;}
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
//  COMPONENT
// ═══════════════════════════════════════════════════

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

function LeaderSlideshow({slides}){
  const [idx,setIdx]=useState(0);
  const [animDir,setAnimDir]=useState("in");

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
    if(i===activeIdx)return;
    setAnimDir("out");
    setTimeout(()=>{setIdx(i);setAnimDir("in");},280);
  };

  if(!slides.length)return null;
  const activeIdx=slides[idx]?idx:0;
  const s=slides[activeIdx]||slides[0];
  if(!s||!s.player)return null;

  const slideStyle={
    opacity:animDir==="in"?1:0,
    transform:animDir==="in"?"translateX(0)":"translateX(14px)",
    transition:"opacity .3s ease, transform .3s ease",
  };

  return(
    <div style={{marginBottom:0}}>
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
              width:i===activeIdx?18:6,height:6,borderRadius:3,cursor:"pointer",
              background:i===activeIdx?s.player.color:"rgba(255,255,255,.18)",
              transition:"all .3s ease",
              boxShadow:i===activeIdx?`0 0 8px ${s.player.color}77`:"none"}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeStage({tag,title,sub,accent,children,marginBottom=22}){
  return(
    <section style={{marginBottom}}>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",
          gap:10,flexWrap:"wrap",marginBottom:8}}>
          <div>
            <div className="bc9" style={{fontSize:".62rem",letterSpacing:".3em",
              color:`${accent}bb`,marginBottom:4}}>
              ▸ {tag}
            </div>
            {title&&<div className="bc7" style={{fontSize:".76rem",color:"var(--text2)",
              letterSpacing:".04em",lineHeight:1.5,maxWidth:780}}>{title}</div>}
          </div>
          {sub&&<div className="bc7" style={{fontSize:".6rem",letterSpacing:".16em",
            color:"var(--text3)",textTransform:"uppercase"}}>{sub}</div>}
        </div>
        <div style={{height:1,
          background:`linear-gradient(90deg,${accent}66,rgba(255,255,255,.05),transparent)`}}/>
      </div>
      {children}
    </section>
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
                opacity:s2Prediction&&!isVoted?0.5:1}}>
              <Av p={player} size={26}/>
              <div style={{minWidth:0}}>
                <div style={{fontFamily:"Barlow Condensed",fontWeight:900,fontSize:".72rem",
                  color:player.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {player.host?"👑 ":""}{dn(player.username)}{isVoted?" ✓":""}
                </div>
                <div style={{fontFamily:"Barlow Condensed",fontWeight:700,
                  fontSize:".58rem",color:"var(--text3)"}}>
                  {vcount>0?`${vcount} vote${vcount===1?"":"s"}`:"board still quiet"}
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

function BriefingFeed({stories}){
  const [visibleCount,setVisibleCount]=useState(0);
  const storySignature=stories.map((story)=>`${story.icon}|${story.color}|${story.text}`).join("||");

  useEffect(()=>{
    setVisibleCount(0);
    if(!stories.length)return undefined;
    const timers=[
      setTimeout(()=>setVisibleCount(1),140),
      ...stories.slice(1).map((_,index)=>setTimeout(()=>{
        setVisibleCount((count)=>Math.min(stories.length,count+1));
      },520+(index*240))),
    ];
    return()=>timers.forEach(clearTimeout);
  },[stories.length,storySignature]);

  if(!stories.length){
    return null;
  }

  return(
    <div style={{
      background:"rgba(0,0,0,.45)",
      border:"1px solid rgba(255,255,255,.08)",
      borderTop:"2px solid rgba(0,255,148,.3)",
      borderRadius:"0 6px 6px 0",
      borderLeft:"3px solid rgba(0,255,148,.35)",
      padding:"14px 16px",
      fontFamily:"'Share Tech Mono',monospace",
      overflow:"hidden",
    }}>
      {stories.map((story,index)=>{
        const isVisible=index<visibleCount;
        const isFresh=isVisible&&index===visibleCount-1;
        return(
          <div key={`${story.icon}-${index}-${story.text.slice(0,18)}`} style={{
            display:"grid",
            gridTemplateColumns:"18px minmax(0,1fr)",
            gap:10,
            alignItems:"flex-start",
            padding:"8px 0",
            borderBottom:index<stories.length-1?"1px solid rgba(255,255,255,.04)":"none",
            opacity:isVisible?1:0,
            transform:isVisible?"translateY(0)":"translateY(10px)",
            transition:"opacity .28s ease, transform .28s ease",
          }}>
            <span style={{fontSize:".8rem",marginTop:1,filter:isFresh?`drop-shadow(0 0 8px ${story.color})`:"none"}}>
              {story.icon}
            </span>
            <div style={{minWidth:0}}>
              <div style={{fontSize:".78rem",lineHeight:1.68,color:"rgba(200,186,255,.88)",
                letterSpacing:".02em",wordBreak:"break-word"}}>
                {story.text}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
                <div style={{height:2,flex:1,maxWidth:isVisible?"100%":"0%",
                  background:`linear-gradient(90deg,${story.color},transparent)`,
                  transition:"max-width .32s ease"}}/>
                <span style={{width:6,height:6,borderRadius:"50%",flexShrink:0,
                  background:story.color,boxShadow:isFresh?`0 0 10px ${story.color}`:"none",
                  opacity:isVisible?0.95:0.2,transition:"opacity .28s ease, box-shadow .28s ease"}}/>
              </div>
            </div>
          </div>
        );
      })}
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
  const [lobbySearch,setLobbySearch] = useState("");
  const [lobbyLimit, setLobbyLimit]  = useState(8);
  const [pollVote,   setPollVote]     = useState(null);
  const [pollClosed, setPollClosed]   = useState(false);
  const [prevView,   setPrevView]     = useState("home");
  const [queuedView, setQueuedView]   = useState(null);
  const [zonePulse,  setZonePulse]    = useState(0);
  const [showCeremony,setShowCeremony]= useState(false);
  const [ceremonyPending,setCeremonyPending]= useState(false);
  const [ceremonySnoozed,setCeremonySnoozed]= useState(false);
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
  const store=createStorageAdapter();
  const CEREMONY_SNOOZE_KEY="gn-s2-ceremony-snoozed";
  const zoneTimersRef=useRef({swap:null,clear:null});

  // ── load ──
  useEffect(()=>{
    let active=true;

    const boot=async()=>{
      const data=await loadGameData(store);
      if(!active)return;

      setPlayers(data.players);
      setSessions(data.sessions);
      setPollVote(data.pollVote);
      setS2Prediction(data.s2Prediction);
      setCeremonyPending(data.showCeremony);
      if(typeof window!=="undefined"){
        setCeremonySnoozed(window.sessionStorage?.getItem(CEREMONY_SNOOZE_KEY)==="1");
      }
      setLoaded(true);
    };

    boot();
    return()=>{active=false;};
  },[]);

  const persist=(nextPlayers,nextSessions)=>
    persistGameData(store,nextPlayers,nextSessions);

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
    const t1=setTimeout(()=>setBootPhase(1),420);
    return()=>clearTimeout(t1);
  },[]);

  useEffect(()=>{
    if(!loaded||bootPhase!==1)return;
    const t2=setTimeout(()=>setBootPhase(2),620);
    return()=>clearTimeout(t2);
  },[loaded,bootPhase]);

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

  useEffect(()=>{
    if(typeof window==="undefined")return;
    const onKeyDown=e=>{
      if(e.key==="Escape"&&showCeremony){
        setShowCeremony(false);
        setCeremonySnoozed(true);
        window.sessionStorage?.setItem(CEREMONY_SNOOZE_KEY,"1");
      }
    };
    window.addEventListener("keydown",onKeyDown);
    return()=>window.removeEventListener("keydown",onKeyDown);
  },[showCeremony]);

  useEffect(()=>{
    if(!loaded||!ceremonyPending||showCeremony||ceremonySnoozed)return;
    if(view!=="home")return;
    if(typeof window!=="undefined"&&window.scrollY>120)return;
    const id=setTimeout(()=>setShowCeremony(true),900);
    return()=>clearTimeout(id);
  },[loaded,ceremonyPending,showCeremony,ceremonySnoozed,view]);

  useEffect(()=>{
    setLobbyLimit(8);
    setExpandedSid(null);
  },[lobbyFilter,lobbyDate,lobbySearch]);

  const markCeremonySeen=async()=>{
    setShowCeremony(false);
    setCeremonyPending(false);
    setCeremonySnoozed(false);
    if(typeof window!=="undefined"){
      window.sessionStorage?.removeItem(CEREMONY_SNOOZE_KEY);
    }
    try{await store.set("gn-s2-ceremony-seen","1");}catch{}
  };
  const snoozeCeremony=()=>{
    setShowCeremony(false);
    setCeremonySnoozed(true);
    if(typeof window!=="undefined"){
      window.sessionStorage?.setItem(CEREMONY_SNOOZE_KEY,"1");
    }
  };
  const openCeremony=()=>{
    setCeremonySnoozed(false);
    if(typeof window!=="undefined"){
      window.sessionStorage?.removeItem(CEREMONY_SNOOZE_KEY);
    }
    setShowCeremony(true);
  };

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
  const ZONE_BRIEFS={
    home:"Live season pulse, storylines, and mission hooks",
    leaderboard:"Pressure table, rankings, and title chases",
    lobbies:"Full session archive and match history",
    hof:"Legacy titles and permanent records",
    rivals:"Head to head grudges and duel pressure",
    records:"Peak numbers, streaks, and landmark runs",
    charts:"Performance trends and data intel",
    season1:"Closed archive of the first campaign",
    season2:"Current campaign state and live race",
    faq:"Rules, schedule, and room brief",
    profile:"Player dossier, milestones, and form",
    admin:"Session control and data entry",
  };
  const SORT_LABELS={
    wins:"Wins",
    kills:"Kills",
    kd:"Kills per lobby",
    winrate:"Win rate",
    appearances:"Lobbies",
    carry:"Carry score",
    consistency:"Consistency",
  };
  const scrollToTop=(behavior="smooth")=>{
    if(typeof window!=="undefined"){
      window.scrollTo({top:0,behavior});
    }
  };
  const clearZoneTimers=()=>{
    if(zoneTimersRef.current.swap){
      clearTimeout(zoneTimersRef.current.swap);
      zoneTimersRef.current.swap=null;
    }
    if(zoneTimersRef.current.clear){
      clearTimeout(zoneTimersRef.current.clear);
      zoneTimersRef.current.clear=null;
    }
  };
  const go=v=>{
    const fromView=queuedView||view;
    setPrevView(fromView);
    setMobileOpen(false);
    const lv=LEVEL_MAP[v];
    if(lv&&v!==fromView){
      clearZoneTimers();
      setQueuedView(v);
      setZonePulse((count)=>count+1);
      setLvlCard({
        ...lv,
        phase:"in",
        brief:ZONE_BRIEFS[v]||"Zone link stable",
        fromLabel:(LEVEL_MAP[fromView]||LEVEL_MAP.home).label,
      });
      zoneTimersRef.current.swap=setTimeout(()=>{
        setView(v);
        scrollToTop("auto");
        setLvlCard(c=>c?{...c,phase:"out"}:null);
        zoneTimersRef.current.clear=setTimeout(()=>{
          setLvlCard(null);
          setQueuedView(null);
        },500);
      },560);
    } else {
      clearZoneTimers();
      setQueuedView(null);
      setView(v);
      scrollToTop("smooth");
    }
  };
  const goProfile=pid=>{
    if(!pid)return;
    setProfileId(pid);
    go("profile");
  };

  // ── stats engine ──
  const playerIndex=buildPlayerIndex(players);
  const getPlayer=pid=>playerIndex[pid]||null;
  const getLatestSessionDate=(src=sessions)=>selectGetLatestSessionDate(src);
  const getPeriodSessions=(period=lbPeriod)=>selectGetPeriodSessions(sessions,period);
  const getStats=(pid,src=sessions)=>selectGetStats(pid,src);
  const allStats=(src=sessions)=>selectAllStats(players,src);
  const getRank=pid=>selectGetRank(pid,players,sessions);
  const getStreak=pid=>selectGetStreak(pid,sessions);
  const getBadges=pid=>selectGetBadges(pid,sessions);
  const getPlayerLevel=pid=>selectGetPlayerLevel(pid,sessions);
  const getDailyMVP=()=>selectGetDailyMVP(sessions,players);
  const getRivals=()=>selectGetRivals(sessions);
  const getSeasonSessions=sid=>selectGetSeasonSessions(sessions,sid);
  const getWeeklyMissions=()=>selectGetWeeklyMissions(sessions);
  const getRecords=()=>selectGetRecords(sessions,players);
  const getChartData=pid=>selectGetChartData(pid,sessions);
  const getLiveStreaks=()=>selectGetLiveStreaks(sessions,players);
  const getDayRecap=date=>selectGetDayRecap(date,sessions,players);
  const getFormGuide=(pid,n=5)=>selectGetFormGuide(pid,sessions,n);
  const getCarryScore=(pid,src=sessions)=>selectGetCarryScore(pid,src);
  const getDrought=pid=>selectGetDrought(pid,sessions);
  const getConsistency=(pid,src=sessions)=>selectGetConsistency(pid,src);
  const getMilestones=pid=>selectGetMilestones(pid,sessions);
  const getBenchmark=pid=>selectGetBenchmark(pid,players,sessions);
  const getLastSeen=pid=>selectGetLastSeen(pid,sessions);
  const getDaysActive=pid=>selectGetDaysActive(pid,sessions);

  useEffect(()=>()=>clearZoneTimers(),[]);

  const joinHumanList=(items)=>{
    const list=items.filter(Boolean);
    if(!list.length)return"";
    if(list.length===1)return list[0];
    if(list.length===2)return`${list[0]} and ${list[1]}`;
    return`${list.slice(0,-1).join(", ")}, and ${list[list.length-1]}`;
  };

  const buildLatestFallout=(date)=>{
    if(!date)return null;
    const latestSessions=[...sessions]
      .filter((session)=>session.date===date)
      .sort((left,right)=>(parseSessionIdNumber(left.id)||0)-(parseSessionIdNumber(right.id)||0));
    if(!latestSessions.length)return null;

    const zeroStats={wins:0,kills:0,appearances:0};
    const latestTotals=allStats(latestSessions).filter((player)=>player.appearances>0);
    const priorSessions=sessions.filter((session)=>session.date<date);
    const beforeTotals=allStats(priorSessions).filter((player)=>player.appearances>0);
    const afterTotals=allStats().filter((player)=>player.appearances>0);
    const playerByUsername=(username)=>players.find((player)=>player.username===username)||null;
    const findTotals=(rows,pid)=>rows.find((row)=>row.id===pid)||zeroStats;
    const byWins=(left,right)=>right.wins-left.wins||right.kills-left.kills;
    const dayWinnerMap={};
    latestSessions.forEach((session)=>{
      if(session.winner){
        dayWinnerMap[session.winner]=(dayWinnerMap[session.winner]||0)+1;
      }
    });
    const dayWinners=Object.entries(dayWinnerMap)
      .map(([pid,wins])=>({
        pid,
        wins,
        player:getPlayer(pid),
        kills:findTotals(latestTotals,pid).kills,
      }))
      .sort((left,right)=>right.wins-left.wins||right.kills-left.kills);
    const topWinCount=dayWinners[0]?.wins||0;
    const topWinners=topWinCount>0
      ?dayWinners.filter((entry)=>entry.wins===topWinCount)
      :[];
    const topKiller=[...latestTotals].sort((left,right)=>right.kills-left.kills||right.wins-left.wins)[0]||null;
    const topKillerPlayer=topKiller?getPlayer(topKiller.id):null;
    const zeroKillWinSession=latestSessions.find((session)=>
      session.winner&&(session.kills?.[session.winner]||0)===0,
    )||null;
    const zeroKillWinner=zeroKillWinSession?getPlayer(zeroKillWinSession.winner):null;

    const mekulaPlayer=playerByUsername("MekulaGG");
    let reboundWin=null;
    if(mekulaPlayer){
      const reboundIndex=latestSessions.findIndex((session)=>
        session.winner===mekulaPlayer.id&&(session.kills?.[mekulaPlayer.id]||0)>=4,
      );
      if(reboundIndex>=0){
        const reboundSession=latestSessions[reboundIndex];
        const priorDaySessions=latestSessions
          .slice(0,reboundIndex)
          .filter((session)=>session.attendees?.includes(mekulaPlayer.id));
        reboundWin={
          player:mekulaPlayer,
          session:reboundSession,
          kills:reboundSession.kills?.[mekulaPlayer.id]||0,
          priorDayLobbies:priorDaySessions.length,
          priorDayWins:priorDaySessions.filter((session)=>session.winner===mekulaPlayer.id).length,
        };
      }
    }

    const legendCrossers=[...afterTotals]
      .filter((player)=>{
        const before=findTotals(beforeTotals,player.id);
        return before.wins<10&&player.wins>=10;
      })
      .sort(byWins)
      .map((player)=>({player:getPlayer(player.id),wins:player.wins}));

    const killCrossers=[...afterTotals]
      .filter((player)=>{
        const before=findTotals(beforeTotals,player.id);
        return before.kills<100&&player.kills>=100;
      })
      .sort((left,right)=>right.kills-left.kills||right.wins-left.wins)
      .map((player)=>({player:getPlayer(player.id),kills:player.kills}));

    const beforeRanks=[...beforeTotals].sort(byWins);
    const afterRanks=[...afterTotals].sort(byWins);
    const getRankFor=(rows,pid)=>rows.findIndex((row)=>row.id===pid)+1;
    const topFiveShift=[...afterRanks]
      .map((player)=>({
        player:getPlayer(player.id),
        wins:player.wins,
        beforeRank:getRankFor(beforeRanks,player.id),
        afterRank:getRankFor(afterRanks,player.id),
      }))
      .find((entry)=>entry.afterRank>0&&entry.afterRank<=5&&entry.beforeRank>entry.afterRank)||null;

    const buildRivalPressure=(leftName,rightName)=>{
      const leftPlayer=playerByUsername(leftName);
      const rightPlayer=playerByUsername(rightName);
      if(!leftPlayer||!rightPlayer)return null;
      const pair=(rows)=>rows.find((entry)=>
        [entry.p1,entry.p2].includes(leftPlayer.id)&&[entry.p1,entry.p2].includes(rightPlayer.id),
      );
      const beforePair=pair(selectGetRivals(priorSessions));
      const afterPair=pair(selectGetRivals(sessions));
      if(!afterPair)return null;
      const leftWins=afterPair.p1===leftPlayer.id?afterPair.p1wins:afterPair.p2wins;
      const rightWins=afterPair.p1===rightPlayer.id?afterPair.p1wins:afterPair.p2wins;
      const leftBefore=beforePair?(beforePair.p1===leftPlayer.id?beforePair.p1wins:beforePair.p2wins):0;
      const rightBefore=beforePair?(beforePair.p1===rightPlayer.id?beforePair.p1wins:beforePair.p2wins):0;
      const leader=leftWins>=rightWins?leftPlayer:rightPlayer;
      const trailer=leader.id===leftPlayer.id?rightPlayer:leftPlayer;
      return{
        leftPlayer,
        rightPlayer,
        leader,
        trailer,
        total:afterPair.total,
        totalDelta:afterPair.total-(beforePair?.total||0),
        leaderWins:Math.max(leftWins,rightWins),
        trailerWins:Math.min(leftWins,rightWins),
        leaderDelta:leader.id===leftPlayer.id?leftWins-leftBefore:rightWins-rightBefore,
      };
    };

    return{
      latestSessions,
      topWinCount,
      topWinners,
      topKiller:topKiller&&topKillerPlayer
        ?{...topKiller,player:topKillerPlayer}
        :null,
      zeroKillWin:zeroKillWinSession&&zeroKillWinner
        ?{session:zeroKillWinSession,player:zeroKillWinner}
        :null,
      reboundWin,
      legendCrossers,
      killCrossers,
      topFiveShift,
      mekulaTeriqPressure:buildRivalPressure("MekulaGG","Teriqstp"),
      teriqHackqamPressure:buildRivalPressure("Teriqstp","Hackqam"),
    };
  };

  // ── Storylines engine: 8 lines, human, passionate, varied, no em dashes ──
  const getStorylines=()=>{
    if(!sessions.length||!players.length)return[];
    const latestDate=getLatestSessionDate();
    if(!latestDate)return[];
    const latestFallout=buildLatestFallout(latestDate);
    const allSt=allStats();
    const s2Sess=sessions.filter(s=>s.date>="2026-04-01");
    const s2St=allStats(s2Sess).filter(p=>p.appearances>0);
    const latestSess=sessions.filter(s=>s.date===latestDate);
    const seed=parseInt(latestDate.replace(/-/g,"").slice(-3),10)||0;
    const candidates=[];
    const addCandidate=(icon,color,w,options)=>{
      const lines=Array.isArray(options)?options:[options];
      if(!lines.length)return;
      const index=(seed+candidates.length*3+w)%lines.length;
      candidates.push({icon,text:lines[index],color,w});
    };
    const getDroughtBeforeDate=(playerId,date)=>{
      const priorSessions=[...sessions]
        .filter((session)=>session.date<date&&session.attendees?.includes(playerId))
        .sort(compareSessionsDesc);
      if(!priorSessions.length)return 0;
      const lastWinIndex=priorSessions.findIndex((session)=>session.winner===playerId);
      return lastWinIndex===-1?priorSessions.length:lastWinIndex;
    };

    if(latestFallout?.topWinners.length>=2&&latestFallout.topKiller?.player){
      const splitLeaders=joinHumanList(
        latestFallout.topWinners.map((entry)=>dn(entry.player?.username||"")),
      );
      const damageLead=dn(latestFallout.topKiller.player.username);
      addCandidate("⚡","#FFD700",10,[
        `${splitLeaders} split the last session day at ${latestFallout.topWinCount} wins each, but ${damageLead} still carried the heavier ${latestFallout.topKiller.kills}-kill line.`,
        `The day ended level on wins between ${splitLeaders}. ${damageLead} made sure the damage board still had a clear owner with ${latestFallout.topKiller.kills} kills.`,
      ]);
    }

    if(latestFallout?.reboundWin){
      const reboundSessionNo=parseSessionIdNumber(latestFallout.reboundWin.session.id)||latestFallout.reboundWin.session.id;
      addCandidate("🔁","#00E5FF",9,[
        `${dn(latestFallout.reboundWin.player.username)} drifted through ${latestFallout.reboundWin.priorDayLobbies} lobbies without a win, then snapped Lobby ${reboundSessionNo} shut with ${latestFallout.reboundWin.kills} kills.`,
        `${dn(latestFallout.reboundWin.player.username)} stayed quiet for most of the last session day, then hit back in Lobby ${reboundSessionNo} with a ${latestFallout.reboundWin.kills}-kill win.`,
      ]);
    }

    if(latestFallout?.zeroKillWin){
      const zeroKillSessionNo=parseSessionIdNumber(latestFallout.zeroKillWin.session.id)||latestFallout.zeroKillWin.session.id;
      addCandidate("🫥","#C77DFF",8,[
        `${dn(latestFallout.zeroKillWin.player.username)} stole Lobby ${zeroKillSessionNo} without landing a kill. That is pure survival nerve.`,
        `Lobby ${zeroKillSessionNo} went to ${dn(latestFallout.zeroKillWin.player.username)} with zero kills on the sheet. Some wins come from damage. That one came from nerve.`,
      ]);
    }

    if(
      latestFallout&&(
        latestFallout.legendCrossers.length||
        latestFallout.killCrossers.length||
        latestFallout.topFiveShift
      )
    ){
      const legendNames=joinHumanList(
        latestFallout.legendCrossers.map((entry)=>dn(entry.player?.username||"")),
      );
      const legendLine=legendNames
        ?latestFallout.legendCrossers.length>1
          ?`${legendNames} both hit Legend`
          :`${legendNames} hit Legend`
        :"";
      const killLine=latestFallout.killCrossers[0]
        ?`${dn(latestFallout.killCrossers[0].player.username)} broke through ${latestFallout.killCrossers[0].kills} kills`
        :"";
      const rankLine=latestFallout.topFiveShift
        ?`${dn(latestFallout.topFiveShift.player?.username||"")} climbed into ${latestFallout.topFiveShift.afterRank}th all-time wins`
        :"";
      addCandidate("🏁","#FFAB40",8,[
        [
          legendLine,
          killLine,
          rankLine,
        ].filter(Boolean).join(", ")+". April 8 moved real furniture.",
        [
          rankLine,
          killLine,
          legendNames
            ?latestFallout.legendCrossers.length>1
              ?`${legendNames} both reached Legend`
              :`${legendNames} reached Legend`
            :"",
        ].filter(Boolean).join(", ")+". That day shifted more than the top row.",
      ]);
    }

    if(latestFallout?.mekulaTeriqPressure&&latestFallout.mekulaTeriqPressure.totalDelta>0){
      const rivalry=latestFallout.mekulaTeriqPressure;
      addCandidate("⚔️","#FF4D8F",7,[
        `${dn(rivalry.leader.username)} pushed the duel board against ${dn(rivalry.trailer.username)} to ${rivalry.leaderWins}-${rivalry.trailerWins} across ${rivalry.total} top-two meetings.`,
        `${dn(rivalry.leader.username)} added ${rivalry.leaderDelta} more top-two wins over ${dn(rivalry.trailer.username)}. That rivalry is now sitting at ${rivalry.leaderWins}-${rivalry.trailerWins}.`,
      ]);
    }

    const seasonWins=[...s2St].sort((a,b)=>b.wins-a.wins||b.kills-a.kills);
    const seasonLeader=seasonWins[0];
    const seasonChaser=seasonWins[1];
    if(seasonLeader&&seasonChaser){
      const leaderPlayer=getPlayer(seasonLeader.id);
      const chasePlayer=getPlayer(seasonChaser.id);
      const gap=seasonLeader.wins-seasonChaser.wins;
      if(leaderPlayer&&chasePlayer){
        if(gap===0){
          addCandidate("👑","#FFD700",6,[
            `${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are tied on Season 2 wins. One clean finish changes the whole room.`,
            `${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are level at the top of Season 2. The next crown breaks the calm.`,
          ]);
        }else if(gap===1){
          addCandidate("👑","#FFD700",6,[
            `${dn(leaderPlayer.username)} has one win of daylight over ${dn(chasePlayer.username)} in Season 2. That is barely breathing room.`,
            `${dn(leaderPlayer.username)} leads Season 2 by a single lobby. ${dn(chasePlayer.username)} is close enough to turn the table tonight.`,
          ]);
        }else{
          addCandidate("👑","#FFD700",5,[
            `${dn(leaderPlayer.username)} is ${gap} wins clear in Season 2 with ${seasonLeader.wins} on the board. ${dn(chasePlayer.username)} still has them in sight.`,
            `${dn(leaderPlayer.username)} has built a ${gap}-win edge in Season 2. ${dn(chasePlayer.username)} needs a heavy session to drag that back.`,
          ]);
        }
      }
    }

    const allTimeKills=[...allSt].sort((a,b)=>b.kills-a.kills);
    const killLeader=allTimeKills[0];
    const killChaser=allTimeKills[1];
    if(killLeader){
      const killLeaderPlayer=getPlayer(killLeader.id);
      const killChaserPlayer=killChaser?getPlayer(killChaser.id):null;
      const killGap=killChaser?killLeader.kills-killChaser.kills:killLeader.kills;
      if(killLeaderPlayer&&killLeader.kills>0){
        if(killChaserPlayer&&killGap<=12){
          addCandidate("💀","#FF4D8F",5,[
            `${dn(killLeaderPlayer.username)} still holds the all-time kill lead, but ${dn(killChaserPlayer.username)} is only ${killGap} behind. One wild night can flip that.`,
            `${dn(killLeaderPlayer.username)} is still first in all-time kills. ${dn(killChaserPlayer.username)} is ${killGap} off the pace and close enough to make it tense.`,
          ]);
        }else{
          addCandidate("💀","#FF4D8F",4,[
            `${dn(killLeaderPlayer.username)} is sitting on ${killLeader.kills} all-time kills. The room still runs through that damage.`,
            `${dn(killLeaderPlayer.username)} keeps stacking the all-time kill lead. ${killLeader.kills} total is not luck, it is pressure every session.`,
          ]);
        }
      }
    }

    const latestWinMap={};
    latestSess.forEach((session)=>{
      if(session.winner){
        latestWinMap[session.winner]=(latestWinMap[session.winner]||0)+1;
      }
    });
    const latestWinners=Object.entries(latestWinMap).sort((a,b)=>b[1]-a[1]);
    const latestRun=latestWinners[0];
    if(latestRun){
      const runPlayer=getPlayer(latestRun[0]);
      const runDrought=getDroughtBeforeDate(latestRun[0],latestDate);
      if(runPlayer){
        if(runDrought>=6){
          addCandidate("🔁","#00E5FF",6,[
            `${dn(runPlayer.username)} broke a ${runDrought}-lobby drought and came straight back onto the winners list last session. That is how a comeback starts.`,
            `${dn(runPlayer.username)} had gone ${runDrought} lobbies without a win. Then last session landed and the whole story changed.`,
          ]);
        }else if(latestRun[1]>=3){
          addCandidate("🔥","#FF6B35",6,[
            `${dn(runPlayer.username)} owned the last session with ${latestRun[1]} lobby wins. That was not noise. That was control.`,
            `${dn(runPlayer.username)} walked out of the last session with ${latestRun[1]} wins. Everyone in the room felt that.`,
          ]);
        }else if(latestRun[1]>=2){
          addCandidate("🔥","#FF6B35",4,[
            `${dn(runPlayer.username)} took ${latestRun[1]} wins in the last session and left with real momentum.`,
            `${dn(runPlayer.username)} came away from the last session with ${latestRun[1]} wins. Quiet sessions do not look like that.`,
          ]);
        }
      }
    }

    let topSpike={pid:"",kills:0,sid:""};
    latestSess.forEach((session)=>{
      Object.entries(session.kills||{}).forEach(([pid,kills])=>{
        if(kills>topSpike.kills){
          topSpike={pid,kills,sid:session.id};
        }
      });
    });
    if(topSpike.pid&&topSpike.kills>=4){
      const spikePlayer=getPlayer(topSpike.pid);
      const topSpikeLobby=parseSessionIdNumber(topSpike.sid)||topSpike.sid;
      if(spikePlayer){
        addCandidate("☄️","#FF6B35",5,[
          `${dn(spikePlayer.username)} dropped ${topSpike.kills} kills in Lobby ${topSpikeLobby} last session. That lobby turned into target practice.`,
          `${dn(spikePlayer.username)} hit ${topSpike.kills} kills in Lobby ${topSpikeLobby}. That is the kind of spike people remember on the way out.`,
        ]);
      }
    }

    let worstDrought={pid:"",gap:0};
    players.forEach((player)=>{
      const playerSessions=[...sessions]
        .filter((session)=>session.attendees?.includes(player.id))
        .sort(compareSessionsDesc);
      if(!playerSessions.length||playerSessions[0].winner===player.id)return;
      const lastWinIndex=playerSessions.findIndex((session)=>session.winner===player.id);
      const gap=lastWinIndex===-1?playerSessions.length:lastWinIndex;
      if(gap>=5&&gap>worstDrought.gap){
        worstDrought={pid:player.id,gap};
      }
    });
    if(worstDrought.pid){
      const droughtPlayer=getPlayer(worstDrought.pid);
      const droughtStats=droughtPlayer?getStats(droughtPlayer.id):null;
      if(droughtPlayer&&droughtStats){
        if(droughtStats.wins===0){
          addCandidate("🤝","#FFAB40",3,[
            `${dn(droughtPlayer.username)} is still chasing that first win, but ${droughtStats.appearances} lobbies deep they are already one of the room's regulars.`,
            `${dn(droughtPlayer.username)} still has no win on the sheet, but ${droughtStats.appearances} lobbies in means they have earned everyone's attention anyway.`,
          ]);
        }else{
          addCandidate("🌵","#FFAB40",4,[
            `${dn(droughtPlayer.username)} has gone ${worstDrought.gap} lobbies without a win. Someone with ${droughtStats.wins} career wins will not stay quiet forever.`,
            `${dn(droughtPlayer.username)} is ${worstDrought.gap} games into a dry run. The next bounce-back session is going to feel loud.`,
          ]);
        }
      }
    }

    const liveStreaks=getLiveStreaks();
    if(liveStreaks.length>0){
      const hottest=liveStreaks[0];
      if(hottest.streak>=2){
        addCandidate("🔥","#FF6B35",5,[
          `${dn(hottest.username)} closed the last session on ${hottest.streak} straight wins. The room is waiting to see if that heat carries.`,
          `${dn(hottest.username)} ended the last session with ${hottest.streak} wins in a row. Nobody queues into that casually.`,
        ]);
      }
    }

    const attendanceLeaders=[...allSt].sort((a,b)=>b.appearances-a.appearances||b.wins-a.wins);
    const attendanceLeader=attendanceLeaders[0];
    const attendanceChaser=attendanceLeaders[1];
    if(attendanceLeader){
      const attendancePlayer=getPlayer(attendanceLeader.id);
      const attendanceGap=attendanceChaser?attendanceLeader.appearances-attendanceChaser.appearances:attendanceLeader.appearances;
      if(attendancePlayer){
        addCandidate("📅","#00E5FF",3,[
          `${dn(attendancePlayer.username)} has logged ${attendanceLeader.appearances} lobbies. That is not a hot streak, that is pure attendance muscle.`,
          attendanceGap>2
            ?`${dn(attendancePlayer.username)} keeps setting the attendance pace with ${attendanceLeader.appearances} lobbies played. That gap is real.`
            :`${dn(attendancePlayer.username)} is only ${attendanceGap} lobby ahead in the attendance race. Even the loyalty table is under pressure.`,
        ]);
      }
    }

    const consistencyLeaders=[...allSt]
      .filter((player)=>player.appearances>=8)
      .map((player)=>({...player,consistency:getConsistency(player.id)}))
      .sort((a,b)=>b.consistency-a.consistency||b.winRate-a.winRate);
    const consistencyLeader=consistencyLeaders[0];
    if(consistencyLeader&&consistencyLeader.consistency>=55){
      const consistencyPlayer=getPlayer(consistencyLeader.id);
      if(consistencyPlayer){
        addCandidate("🧱","#00FF94",3,[
          `${dn(consistencyPlayer.username)} is landing solid finishes in ${consistencyLeader.consistency}% of their lobbies. They do not give the room many easy games.`,
          `${dn(consistencyPlayer.username)} keeps turning up with one of the steadiest profiles in the room. ${consistencyLeader.consistency}% consistency is hard to fake.`,
        ]);
      }
    }

    const upsetCandidate=latestWinners
      .map(([pid,wins])=>({
        pid,
        wins,
        rank:Math.max(seasonWins.findIndex((player)=>player.id===pid),allSt.findIndex((player)=>player.id===pid)),
      }))
      .filter((entry)=>entry.rank>=4)
      .sort((a,b)=>b.wins-a.wins||b.rank-a.rank)[0];
    if(upsetCandidate){
      const upsetPlayer=getPlayer(upsetCandidate.pid);
      if(upsetPlayer){
        addCandidate("⚠️","#C77DFF",4,[
          `${dn(upsetPlayer.username)} was not supposed to own the last session, then took ${upsetCandidate.wins} wins and made the room adjust.`,
          `${dn(upsetPlayer.username)} came out of the pack last session and turned it noisy with ${upsetCandidate.wins} wins. That is how upsets start sticking.`,
        ]);
      }
    }

    const killMilestones=[50,100,150,200,300,400,500];
    let bestChase={pid:"",gap:999,milestone:0};
    players.forEach((player)=>{
      const stats=getStats(player.id);
      for(const milestone of killMilestones){
        const gap=milestone-stats.kills;
        if(gap>0&&gap<=8&&gap<bestChase.gap){
          bestChase={pid:player.id,gap,milestone};
        }
      }
    });
    if(bestChase.pid){
      const chasePlayer=getPlayer(bestChase.pid);
      if(chasePlayer){
        addCandidate("💥","#00E5FF",4,[
          `${dn(chasePlayer.username)} is ${bestChase.gap} kill${bestChase.gap===1?"":"s"} away from ${bestChase.milestone} total. That can disappear in one busy session.`,
          `${dn(chasePlayer.username)} is close to a ${bestChase.milestone}-kill landmark. ${bestChase.gap} more and it is theirs.`,
        ]);
      }
    }

    for(const [milestone,label,icon] of [[100,"100 wins","👑"],[50,"50 wins","🏆"],[25,"25 wins","⭐"],[10,"Legend","⚡"]]){
      let closest={pid:"",gap:999};
      players.forEach((player)=>{
        const stats=getStats(player.id);
        const gap=milestone-stats.wins;
        if(gap>0&&gap<=3&&gap<closest.gap){
          closest={pid:player.id,gap};
        }
      });
      if(closest.pid){
        const winChaser=getPlayer(closest.pid);
        if(winChaser){
          addCandidate(icon,"#C77DFF",4,[
            `${dn(winChaser.username)} is ${closest.gap} win${closest.gap===1?"":"s"} off ${label}. That badge is one session away from becoming real.`,
            `${dn(winChaser.username)} only needs ${closest.gap} more win${closest.gap===1?"":"s"} for ${label}. That is live pressure, not distant theory.`,
          ]);
          break;
        }
      }
    }

    const rivalData=getRivals().filter((rival)=>rival.total>=6);
    if(rivalData.length>0){
      const rivalry=rivalData[seed%rivalData.length];
      const leftPlayer=getPlayer(rivalry.p1);
      const rightPlayer=getPlayer(rivalry.p2);
      if(leftPlayer&&rightPlayer){
        const leftLead=rivalry.p1wins-rivalry.p2wins;
        if(leftLead===0){
          addCandidate("⚔️","#FF4D8F",3,[
            `${dn(leftPlayer.username)} and ${dn(rightPlayer.username)} are dead level in their 1st versus 2nd duels. Nobody owns that matchup yet.`,
            `${dn(leftPlayer.username)} against ${dn(rightPlayer.username)} is still unresolved. ${rivalry.total} big duels in and neither side has control.`,
          ]);
        }else{
          const leader=leftLead>0?leftPlayer:rightPlayer;
          const trailer=leftLead>0?rightPlayer:leftPlayer;
          const leaderWins=Math.max(rivalry.p1wins,rivalry.p2wins);
          const trailerWins=Math.min(rivalry.p1wins,rivalry.p2wins);
          addCandidate("⚔️","#FF4D8F",3,[
            `${dn(leader.username)} has the edge over ${dn(trailer.username)} when those two finish on top together. Right now it is ${leaderWins}-${trailerWins}.`,
            `${dn(leader.username)} keeps getting the better of ${dn(trailer.username)} in their biggest duels. The board says ${leaderWins}-${trailerWins}.`,
          ]);
        }
      }
    }

    const rising=[...s2St]
      .filter((player)=>player.appearances>=3&&player.wins>=2)
      .sort((a,b)=>b.wins-a.wins||b.winRate-a.winRate)
      .find((player)=>(allSt.find((entry)=>entry.id===player.id)?.wins||0)<=8);
    if(rising){
      const risingPlayer=getPlayer(rising.id);
      if(risingPlayer){
        addCandidate("🎯","#00E5FF",3,[
          `${dn(risingPlayer.username)} has become one of the live Season 2 stories with ${rising.wins} wins already. The room is paying attention now.`,
          `${dn(risingPlayer.username)} is climbing fast in Season 2. ${rising.wins} wins on the sheet and the confidence is starting to show.`,
        ]);
      }
    }

    candidates.sort((a,b)=>b.w-a.w||((seed+a.text.length)%9)-((seed+b.text.length)%9));
    return candidates.slice(0,8).map(({icon,text,color})=>({icon,text,color}));
  };

  const getShareData=(sid)=>{
    const s=sessions.find(x=>x.id===sid);
    if(!s)return null;
    const winner=getPlayer(s.winner);
    const topKiller=s.attendees?.reduce((best,pid)=>
      (s.kills?.[pid]||0)>(s.kills?.[best]||0)?pid:best, s.attendees?.[0]);
    const tkPlayer=getPlayer(topKiller);
    const tkKills=s.kills?.[topKiller]||0;
    const totalKills=Object.values(s.kills||{}).reduce((a,b)=>a+b,0);
    const players_count=s.attendees?.length||0;
    const dd=new Date(s.date+"T12:00:00Z");
    const dateLabel=dd.toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    const winnerKills=s.kills?.[s.winner]||0;
    const sessionNum=parseSessionIdNumber(sid);
    return{s,winner,tkPlayer,tkKills,totalKills,players_count,dateLabel,winnerKills,sessionNum:sessionNum||sid};
  };

  // ── Season 1 wrap data ──
  const getS1Wrap=()=>selectGetSeasonOneWrap(sessions,players);

  // ── head-to-head ──
  const getH2H=(pA,pB)=>selectGetHeadToHead(pA,pB,sessions);

  // ── leaderboard ──
  const getSortedLB=()=>selectGetSortedLeaderboard({
    players,
    sessions,
    seasonId:lbSeason,
    period:lbPeriod,
    sortBy,
  });

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
    const winner=getPlayer(sess.winner);
    const tkPid=sess.attendees?.reduce((b,pid)=>(sess.kills?.[pid]||0)>(sess.kills?.[b]||0)?pid:b,sess.attendees?.[0]);
    const tkP=getPlayer(tkPid);
    const tkK=sess.kills?.[tkPid]||0;
    const placements=(sess.placements||sess.attendees).slice(0,3).map((pid,i)=>{
      const p=getPlayer(pid);
      const k=sess.kills?.[pid]||0;
      return `${["🥇","🥈","🥉"][i]} **${p?.username||pid}**${k>0?" ("+k+"K)":""}`;
    }).join("\n");
    const body={embeds:[{
      title:"🎮 Games Night · Lobby Result",
      color:0xFF6B35,
      fields:[
        {name:"🏆 Winner",value:winner?.username||"?",inline:true},
        {name:"💀 Top Fragger",value:tkP&&tkK>0?`${tkP.username} (${tkK}K)`:"No leader yet",inline:true},
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
      const newSession={id:createNextSessionId(sessions),...sf,placements};
      const ns=[newSession,...sessions];
      setSessions(ns);persist(players,ns);postToDiscord(newSession);
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
  const formatLobbyDate=(date,opts={weekday:"short",day:"numeric",month:"short",year:"numeric"})=>
    new Date(date+"T12:00:00Z").toLocaleDateString("en-GB",opts);
  const getLobbyDateMarker=(date)=>{
    if(date==="2026-04-04")return{icon:"🥚",label:"Easter"};
    if(date==="2026-04-03")return{icon:"💪",label:"Good Friday"};
    if(date==="2026-04-01")return{icon:"🃏",label:"April Fools"};
    return null;
  };
  const getLobbyTotalKills=(session)=>
    Object.values(session?.kills||{}).reduce((sum,value)=>sum+value,0);
  const getLobbyTopDamage=(session)=>{
    const attendeeIds=session?.attendees||[];
    if(!attendeeIds.length)return{player:null,pid:"",kills:0};
    const pid=attendeeIds.reduce((best,current)=>
      (session.kills?.[current]||0)>(session.kills?.[best]||0)?current:best,attendeeIds[0]);
    return{player:getPlayer(pid),pid,kills:session.kills?.[pid]||0};
  };
  const hasCustomLobbyNote=(session)=>{
    const defaultNote=`Lobby ${session.id?.replace("s","")}`;
    return !!(session?.notes&&session.notes.trim()&&session.notes.trim()!==defaultNote);
  };
  const getLobbyBeatTags=(session)=>{
    const attendeeCount=session.attendees?.length||0;
    const winner=getPlayer(session.winner);
    const second=session.placements?.[1]?getPlayer(session.placements[1]):null;
    const totalKills=getLobbyTotalKills(session);
    const {player:tkP,kills:tkK}=getLobbyTopDamage(session);
    const winnerKills=winner?(session.kills?.[winner.id]||0):0;
    const secondKills=second?(session.kills?.[second.id]||0):0;
    const tags=[];
    const pushTag=(label,color,background,border)=>tags.push({label,color,background,border});

    if(winner&&tkP&&winner.id===tkP.id&&tkK>=5){
      pushTag("Clean takeover","#FFD700","rgba(255,215,0,.12)","rgba(255,215,0,.32)");
    }else if(winner&&tkP&&winner.id!==tkP.id&&tkK>=4){
      pushTag("Split crown","#FF4D8F","rgba(255,77,143,.12)","rgba(255,77,143,.32)");
    }else if(totalKills>=Math.max(10,attendeeCount*2)){
      pushTag("Firefight","#FF6B35","rgba(255,107,53,.12)","rgba(255,107,53,.3)");
    }else if(totalKills<=Math.max(2,attendeeCount)){
      pushTag("Slow burn","#C77DFF","rgba(199,125,255,.12)","rgba(199,125,255,.28)");
    }

    if(attendeeCount>=6){
      pushTag("Packed room","#00E5FF","rgba(0,229,255,.12)","rgba(0,229,255,.28)");
    }else if(attendeeCount>0&&attendeeCount<=3){
      pushTag("Small squad","#7B8CDE","rgba(123,140,222,.14)","rgba(123,140,222,.28)");
    }

    if(winner&&second&&Math.abs(winnerKills-secondKills)<=1&&winner.id!==second.id){
      pushTag("No breathing room","#00FF94","rgba(0,255,148,.12)","rgba(0,255,148,.26)");
    }

    if(!tags.length){
      pushTag("Filed result","var(--text2)","rgba(255,255,255,.06)","rgba(255,255,255,.12)");
    }
    return tags.slice(0,2);
  };
  const getLobbyReport=(session)=>{
    const attendeeIds=session.attendees||[];
    const placements=(session.placements&&session.placements.length?session.placements:attendeeIds)
      .map((pid)=>getPlayer(pid))
      .filter(Boolean);
    const winner=getPlayer(session.winner);
    const second=placements[1];
    const third=placements[2];
    const attendeeCount=attendeeIds.length;
    const totalKills=getLobbyTotalKills(session);
    const {player:tkP,kills:tkK}=getLobbyTopDamage(session);
    const quietRoom=totalKills<=Math.max(2,attendeeCount);
    const packedRoom=attendeeCount>=6;
    const firefight=totalKills>=Math.max(10,attendeeCount*2);

    if(winner&&tkP&&winner.id===tkP.id&&tkK>=5){
      return `${dn(winner.username)} turned ${session.id} into target practice, ripped ${tkK} kills, and shut every comeback door before it could open.`;
    }
    if(winner&&tkP&&winner.id!==tkP.id&&tkK>=4){
      return `${dn(winner.username)} walked out with the crown, but ${dn(tkP.username)} kept the room bleeding with ${tkK} kills. The result landed hard either way.`;
    }
    if(winner&&second&&third&&firefight){
      return `${dn(winner.username)} survived a loud ${session.id}, keeping ${dn(second.username)} and ${dn(third.username)} behind them while the room tore through ${totalKills} kills.`;
    }
    if(winner&&second&&packedRoom){
      return `${dn(winner.username)} found daylight in a packed ${attendeeCount}-player room, held off ${dn(second.username)}, and kept the file pointed their way.`;
    }
    if(winner&&second&&quietRoom){
      return `${dn(winner.username)} won a tight, low-noise ${session.id} over ${dn(second.username)}. Nobody got loose, so every finish mattered.`;
    }
    if(winner&&second&&third){
      return `${dn(winner.username)} kept ${dn(second.username)} and ${dn(third.username)} reaching in ${session.id} and stamped another result into the archive.`;
    }
    if(winner){
      return `${dn(winner.username)} closed ${session.id} and left another room on file before the night could swing back.`;
    }
    if(tkP&&tkK>0){
      return `${dn(tkP.username)} gave ${session.id} its sharpest moment with ${tkK} kills and forced the archive to remember the room their way.`;
    }
    if(attendeeCount){
      return `${attendeeCount} players filed into ${session.id}, the room broke on ${totalKills} kills, and the report still carries the smoke.`;
    }
    return "This room is on file, but the battle report is still waiting on detail.";
  };
  const getLobbySearchHaystack=(session)=>{
    const winnerName=getPlayer(session.winner)?.username||"";
    const attendeeNames=(session.attendees||[]).map((pid)=>getPlayer(pid)?.username||"").join(" ");
    const note=hasCustomLobbyNote(session)?session.notes.trim():"";
    return `${session.id} ${session.date} ${winnerName} ${attendeeNames} ${note} ${getLobbyReport(session)}`.toLowerCase();
  };

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
          {bootPhase===0
            ?"Opening command uplink"
            :!loaded
              ?"Syncing lobbies and combat files"
              :"Arena link stable"}
        </div>
        <div style={{height:3,background:"rgba(255,255,255,.08)",borderRadius:2,overflow:"hidden"}}>
          {bootPhase>=1&&<div style={{
            height:"100%",borderRadius:2,
            background:"linear-gradient(90deg,#FFD700,#FF6B35,#FF4D8F)",
            animation:"bootBar 1.1s cubic-bezier(.4,0,.2,1) forwards",
            boxShadow:"0 0 12px rgba(255,215,0,.6)"
          }}/>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:12}}>
          {[
            {label:"UPLINK",done:true,color:"#FFD700"},
            {label:"RECORDS",done:bootPhase>=1,color:"#00E5FF"},
            {label:"LIVE OPS",done:loaded,color:"#00FF94"},
          ].map((step)=>(
            <div key={step.label} style={{
              padding:"7px 8px",
              borderRadius:8,
              border:`1px solid ${step.done?`${step.color}55`:"rgba(255,255,255,.08)"}`,
              background:step.done?`${step.color}12`:"rgba(255,255,255,.03)",
              color:step.done?step.color:"rgba(255,255,255,.28)",
              fontFamily:"Barlow Condensed",
              fontWeight:800,
              fontSize:".62rem",
              letterSpacing:".16em",
              textAlign:"center",
              textTransform:"uppercase",
            }}>
              {step.done?"READY":"LINK"} · {step.label}
            </div>
          ))}
        </div>
        <div style={{fontFamily:"Barlow Condensed",fontWeight:700,fontSize:".68rem",
          letterSpacing:".08em",lineHeight:1.6,color:"rgba(200,186,255,.56)",marginTop:12}}>
          {loaded
            ?"Standings, stories, and zone controls are online."
            :"Pulling live standings, session history, and player dossiers into the room."}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:8,
          fontFamily:"Barlow Condensed",fontSize:".65rem",
          letterSpacing:".1em",color:"rgba(255,255,255,.2)"}}>
          <span>S2 · ACTIVE</span>
          <span>{STORAGE_VERSION.replace("gn-","").toUpperCase()}</span>
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
  const activeNavView=queuedView||view;
  const activeZone=LEVEL_MAP[activeNavView]||LEVEL_MAP.home;
  const currentZone=LEVEL_MAP[view]||LEVEL_MAP.home;
  const zoneLinking=Boolean(queuedView&&queuedView!==view);
  const zoneRailStatus=zoneLinking
    ? `Linking from ${currentZone.label}`
    : "Zone link stable";

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
      background:`radial-gradient(ellipse,${(lvlCard?.color||activeZone.color)}12 0%,transparent 70%)`,
    }}/>
    {showScroll&&<button className="scroll-top" onClick={()=>scrollToTop("smooth")}>↑</button>}

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
    {ceremonyPending&&!showCeremony&&["home","season1","season2"].includes(view)&&(
      <div style={{position:"fixed",left:18,bottom:18,zIndex:9500,maxWidth:320}}>
        <div style={{...card({
          padding:"14px 14px 12px",
          border:"1.5px solid rgba(255,215,0,.32)",
          background:"linear-gradient(135deg,rgba(255,215,0,.12),rgba(255,107,53,.08),rgba(22,13,46,.96))",
          boxShadow:"0 18px 40px rgba(0,0,0,.35)",
        })}}>
          <div className="bc7" style={{fontSize:".58rem",letterSpacing:".18em",color:"#FFD700",textTransform:"uppercase",marginBottom:7}}>
            Transition broadcast ready
          </div>
          <div style={{fontFamily:"Fredoka One",fontSize:"1rem",lineHeight:1.15,color:"#fff",marginBottom:6}}>
            Season 1 closed. The handoff is waiting when you want the moment.
          </div>
          <div className="bc7" style={{fontSize:".72rem",lineHeight:1.55,color:"var(--text3)",marginBottom:12}}>
            It will not interrupt the archive. Open it when you are settled at the top of the board.
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={openCeremony} style={{...primaryBtn({padding:"9px 14px",fontSize:".82rem"})}}>
              Open ceremony
            </button>
            <button onClick={markCeremonySeen} style={{
              padding:"9px 14px",borderRadius:10,border:"1.5px solid rgba(255,255,255,.14)",
              background:"rgba(255,255,255,.06)",color:"var(--text2)",cursor:"pointer",fontWeight:700,fontSize:".8rem"}}>
              Archive alert
            </button>
          </div>
        </div>
      </div>
    )}
    {showCeremony&&(
      <div onClick={snoozeCeremony} style={{
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
        <div onClick={e=>e.stopPropagation()} style={{textAlign:"center",position:"relative",zIndex:1,maxWidth:560}}>
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
          <div className="bc7" style={{fontSize:".78rem",color:"rgba(255,255,255,.38)",fontWeight:700,letterSpacing:".08em",lineHeight:1.6,marginBottom:18}}>
            Stay for the handoff, or close it for now and keep browsing. This moment only needs your attention when you want to give it.
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
            <button onClick={markCeremonySeen} style={{...primaryBtn({padding:"11px 18px",fontSize:".86rem"})}}>
              Enter Season 2
            </button>
            <button onClick={snoozeCeremony} style={{
              padding:"11px 18px",borderRadius:11,border:"1.5px solid rgba(255,255,255,.16)",
              background:"rgba(255,255,255,.06)",color:"var(--text2)",cursor:"pointer",fontWeight:700,fontSize:".84rem"}}>
              Close for now
            </button>
          </div>
          <div className="bc7" style={{fontSize:".68rem",color:"rgba(255,255,255,.24)",fontWeight:700,letterSpacing:".12em",marginTop:14,textTransform:"uppercase"}}>
            Esc also closes it for now
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
            : `🔴 GAMES NIGHT LIVE \u00a0·\u00a0 ${FEATURED_GAME} \u00a0·\u00a0 Hosted by ${HOSTED_BY} \u00a0·\u00a0 5-7 PM UTC \u00a0·\u00a0 📺 TUNE IN ON TWITCH \u00a0·\u00a0`
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
          <button key={item.id} className={`nav-btn${activeNavView===item.id?" active":""}${queuedView===item.id?" incoming":""}`} onClick={()=>go(item.id)} aria-current={activeNavView===item.id?"page":undefined} style={{
            "--navc":(LEVEL_MAP[item.id]||LEVEL_MAP.home).color,
            padding:"5px 10px",borderRadius:0,fontWeight:700,fontSize:".66rem",
            fontFamily:"Barlow Condensed",letterSpacing:".16em",
            color:activeNavView===item.id?(LEVEL_MAP[item.id]||LEVEL_MAP.home).color:"rgba(255,255,255,.3)",
            background:activeNavView===item.id?`${(LEVEL_MAP[item.id]||LEVEL_MAP.home).color}10`:"none",border:"none",
            cursor:"pointer",height:58,transition:"color .13s",whiteSpace:"nowrap",
            boxShadow:activeNavView===item.id?`inset 0 0 0 1px ${(LEVEL_MAP[item.id]||LEVEL_MAP.home).color}12`:"none"}}>
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
    <div key={zonePulse} className={`zone-rail${zoneLinking?" live":""}`} style={{"--zonec":activeZone.color}}>
      <div className="zone-rail-chip">
        <span className="zone-rail-icon">{activeZone.icon}</span>
        <div className="zone-rail-copy">
          <span className="zone-rail-label">{activeZone.label}</span>
          <span className="zone-rail-brief">{ZONE_BRIEFS[activeNavView]||"Zone link stable"}</span>
        </div>
      </div>
      <span className="zone-rail-status hide-mob">
        {zoneRailStatus}
      </span>
    </div>
    {/* Bottom zone accent line */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,height:2,zIndex:50,pointerEvents:"none",
      background:`linear-gradient(90deg,transparent,${activeZone.color}66,transparent)`,
      transition:"background .7s ease"}}/>

    {/* MOBILE MENU */}
    {mobileOpen&&(
      <div className="mob-menu">
        {navItems.map(item=>(
          <button key={item.id} className={`mob-item${activeNavView===item.id?" active":""}`}
            onClick={()=>go(item.id)}>{item.l}</button>
        ))}
        {adminMode&&<button className={`mob-item${activeNavView==="admin"?" active":""}`} onClick={()=>go("admin")}>⚙️ Admin</button>}
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
            const clearedMissionCount=missions.filter((mission)=>mission.progress>=mission.target).length;

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
            const latestFallout=buildLatestFallout(latestDate);
            const stories=getStorylines();
            const leaderStageTitle=leaderP
              ? `${dn(leaderP.username)} is setting the pace in ${currentSeason.name}`
              : `${currentSeason.name} is still looking for a front-runner`;
            const leaderStageSub=leaderSlides.length
              ? `${leaderSlides.length} LIVE CARDS ROTATING`
              : "RACE STILL FORMING";
            const falloutDateLabel=latestDate
              ?new Date(latestDate+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"long"})
              :"";
            const splitLeaders=latestFallout?.topWinners.length
              ?joinHumanList(latestFallout.topWinners.map((entry)=>dn(entry.player?.username||"")))
              :"";
            const briefingTitle=latestFallout?.topWinners.length>=2&&latestFallout.topKiller?.player
              ? `${falloutDateLabel} changed the pressure map. ${splitLeaders} split the wins at ${latestFallout.topWinCount} each, but ${dn(latestFallout.topKiller.player.username)} still hauled out the heavier ${latestFallout.topKiller.kills}-kill line.`
              :stories.length
              ? "Live reads on the streaks, grudges, droughts, and pressure spikes shaping the room"
              : "Fresh reads will lock in here as soon as the room has more data";
            const recap=getDayRecap(latestDate);
            const mvp=getDailyMVP();
            let dateLabel="";
            let recapTag="AFTER-ACTION REPORT";
            let recapTitle="No session report is locked in yet";
            let recapFieldNotes=[];
            let mvpCards=[];
            if(recap&&recap.lobbies){
              const dd=new Date(latestDate+"T12:00:00Z");
              dateLabel=dd.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
              const specialTag=latestDate==="2026-04-03"?"🌅 Good Friday · "
                :latestDate==="2026-04-01"?"🃏 April Fools · "
                :latestDate==="2026-04-04"?"🥚 Easter Saturday · ":"";
              recapTag=`${specialTag}AFTER-ACTION REPORT`;
              recapTitle=latestFallout?.topWinners.length>=2&&latestFallout.topKiller?.player
                ? `${splitLeaders} split ${falloutDateLabel} at ${latestFallout.topWinCount} wins each. ${dn(latestFallout.topKiller.player.username)} still walked out with ${latestFallout.topKiller.kills} kills on the day.`
                :`${recap.totalKills} confirmed kills across ${recap.lobbies} lobbies on the last session day`;
              const reboundSessionNo=latestFallout?.reboundWin
                ?parseSessionIdNumber(latestFallout.reboundWin.session.id)||latestFallout.reboundWin.session.id
                :null;
              const zeroKillSessionNo=latestFallout?.zeroKillWin
                ?parseSessionIdNumber(latestFallout.zeroKillWin.session.id)||latestFallout.zeroKillWin.session.id
                :null;
              const legendNames=latestFallout?.legendCrossers.length
                ?joinHumanList(latestFallout.legendCrossers.map((entry)=>dn(entry.player?.username||"")))
                :"";
              const legendFieldNote=legendNames
                ?latestFallout.legendCrossers.length>1
                  ?`${legendNames} both reached Legend`
                  :`${legendNames} reached Legend`
                :"";
              if(latestFallout?.reboundWin){
                recapFieldNotes.push(
                  `${dn(latestFallout.reboundWin.player.username)} went ${latestFallout.reboundWin.priorDayLobbies} lobbies without a win, then closed Lobby ${reboundSessionNo} with ${latestFallout.reboundWin.kills} kills.`,
                );
              }
              if(latestFallout?.zeroKillWin||legendFieldNote){
                const parts=[];
                if(latestFallout?.zeroKillWin){
                  parts.push(`${dn(latestFallout.zeroKillWin.player.username)} stole Lobby ${zeroKillSessionNo} without landing a kill`);
                }
                if(legendFieldNote){
                  parts.push(legendFieldNote);
                }
                recapFieldNotes.push(parts.join(", ")+".");
              }
              if(latestFallout?.killCrossers[0]||latestFallout?.topFiveShift){
                const parts=[];
                if(latestFallout?.killCrossers[0]){
                  parts.push(`${dn(latestFallout.killCrossers[0].player.username)} crossed ${latestFallout.killCrossers[0].kills} total kills`);
                }
                if(latestFallout?.topFiveShift){
                  parts.push(`${dn(latestFallout.topFiveShift.player?.username||"?")} climbed into ${latestFallout.topFiveShift.afterRank}th all-time wins`);
                }
                recapFieldNotes.push(parts.join(", ")+".");
              }
              if(latestFallout?.mekulaTeriqPressure||latestFallout?.teriqHackqamPressure){
                const rivalryLines=[];
                if(latestFallout?.mekulaTeriqPressure){
                  rivalryLines.push(
                    `${dn(latestFallout.mekulaTeriqPressure.leader.username)} leads ${dn(latestFallout.mekulaTeriqPressure.trailer.username)} ${latestFallout.mekulaTeriqPressure.leaderWins}-${latestFallout.mekulaTeriqPressure.trailerWins} across ${latestFallout.mekulaTeriqPressure.total} top-two clashes`,
                  );
                }
                if(latestFallout?.teriqHackqamPressure){
                  rivalryLines.push(
                    `${dn(latestFallout.teriqHackqamPressure.leader.username)} still has the edge over ${dn(latestFallout.teriqHackqamPressure.trailer.username)} at ${latestFallout.teriqHackqamPressure.leaderWins}-${latestFallout.teriqHackqamPressure.trailerWins} from ${latestFallout.teriqHackqamPressure.total}`,
                  );
                }
                if(rivalryLines.length){
                  recapFieldNotes.push(rivalryLines.join(", and ")+".");
                }
              }
              const tw=mvp&&mvp.topWinner?players.find(p=>p.id===mvp.topWinner.id):null;
              const tk=mvp&&mvp.topKiller?players.find(p=>p.id===mvp.topKiller.id):null;
              const ta=mvp&&mvp.topAppear?players.find(p=>p.id===mvp.topAppear.id):null;
              const kk=mvp&&mvp.killKing?players.find(p=>p.id===mvp.killKing.id):null;
              const killKingLobby=mvp?.killKing?.killKingSid
                ?`Lobby ${parseSessionIdNumber(mvp.killKing.killKingSid)||mvp.killKing.killKingSid}`
                :"";
              mvpCards=[
                {icon:"🏆",label:"MOST WINS",       player:tw,stat:mvp?.topWinner?.wins+"W",       sub:"lobbies won",     c:"#FFD700"},
                {icon:"💀",label:"MOST KILLS",       player:tk,stat:mvp?.topKiller?.kills+"K",      sub:"total kills",     c:"#FF4D8F"},
                {icon:"☄️",label:"BEST SINGLE GAME", player:kk,stat:mvp?.killKing?.killKingK+"K",   sub:killKingLobby, c:"#FF6B35"},
                {icon:"📅",label:"MOST APPEARANCES", player:ta,stat:mvp?.topAppear?.appearances+"G",sub:"lobbies played",  c:"#00E5FF"},
              ].filter(c=>c.player);
            }
            const missionTitle=clearedMissionCount===missions.length
              ? "Every live objective is cleared and the board is waiting for the Monday reset"
              : `${clearedMissionCount} of ${missions.length} live objectives are already cleared`;
            return(<>
              {/* Status row */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                marginBottom:14,flexWrap:"wrap",gap:8}}>
                <span className="bc7" style={{fontSize:".62rem",letterSpacing:".3em",
                  color:`rgba(255,107,53,.7)`}}>
                  {currentSeason.name.toUpperCase()} · {currentSeason.label.toUpperCase()} · CAMPAIGN LIVE
                </span>
                <span className="bc7" style={{fontSize:".62rem",letterSpacing:".2em",color:"var(--text3)"}}>
                  {seasonSess.length} LOBBIES THIS CAMPAIGN · {sessions.length} ON RECORD
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
                        {FEATURED_GAME} · MON-SAT · 5PM UTC · HOSTED BY {HOSTED_BY.toUpperCase()}
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

              <HomeStage
                tag="FIELD COMMAND"
                title={leaderStageTitle}
                sub={leaderStageSub}
                accent="#FFD700">
                <LeaderSlideshow slides={leaderSlides}/>
              </HomeStage>

              <HomeStage
                tag="INTELLIGENCE BRIEFING"
                title={briefingTitle}
                sub={stories.length?`${stories.length} LIVE READS`:"SYNCING ROOM DATA"}
                accent="#00FF94">
                <BriefingFeed stories={stories}/>
              </HomeStage>

              {recap&&recap.lobbies&&(
                <HomeStage
                  tag={recapTag}
                  title={recapTitle}
                  sub={dateLabel.toUpperCase()}
                  accent="#FFD700">
                  <div style={{
                    background:"rgba(255,255,255,.02)",
                    border:"1px solid rgba(255,255,255,.07)",
                    borderLeft:"3px solid rgba(255,215,0,.4)",
                    borderRadius:"0 8px 8px 0",padding:"16px 18px"}}>
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
                    {recapFieldNotes.length>0&&(
                      <div style={{
                        display:"grid",gap:6,marginBottom:14,
                        padding:"12px 0 0",borderTop:"1px solid rgba(255,255,255,.06)"}}>
                        <div className="bc7" style={{fontSize:".56rem",letterSpacing:".24em",
                          color:"rgba(0,255,148,.6)"}}>FIELD NOTES</div>
                        {recapFieldNotes.map((note,i)=>(
                          <div key={i} className="bc7" style={{fontSize:".68rem",
                            color:"var(--text2)",lineHeight:1.7,letterSpacing:".04em"}}>
                            <span style={{color:"#00FF94",marginRight:8}}>▸</span>{note}
                          </div>
                        ))}
                      </div>
                    )}
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
                        ))} claimed lobbies
                      </div>
                    )}
                  </div>
                </HomeStage>
              )}

              <HomeStage
                tag="MISSION BOARD"
                title={missionTitle}
                sub={`${clearedMissionCount} OF ${missions.length} CLEARED · RESETS MONDAY`}
                accent="#C77DFF"
                marginBottom={4}>
                <div style={{display:"grid",
                  gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",
                  gap:14,alignItems:"start"}}>
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
                            {done?"OBJECTIVE CLEARED":`${m.unit} · ${pct}%`}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!live&&(
                    <div style={{
                      minHeight:"100%",
                      background:"linear-gradient(180deg,rgba(0,229,255,.08),rgba(0,0,0,.34))",
                      border:"1px solid rgba(0,229,255,.16)",
                      borderLeft:"3px solid rgba(0,229,255,.38)",
                      borderRadius:"0 8px 8px 0",
                      padding:"16px 18px"}}>
                      <div className="bc7" style={{fontSize:".6rem",letterSpacing:".35em",
                        color:"rgba(0,229,255,.5)",marginBottom:12}}>
                        ▸ NEXT SESSION IN
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"flex-end",flexWrap:"wrap"}}>
                        {[
                          {v:String(cd.d).padStart(2,"0"), l:"DAYS",    show:cd.d>0},
                          {v:String(cd.h).padStart(2,"0"), l:"HOURS",   show:true},
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
                          </div>
                        ))}
                      </div>
                      <div className="bc7" style={{fontSize:".68rem",color:"var(--text3)",
                        marginTop:10,letterSpacing:".08em",lineHeight:1.7}}>
                        Mon-Sat · 5PM UTC · Hosted by {HOSTED_BY}
                      </div>
                    </div>
                  )}
                </div>
              </HomeStage>
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
              Old campaigns, current royalty, names the room keeps forever
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
                    <span style={{fontSize:".68rem",color:season.color,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase"}}>{ended?"🏁 Campaign Closed":"📅 Campaign Live"}</span>
                    <h3 style={{fontFamily:"Fredoka One",color:"#fff",fontSize:"1.2rem",marginTop:2}}>{season.name}: {season.label}</h3>
                    <p style={{color:"var(--text3)",fontSize:".76rem",marginTop:2}}>{sSess.length} lobbies logged · {sStats.length} names on file</p>
                  </div>
                  {ended&&champ&&<div style={{textAlign:"center"}}>
                    <div style={{fontSize:".66rem",color:"#FFD700",fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>👑 Crown Holder</div>
                    <div style={{fontFamily:"Fredoka One",color:"#FFD700",fontSize:"1.1rem"}}>{champ.username}</div>
                    <div style={{fontSize:".72rem",color:"var(--text3)"}}>{champ.wins}W · {champ.winRate}%WR</div>
                  </div>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
                  {[
                    {icon:"🏆",label:"Wins Leader",    p:champ,    val:champ?.wins+"W"},
                    {icon:"💀",label:"Lead Fragger",   p:topK,     val:topK?.kills+"K"},
                    {icon:"📅",label:"Iron Presence", p:mostActive,val:mostActive?.appearances+"G"},
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
                <h3 style={{fontFamily:"Fredoka One",color:"#C77DFF",fontSize:"1.2rem"}}>Callsigns Explained</h3>
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>Every title means something. This is what the room is saying.</p>
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
                <h3 style={{fontFamily:"Fredoka One",color:"#FFD700",fontSize:"1.2rem"}}>Commendations</h3>
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>Tap any badge to see what kind of night earns it.</p>
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
                {sessions.length} LOBBIES ON RECORD
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
                SEASON 2 · CAMPAIGN LIVE · TABLE OPEN
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
              <span className="bc7" style={{
                fontSize:".62rem",
                letterSpacing:".12em",
                color:"rgba(255,255,255,.55)",
                background:"rgba(255,255,255,.04)",
                border:"1px solid rgba(255,255,255,.08)",
                borderRadius:999,
                padding:"5px 10px",
              }}>
                {SORT_LABELS[sortBy].toUpperCase()} · {filteredLB.length} IN VIEW{lbSearch.trim()?` · FILTER ${lbSearch.trim().toUpperCase()}`:""}
              </span>
            </div>
          </div>

          {/* Search */}
          <div style={{position:"relative",marginBottom:16}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:"1rem",pointerEvents:"none"}}>🔍</span>
            <input className="search-inp" placeholder="Search callsign or gamertag..."
              value={lbSearch} onChange={e=>{
                const nextValue=e.target.value;
                const query=nextValue.trim().toLowerCase();
                setLbSearch(nextValue);
                if(!query){setSpotlight(null);return;}
                const m=players.find(p=>p.username.toLowerCase().includes(query));
                setSpotlight(m?m.id:null);
              }}/>
            {lbSearch&&<button onClick={()=>{setLbSearch("");setSpotlight(null);}} style={{
              position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
              background:"rgba(255,255,255,.12)",border:"none",borderRadius:50,
              width:22,height:22,cursor:"pointer",color:"#fff",fontSize:".72rem"}}>✕</button>}
          </div>

          {sortedLB.length>0&&(()=>{
            const boardLeader=sortedLB[0];
            const boardChaser=sortedLB[1];
            const leaderPlayer=players.find((player)=>player.id===boardLeader.id);
            const chasePlayer=boardChaser?players.find((player)=>player.id===boardChaser.id):null;
            if(!leaderPlayer)return null;
            const scopeLabel=lbSeason==="s1"
              ?"Season 1 archive"
              :lbSeason==="s2"
                ?"Season 2 live board"
                :"All-time board";
            const pressureText=(()=>{
              if(!boardChaser||!chasePlayer){
                return `${dn(leaderPlayer.username)} owns this board for now.`;
              }
              if(sortBy==="kills"){
                const gap=boardLeader.kills-boardChaser.kills;
                return gap===0
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are level on kills right now.`
                  :`${dn(leaderPlayer.username)} is ${gap} kill${gap===1?"":"s"} clear of ${dn(chasePlayer.username)}.`;
              }
              if(sortBy==="kd"){
                const gap=(parseFloat(boardLeader.kd)-parseFloat(boardChaser.kd)).toFixed(1);
                return gap==="0.0"
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are locked on efficiency.`
                  :`${dn(leaderPlayer.username)} is ${gap} K/G ahead of ${dn(chasePlayer.username)}.`;
              }
              if(sortBy==="winrate"){
                const gap=boardLeader.winRate-boardChaser.winRate;
                return gap===0
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are tied on win rate.`
                  :`${dn(leaderPlayer.username)} is ${gap}% ahead of ${dn(chasePlayer.username)} on win rate.`;
              }
              if(sortBy==="appearances"){
                const gap=boardLeader.appearances-boardChaser.appearances;
                return gap===0
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are level on attendance.`
                  :`${dn(leaderPlayer.username)} has ${gap} more lobby${gap===1?"":"ies"} logged than ${dn(chasePlayer.username)}.`;
              }
              if(sortBy==="carry"){
                const gap=boardLeader.carry-boardChaser.carry;
                return gap===0
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are even on carry score.`
                  :`${dn(leaderPlayer.username)} leads carry score by ${gap}.`;
              }
              if(sortBy==="consistency"){
                const gap=boardLeader.consistency-boardChaser.consistency;
                return gap===0
                  ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are level on consistency.`
                  :`${dn(leaderPlayer.username)} is ${gap}% steadier than ${dn(chasePlayer.username)} right now.`;
              }
              const gap=boardLeader.wins-boardChaser.wins;
              return gap===0
                ?`${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are tied on wins.`
                :`${dn(leaderPlayer.username)} is ${gap} win${gap===1?"":"s"} clear of ${dn(chasePlayer.username)}.`;
            })();
            return(
              <div style={{
                marginBottom:16,
                background:`linear-gradient(135deg,${leaderPlayer.color}12,rgba(0,0,0,.4))`,
                border:`1px solid ${leaderPlayer.color}33`,
                borderLeft:`3px solid ${leaderPlayer.color}`,
                borderRadius:"0 10px 10px 0",
                padding:"14px 16px",
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6}}>
                  <span className="bc9" style={{fontSize:".64rem",letterSpacing:".24em",color:`${leaderPlayer.color}bb`}}>
                    PRESSURE BOARD
                  </span>
                  <span className="bc7" style={{fontSize:".6rem",letterSpacing:".14em",color:"var(--text3)"}}>
                    {scopeLabel.toUpperCase()} · SORTED BY {SORT_LABELS[sortBy].toUpperCase()}
                  </span>
                </div>
                <div className="bc9" style={{fontSize:"clamp(1rem,3vw,1.2rem)",color:leaderPlayer.color,marginBottom:4}}>
                  {leaderPlayer.host?"👑 ":""}{dn(leaderPlayer.username)} has the front spot.
                </div>
                <div className="bc7" style={{fontSize:".76rem",color:"var(--text2)",lineHeight:1.6}}>
                  {pressureText}
                </div>
              </div>
            );
          })()}

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
                      {isFirst&&(
                        <div className="bc7" style={{fontSize:".56rem",color:"#FFD700",letterSpacing:".2em",marginTop:4}}>
                          CURRENT LEADER
                        </div>
                      )}
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
              const isFirst=globalRank===0&&!foolsDay;
              const streak=getStreak(player.id);
              return(
                <div key={player.id} onClick={()=>goProfile(player.id)} style={{...card({border:isHL?`2px solid ${player.color}`:isFirst?"1.5px solid rgba(255,215,0,.55)":`1.5px solid ${player.color}2a`}),
                  padding:"12px 14px",display:"flex",alignItems:"center",gap:11,cursor:"pointer",
                  background:isHL?`${player.color}10`:isFirst?"linear-gradient(135deg,rgba(255,215,0,.08),rgba(255,255,255,.02))":"var(--card)",
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
                    {isFirst&&<div className="bc7" style={{fontSize:".52rem",color:"#FFD700",letterSpacing:".18em",marginTop:3}}>CURRENT LEADER</div>}
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
                {lbPeriod==="today"?"The room has not opened today yet.":`No lobby has landed this ${lbPeriod==="week"?"week":"run"}`}
              </p>
              <p style={{fontSize:".82rem",color:"var(--text3)",marginTop:5}}>Check back after the next drop into the room.</p>
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
                            <span style={{color:"var(--text3)",fontSize:".7rem"}}>-</span>
                            <span style={{fontFamily:"Fredoka One",color:!aWin&&!tie?row.c:tie?"var(--text2)":"var(--text3)",fontSize:"1.1rem"}}>{row.bV}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {h.shared>0&&(
                    <div style={{textAlign:"center",padding:"10px",background:`linear-gradient(135deg,${h.aWins>h.bWins?pA.color:pB.color}12,rgba(0,0,0,.2))`,borderRadius:10,fontSize:".82rem",fontWeight:700,color:"var(--text2)"}}>
                      {h.aWins===h.bWins?"🤝 Dead even in shared games":
                        `${(h.aWins>h.bWins?pA:pB).username} dominates shared lobbies ${Math.max(h.aWins,h.bWins)}-${Math.min(h.aWins,h.bWins)}`}
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
                      <span style={{color:"var(--text3)",fontSize:".8rem"}}> leads {lWins}-{tWins}</span>
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
                          <span style={{color:"var(--text3)",fontSize:".72rem"}}>-</span>
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
          {(()=>{
            const archiveSessions=[...sessions].sort(compareSessionsDesc);
            const latestLobby=archiveSessions[0]||null;
            const latestWinner=latestLobby?getPlayer(latestLobby.winner):null;
            const liveHeat=getLiveStreaks()[0]||null;
            const heatPlayer=liveHeat?getPlayer(liveHeat.id):null;
            const loudestLobby=archiveSessions.length
              ?archiveSessions.reduce((best,session)=>
                getLobbyTotalKills(session)>getLobbyTotalKills(best)?session:best)
              :null;
            const loudestKills=loudestLobby?getLobbyTotalKills(loudestLobby):0;
            const searchTerm=lobbySearch.trim().toLowerCase();
            let filtered=[...archiveSessions];
            if(lobbyFilter)filtered=filtered.filter(s=>s.attendees?.includes(lobbyFilter));
            if(lobbyDate)filtered=filtered.filter(s=>s.date===lobbyDate);
            if(searchTerm)filtered=filtered.filter(s=>getLobbySearchHaystack(s).includes(searchTerm));
            const visible=filtered.slice(0,lobbyLimit);
            const archiveNights=new Set(filtered.map((s)=>s.date)).size;
            const daySummary=filtered.reduce((acc,session)=>{
              if(!acc[session.date]){
                acc[session.date]={count:0,kills:0};
              }
              acc[session.date].count+=1;
              acc[session.date].kills+=getLobbyTotalKills(session);
              return acc;
            },{});
            const activeTrail=[
              lobbyFilter?`Operative: ${dn(getPlayer(lobbyFilter)?.username||"Unknown")}`:"",
              lobbyDate?`Date: ${formatLobbyDate(lobbyDate,{day:"numeric",month:"short",year:"numeric"})}`:"",
              searchTerm?`Search: ${lobbySearch.trim()}`:"",
            ].filter(Boolean);
            return(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{...card({
              padding:"22px 20px",
              marginBottom:4,
              overflow:"hidden",
              position:"relative",
              background:"linear-gradient(135deg,rgba(255,77,143,.14),rgba(25,15,61,.96) 55%,rgba(0,229,255,.08))",
            })}}>
              <div style={{position:"absolute",inset:0,pointerEvents:"none",
                background:"radial-gradient(circle at top right,rgba(255,77,143,.18),transparent 42%)"}}/>
              <div className="bc7" style={{fontSize:".65rem",letterSpacing:".22em",color:"#FF9BC2",textTransform:"uppercase",marginBottom:8}}>
                Battle report archive
              </div>
              <h2 style={{fontFamily:"Fredoka One",fontSize:"clamp(2rem,8vw,3.2rem)",
                background:"linear-gradient(135deg,#FF4D8F,#C77DFF)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
                🎮 War Room
              </h2>
              <p style={{color:"var(--text2)",marginTop:8,fontSize:".86rem",maxWidth:720,lineHeight:1.7}}>
                Battle reports, pressure swings, and the rooms that changed the board. Newest drops stay on top, and every file should feel worth opening.
              </p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:10,marginTop:18}}>
                <div style={{padding:"12px 14px",borderRadius:14,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)"}}>
                  <div className="bc7" style={{fontSize:".58rem",letterSpacing:".16em",color:"var(--text3)",textTransform:"uppercase",marginBottom:6}}>Latest close</div>
                  <div style={{fontFamily:"Fredoka One",fontSize:"1.05rem",color:latestWinner?latestWinner.color:"#FFD700"}}>
                    {latestWinner?dn(latestWinner.username):"Archive waiting"}
                  </div>
                  <div className="bc7" style={{fontSize:".72rem",color:"var(--text3)",marginTop:4,lineHeight:1.5}}>
                    {latestLobby?`${latestLobby.id.toUpperCase()} filed on ${formatLobbyDate(latestLobby.date,{day:"numeric",month:"short"})}`:"No room has landed yet"}
                  </div>
                </div>
                <div style={{padding:"12px 14px",borderRadius:14,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)"}}>
                  <div className="bc7" style={{fontSize:".58rem",letterSpacing:".16em",color:"var(--text3)",textTransform:"uppercase",marginBottom:6}}>Heat check</div>
                  <div style={{fontFamily:"Fredoka One",fontSize:"1.05rem",color:heatPlayer?heatPlayer.color:"#FF6B35"}}>
                    {heatPlayer?`${dn(heatPlayer.username)} ${liveHeat.streak}W run`:"Room wide open"}
                  </div>
                  <div className="bc7" style={{fontSize:".72rem",color:"var(--text3)",marginTop:4,lineHeight:1.5}}>
                    {heatPlayer?"Current active streak. One more clean finish makes everybody feel it.":"No streak longer than one room is holding the lobby."}
                  </div>
                </div>
                <div style={{padding:"12px 14px",borderRadius:14,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)"}}>
                  <div className="bc7" style={{fontSize:".58rem",letterSpacing:".16em",color:"var(--text3)",textTransform:"uppercase",marginBottom:6}}>Loudest file</div>
                  <div style={{fontFamily:"Fredoka One",fontSize:"1.05rem",color:"#FFAB40"}}>
                    {loudestLobby?`${loudestLobby.id.toUpperCase()} · ${loudestKills}K`:"Quiet archive"}
                  </div>
                  <div className="bc7" style={{fontSize:".72rem",color:"var(--text3)",marginTop:4,lineHeight:1.5}}>
                    {loudestLobby?`${formatLobbyDate(loudestLobby.date,{day:"numeric",month:"short"})} still stands as the heaviest room on file.`:"The archive wakes up once the first room is logged."}
                  </div>
                </div>
              </div>
            </div>

            <div style={{...card({padding:18,marginBottom:2,border:"1.5px solid rgba(255,77,143,.18)"})}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:12}}>
                <div>
                  <div className="bc7" style={{fontSize:".62rem",letterSpacing:".18em",color:"#FF9BC2",textTransform:"uppercase",marginBottom:6}}>
                    Archive sweep
                  </div>
                  <div className="bc7" style={{fontSize:".78rem",color:"var(--text2)",lineHeight:1.6,maxWidth:680}}>
                    Pull one operative, lock a date, or sweep the archive for a room ID, winner, or field note. Reports stay filed newest first.
                  </div>
                </div>
                <div className="bc7" style={{fontSize:".64rem",letterSpacing:".16em",color:"var(--text3)",textTransform:"uppercase"}}>
                  {archiveSessions.length} reports on file
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
                <div>
                  <label style={{...lbl,marginBottom:6,fontSize:".64rem"}}>Pull operative</label>
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:".9rem",pointerEvents:"none"}}>👤</span>
                    <select value={lobbyFilter} onChange={e=>setLobbyFilter(e.target.value)}
                      style={{...inp({width:"100%",padding:"9px 12px 9px 34px",fontSize:".86rem"})}}>
                      <option value="">Any operative</option>
                      {players.map(p=><option key={p.id} value={p.id}>{p.username}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{...lbl,marginBottom:6,fontSize:".64rem"}}>Lock date</label>
                  <input type="date" value={lobbyDate} onChange={e=>setLobbyDate(e.target.value)}
                    style={{...inp({width:"100%",padding:"9px 12px",fontSize:".86rem"})}}/>
                </div>
                <div>
                  <label style={{...lbl,marginBottom:6,fontSize:".64rem"}}>Search the file</label>
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:".9rem",pointerEvents:"none"}}>🔎</span>
                    <input value={lobbySearch} onChange={e=>setLobbySearch(e.target.value)}
                      placeholder="Room, closer, note"
                      style={{...inp({width:"100%",padding:"9px 12px 9px 36px",fontSize:".86rem"})}}/>
                  </div>
                </div>
              </div>
              {activeTrail.length>0&&(
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginTop:12}}>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {activeTrail.map((item)=>(
                      <div key={item} className="bc7" style={{padding:"5px 10px",borderRadius:999,
                        background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",
                        fontSize:".62rem",letterSpacing:".08em",color:"var(--text3)",textTransform:"uppercase"}}>
                        {item}
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>{setLobbyFilter("");setLobbyDate("");setLobbySearch("");}} style={{
                    padding:"8px 14px",borderRadius:10,border:"1.5px solid var(--border)",
                    background:"rgba(255,255,255,.07)",color:"var(--text2)",cursor:"pointer",fontWeight:700,fontSize:".8rem"}}>
                    Reset trail
                  </button>
                </div>
              )}
            </div>

            <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:2}}>
              <p className="bc7" style={{color:"var(--text3)",fontSize:".78rem",fontWeight:700}}>
                {filtered.length} report{filtered.length!==1?"s":""} across {archiveNights} archive night{archiveNights!==1?"s":""}
              </p>
              <p className="bc7" style={{color:"var(--text3)",fontSize:".74rem",letterSpacing:".08em",textTransform:"uppercase"}}>
                Showing {visible.length} now · newest first
              </p>
            </div>

            {visible.length===0&&(
              <div style={{textAlign:"center",padding:"34px 18px",
                background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",
                borderRadius:"0 10px 10px 0",borderLeft:"3px solid rgba(255,77,143,.35)"}}>
                <div style={{fontSize:"2rem",marginBottom:10}}>🗂️</div>
                <div className="bc9" style={{fontSize:"1rem",color:"#FF4D8F",marginBottom:6}}>
                  No battle report fits this trail yet
                </div>
                <div className="bc7" style={{fontSize:".74rem",color:"var(--text3)",letterSpacing:".04em"}}>
                  Ease a filter, widen the search, or wait for the next room to land.
                </div>
              </div>
            )}

            {visible.map((s,idx)=>{
              const winner=players.find(p=>p.id===s.winner);
              const {player:tkP,kills:tkK}=getLobbyTopDamage(s);
              const totalLobbyKills=getLobbyTotalKills(s);
              const customNote=hasCustomLobbyNote(s)?s.notes.trim():"";
              const beatTags=getLobbyBeatTags(s);
              const primaryTag=beatTags[0];
              const showNightBreak=idx===0||visible[idx-1].date!==s.date;
              const marker=getLobbyDateMarker(s.date);
              const nightSummary=daySummary[s.date];
              return(
                <div key={s.id} style={{display:"flex",flexDirection:"column",gap:10}}>
                  {showNightBreak&&(
                    <div style={{display:"flex",alignItems:"center",gap:10,marginTop:idx===0?0:4}}>
                      <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(255,77,143,.3),transparent)"}}/>
                      <div className="bc7" style={{padding:"6px 12px",borderRadius:999,
                        background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",
                        fontSize:".62rem",letterSpacing:".14em",color:"var(--text3)",textTransform:"uppercase",textAlign:"center"}}>
                        {idx===0?"Latest night on file":"Night file"} · {formatLobbyDate(s.date,{weekday:"long",day:"numeric",month:"short"})} · {nightSummary.count} report{nightSummary.count!==1?"s":""} · {nightSummary.kills} kills
                      </div>
                      <div style={{height:1,flex:1,background:"linear-gradient(90deg,transparent,rgba(199,125,255,.3))"}}/>
                    </div>
                  )}

                  <div style={{...card({
                    padding:20,
                    position:"relative",
                    cursor:"pointer",
                    overflow:"hidden",
                    animation:`fadeUp .35s ease ${Math.min(idx,.5)*.06}s both`,
                    border:`1.5px solid ${expandedSid===s.id?"rgba(255,107,53,.6)":primaryTag?.border||"var(--border)"}`,
                    boxShadow:expandedSid===s.id?"0 18px 42px rgba(255,107,53,.14)":"none",
                  })}}
                    onClick={e=>{if(e.target.tagName==="BUTTON")return;setExpandedSid(v=>v===s.id?null:s.id);}}>
                    <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:primaryTag?.color||"#FF4D8F",opacity:.85}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:12,paddingLeft:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                          <div style={{fontFamily:"Fredoka One",color:"#FFAB40",fontSize:".88rem"}}>
                            📅 {formatLobbyDate(s.date)}
                          </div>
                          {marker&&<span style={{fontSize:".78rem",color:"var(--text3)"}}>{marker.icon} {marker.label}</span>}
                          <span style={{color:"var(--text3)",fontSize:".76rem",fontWeight:700}}>· {s.id.toUpperCase()}</span>
                        </div>
                        <p className="bc7" style={{color:"var(--text2)",fontSize:".76rem",
                          lineHeight:1.7,letterSpacing:".04em",maxWidth:660}}>
                          {getLobbyReport(s)}
                        </p>
                        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:10}}>
                          {beatTags.map((tag)=>(
                            <div key={tag.label} className="bc7" style={{display:"inline-flex",alignItems:"center",
                              gap:6,padding:"5px 10px",borderRadius:999,background:tag.background,
                              border:`1px solid ${tag.border}`,fontSize:".58rem",letterSpacing:".16em",
                              color:tag.color,textTransform:"uppercase"}}>
                              {tag.label}
                            </div>
                          ))}
                          {customNote&&<div className="bc7" style={{display:"inline-flex",alignItems:"center",
                            gap:6,padding:"5px 10px",borderRadius:999,background:"rgba(255,255,255,.06)",
                            border:"1px solid rgba(255,255,255,.08)",fontSize:".58rem",letterSpacing:".16em",
                            color:"var(--text3)",textTransform:"uppercase"}}>
                            Field note · {customNote}
                          </div>}
                        </div>
                      </div>
                      <div style={{display:"grid",gap:6,minWidth:122,flexShrink:0,paddingLeft:8}}>
                        <div style={{padding:"8px 10px",borderRadius:10,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)"}}>
                          <div className="bc7" style={{fontSize:".52rem",letterSpacing:".16em",color:"var(--text3)",textTransform:"uppercase",marginBottom:4}}>Room noise</div>
                          <div style={{fontFamily:"Fredoka One",fontSize:".9rem",color:"#FF4D8F"}}>{totalLobbyKills} kills</div>
                        </div>
                        <div style={{padding:"8px 10px",borderRadius:10,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)"}}>
                          <div className="bc7" style={{fontSize:".52rem",letterSpacing:".16em",color:"var(--text3)",textTransform:"uppercase",marginBottom:4}}>Bodies in room</div>
                          <div style={{fontFamily:"Fredoka One",fontSize:".9rem",color:"#00E5FF"}}>{s.attendees?.length||0} players</div>
                        </div>
                      </div>
                    </div>

                    {s.placements&&s.placements.length>0&&(
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10,paddingLeft:8}}>
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
                    <div style={{display:"flex",gap:7,flexWrap:"wrap",paddingLeft:8}}>
                      {winner&&(
                        <div style={{background:"rgba(255,215,0,.08)",border:"1px solid rgba(255,215,0,.25)",
                          borderRadius:8,padding:"5px 11px",display:"flex",alignItems:"center",gap:7}}>
                          <span style={{fontSize:".7rem",color:"var(--text3)"}}>🏆 Closed the room</span>
                          <Av p={winner} size={22}/>
                          <span style={{fontFamily:"Fredoka One",color:winner.color,fontSize:".86rem"}}>{winner.username}</span>
                        </div>
                      )}
                      {tkP&&tkK>0&&(
                        <div style={{background:"rgba(255,77,143,.08)",border:"1px solid rgba(255,77,143,.25)",
                          borderRadius:8,padding:"5px 11px",display:"flex",alignItems:"center",gap:7}}>
                          <span style={{fontSize:".7rem",color:"var(--text3)"}}>💀 Damage lead</span>
                          <Av p={tkP} size={22}/>
                          <span style={{fontFamily:"Fredoka One",color:tkP.color,fontSize:".86rem"}}>{tkP.username} ({tkK}k)</span>
                        </div>
                      )}
                    </div>
                    {expandedSid===s.id&&s.placements&&s.placements.length>0&&(
                      <div style={{marginTop:14,borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:14,paddingLeft:8}}
                        onClick={e=>e.stopPropagation()}>
                        <div style={{fontSize:".72rem",color:"var(--text3)",fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>How the room broke</div>
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
                                <span style={{fontFamily:"Fredoka One",color:k>0?"#FF4D8F":"var(--text3)",fontSize:".9rem"}}>{`${k}K`}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div style={{position:"absolute",top:12,right:adminMode?44:12,color:"var(--text3)",fontSize:".72rem",fontWeight:700}}>
                      {expandedSid===s.id?"▲":"▼"}
                    </div>
                    {s.clip&&(
                      <div style={{marginTop:8,paddingLeft:8}}>
                        <a href={s.clip} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{
                          display:"inline-flex",alignItems:"center",gap:6,
                          padding:"4px 12px",borderRadius:8,textDecoration:"none",
                          background:"rgba(145,71,255,.18)",border:"1px solid rgba(145,71,255,.4)",
                          color:"#cc99ff",fontWeight:700,fontSize:".74rem"}}>
                          🎬 Watch clip
                        </a>
                      </div>
                    )}
                    {expandedSid===s.id&&(
                      <div style={{marginTop:10,paddingLeft:8}}>
                        <button onClick={e=>{e.stopPropagation();setShareCard({sid:s.id,visible:true});}}
                          style={{display:"inline-flex",alignItems:"center",gap:6,
                            padding:"5px 14px",borderRadius:8,cursor:"pointer",
                            background:"rgba(0,229,255,.12)",border:"1px solid rgba(0,229,255,.4)",
                            color:"#00E5FF",fontWeight:700,fontSize:".78rem"}}>
                          📤 Share report
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
                </div>
              );
            })}

            {filtered.length>visible.length&&(
              <div style={{...card({padding:18,textAlign:"center",border:"1px dashed rgba(255,255,255,.14)"})}}>
                <div className="bc7" style={{fontSize:".74rem",letterSpacing:".08em",color:"var(--text3)",marginBottom:10}}>
                  {filtered.length-visible.length} older report{filtered.length-visible.length!==1?"s":""} still waiting deeper in the archive
                </div>
                <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
                  <button onClick={()=>setLobbyLimit((count)=>count+8)} style={{
                    ...primaryBtn({padding:"10px 18px",fontSize:".86rem"})
                  }}>
                    Load older reports
                  </button>
                  {lobbyLimit>8&&(
                    <button onClick={()=>setLobbyLimit(8)} style={{
                      padding:"10px 16px",borderRadius:10,border:"1.5px solid var(--border)",
                      background:"rgba(255,255,255,.07)",color:"var(--text2)",cursor:"pointer",fontWeight:700,fontSize:".82rem"}}>
                      Back to freshest file
                    </button>
                  )}
                </div>
              </div>
            )}
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
            p01:`Mekula runs the room and still sits on top of the all-time kill board. ${s.kills} kills is not admin privilege, it is repeated work. Every night he is in the middle of the chaos, pressing fights and making the lobby move. The wins swing. The damage rarely does.${s2Note}${streakNote}`,
            p02:`${s.wins} wins on the file. Teriqstp set the tone for what winning here looks like, especially in Season 1 where the race never really opened up. Calm, consistent, and hard to shake once they settle into a session.${s2Note}`,
            p03:`Sanctus has ${s.appearances} lobbies on record and one win to prove the room can crack open when the timing is right. The ceiling is there. The trick is getting that version to stay for a full night.${droughtNote}`,
            p04:`DjxHunter has the kind of game that can swallow a lobby whole when it clicks. ${s.wins} wins, a 6-kill ceiling, and a Season 1 podium run say the threat is real. The mystery is which version shows up on a given night.${droughtNote}${streakNote}`,
            p05:`Bohdanmain is quiet until the scoreboard forces everybody to notice. ${s.wins} wins from ${s.appearances} games, plus that four-win streak that still hangs in the air. The calm ones are the ones that punish you for looking away.${s2Note}`,
            p06:`One of the early names on the board. ${s.wins} wins from ${s.appearances} lobbies and part of the group that gave the room its first rhythm. The file is older than the spotlight, and it still carries weight.`,
            p07:`${s.wins} wins and ${s.kills} kills make Dhemo one of the cleanest all-round files in the room. They win enough, frag enough, and show up enough that there is no easy angle against them on paper.${droughtNote}`,
            p08:`${s.wins} wins across ${s.appearances} lobbies. Chugrud keeps stacking useful nights without asking for the spotlight. Not always the loudest player in the room, but the file keeps adding proof.${s2Note}`,
            p09:`${s.appearances} lobbies, no win yet, and still SirHaazy99 keeps turning up. That matters more here than people admit. When the first one lands, the room is going to celebrate like it was overdue.`,
            p10:`Izzyboi only stayed for ${s.appearances} games, but they left a footprint. Not every file gets thick before it earns a place in the archive.`,
            p11:`Loudmouth has ${s.wins} wins from ${s.appearances} lobbies and a habit of being around when sessions get memorable. The win rate is one story. The nights they really catch fire are another.${droughtNote}`,
            p12:`${s.wins}W and ${s.kills}K from ${s.appearances} games. Michkyle never feels like a free lobby. If the attendance ever settles, the file probably gets heavier in a hurry.`,
            p13:`${s.wins} wins from ${s.appearances} lobbies. TheLostOG has not been here long, but the conversion rate already reads like somebody who understands timing and pressure.${s2Note} Less screen time, real impact.`,
            p14:`${s.wins} wins and ${s.kills} kills. Hackqam has gone from occasional name on the roster to one of the sharper dangers in Season 2. More confident, more decisive, and clearly more comfortable in the room now.${s2Note}`,
            p15:`${s.wins} wins and Nellywaz still feels mid-rise. Season 2 has been the strongest stretch of their run so far, and the file suggests there is still another level to unlock.${s2Note}${streakNote} Quiet presence, real threat.`,
            p16:`${s.wins} wins from ${s.appearances} games. Zakipro does not log the same volume as the regulars, but the efficiency is hard to miss whenever they do show.${s2Note}`,
            p17:`ZapGrupoBulletBR has ${s.appearances} games logged and the kind of tag nobody forgets after reading it once. Every appearance adds another line to a file that still feels early.`,
            p18:`${s.appearances} lobbies and counting. CelesteHI5 has been around longer than people remember and the file shows it. ${s.wins} wins, ${s.kills} kills, steady appearances, quiet permanence.${s2Note}`,
            p19:`Six games, one win, instant footprint. xLilithx did not need a long stay to prove they could bite, and the win rate still looks cleaner than plenty of longer files.`,
            p20:`${s.wins}W from ${s.appearances} lobbies. DeadlySoaringSeagull6 does not clock in every night, but when they do the room has to take them seriously.`,
            p21:`${s.appearances} lobbies in and the first win is still waiting. Beedee4PF keeps answering the call anyway. That kind of patience usually gets paid eventually.`,
            p22:`Bxdguy is on the roster and waiting for the first real chapter. Right now the file is blank space and possibility.`,
            p23:`One lobby. One kill. ReyzinhoPL touched the board once and made it count. That line stays in the archive whether the next one comes tomorrow or months from now.`,
            p24:`${s.wins} wins, a 4-kill best game, ${s.appearances} lobbies. Web3guy tends to make sessions sharper when they are around. The room feels more competitive with that tag in it.`,
            p25:`Twelve wins from 33 lobbies and one of the best win rates among the regulars. FKxKingLurius is less about chaos than control. They read rooms, manage tempo, and close when the opening appears.`,
            p26:`Web3hustlre has a nameplate and an empty page waiting for ink. The first proper run writes the tone of the whole file.`,
            p27:`FKxPhanteon is registered. The rest of the story still belongs to whatever happens the next time the lobby opens.`,
            p28:`Lazerine is on the board and waiting for the room to meet them properly. Some files start quiet.`,
            p29:`${s.wins} wins from ${s.appearances} lobbies at a 35% win rate. ElderRovingWorm81 walked into Season 2 like they had already studied the room. Efficient, dangerous, very little wasted motion.${s2Note}`,
            p30:`Seven kills in a single lobby is still the all-time ceiling, and EZEDINEYoutube owns it. ${s.wins} wins, ${s.kills} kills, and the kind of upside that changes how people queue when they see the name.${s2Note}`,
            p31:`${s.appearances} games logged. Ironlover keeps coming back and keeps thickening the record. Not every story jumps. Some grow by return visits.`,
            p32:`KhingPilot touched one lobby and left a single entry in the archive. Short file, permanent mark.`,
            p33:`iVimXGF has one lobby on record and that is enough to be part of the story now. The archive keeps even the brief visits.`,
            p34:`${s.wins} wins and ${s.kills} kills from ${s.appearances} games. TMIyc does not play often, but the file says they do not waste appearances either.`,
            p35:`${s.appearances} lobbies and still answering the call. Demejii55 is building the kind of file that only needs one breakthrough night to look very different.`,
            p36:`${s.appearances} games logged. 0netwoo is laying the groundwork slowly. Quiet progress still counts as progress.`,
            p37:`FKxVanBR has the first lobby on record. That is how every file starts. The question is what comes after the opener.`,
          };
          return bios[pid]||`${s.wins}W and ${s.kills}K across ${s.appearances} lobbies.`;
        };
        const bio=getBio(p.id);
        const lvlData=getPlayerLevel(p.id);
        // Sparkline
        const pSess=[...sessions].filter(s=>s.attendees?.includes(p.id))
          .sort(compareSessionsDesc);
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
        const lastSeenLabel=diffDays===0?"Today":diffDays===1?"Yesterday":diffDays!=null?`${diffDays}d ago`:"Awaiting debut";

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
                color:"var(--text3)",marginBottom:10}}>OPEN A FILE</div>
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
                  {form.filter(f=>f.win).length>=4?"Running hot":
                   form.filter(f=>f.win).length>=2?"Holding steady":"Looking for a spark"}
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
                    {rivalWins}-{rivalLoss} in {topRival?.total||0} meetings
                  </div>
                </div>
              ):(
                <div style={{padding:"12px 14px",background:"rgba(255,255,255,.02)",
                  border:"1px solid rgba(255,255,255,.05)",borderRadius:"0 6px 6px 0",
                  borderLeft:"3px solid rgba(255,255,255,.1)",display:"flex",
                  alignItems:"center",justifyContent:"center"}}>
                  <div className="bc7" style={{fontSize:".7rem",color:"var(--text3)",
                    textAlign:"center",letterSpacing:".08em"}}>DUEL FILE STILL OPEN</div>
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
              All-time records · stories the room keeps bringing back
            </div>
          </div>
          {(()=>{
            const rec=getRecords();
            if(!rec)return <p style={{color:"var(--text3)",textAlign:"center"}}>The Vault opens once the room has history worth keeping.</p>;
            const topWinP=players.find(p=>p.id===rec.topWinner[0]);
            const topKillP=players.find(p=>p.id===rec.topKiller[0]);
            const topGameP=players.find(p=>p.id===rec.topGame.pid);
            const topDayP=players.find(p=>p.id===rec.topDay.pid);
            const streakP=players.find(p=>p.id===rec.bestStreak.pid);
            const firstWinP=players.find(p=>p.id===rec.first?.winner);
            const topDayKillP=players.find(p=>p.id===rec.topDayKill?.pid);
            const records=[
              {icon:"🏆",color:"#FFD700",title:"Most Wins All Time",  player:topWinP,  stat:`${rec.topWinner[1]} wins`,    sub:"Still the crown every closer is chasing"},
              {icon:"💀",color:"#FF4D8F",title:"Most Kills All Time",  player:topKillP, stat:`${rec.topKiller[1]} kills`,   sub:"The room's all-time damage line still runs through this file"},
              {icon:"☄️",color:"#FF6B35",title:"Highest Single Game",  player:topGameP, stat:`${rec.topGame.k}K`,           sub:`${rec.topGame.sid} · one burst the room still talks about from ${rec.topGame.date}`},
              {icon:"🔥",color:"#FF6B35",title:"Longest Win Streak",   player:streakP,  stat:`${rec.bestStreak.streak} in a row`, sub:"The cleanest run anyone has held together in one sitting"},
              {icon:"🌋",color:"#FF4D8F",title:"Most Kills in a Day",  player:topDayKillP, stat:`${rec.topDayKill?.k||0}K`, sub:rec.topDayKill?.date?`${rec.topDayKill.date} · the loudest session day on file`:"The room is still waiting for that kind of eruption"},
              {icon:"📆",color:"#00E5FF",title:"Most Lobbies in a Day",player:topDayP,  stat:`${rec.topDay.count} lobbies`, sub:`${rec.topDay.date} · the heaviest one-day grind the archive has seen`},
              {icon:"🎮",color:"#00FF94",title:"Total Sessions",       player:null,     stat:rec.totalSessions,             sub:`${[...new Set(sessions.map(s=>s.date))].length} session days since the room first went live`},
              {icon:"⚡",color:"#C77DFF",title:"First Ever Win",       player:firstWinP,stat:rec.first?.date||"Archive unopened", sub:rec.first?.id?`In ${rec.first.id} · the crown that started the whole file`:"The opening crown is still waiting"},
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
                    The loudest kill spike from each session night
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
                                {kkP?dn(kkP.username):"Night stayed quiet"}
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
                  Season 2 has not logged its opener yet
                </div>
                <p style={{color:"var(--text3)",fontSize:".85rem",fontWeight:600}}>
                  Once the first lobby is filed, the whole season board wakes up here.
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
                              {pickStats?`${pickStats.wins}W · ${pickStats.appearances} lobbies played`:"Yet to drop into S2"}
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
                              Waiting on their first drop into the season
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
                    {icon:"👑",color:"#00E5FF",title:"S2 Champion",player:byWins[0],stat:byWins[0]?`${byWins[0].wins}W · ${byWins[0].kills}K`:"Race still open",desc:"Currently carrying the season crown"},
                    {icon:"💀",color:"#FF4D8F",title:"S2 Reaper",player:byKills[0],stat:byKills[0]?`${byKills[0].kills} total kills`:"Board still open",desc:"Setting the damage line for the season"},
                    {icon:"🎮",color:"#00FF94",title:"Most Loyal",player:byApp[0],stat:byApp[0]?`${byApp[0].appearances} lobbies`:"Attendance still forming",desc:"Keeps answering the call and thickening the season file"},
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
            <p style={{color:"var(--text3)",fontWeight:800,fontSize:".7rem",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>Field notes before you drop in</p>
            <h2 style={{fontFamily:"Fredoka One",fontSize:"clamp(2rem,8vw,3.2rem)",
              background:"linear-gradient(135deg,#FFD700,#C77DFF,#00E5FF)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
              ❓ BRIEFING FILE
            </h2>
          </div>

          {/* ── Rank Titles ── */}
          <div style={{...card({border:"2px solid rgba(199,125,255,.3)"}),padding:26,marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <span style={{fontSize:"1.6rem"}}>🏅</span>
              <div>
                <h3 style={{fontFamily:"Fredoka One",color:"#C77DFF",fontSize:"1.3rem"}}>Callsigns: What They Mean</h3>
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>These titles sit under each player name. The top ones belong to one player at a time, until somebody takes them.</p>
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
                <h3 style={{fontFamily:"Fredoka One",color:"#FFD700",fontSize:"1.3rem"}}>Commendations: How to Earn Them</h3>
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>Badges stack, and the room remembers all of them. Tap to open a file note.</p>
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
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>What the board is actually telling you</p>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
              {[
                {icon:"🏆",term:"Wins",            color:"#FFD700",def:"How many lobbies you finished first in. Simple. You wore the crown that round."},
                {icon:"💀",term:"Kills",            color:"#FF4D8F",def:"Total eliminations across every lobby you have entered. Pressure leaves receipts."},
                {icon:"⚡",term:"K/G (Kills/Game)", color:"#00E5FF",def:"Total kills divided by lobbies played. A quick read on how much damage you bring each time you show."},
                {icon:"🎯",term:"Win Rate %",       color:"#00FF94",def:"Wins divided by appearances. How often you actually close the room once you are in it."},
                {icon:"📅",term:"Appearances",      color:"#FFAB40",def:"Every lobby you showed up for. The file respects attendance before it respects legacy."},
                {icon:"🌟",term:"Best Game",        color:"#C77DFF",def:"Your highest single-lobby kill count. The one night people bring up again later."},
                {icon:"🔥",term:"Win Streak",       color:"#FF6B35",def:"Consecutive wins on the same session day. It resets with a new date, so hot nights stand on their own."},
                {icon:"⚔️",term:"Duels (Rivals)",   color:"#FF4D8F",def:"Times you and another player finished first and second in the same lobby. The Rivals board tracks who blinked first."},
                {icon:"⚡",term:"Latest Day",       color:"#00E5FF",def:"Filters the Arena to the most recent session only. Good for seeing who owned the room last time out."},
                {icon:"🎖️",term:"Carry Score",     color:"#FF6B35",def:"Wins where you also led the lobby in kills. You closed it and did the lifting."},
                {icon:"🧱",term:"Consistency",      color:"#00FF94",def:"Percent of lobbies where you finished in the top half. Not flashy, but the room notices reliable players."},
                {icon:"🌵",term:"Drought",          color:"#FFAB40",def:"How many lobbies since your last win. Zero means your latest outing ended with the crown."},
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
                <h3 style={{fontFamily:"Fredoka One",color:"#C77DFF",fontSize:"1.3rem"}}>Levels: How They Climb</h3>
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>
                  XP builds every time you show up. Your level appears in the Arena and inside every Combat File.
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
                Level comes from total XP on a square-root curve, so the early jumps happen quickly and the higher ranks ask for real staying power.
                The mini bar in the Arena and your Combat File shows how close you are to the next level.
                Badges help a lot because each one adds 10 XP on top of whatever you already earned through wins, kills, and appearances.
                Big milestones do double duty. The 500 Kills badge, for example, lands after the long grind and still gives an extra push.
              </div>
            </div>
          </div>

          {/* ── General Questions ── */}
          <div style={{...card({border:"2px solid rgba(255,107,53,.25)"}),padding:26}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <span style={{fontSize:"1.6rem"}}>💬</span>
              <div>
                <h3 style={{fontFamily:"Fredoka One",color:"#FF6B35",fontSize:"1.3rem"}}>Room Questions</h3>
                <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>Schedule, rules, and how to get your name on the board. Tap to expand.</p>
              </div>
            </div>
            {[
              {q:"When do sessions run?",         a:"Mon-Sat, 5:00 PM to 7:00 PM UTC. Mekula hosts. Discord is where the warning siren goes out before the room opens."},
              {q:"How do I get added to the roster?",a:"Join the Discord and ask Mekula. Once your name is on the roster, your file starts tracking from the next session you play."},
              {q:"What is Bullet League?",        a:"Bullet League is the featured battleground for Games Night. Fast rounds, fast swings, and not much room to hide."},
              {q:"How are winners determined?",   a:"Whoever finishes first on the in-game leaderboard at the end of a round takes that lobby. The kill number beside each name is the confirmed damage for that round."},
              {q:"Why does my Win Rate show 0% even if I played?",a:"Win Rate only really comes alive once you close a lobby. Until then the file is still tracking your appearances, kills, and pressure. The first win unlocks the rest."},
              {q:"What is the Rivals page?",      a:"Rivals tracks the matchups that keep repeating. Every time two players finish first and second in the same lobby, the duel is logged and the rivalry grows."},
              {q:"How do I watch the stream?",   a:"Most sessions go live on Twitch at twitch.tv/mekulavick. The Twitch button in the nav takes you straight to the broadcast."},
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
                    color:"#fff",marginBottom:4}}>After-Action Report</div>
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
                    letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>🏆 Lobby Winners</div>
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
                        Top Fragger{recap.killKingsList?.length>1?" (Tied)":""}
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
                  📱 Grab a screenshot and send it to the squad
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
                  {l:"Top Fragger",v:tkKills+"K",c:"var(--orange)"},
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
                    textTransform:"uppercase",letterSpacing:1}}>Lobby Top Fragger</div>
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
          <div style={{fontFamily:"Barlow Condensed",fontWeight:800,
            fontSize:"clamp(.62rem,1.8vw,.8rem)",letterSpacing:".22em",
            color:`${lvlCard.color}99`,marginBottom:10,textTransform:"uppercase",
            animation:"lvlSub .35s ease both"}}>
            {lvlCard.fromLabel} TO {lvlCard.label}
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
          <div style={{fontFamily:"Barlow Condensed",fontWeight:700,
            fontSize:"clamp(.76rem,2vw,.95rem)",letterSpacing:".12em",
            color:"rgba(200,186,255,.72)",maxWidth:560,margin:"12px auto 0",
            lineHeight:1.5,animation:"lvlSub .45s ease .12s both"}}>
            {lvlCard.brief}
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
        {" · Hosted by "}{HOSTED_BY}{" · Mon-Sat 5-7 PM UTC · "}{FEATURED_GAME}
      </div>
      <div>Built for the community 💛</div>
    </footer>
  </>);
}
