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
  compareSessionsAsc,
  compareSessionsDesc,
  createNextPlayerId,
  createNextSessionId,
  getBadges as selectGetBadges,
  getBenchmark as selectGetBenchmark,
  getCarryScore as selectGetCarryScore,
  getChartData as selectGetChartData,
  getConsistency as selectGetConsistency,
  getDailyMVP as selectGetDailyMVP,
  getDailyOrdersScheduleState as selectGetDailyOrdersScheduleState,
  getDayRecap as selectGetDayRecap,
  getDayStorylines as selectGetDayStorylines,
  getDailyOrdersForPlayer as selectGetDailyOrdersForPlayer,
  getDaysActive as selectGetDaysActive,
  getDrought as selectGetDrought,
  getFormGuide as selectGetFormGuide,
  getHeadToHead as selectGetHeadToHead,
  getLiveDayStreak as selectGetLiveDayStreak,
  getLatestDayHeatRun as selectGetLatestDayHeatRun,
  getLastSeen as selectGetLastSeen,
  getLatestDayConsequences as selectGetLatestDayConsequences,
  getLatestSessionDate as selectGetLatestSessionDate,
  getLeaderboardShiftData as selectGetLeaderboardShiftData,
  getLiveStreaks as selectGetLiveStreaks,
  getMilestones as selectGetMilestones,
  getMissionBoardState as selectGetMissionBoardState,
  getOnDeckPressure as selectGetOnDeckPressure,
  getPressureQueue as selectGetPressureQueue,
  getPeriodSessions as selectGetPeriodSessions,
  getPlayerFileState as selectGetPlayerFileState,
  getPlayerLevel as selectGetPlayerLevel,
  getRank as selectGetRank,
  getRecords as selectGetRecords,
  getRivalryBoard as selectGetRivalryBoard,
  reconcileRivalOpsState as selectReconcileRivalOpsState,
  getRivals as selectGetRivals,
  getSeasonCampaignFile as selectGetSeasonCampaignFile,
  getSeasonOneWrap as selectGetSeasonOneWrap,
  getSeasonSessions as selectGetSeasonSessions,
  getSortedLeaderboard as selectGetSortedLeaderboard,
  sameRivalOpsState as selectSameRivalOpsState,
  getStats as selectGetStats,
  getStreak as selectGetStreak,
  formatOrdinal,
  parseSessionIdNumber,
} from "./game/selectors";
import {
  createStorageAdapter,
  pruneInvalidRivalOps,
  readRivalOpsState,
  setSelectedRivalOpId,
  writeRivalOpsState,
} from "./game/storage";
import {
  getNextSession,
  isEventActive,
  isFoolsDay,
  isLiveNow,
  scrambleName,
  todayStr,
} from "./game/time";
import {
  SEASON_TWO_ID,
  SEASON_TWO_LAUNCH_AT,
  SEASON_TWO_LAUNCH_DATE,
  SPECIAL_DATE_MARKERS,
  filterSessionsBySeason,
  getSeasonForDate,
} from "./game/seasons";
import { useGameData } from "./game/useGameData";
import WarRoomView from "./views/WarRoomView.jsx";
import CombatFileView from "./views/CombatFileView.jsx";
import VaultView from "./views/VaultView.jsx";
import ArenaView from "./views/ArenaView.jsx";
import Season2View from "./views/Season2View.jsx";
import RivalsView from "./views/RivalsView.jsx";
import HomeView from "./views/HomeView.jsx";

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
  html{scroll-behavior:auto;}
  body{background:var(--bg);font-family:'Nunito',sans-serif;color:var(--text);
    overflow-x:hidden;min-height:100vh;
    background-image:
      radial-gradient(ellipse at 15% 0%,rgba(199,125,255,.14) 0%,transparent 55%),
      radial-gradient(ellipse at 85% 100%,rgba(0,229,255,.09) 0%,transparent 55%);}
  input,textarea,select,button{font-family:'Nunito',sans-serif;}
  ::-webkit-scrollbar{width:6px;}
  ::-webkit-scrollbar-track{background:var(--bg2);}
  ::-webkit-scrollbar-thumb{background:var(--orange);border-radius:4px;}

  @keyframes fadeUp  {from{opacity:.92}to{opacity:1}}
  @keyframes popIn   {from{opacity:.92}to{opacity:1}}
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
  @keyframes zoneShellIn{from{opacity:.96}to{opacity:1}}
  @keyframes zoneSliceIn{from{opacity:.96}to{opacity:1}}
  @keyframes zoneReceiveAnchorIn{from{opacity:.96}to{opacity:1}}
  @keyframes zoneReceiveFollowIn{from{opacity:.96}to{opacity:1}}
  @keyframes dossierOpenIn{from{opacity:.96}to{opacity:1}}
  @keyframes stateSweep{0%{transform:translateX(-130%);opacity:0}18%{opacity:.4}55%{opacity:.92}100%{transform:translateX(130%);opacity:0}}
  @keyframes archiveCheckpointIn{from{opacity:0;transform:translateY(10px);filter:saturate(.9)}to{opacity:1;transform:translateY(0);filter:none}}
  @keyframes archiveReportIn{from{opacity:0;transform:translateY(12px) scale(.992)}to{opacity:1;transform:translateY(0) scale(1)}}
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

  .rival-heat-hero{
    text-align:center;
    margin-bottom:18px;
  }
  .rival-heat-search{
    position:relative;
    margin:0 auto 18px;
    max-width:760px;
  }
  .rival-heat-search-icon{
    position:absolute;
    left:14px;
    top:50%;
    transform:translateY(-50%);
    font-size:.92rem;
    pointer-events:none;
    opacity:.72;
  }
  .rival-ops-shell{
    display:grid;
    gap:20px;
    margin-bottom:18px;
    padding:4px 0 0;
    background:
      radial-gradient(circle at 20% 12%,rgba(255,77,143,.12),transparent 28%),
      radial-gradient(circle at 80% 38%,rgba(255,215,0,.08),transparent 30%);
  }
  .rival-ops-tier{
    display:grid;
    gap:9px;
    padding:0;
    border:0;
    background:transparent;
  }
  .rival-ops-tier-head{
    display:flex;
    align-items:flex-end;
    justify-content:space-between;
    gap:12px;
    padding:0 2px;
  }
  .rival-ops-tier-title{
    margin:0;
    color:var(--text2);
    font-family:"Fredoka One",sans-serif;
    font-size:.96rem;
  }
  .rival-ops-tier-count{
    color:var(--text3);
    font-size:.58rem;
    letter-spacing:.16em;
    text-transform:uppercase;
  }
  .rival-ops-track{
    display:grid;
    gap:10px;
  }
  .rival-ops-track.is-active{
    grid-template-columns:repeat(auto-fit,minmax(420px,1fr));
    gap:14px;
  }
  .rival-ops-track.is-watch{
    grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  }
  .rival-ops-track.is-cold{
    grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
    gap:7px;
  }
  .rival-ops-card{
    width:100%;
    display:block;
    text-align:left;
    cursor:default;
    padding:12px 14px 13px;
    border-radius:12px;
    border:1px solid rgba(255,255,255,.09);
    background:rgba(255,255,255,.04);
    color:#fff;
    appearance:none;
    -webkit-tap-highlight-color:transparent;
    touch-action:manipulation;
    transform:translateY(0) scale(1);
    transition:
      transform .14s cubic-bezier(.2,.9,.32,1),
      border-color .14s ease,
      background .14s ease,
      box-shadow .14s ease,
      color .14s ease;
    box-shadow:0 0 0 rgba(0,0,0,0);
  }
  .rival-ops-card:hover{
    border-color:rgba(255,77,143,.24);
  }
  .rival-ops-card.heat-active{
    min-height:150px;
    padding:17px 18px 18px;
    border-radius:16px;
    border-color:rgba(255,77,143,.5);
    border-left:4px solid #FF4D8F;
    background:
      linear-gradient(135deg,rgba(255,77,143,.2),rgba(0,0,0,.38) 62%),
      radial-gradient(circle at 96% 0,rgba(255,215,0,.18),transparent 28%);
    box-shadow:0 18px 42px rgba(255,77,143,.12),0 0 0 1px rgba(255,255,255,.04);
  }
  .rival-ops-card.heat-watch{
    min-height:124px;
    border-color:rgba(255,215,0,.26);
    border-left:3px solid rgba(255,215,0,.42);
    background:linear-gradient(135deg,rgba(255,215,0,.095),rgba(0,0,0,.31));
  }
  .rival-ops-card.heat-cold{
    padding:9px 11px;
    border-radius:9px;
    border-color:rgba(255,255,255,.065);
    background:rgba(255,255,255,.024);
    opacity:.7;
  }
  .rivalry-evidence-card{
    cursor:default;
  }
  .rival-card-mobile-chip{
    display:none;
  }
  .rival-card-matchup{
    display:grid;
    grid-template-columns:minmax(0,1fr) 88px minmax(0,1fr);
    align-items:center;
    gap:12px;
    margin-bottom:12px;
  }
  .rival-card-player{
    display:flex;
    align-items:center;
    gap:9px;
    min-width:0;
  }
  .rival-card-player-b{
    justify-content:flex-end;
    text-align:right;
  }
  .rival-card-score-lockup{
    min-width:82px;
    text-align:center;
  }
  .rival-card-evidence-row{
    display:grid;
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:6px;
    margin-bottom:10px;
    color:var(--text3);
    font-size:.62rem;
    font-weight:800;
    letter-spacing:.12em;
    text-transform:uppercase;
  }
  .rival-card-evidence-row span{
    min-width:0;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }
  .rival-card-foot{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    margin-bottom:6px;
  }
  .rival-card-pressure-line{
    color:var(--text2);
    font-size:.68rem;
    line-height:1.45;
  }
  .rival-ops-card-top{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
    margin-bottom:7px;
    flex-wrap:wrap;
  }
  .rival-ops-card-name{
    font-size:clamp(.94rem,2.6vw,1.04rem);
    color:#FF4D8F;
    letter-spacing:.04em;
    line-height:1.08;
    min-width:0;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }
  .heat-active .rival-ops-card-name{
    font-size:clamp(1.08rem,2.8vw,1.24rem);
    color:#ff5c9a;
  }
  .heat-watch .rival-ops-card-name{
    color:#ff6fa6;
  }
  .heat-cold .rival-ops-card-name{
    color:rgba(255,255,255,.66);
    font-size:.82rem;
  }
  .rival-ops-card-chip{
    flex-shrink:0;
    font-size:.6rem;
    letter-spacing:.18em;
    text-transform:uppercase;
    font-weight:800;
    color:rgba(255,255,255,.78);
  }
  .heat-active .rival-ops-card-chip{
    color:#FFD700;
  }
  .rival-ops-score-row{
    display:flex;
    align-items:baseline;
    gap:8px;
    margin-bottom:6px;
  }
  .rival-ops-score{
    color:#fff;
    font-size:1.2rem;
    line-height:1;
  }
  .heat-active .rival-ops-score{
    font-size:1.62rem;
    color:#fff;
  }
  .heat-cold .rival-ops-score{
    font-size:.92rem;
    color:rgba(255,255,255,.72);
  }
  .rival-ops-score-label{
    color:var(--text3);
    font-size:.52rem;
    letter-spacing:.14em;
    text-transform:uppercase;
  }
  .rival-ops-card-pressure{
    font-size:.7rem;
    color:var(--text2);
    line-height:1.48;
  }
  .heat-active .rival-ops-card-pressure{
    font-size:.78rem;
    color:rgba(255,255,255,.84);
  }
  .heat-cold .rival-ops-card-pressure{
    font-size:.64rem;
    color:rgba(255,255,255,.46);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .heat-cold .rival-card-matchup{
    grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);
    gap:8px;
    margin-bottom:7px;
  }
  .heat-cold .rival-card-evidence-row{
    margin-bottom:6px;
    font-size:.56rem;
    opacity:.78;
  }
  .heat-cold .rival-card-pressure-line{
    font-size:.58rem;
    color:rgba(255,255,255,.42);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .rival-ops-empty{
    padding:12px 14px;
    border-radius:12px;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.08);
  }
  .rival-ops-empty-title{
    font-size:.58rem;
    letter-spacing:.22em;
    color:rgba(255,77,143,.74);
    margin-bottom:6px;
  }
  .rival-ops-empty-line{
    font-size:.74rem;
    line-height:1.55;
    color:var(--text2);
  }
  .heat-tier-empty{
    padding:10px 12px;
    opacity:.72;
  }
  .h2h-secondary-tool summary::-webkit-details-marker{
    display:none;
  }
  .h2h-secondary-tool{
    opacity:.78;
  }
  @media(max-width:640px){
    .season-closed-state{
      grid-template-columns:1fr!important;
      gap:12px!important;
    }
    .season-closed-stats{
      grid-template-columns:repeat(3,minmax(0,1fr))!important;
    }
  }
  .pressure-queue-shell{
    display:grid;
    gap:10px;
    margin-bottom:24px;
  }
  .pressure-queue-head{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:12px;
  }
  .pressure-queue-title{
    margin:0;
    font-family:"Fredoka One",sans-serif;
    font-size:1rem;
    color:#fff;
  }
  .pressure-queue-grid{
    display:grid;
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:10px;
  }
  .pressure-queue-card{
    min-width:0;
    padding:12px 14px 13px;
    border-radius:12px;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.035);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.02);
  }
  .pressure-queue-label{
    font-size:.55rem;
    letter-spacing:.18em;
    text-transform:uppercase;
    margin-bottom:8px;
  }
  .pressure-queue-headline{
    font-size:.86rem;
    line-height:1.38;
    color:#fff;
    margin-bottom:6px;
  }
  .pressure-queue-detail{
    font-size:.7rem;
    line-height:1.58;
    color:var(--text2);
  }
  .pressure-queue-empty{
    padding:12px 14px;
    border-radius:12px;
    border:1px solid rgba(255,255,255,.08);
    background:rgba(255,255,255,.03);
    font-size:.78rem;
    line-height:1.55;
    color:var(--text2);
  }
  @media(max-width:720px){
    .rival-heat-hero{
      margin-bottom:14px;
    }
    .rival-heat-search{
      margin-bottom:18px;
    }
    .rival-ops-shell{
      gap:18px;
      margin-left:-2px;
      margin-right:-2px;
    }
    .rival-ops-tier{
      gap:7px;
    }
    .rival-ops-track.is-active,
    .rival-ops-track.is-watch,
    .rival-ops-track.is-cold{
      display:grid;
      grid-template-columns:none;
      grid-auto-flow:column;
      overflow-x:auto;
      padding:0 2px 6px;
      -webkit-overflow-scrolling:touch;
      scrollbar-width:none;
    }
    .rival-ops-track::-webkit-scrollbar{
      display:none;
    }
    .rival-ops-track.is-active{
      grid-auto-columns:minmax(270px,76vw);
      scroll-snap-type:x mandatory;
      gap:10px;
    }
    .rival-ops-track.is-watch{
      grid-auto-columns:minmax(220px,70vw);
      scroll-snap-type:x proximity;
      gap:10px;
    }
    .rival-ops-track.is-cold{
      grid-auto-columns:minmax(190px,58vw);
      scroll-snap-type:x proximity;
      gap:8px;
    }
    .rival-ops-card{
      padding:11px 12px 12px;
      scroll-snap-align:start;
    }
    .rival-ops-card.heat-active{
      min-height:164px;
      padding:16px 15px;
      scroll-snap-align:start;
    }
    .rival-ops-card.heat-watch{
      min-height:120px;
      padding:12px 13px;
    }
    .rival-ops-card.heat-cold{
      min-height:0;
      padding:9px 10px;
    }
    .rival-card-mobile-chip{
      display:inline-flex;
      margin-bottom:9px;
      color:#FFD700;
      font-size:.58rem;
      letter-spacing:.18em;
    }
    .rival-card-matchup{
      display:block;
      margin-bottom:10px;
    }
    .rival-card-player,
    .rival-card-player-b{
      justify-content:flex-start;
      text-align:left;
      margin-bottom:5px;
    }
    .rival-card-player .av-wrap,
    .rival-card-player-b .av-wrap{
      display:none;
    }
    .rival-card-score-lockup{
      text-align:left;
      margin:7px 0 0;
    }
    .rival-card-evidence-row{
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:5px;
      font-size:.55rem;
      letter-spacing:.08em;
    }
    .rival-card-foot{
      align-items:flex-start;
      margin-bottom:7px;
    }
    .rival-card-pressure-line{
      font-size:.66rem;
    }
    .rival-ops-card-top{
      gap:6px;
      margin-bottom:6px;
    }
    .rival-ops-card-name{
      font-size:.92rem;
    }
    .rival-ops-card-chip{
      width:auto;
      margin-left:auto;
      font-size:.57rem;
      letter-spacing:.14em;
      color:var(--text3);
    }
    .rival-ops-score{font-size:1.08rem;}
    .heat-active .rival-ops-score{font-size:1.55rem;}
    .heat-cold .rival-ops-score{font-size:.84rem;}
    .rival-ops-score-label{font-size:.49rem;}
    .rival-ops-card-pressure{
      font-size:.67rem;
    }
    .pressure-queue-grid{
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:8px;
    }
    .pressure-queue-card:nth-child(n+3){
      display:none;
    }
    .pressure-queue-card{
      padding:11px 12px 12px;
    }
    .pressure-queue-headline{
      font-size:.8rem;
      line-height:1.34;
    }
    .pressure-queue-detail{
      font-size:.66rem;
      line-height:1.52;
    }
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
    transition:background .12s ease;
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

  .zone-view-shell{
    width:100%;
    animation:none;
  }
  .zone-arrival-slice{
    opacity:1;
    animation:none;
  }
  .zone-receive-anchor{
    opacity:1;
    transform-origin:top left;
    animation:none;
  }
  .zone-receive-follow{
    opacity:1;
    animation:none;
  }
  .motion-reveal{
    opacity:1;
    transform:none;
    filter:none;
  }
  .motion-reveal.is-visible{
    opacity:1;
    transform:none;
    filter:none;
    transition:none;
    transition-delay:0ms;
  }
  .dossier-open-shell{
    display:grid;
    gap:0;
  }
  .dossier-open-step{
    opacity:1;
    animation:none;
  }
  .state-react-card{
    position:relative;
    overflow:hidden;
    isolation:isolate;
  }
  .state-react-card::after{
    content:"";
    position:absolute;
    inset:-1px;
    background:linear-gradient(110deg,transparent 0%,rgba(255,255,255,.05) 42%,rgba(255,255,255,.14) 50%,transparent 58%);
    transform:translateX(-130%);
    opacity:0;
    pointer-events:none;
    mix-blend-mode:screen;
  }
  .state-react-card.state-react-live::after{
    animation:none;
  }
  .archive-rhythm-break{
    position:relative;
  }
  .archive-rhythm-card{
    transform-origin:top left;
  }
  .archive-entry-break{
    opacity:1;
    animation:none;
  }
  .archive-entry-break .warroom-night-pill{
    box-shadow:0 0 0 1px rgba(255,255,255,.04),0 0 18px rgba(255,77,143,.08);
  }
  .archive-entry-card{
    opacity:1;
    transform-origin:top left;
    animation:none;
  }

  @media(max-width:640px){
    .zone-view-shell,
    .zone-arrival-slice,
    .zone-receive-anchor,
    .zone-receive-follow,
    .archive-entry-break,
    .archive-entry-card{
      animation:none!important;
      opacity:1!important;
      transform:none!important;
    }
    .state-react-card::after{
      animation:none!important;
      opacity:0!important;
    }
    .motion-reveal,
    .motion-reveal.is-visible,
    .motion-reveal.is-hidden{
      transition:none!important;
      transition-delay:0ms!important;
    }
    .zone-glow-orb{
      transition:none!important;
    }
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
    main{padding-left:12px!important;padding-right:12px!important;overflow-x:hidden!important;}
    .combat-picker-shell{
      padding:12px!important;
      border:1px solid rgba(255,255,255,.06);
      border-radius:10px;
      background:rgba(255,255,255,.025);
    }
    .combat-selector{
      display:grid!important;
      grid-template-columns:1fr;
      gap:10px!important;
      max-height:248px;
      overflow:auto;
      align-content:start;
      padding-right:2px;
    }
    .combat-selector button{
      display:flex!important;
      align-items:center!important;
      justify-content:flex-start!important;
      text-align:left!important;
      font-size:.76rem!important;
      padding:11px 13px!important;
      min-height:50px!important;
      line-height:1.25!important;
      letter-spacing:.03em!important;
      border-radius:8px!important;
    }
    .combat-picker-label-mobile{
      display:-webkit-box!important;
      -webkit-line-clamp:2;
      -webkit-box-orient:vertical;
      white-space:normal;
      overflow:hidden;
      max-width:100%;
      text-transform:none;
      font-weight:800;
      line-height:1.3;
      word-break:break-word;
    }
    .stat-strip-mob{grid-template-columns:repeat(2,1fr)!important;}
    .arena-row .mob-hide{display:none!important;}
    .badge-flip-wrap{width:calc(50% - 3px)!important;height:58px!important;}
    .records-grid{grid-template-columns:1fr!important;}
    .kill-king-grid{grid-template-columns:72px 1fr!important;}
    .zone-rail{top:58px;padding:10px 12px 11px!important;align-items:flex-start!important;gap:10px!important;}
    .zone-rail-chip{gap:8px!important;align-items:flex-start!important;}
    .zone-rail-label{font-size:.68rem!important;letter-spacing:.16em!important;}
    .zone-rail-brief{font-size:.68rem!important;line-height:1.5!important;white-space:normal!important;}
    .mob-menu{padding:10px 0 14px!important;box-shadow:0 10px 28px rgba(0,0,0,.28);}
    .mob-item{padding:14px 20px!important;font-size:.88rem!important;line-height:1.3!important;min-height:48px!important;}
    .home-mobile-shell .home-hero-block{margin-bottom:28px!important;}
    .home-mobile-shell .home-stat-strip{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;border:none!important;overflow:visible!important;background:none!important;margin-bottom:26px!important;}
    .home-mobile-shell .home-stat-strip>div{border:1px solid rgba(255,255,255,.07)!important;border-radius:8px!important;background:rgba(255,255,255,.03)!important;padding:14px 10px 13px!important;}
    .home-mobile-shell .home-pulse-grid{gap:12px!important;margin-bottom:30px!important;}
    .home-mobile-shell .home-pulse-grid>div{min-height:auto!important;padding:16px 16px 17px!important;}
    .home-stage-shell{margin-bottom:34px!important;}
    .home-stage-head{margin-bottom:18px!important;}
    .home-stage-row{gap:10px!important;}
    .home-stage-title{font-size:.78rem!important;line-height:1.72!important;max-width:none!important;}
    .home-stage-sub{font-size:.58rem!important;letter-spacing:.18em!important;padding-bottom:0!important;}
    .briefing-feed{padding:17px 14px 18px!important;}
    .briefing-row{
      grid-template-columns:18px minmax(0,1fr)!important;
      gap:11px!important;
      padding:12px 10px 18px!important;
      margin:0!important;
      border-radius:10px!important;
      border:1px solid transparent;
    }
    .briefing-row:nth-child(odd){
      background:rgba(255,255,255,.028)!important;
      border-color:rgba(255,255,255,.045)!important;
    }
    .briefing-row:nth-child(even){
      background:rgba(0,0,0,.12)!important;
      border-color:rgba(255,255,255,.035)!important;
    }
    .briefing-row+.briefing-row{margin-top:6px!important;}
    .briefing-copy{font-size:.77rem!important;line-height:1.92!important;}
    .briefing-trace{margin-top:12px!important;}
    .after-action-card{padding:17px 16px 18px!important;}
    .after-action-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;border:none!important;overflow:visible!important;margin-bottom:20px!important;}
    .after-action-stats>div{border:1px solid rgba(255,255,255,.07)!important;border-radius:8px!important;background:rgba(255,255,255,.03)!important;padding:12px 9px 11px!important;}
    .after-action-group{gap:12px!important;padding:16px 14px 0!important;margin-left:0!important;margin-right:0!important;}
    .after-action-mvp{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;}
    .after-action-rollup{margin-top:18px!important;padding-top:18px!important;font-size:.7rem!important;line-height:1.9!important;}
    .combat-file-page .combat-file-selector{margin-bottom:22px!important;}
    .combat-file-page .combat-file-hero{padding:15px 14px!important;margin-bottom:14px!important;}
    .combat-file-page .combat-file-summary{
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:8px!important;
      margin-top:10px!important;
      align-items:stretch!important;
    }
    .combat-file-page .combat-file-summary-chip{
      min-width:0;
      padding:8px 10px!important;
      border:1px solid rgba(255,255,255,.08);
      border-radius:8px;
      background:rgba(255,255,255,.03);
      justify-content:flex-start!important;
    }
    .combat-file-page .combat-file-summary-chip.level{
      grid-column:1 / -1;
    }
    .combat-file-page .combat-file-summary-chip .summary-copy{
      min-width:0;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .combat-file-page .living-dossier-identity{align-items:flex-start!important;}
    .combat-file-page .living-duel-rail{flex-wrap:wrap!important;gap:6px!important;border:none!important;overflow:visible!important;}
    .combat-file-page .living-duel-rail>div{flex:1 1 calc(50% - 6px)!important;border:1px solid rgba(255,255,255,.07)!important;border-radius:8px!important;background:rgba(255,255,255,.03)!important;}
    .combat-file-page .living-dossier-pressure{margin-top:12px!important;}
    .combat-file-page .living-core-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;border:none!important;overflow:visible!important;}
    .combat-file-page .living-core-stats>div{border:1px solid rgba(255,255,255,.07)!important;border-radius:8px!important;background:rgba(255,255,255,.03)!important;padding:11px 8px 10px!important;}
    .combat-file-page .combat-file-dossier{grid-template-columns:1fr!important;gap:10px!important;margin-bottom:14px!important;}
    .combat-file-page .combat-orders-grid{grid-template-columns:1fr!important;gap:10px!important;}
    .combat-file-page .combat-file-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;border:none!important;overflow:visible!important;}
    .combat-file-page .combat-file-stats>div{border:1px solid rgba(255,255,255,.07)!important;border-radius:8px!important;background:rgba(255,255,255,.03)!important;padding:11px 8px 10px!important;}
    .combat-file-page .combat-file-duo{grid-template-columns:1fr!important;gap:10px!important;}
    .warroom-hero{padding:18px 16px!important;}
    .warroom-summary-grid{grid-template-columns:1fr!important;gap:8px!important;margin-top:16px!important;}
    .warroom-filter-card{padding:16px!important;}
    .warroom-filter-head{margin-bottom:14px!important;gap:10px!important;}
    .warroom-filter-grid{grid-template-columns:1fr!important;gap:10px!important;}
    .warroom-active-trail{margin-top:14px!important;gap:12px!important;}
    .warroom-active-trail .trail-items{gap:6px!important;}
    .warroom-results-row{gap:6px!important;margin-bottom:4px!important;}
    .warroom-night-break{gap:6px!important;}
    .warroom-night-pill{font-size:.58rem!important;letter-spacing:.12em!important;line-height:1.6!important;padding:7px 10px!important;}
    .warroom-report-card{padding:16px!important;}
    .warroom-report-top{gap:12px!important;padding-left:0!important;}
    .warroom-room-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;width:100%!important;min-width:0!important;padding-left:0!important;}
    .warroom-beat-tags{gap:6px!important;margin-top:12px!important;}
    .warroom-beat-tags>div{padding:5px 8px!important;font-size:.54rem!important;}
    .warroom-beat-tags>div:nth-child(n+4){display:none!important;}
    .warroom-placements{padding-left:0!important;gap:6px!important;}
    .warroom-endchips{padding-left:0!important;gap:6px!important;}
    .season2-top-shell .season2-banner{padding:20px 15px!important;margin-bottom:24px!important;}
    .season2-top-shell .season2-banner-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;}
    .season2-top-shell .season2-banner-copy{margin-top:16px!important;padding-top:16px!important;gap:9px!important;}
    .season2-top-shell .season2-marker-grid{grid-template-columns:1fr!important;gap:8px!important;}
  }
  @media(min-width:900px){
    .season2-top-shell .season2-hero-block{margin-bottom:24px!important;}
  }
  @media(max-width:400px){
    .bc9.hero-big{font-size:clamp(2.8rem,16vw,5rem)!important;}
    .combat-selector{max-height:264px;}
    .combat-file-page .combat-file-summary{grid-template-columns:1fr!important;}
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
    animation:none;
  }
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
    display:none;
  }
  .zone-rail-status{
    display:none;
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
  @keyframes zoneRailRise{0%{opacity:0;transform:translateY(-8px)}100%{opacity:1;transform:translateY(0)}}
  @keyframes opsStripConfirm{0%{opacity:0;transform:translateY(-3px)}100%{opacity:1;transform:translateY(0)}}

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

const DEFAULT_LOBBY_LIMIT = 8;
const gameStore = createStorageAdapter();

const createFoolsConfetti = () => {
  const colors = [
    "#FF4D8F",
    "#FFD700",
    "#C77DFF",
    "#00E5FF",
    "#FF6B35",
    "#00FF94",
    "#FF6B6B",
    "#4ECDC4",
  ];

  return Array.from({ length: 20 }, (_, index) => ({
    id: index,
    color: colors[index % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 8,
  }));
};

// ═══════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════

function PlayerIntelCard({p,rank,form,drought,stats}){
  return(
    <div className="intel-card" style={{border:`1px solid ${p.color}44`,borderTop:`2px solid ${p.color}`}}>
      <div className="bc9" style={{fontSize:".72rem",color:p.color,letterSpacing:".07em",marginBottom:4}}>
        {rank.title}
      </div>
      <div style={{display:"flex",gap:3,marginBottom:6}}>
        {form.map((entry,index)=>(
          <div key={index} style={{width:8,height:8,borderRadius:"50%",
            background:entry.win?p.color:"rgba(255,255,255,.2)",
            boxShadow:entry.win?`0 0 5px ${p.color}88`:"none"}}/>
        ))}
      </div>
      <div className="bc7" style={{fontSize:".68rem",color:"#c8baff",letterSpacing:".05em"}}>
        {stats.wins}W · {stats.kills}K
        {drought>3&&<span style={{color:"#FF6B35",marginLeft:6}}>{drought}G drought</span>}
      </div>
    </div>
  );
}

function Avatar({p,size=44,glow=false,intel=null}){
  return(
    <div className="av-wrap">
      <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,
        background:`linear-gradient(135deg,${p.color},${p.color}88)`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontFamily:"Barlow Condensed",fontWeight:900,fontSize:size*.38+"px",color:"#fff",
        textShadow:"0 1px 4px rgba(0,0,0,.6)",
        boxShadow:glow?`0 0 24px ${p.color}66`:"none"}}>
        {p.username[0].toUpperCase()}
      </div>
      {intel}
    </div>
  );
}

export default function GameNight(){
  const foolsDay=isFoolsDay();
  const [view,       setView]      = useState("home");
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
  const [lbSeason,   setLbSeason]   = useState("s3");
  const [h2hA,       setH2hA]       = useState("");
  const [h2hB,       setH2hB]       = useState("");
  const [editingSess,setEditingSess] = useState(null);
  const [lobbyFilter,setLobbyFilter] = useState("");
  const [lobbyDate,  setLobbyDate]   = useState("");
  const [lobbySearch,setLobbySearch] = useState("");
  const [lobbyLimit, setLobbyLimit]  = useState(DEFAULT_LOBBY_LIMIT);
  const [zonePulse,  setZonePulse]    = useState(0);
  const [s2CdClock,  setS2CdClock]   = useState({d:0,h:0,m:0,s:0});

  const emptyForm=()=>({date:todayStr(),attendees:[],winner:"",kills:{},deaths:{},notes:"",placements:[],clip:""});
  const [sf,setSf]=useState(emptyForm());
  const [np,setNp]=useState({username:"",color:"#FFD700"});
  const [chartPid,setChartPid]=useState("");
  const [shareCard,setShareCard]=useState(null); // {sid, visible}
  const [confetti,setConfetti]=useState(()=>foolsDay?createFoolsConfetti():[]);
  const [foolsToast,setFoolsToast]=useState(0); // 0=hidden 1=warning 2=reveal
  const [dailyOrdersSchedule,setDailyOrdersSchedule]=useState(()=>selectGetDailyOrdersScheduleState());
  const [rivalOpsState,setRivalOpsState]=useState({ops:[],selectedOpId:null,lastResolvedOpId:null});
  const [rivalOpsLoaded,setRivalOpsLoaded]=useState(false);

  // ── Dual storage: window.storage (artifact) + localStorage (Netlify) ──
  const store=gameStore;
  const {
    players,
    setPlayers,
    sessions,
    setSessions,
    loaded,
    persist,
  } = useGameData({ store, view });

  // ── clock ──
  useEffect(()=>{
    const tick=()=>{
      const isLive=isLiveNow();
      setLive(isLive);
      const diff=getNextSession()-new Date();
      if(diff>0){
        const t=Math.floor(diff/1000);
        setCd({d:Math.floor(t/86400),h:Math.floor((t%86400)/3600),m:Math.floor((t%3600)/60),s:t%60});
      }else{
        setCd({d:0,h:0,m:0,s:0});
      }
    };
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const syncSchedule=()=>{
      const nextState=selectGetDailyOrdersScheduleState();
      setDailyOrdersSchedule((prev)=>
        prev.isActive===nextState.isActive&&
        prev.dayKey===nextState.dayKey&&
        prev.reopensLabel===nextState.reopensLabel
          ? prev
          : nextState,
      );
    };
    syncSchedule();
    const id=setInterval(syncSchedule,60*1000);
    return()=>clearInterval(id);
  },[]);

  // ── S2 launch countdown ──
  useEffect(()=>{
    if(todayStr()>=SEASON_TWO_LAUNCH_DATE)return;
    const tick=()=>{
      const s2Launch=new Date(SEASON_TWO_LAUNCH_AT);
      const diff=s2Launch-new Date();
      if(diff<=0){setS2CdClock({d:0,h:0,m:0,s:0});return;}
      const t=Math.floor(diff/1000);
      setS2CdClock({d:Math.floor(t/86400),h:Math.floor((t%86400)/3600),m:Math.floor((t%3600)/60),s:t%60});
    };
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[]);

  // ── April Fools: confetti burst + fake alert ──
  useEffect(()=>{
    if(!foolsDay)return;
    const t=setTimeout(()=>setConfetti([]),4000);
    // Fake alert — shows at 2s, changes at 5s, gone at 8s
    const t1=setTimeout(()=>setFoolsToast(1),2000);
    const t2=setTimeout(()=>setFoolsToast(2),5000);
    const t3=setTimeout(()=>setFoolsToast(0),8000);
    return()=>{clearTimeout(t);clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[foolsDay]);

  useEffect(()=>{
    if(typeof window==="undefined")return;
    const h=()=>setShowScroll(window.scrollY>320);
    window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);
  },[]);

  useEffect(()=>{
    let active=true;
    const bootRivalOps=async()=>{
      const persisted=await readRivalOpsState(store);
      if(!active)return;
      setRivalOpsState(persisted);
      setRivalOpsLoaded(true);
    };
    bootRivalOps();
    return()=>{active=false;};
  },[store]);

  useEffect(()=>{
    if(!loaded||!rivalOpsLoaded)return;
    const cleaned=pruneInvalidRivalOps(rivalOpsState,{players,sessions},todayStr());
    const nextState=selectReconcileRivalOpsState({players,sessions,rivalOpsState:cleaned},todayStr());
    if(selectSameRivalOpsState(cleaned,nextState))return;
    setRivalOpsState(nextState);
    writeRivalOpsState(store,nextState);
  },[loaded,rivalOpsLoaded,players,sessions,rivalOpsState,store]);

  const resetLobbyScope=()=>{
    setLobbyLimit(DEFAULT_LOBBY_LIMIT);
    setExpandedSid(null);
  };
  const updateLobbyFilter=value=>{
    setLobbyFilter(value);
    resetLobbyScope();
  };
  const updateLobbyDate=value=>{
    setLobbyDate(value);
    resetLobbyScope();
  };
  const updateLobbySearch=value=>{
    setLobbySearch(value);
    resetLobbyScope();
  };
  const clearLobbyFilters=()=>{
    setLobbyFilter("");
    setLobbyDate("");
    setLobbySearch("");
    resetLobbyScope();
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
    season2:  {label:"SEASON 3",      icon:"🚀",color:"#FF4D8F"},
    faq:      {label:"BRIEFING ROOM", icon:"❓",color:"#7B8CDE"},
    profile:  {label:"COMBAT FILE",   icon:"👤",color:"#FF6B35"},
    admin:    {label:"COMMAND",       icon:"⚙️",color:"#FF5252"},
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
  const go=v=>{
    setMobileOpen(false);
    if(v!==view){
      setView(v);
      setZonePulse((count)=>count+1);
      scrollToTop("auto");
      return;
    }
    scrollToTop("smooth");
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
  const getStats=(pid,src=sessions)=>selectGetStats(pid,src);
  const allStats=(src=sessions)=>selectAllStats(players,src);
  const getRank=pid=>selectGetRank(pid,players,sessions);
  const getStreak=(pid,src=sessions)=>selectGetStreak(pid,src);
  const getBadges=pid=>selectGetBadges(pid,sessions);
  const getPlayerLevel=pid=>selectGetPlayerLevel(pid,sessions);
  const getPlayerFileState=pid=>selectGetPlayerFileState(pid,players,sessions,{seasonId:activeCampaignId});
  const getDailyMVP=()=>selectGetDailyMVP(sessions,players);
  const getRivals=()=>selectGetRivals(sessions);
  const getSeasonSessions=sid=>selectGetSeasonSessions(sessions,sid);
  const getMissionBoardState=()=>selectGetMissionBoardState(sessions,players);
  const getRecords=()=>selectGetRecords(sessions,players);
  const getChartData=pid=>selectGetChartData(pid,sessions);
  const getLiveStreaks=()=>selectGetLiveStreaks(sessions,players);
  const getLatestDayHeatRun=(date=getLatestSessionDate())=>selectGetLatestDayHeatRun(sessions,players,date);
  const getDayRecap=date=>selectGetDayRecap(date,sessions,players);
  const getDayStorylines=date=>selectGetDayStorylines(date,sessions,players);
  const getDailyOrdersForPlayer=pid=>
    selectGetDailyOrdersForPlayer(pid,players,sessions,{
      dayKey:dailyOrdersSchedule.dayKey,
      isActiveWindow:dailyOrdersSchedule.isActive,
    });
  const getLatestDayConsequences=date=>selectGetLatestDayConsequences(sessions,players,date);
  const getLeaderboardShiftData=(seasonId="all",period=lbPeriod,sortKey=sortBy)=>
    selectGetLeaderboardShiftData(players,sessions,{seasonId,period,sortBy:sortKey});
  const getOnDeckPressure=(options)=>selectGetOnDeckPressure(sessions,players,options);
  const getPressureQueue=(options)=>selectGetPressureQueue({players,sessions,rivalOpsState},options);
  const getFormGuide=(pid,n=5)=>selectGetFormGuide(pid,sessions,n);
  const getLiveDayStreak=pid=>selectGetLiveDayStreak(pid,sessions);
  const getCarryScore=(pid,src=sessions)=>selectGetCarryScore(pid,src);
  const getDrought=pid=>selectGetDrought(pid,sessions);
  const getConsistency=(pid,src=sessions)=>selectGetConsistency(pid,src);
  const getMilestones=pid=>selectGetMilestones(pid,sessions);
  const getBenchmark=pid=>selectGetBenchmark(pid,players,sessions);
  const getLastSeen=pid=>selectGetLastSeen(pid,sessions);
  const getDaysActive=pid=>selectGetDaysActive(pid,sessions);
  const buildSeasonCampaignFile=(seasonSessions)=>
    selectGetSeasonCampaignFile(seasonSessions,players);
  const renderPlayerIntel=p=>{
    if(!p?.id)return null;
    return(
      <PlayerIntelCard
        p={p}
        rank={getRank(p.id)}
        form={getFormGuide(p.id,5)}
        drought={getDrought(p.id)}
        stats={getStats(p.id)}
      />
    );
  };

  const joinHumanList=(items)=>{
    const list=items.filter(Boolean);
    if(!list.length)return"";
    if(list.length===1)return list[0];
    if(list.length===2)return`${list[0]} and ${list[1]}`;
    return`${list.slice(0,-1).join(", ")}, and ${list[list.length-1]}`;
  };

  // ── Storylines engine: 8 lines, human, passionate, varied, no em dashes ──
  const getStorylines=()=>{
    if(!sessions.length||!players.length)return[];
    const latestDate=getLatestSessionDate();
    if(!latestDate)return[];
    const latestFallout=getLatestDayConsequences(latestDate);
    const allSt=allStats();
    const campaignSess=filterSessionsBySeason(sessions,activeCampaignId);
    const campaignStats=allStats(campaignSess).filter(p=>p.appearances>0);
    const latestSess=sessions.filter(s=>s.date===latestDate);
    const seed=parseInt(latestDate.replace(/-/g,"").slice(-3),10)||0;
    const candidates=[];
    const addCandidate=(icon,color,w,options)=>{
      const lines=Array.isArray(options)?options:[options];
      if(!lines.length)return;
      const index=(seed+candidates.length*3+w)%lines.length;
      candidates.push({icon,text:lines[index],color,w});
    };
    const latestTopKillers=latestFallout?.topKillers?.length
      ?latestFallout.topKillers
      :(latestFallout?.topKiller?.player?[latestFallout.topKiller]:[]);
    const latestTopKillerNames=latestTopKillers.length
      ?joinHumanList(latestTopKillers.map((entry)=>dn(entry.player?.username||"")))
      :"";
    const latestTopKillCount=latestTopKillers[0]?.kills||latestFallout?.topKiller?.kills||0;

    if(latestFallout?.topWinners.length===1&&latestTopKillers.length>1){
      const winnerName=dn(latestFallout.topWinners[0].player?.username||"");
      const winnerOwnsDamage=latestTopKillers.some((entry)=>entry.player?.id===latestFallout.topWinners[0].player?.id);
      addCandidate("⚡","#FFD700",10,[
        winnerOwnsDamage
          ?`${winnerName} owned the last session day with ${latestFallout.topWinCount} wins, and the damage race still ended level between ${latestTopKillerNames} at ${latestTopKillCount} kills each.`
          :`${winnerName} owned the last session day with ${latestFallout.topWinCount} wins, while ${latestTopKillerNames} tied on damage at ${latestTopKillCount} kills each.`,
        winnerOwnsDamage
          ?`${winnerName} took control of the wins column with ${latestFallout.topWinCount}, but ${latestTopKillerNames} still closed the day tied on damage at ${latestTopKillCount} each.`
          :`${winnerName} set the win pace with ${latestFallout.topWinCount} wins. The damage line still finished level between ${latestTopKillerNames} on ${latestTopKillCount} kills each.`,
      ]);
    }else if(latestFallout?.topWinners.length>=2&&latestTopKillers.length>1){
      const splitLeaders=joinHumanList(
        latestFallout.topWinners.map((entry)=>dn(entry.player?.username||"")),
      );
      addCandidate("⚡","#FFD700",10,[
        `${splitLeaders} split the last session day at ${latestFallout.topWinCount} wins each, and ${latestTopKillerNames} matched the damage line at ${latestTopKillCount} kills each.`,
        `${splitLeaders} finished level on wins, and ${latestTopKillerNames} left the damage race tied on ${latestTopKillCount} kills each.`,
      ]);
    }else if(latestFallout?.topWinners.length>=2&&latestFallout.topKiller?.player){
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
      const climbPlayer=latestFallout.biggestClimber?.player||latestFallout.topFiveShift?.player||null;
      const climbStats=climbPlayer?getStats(climbPlayer.id):null;
      const winsToLegend=climbStats&&climbStats.wins<10?10-climbStats.wins:null;
      const rankLine=latestFallout.biggestClimber
        ?`${latestFallout.biggestClimber.line.replace(/\.$/,"")}${latestFallout.biggestClimber.afterWins>0&&winsToLegend&&winsToLegend<=2?` and now sits ${winsToLegend} win${winsToLegend===1?"":"s"} from Legend`:""}`
        :"";
      addCandidate("🏁","#FFAB40",8,[
        [
          legendLine,
          killLine,
          rankLine,
        ].filter(Boolean).join(", ")+". The latest file changed more than the top row.",
        [
          rankLine,
          killLine,
          legendNames
            ?latestFallout.legendCrossers.length>1
              ?`${legendNames} both reached Legend`
              :`${legendNames} reached Legend`
            :"",
        ].filter(Boolean).join(", ")+". The room felt that shift right away.",
      ]);
    }

    const latestDateSessions=latestDate?sessions.filter((session)=>session.date===latestDate):[];
    const beforeLatestStats=latestDate
      ?allStats(sessions.filter((session)=>session.date<latestDate))
      :[];
    const latestOneKCrossers=allSt
      .filter((player)=>{
        const before=beforeLatestStats.find((entry)=>entry.id===player.id);
        const playedLatest=latestDateSessions.some((session)=>session.attendees?.includes(player.id));
        return playedLatest&&(before?.kills||0)<1000&&player.kills>=1000;
      })
      .sort((left,right)=>right.kills-left.kills);
    if(latestOneKCrossers.length){
      const oneKPlayer=getPlayer(latestOneKCrossers[0].id);
      if(oneKPlayer){
        addCandidate("👹","#FF4D8F",9,[
          `${dn(oneKPlayer.username)} crossed 1,000 all-time kills. That is no longer a hot streak, it is permanent damage on the record.`,
          `${dn(oneKPlayer.username)} broke the 1,000-kill line and turned the damage board into a legacy file.`,
        ]);
      }
    }

    const weeklyShift=getLeaderboardShiftData("all","week","wins");
    const weeklyClimbPlayer=weeklyShift.biggestRise?.player||null;
    if(weeklyClimbPlayer&&weeklyShift.biggestRise?.delta&&weeklyShift.biggestRise.delta>=3){
      const weeklyClimbStats=getStats(weeklyClimbPlayer.id);
      const killGapToTwoHundred=weeklyClimbStats.kills<200?200-weeklyClimbStats.kills:null;
      addCandidate("📈","#00E5FF",7,[
        killGapToTwoHundred&&killGapToTwoHundred<=6
          ?`${dn(weeklyClimbPlayer.username)} jumped ${weeklyShift.biggestRise.delta} places on this week's board and now sits ${killGapToTwoHundred} kills from 200 all time.`
          :`${dn(weeklyClimbPlayer.username)} made the sharpest move on this week's board with a ${weeklyShift.biggestRise.delta}-place jump.`,
        killGapToTwoHundred&&killGapToTwoHundred<=6
          ?`${dn(weeklyClimbPlayer.username)} is the weekly mover right now, up ${weeklyShift.biggestRise.delta} spots and only ${killGapToTwoHundred} kills from 200 overall.`
          :`${dn(weeklyClimbPlayer.username)} climbed ${weeklyShift.biggestRise.delta} places on this week's board. That is the freshest move still hanging over the room.`,
      ]);
    }

    if(latestFallout?.mekulaTeriqPressure&&latestFallout.mekulaTeriqPressure.totalDelta>0){
      const rivalry=latestFallout.mekulaTeriqPressure;
      addCandidate("⚔️","#FF4D8F",7,[
        `${dn(rivalry.leader.username)} pushed the duel board against ${dn(rivalry.trailer.username)} to ${rivalry.leaderWins}-${rivalry.trailerWins} across ${rivalry.total} top-two meetings.`,
        `${dn(rivalry.leader.username)} added ${rivalry.leaderDelta} more top-two wins over ${dn(rivalry.trailer.username)}. That rivalry is now sitting at ${rivalry.leaderWins}-${rivalry.trailerWins}.`,
      ]);
    }

    const seasonWins=[...campaignStats].sort((a,b)=>b.wins-a.wins||b.kills-a.kills);
    const seasonLeader=seasonWins[0];
    const seasonChaser=seasonWins[1];
    if(seasonLeader&&seasonChaser){
      const leaderPlayer=getPlayer(seasonLeader.id);
      const chasePlayer=getPlayer(seasonChaser.id);
      const gap=seasonLeader.wins-seasonChaser.wins;
      if(leaderPlayer&&chasePlayer){
        if(activeCampaignClosed){
          addCandidate("👑","#FFD700",6,[
            `${dn(leaderPlayer.username)} finished ${activeCampaign.name} ${gap} wins clear with ${seasonLeader.wins} on the board. ${dn(chasePlayer.username)} closes the file in second.`,
            `${activeCampaign.name} is locked with ${dn(leaderPlayer.username)} on ${seasonLeader.wins} wins and ${dn(chasePlayer.username)} next at ${seasonChaser.wins}. That chase is record now.`,
          ]);
        }else if(gap===0){
          addCandidate("👑","#FFD700",6,[
            `${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are tied on ${activeCampaign.name} wins. One clean finish changes the whole room.`,
            `${dn(leaderPlayer.username)} and ${dn(chasePlayer.username)} are level at the top of ${activeCampaign.name}. The next crown breaks the calm.`,
          ]);
        }else if(gap===1){
          addCandidate("👑","#FFD700",6,[
            `${dn(leaderPlayer.username)} has one win of daylight over ${dn(chasePlayer.username)} in ${activeCampaign.name}. That is barely breathing room.`,
            `${dn(leaderPlayer.username)} leads ${activeCampaign.name} by a single lobby. ${dn(chasePlayer.username)} is close enough to turn the table tonight.`,
          ]);
        }else{
          addCandidate("👑","#FFD700",5,[
            `${dn(leaderPlayer.username)} is ${gap} wins clear in ${activeCampaign.name} with ${seasonLeader.wins} on the board. ${dn(chasePlayer.username)} still has them in sight.`,
            `${dn(leaderPlayer.username)} has built a ${gap}-win edge in ${activeCampaign.name}. ${dn(chasePlayer.username)} needs a heavy session to drag that back.`,
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
      if(runPlayer){
        if(latestRun[1]>=3){
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

    const latestHeatRun=getLatestDayHeatRun();
    if(latestHeatRun?.player&&latestHeatRun.streak>=2){
      const hottest=latestHeatRun.player;
      if(latestHeatRun.streak>=2){
        addCandidate("🔥","#FF6B35",5,[
          `${dn(hottest.username)} had the cleanest run on the last session day at ${latestHeatRun.streak} straight wins. The room is waiting to see if that heat carries.`,
          `${dn(hottest.username)} put together ${latestHeatRun.streak} wins in a row on the last session day. Nobody queues into that casually.`,
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

    const rising=[...campaignStats]
      .filter((player)=>player.appearances>=3&&player.wins>=2)
      .sort((a,b)=>b.wins-a.wins||b.winRate-a.winRate)
      .find((player)=>(allSt.find((entry)=>entry.id===player.id)?.wins||0)<=8);
    if(rising){
      const risingPlayer=getPlayer(rising.id);
      if(risingPlayer){
        addCandidate("🎯","#00E5FF",3,[
          `${dn(risingPlayer.username)} has become one of the live ${activeCampaign.name} stories with ${rising.wins} wins already. The room is paying attention now.`,
          `${dn(risingPlayer.username)} is climbing fast in ${activeCampaign.name}. ${rising.wins} wins on the sheet and the confidence is starting to show.`,
        ]);
      }
    }

    candidates.sort((a,b)=>b.w-a.w||((seed+a.text.length)%9)-((seed+b.text.length)%9));
    return candidates.slice(0,8).map(({icon,text,color})=>({icon,text,color}));
  };

  const getScopedSessions=(seasonId="all",period="all")=>{
    const seasonSessions=seasonId==="all"?sessions:getSeasonSessions(seasonId);
    return selectGetPeriodSessions(seasonSessions,period);
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
    const newP=[...players,{id:createNextPlayerId(players),username:np.username.trim(),color:np.color}];
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
  const activeCampaign=(()=>{
    const today=todayStr();
    return getSeasonForDate(today)
      || getSeasonForDate(getLatestSessionDate())
      || [...SEASONS].reverse().find((season)=>today>=season.start)
      || SEASONS[SEASONS.length-1];
  })();
  const activeCampaignId=activeCampaign?.id||SEASON_TWO_ID;
  const activeCampaignSessions=filterSessionsBySeason(sessions,activeCampaignId);
  const activeCampaignClosed=Boolean(activeCampaign?.end&&todayStr()>activeCampaign.end);
  const activeCampaignOpened=Boolean(activeCampaignSessions.length);
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
    {id:"season2",   l:activeCampaign?.name?.toUpperCase()||"CAMPAIGN"},
    {id:"faq",       l:"BRIEFING"},
  ];

  // ── April Fools display name — scrambles on Apr 1 ──
  const dn=(username)=>foolsDay?scrambleName(username):username;
  const formatLobbyDate=(date,opts={weekday:"short",day:"numeric",month:"short",year:"numeric"})=>
    new Date(date+"T12:00:00Z").toLocaleDateString("en-GB",opts);
  const getLobbyDateMarker=(date)=>{
    return SPECIAL_DATE_MARKERS[date]||null;
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
      pushTag("Room held","var(--text2)","rgba(255,255,255,.06)","rgba(255,255,255,.12)");
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
    const winnerKills=winner?(session.kills?.[winner.id]||0):0;
    const secondKills=second?(session.kills?.[second.id]||0):0;
    const thirdKills=third?(session.kills?.[third.id]||0):0;
    const quietRoom=totalKills<=Math.max(2,attendeeCount);
    const packedRoom=attendeeCount>=6;
    const firefight=totalKills>=Math.max(10,attendeeCount*2);
    const zeroKillWin=winner&&winnerKills===0;
    const lowKillWin=winner&&winnerKills<=1;
    const strangeFinish=winner&&tkP&&winner.id!==tkP.id&&tkK>=4;
    const messyRoom=winner&&second&&third&&Math.abs(winnerKills-secondKills)<=1&&Math.abs(secondKills-thirdKills)<=1;
    const cleanClose=winner&&tkP&&winner.id===tkP.id&&winnerKills>=Math.max(3,Math.ceil(totalKills/3));
    const chooseLine=(variants)=>{
      if(!variants.length)return "";
      const seed=`${session.id}|${winner?.id||""}|${second?.id||""}|${third?.id||""}|${tkP?.id||""}|${attendeeCount}|${totalKills}|${winnerKills}|${secondKills}|${thirdKills}|${tkK}`;
      let hash=0;
      for(let index=0;index<seed.length;index+=1){
        hash=((hash*33)+seed.charCodeAt(index))>>>0;
      }
      return variants[hash%variants.length];
    };

    if(zeroKillWin&&second){
      return chooseLine([
        `${dn(winner.username)} left ${session.id} with the win and no kills on the sheet. ${dn(second.username)} did the damage, but the room still broke the other way.`,
        `${session.id} ended in strange fashion. ${dn(winner.username)} took it without landing a kill, while ${dn(second.username)} still had to watch the room slip away.`,
        `${dn(winner.username)} walked out of ${session.id} on pure survival nerve. Zero kills, first place, and everyone else left arguing about how that happened.`,
      ]);
    }
    if(cleanClose&&tkK>=5){
      return chooseLine([
        `${dn(winner.username)} owned ${session.id} from the front, put up ${tkK} kills, and never let the room reopen behind them.`,
        `${dn(winner.username)} made ${session.id} look settled early, stacked ${tkK} kills, and kept everyone else chasing the same door all night.`,
        `${dn(winner.username)} closed ${session.id} with the cleanest hand on file, carrying both the win and the damage line at ${tkK} kills.`,
      ]);
    }
    if(strangeFinish&&tkP){
      return chooseLine([
        `${dn(winner.username)} took the room, but ${dn(tkP.username)} still left the deeper damage scar at ${tkK} kills. ${session.id} did not end the way the numbers hinted.`,
        `${session.id} went sideways late. ${dn(winner.username)} held onto the win while ${dn(tkP.username)} walked away with the heaviest damage line.`,
        `${dn(tkP.username)} did the bleeding in ${session.id}, but ${dn(winner.username)} still closed the file. That is the kind of finish people keep talking through on the way out.`,
      ]);
    }
    if(winner&&second&&third&&firefight){
      return chooseLine([
        `${dn(winner.username)} came through the loudest stretch of ${session.id}, keeping ${dn(second.username)} and ${dn(third.username)} behind them while the room tore through ${totalKills} kills.`,
        `${session.id} turned into a damage room fast. ${dn(winner.username)} still came out first with ${dn(second.username)} and ${dn(third.username)} hanging close behind.`,
        `${totalKills} kills went on the report in ${session.id}, and ${dn(winner.username)} was the one who still had daylight when it finally settled.`,
      ]);
    }
    if(winner&&second&&packedRoom){
      return chooseLine([
        `${dn(winner.username)} came through a crowded ${attendeeCount}-player room and kept ${dn(second.username)} reaching for it the whole way.`,
        `${attendeeCount} players piled into ${session.id}, and ${dn(winner.username)} still gave ${dn(second.username)} nothing easy at the finish.`,
        `${session.id} had bodies everywhere, but ${dn(winner.username)} still found the cleanest way out with ${dn(second.username)} right behind.`,
      ]);
    }
    if(winner&&second&&quietRoom){
      return chooseLine([
        `${dn(winner.username)} took a quiet ${session.id} over ${dn(second.username)}. Nobody cracked the room open, so the finish did all the talking.`,
        `${session.id} stayed tight and low on damage. ${dn(winner.username)} still edged past ${dn(second.username)} when there was almost nothing loose to punish.`,
        `${dn(winner.username)} got through a low-noise room against ${dn(second.username)}. It was a finish built on small margins, not chaos.`,
      ]);
    }
    if(winner&&second&&third&&messyRoom){
      return chooseLine([
        `${session.id} never really picked one clean shape. ${dn(winner.username)}, ${dn(second.username)}, and ${dn(third.username)} stayed tangled until the last stretch.`,
        `${dn(winner.username)} got out of a messy room with ${dn(second.username)} and ${dn(third.username)} still close enough to matter at the line.`,
        `${session.id} stayed crowded at the top all the way through, and ${dn(winner.username)} was the one who finally came out of the tangle first.`,
      ]);
    }
    if(winner&&second&&lowKillWin){
      return chooseLine([
        `${dn(winner.username)} took ${session.id} without needing much damage. ${dn(second.username)} stayed close, but the room never gave them a clean swing.`,
        `${dn(winner.username)} walked off with a low-kill win in ${session.id}. ${dn(second.username)} was close enough to feel it, but not enough to turn it.`,
        `${session.id} was won on timing more than damage. ${dn(winner.username)} kept the edge over ${dn(second.username)} and did not need a big kill line to do it.`,
      ]);
    }
    if(winner&&second&&third){
      return chooseLine([
        `${dn(winner.username)} kept ${dn(second.username)} and ${dn(third.username)} close enough to matter, then still shut ${session.id} first.`,
        `${dn(second.username)} and ${dn(third.username)} stayed in the room all the way through ${session.id}, but ${dn(winner.username)} was still the one who finished on top.`,
        `${dn(winner.username)} got through a live room in ${session.id} with ${dn(second.username)} and ${dn(third.username)} still pulling at the result.`,
      ]);
    }
    if(winner){
      return chooseLine([
        `${dn(winner.username)} closed ${session.id} before the room could turn back on them.`,
        `${dn(winner.username)} kept control of ${session.id} when it mattered and left with the result.`,
        `${session.id} still finished in ${dn(winner.username)}'s hands once the last angle ran out.`,
      ]);
    }
    if(tkP&&tkK>0){
      return chooseLine([
        `${dn(tkP.username)} gave ${session.id} its sharpest moment with ${tkK} kills and forced the room to remember it that way.`,
        `${tkK} kills from ${dn(tkP.username)} was the cleanest scar ${session.id} left behind, even with no winner on file.`,
        `${session.id} is still mostly noise, but ${dn(tkP.username)} gave it one line worth keeping with ${tkK} kills.`,
      ]);
    }
    if(attendeeCount){
      return chooseLine([
        `${attendeeCount} players filed into ${session.id}, the room broke on ${totalKills} kills, and the report is still missing a clean owner.`,
        `${session.id} pulled in ${attendeeCount} players and ${totalKills} kills, but the file still reads more like fallout than closure.`,
        `${attendeeCount} players made noise in ${session.id}. ${totalKills} kills later, the room is still sitting on an unfinished report.`,
      ]);
    }
    return "This room is on file, but the battle report is still waiting on detail.";
  };
  const getLobbySearchHaystack=(session)=>{
    const winnerName=getPlayer(session.winner)?.username||"";
    const attendeeNames=(session.attendees||[]).map((pid)=>getPlayer(pid)?.username||"").join(" ");
    const note=hasCustomLobbyNote(session)?session.notes.trim():"";
    return `${session.id} ${session.date} ${winnerName} ${attendeeNames} ${note} ${getLobbyReport(session)}`.toLowerCase();
  };

  // ── TypedBio — proper component so it can use hooks ──
  // ── Badge flip — DOM classList toggle, no hooks ──

  if(!loaded)return(
    <div style={{minHeight:"100vh",background:"#0B0620"}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
    </div>
  );

  const arenaLatestDate=getLatestSessionDate();
  const arenaCurrentSeason=getSeasonForDate(arenaLatestDate)||SEASONS[SEASONS.length-1];
  const arenaScopeSessions=getScopedSessions(lbSeason,lbPeriod);
  const arenaScopeLatestDate=arenaScopeSessions.length?getLatestSessionDate(arenaScopeSessions):"";
  const arenaScopeKills=arenaScopeSessions.reduce(
    (total,session)=>total+Object.values(session.kills||{}).reduce((sum,kills)=>sum+kills,0),
    0,
  );
  const arenaScopeWinnerCount=[...new Set(arenaScopeSessions.filter((session)=>session.winner).map((session)=>session.winner))].length;
  const arenaWeekSessions=getScopedSessions("all","week");
  const arenaWeekFirstDate=arenaWeekSessions.length?[...arenaWeekSessions].sort(compareSessionsAsc)[0].date:"";
  const getArenaStats=pid=>selectGetStats(pid,arenaScopeSessions);
  const getArenaStreak=pid=>selectGetStreak(pid,arenaScopeSessions);
  const getArenaFormGuide=(pid,count=5)=>selectGetFormGuide(pid,arenaScopeSessions,count);
  const getArenaCarry=pid=>selectGetCarryScore(pid,arenaScopeSessions);
  const getArenaConsistency=pid=>selectGetConsistency(pid,arenaScopeSessions);
  const getArenaBenchmark=pid=>selectGetBenchmark(pid,players,arenaScopeSessions);
  const arenaRangeKey=lbPeriod==="today"
    ?"today"
    :lbPeriod==="week"
      ?"week"
      :lbSeason===arenaCurrentSeason.id
        ?"season"
        :"all";
  const arenaRangeOptions=[
    {
      id:"today",
      label:"⚡ LATEST DAY",
      sub:arenaLatestDate?formatLobbyDate(arenaLatestDate,{weekday:"short",day:"numeric",month:"short"}):"Most recent drop",
      color:"#00E5FF",
      seasonId:"all",
      period:"today",
    },
    {
      id:"week",
      label:"🔥 THIS WEEK",
      sub:arenaWeekFirstDate&&arenaLatestDate
        ?`${formatLobbyDate(arenaWeekFirstDate,{day:"numeric",month:"short"})} to ${formatLobbyDate(arenaLatestDate,{day:"numeric",month:"short"})}`
        :"Recent momentum",
      color:"#FF6B35",
      seasonId:"all",
      period:"week",
    },
    {
      id:"season",
      label:"🚀 SEASON",
      sub:`${arenaCurrentSeason.name} · ${arenaCurrentSeason.label}`,
      color:arenaCurrentSeason.color,
      seasonId:arenaCurrentSeason.id,
      period:"all",
    },
    {
      id:"all",
      label:"🌐 ALL TIME",
      sub:`${sessions.length} lobbies on record`,
      color:"#C77DFF",
      seasonId:"all",
      period:"all",
    },
  ];
  const arenaRangeMeta=(()=>{
    if(arenaRangeKey==="today"){
      return{
        strap:"LATEST DAY · LAST ROOM STILL HOT",
        summary:arenaScopeLatestDate
          ?`${arenaScopeSessions.length} lobbies filed on ${formatLobbyDate(arenaScopeLatestDate,{weekday:"short",day:"numeric",month:"short"})}`
          :"Waiting on the latest room",
        scopeLabel:"Latest day board",
        emptyTitle:"The freshest day file is still waiting to land.",
        emptyNote:"Once the next set of rooms closes, the newest pressure board wakes up here.",
      };
    }
    if(arenaRangeKey==="week"){
      return{
        strap:"THIS WEEK · MOMENTUM ON THE TABLE",
        summary:arenaWeekFirstDate&&arenaScopeLatestDate
          ?`${arenaScopeSessions.length} lobbies from ${formatLobbyDate(arenaWeekFirstDate,{day:"numeric",month:"short"})} to ${formatLobbyDate(arenaScopeLatestDate,{day:"numeric",month:"short"})}`
          :"This week is still waiting on its first file",
        scopeLabel:"This week board",
        emptyTitle:"This week has not opened a clean file yet.",
        emptyNote:"The first room of the week sets the pace. This board fills the moment it lands.",
      };
    }
    if(arenaRangeKey==="season"){
      const seasonClosed=arenaCurrentSeason.end<=todayStr();
      return{
        strap:seasonClosed
          ?`${arenaCurrentSeason.name.toUpperCase()} · FINAL BOARD`
          :`${arenaCurrentSeason.name.toUpperCase()} · CAMPAIGN PRESSURE`,
        summary:`${arenaScopeSessions.length} lobbies, ${arenaScopeKills} kills, ${arenaScopeWinnerCount} winning file${arenaScopeWinnerCount===1?"":"s"}`,
        scopeLabel:`${arenaCurrentSeason.name} board`,
        emptyTitle:`${arenaCurrentSeason.name} has not opened its file yet.`,
        emptyNote:seasonClosed
          ?"This season has no filed rooms in the archive."
          :"Once the opener lands, the seasonal pressure board starts moving here.",
      };
    }
    return{
      strap:"ALL TIME · LEGACY PRESSURE OPEN",
      summary:`${sessions.length} lobbies on record · ${arenaScopeWinnerCount} winners with history on file`,
      scopeLabel:"All-time board",
      emptyTitle:"The archive is still waiting on its first room.",
      emptyNote:"Once the first results are filed, the legacy board starts taking shape here.",
    };
  })();
  const sortedLB=foolsDay?[...getSortedLB()].reverse():getSortedLB();
  const filteredLB=lbSearch.trim()?sortedLB.filter(p=>p.username.toLowerCase().includes(lbSearch.toLowerCase())):sortedLB;
  const leaderboardShiftData=getLeaderboardShiftData(lbSeason,lbPeriod,sortBy);
  const rivals=getRivals();
  const filteredRivals=rivalSearch.trim()
    ?rivals.filter(r=>{
        const p1=players.find(x=>x.id===r.p1),p2=players.find(x=>x.id===r.p2);
        return p1?.username.toLowerCase().includes(rivalSearch.toLowerCase())||p2?.username.toLowerCase().includes(rivalSearch.toLowerCase());
      })
    :rivals;
  const rivalryBoard=selectGetRivalryBoard(sessions,players,{seasonId:activeCampaignId});
  const seasonTwoMeta=SEASONS.find(season=>season.id===SEASON_TWO_ID);
  const seasonThreeMeta=SEASONS.find(season=>season.id==="s3");
  const seasonTwoCloseDay=seasonTwoMeta
    ?Math.floor((new Date(`${todayStr()}T12:00:00Z`)-new Date(`${seasonTwoMeta.end}T12:00:00Z`))/86400000)
    :-1;
  const showSeasonTwoClosedState=false;
  const seasonThreeSessions=seasonThreeMeta?filterSessionsBySeason(sessions,seasonThreeMeta.id):[];
  const seasonThreeWaiting=Boolean(
    seasonThreeMeta&&
    todayStr()>=seasonThreeMeta.start&&
    todayStr()<=seasonThreeMeta.end&&
    seasonThreeSessions.length===0
  );
  const showSeasonThreeWaitingState=seasonThreeWaiting&&view==="home";
  const seasonTwoClosedSessions=filterSessionsBySeason(sessions,SEASON_TWO_ID);
  const seasonTwoClosedKills=seasonTwoClosedSessions.reduce(
    (total,session)=>total+Object.values(session.kills||{}).reduce((sum,kills)=>sum+kills,0),
    0,
  );
  const seasonTwoClosedWinners=[...new Set(seasonTwoClosedSessions.filter(session=>session.winner).map(session=>session.winner))].length;
  const activeNavView=view;
  const activeZone=LEVEL_MAP[activeNavView]||LEVEL_MAP.home;
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
      background:`radial-gradient(ellipse,${activeZone.color}12 0%,transparent 70%)`,
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
          <button key={item.id} className={`nav-btn${activeNavView===item.id?" active":""}`} onClick={()=>go(item.id)} aria-current={activeNavView===item.id?"page":undefined} style={{
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
    <div className="zone-rail" style={{"--zonec":activeZone.color}}>
      <div className="zone-rail-chip">
        <span className="zone-rail-icon">{activeZone.icon}</span>
        <div className="zone-rail-copy">
          <span className="zone-rail-label">{activeZone.label}</span>
        </div>
      </div>
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
      {showSeasonTwoClosedState&&(
        <section className="season-closed-state" style={{
          ...card({
            border:"1.5px solid rgba(0,229,255,.28)",
            background:"linear-gradient(135deg,rgba(0,229,255,.1),rgba(255,77,143,.06),rgba(22,13,46,.9))",
            boxShadow:"0 18px 42px rgba(0,0,0,.22)",
          }),
          padding:"clamp(15px,3vw,22px)",
          marginBottom:22,
          display:"grid",
          gridTemplateColumns:"minmax(0,1.4fr) minmax(220px,.8fr)",
          gap:16,
          alignItems:"center",
        }}>
          <div>
            <div className="bc7" style={{fontSize:".62rem",letterSpacing:".22em",color:"#00E5FF",textTransform:"uppercase",marginBottom:8}}>
              Season 2 closed
            </div>
            <h2 style={{fontFamily:"Fredoka One",fontSize:"clamp(1.35rem,4vw,2.1rem)",lineHeight:1.02,color:"#fff",marginBottom:8}}>
              Final standings are locked.
            </h2>
            <p style={{color:"var(--text2)",fontSize:".86rem",lineHeight:1.55,maxWidth:620}}>
              The Season 2 campaign file is complete. The board now reads as record, not chase.
            </p>
          </div>
          <div className="season-closed-stats" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[
              {label:"Lobbies",value:seasonTwoClosedSessions.length},
              {label:"Kills",value:seasonTwoClosedKills},
              {label:"Winners",value:seasonTwoClosedWinners},
            ].map(item=>(
              <div key={item.label} style={{background:"rgba(0,0,0,.3)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"11px 10px",textAlign:"center"}}>
                <div style={{fontFamily:"Fredoka One",color:"#00E5FF",fontSize:"1.05rem",lineHeight:1}}>{item.value}</div>
                <div className="bc7" style={{color:"var(--text3)",fontSize:".56rem",letterSpacing:".12em",textTransform:"uppercase",marginTop:5}}>{item.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showSeasonThreeWaitingState&&(
        <section style={{
          ...card({
            border:"1px solid rgba(255,77,143,.22)",
            background:"linear-gradient(135deg,rgba(255,77,143,.08),rgba(0,0,0,.26))",
          }),
          padding:"12px 14px",
          marginBottom:22,
          borderLeft:"3px solid rgba(255,77,143,.58)",
          borderRadius:"0 10px 10px 0",
        }}>
          <div className="bc7" style={{fontSize:".58rem",letterSpacing:".22em",color:"rgba(255,77,143,.78)",marginBottom:5,textTransform:"uppercase"}}>
            Season 3 waiting
          </div>
          <div className="bc7" style={{fontSize:".78rem",lineHeight:1.55,color:"var(--text2)"}}>
            No May lobbies have been filed yet. Season 3 starts once the first official May room lands.
          </div>
        </section>
      )}

      {/* ═══════════════ HOME ═══════════════ */}
      {view==="home"&&(
          <HomeView ctx={{
            foolsDay,
            getLatestSessionDate,
            getSeasonForDate,
            todayStr,
            SEASONS,
            activeCampaign,
            activeCampaignSessions,
          sessions,
          allStats,
          players,
          getStats,
          dn,
          getMissionBoardState,
          cd,
          live,
          HOSTED_BY,
          FEATURED_GAME,
          getLeaderboardShiftData,
          getLatestDayConsequences,
          getStorylines,
          getDayRecap,
          getDayStorylines,
          getDailyMVP,
          getLobbyDateMarker,
          parseSessionIdNumber,
          getStreak,
          getLiveStreaks,
            getLatestDayHeatRun,
            getOnDeckPressure,
            getPressureQueue,
            isEventActive,
            card,
          primaryBtn,
          goProfile,
          Avatar,
        }}/>
      )}

      {/* ═══════════════ HALL OF FAME ═══════════════ */}
      {view==="hof"&&(
        <div className="fade-up zone-view-shell" style={{minHeight:"calc(100vh - 120px)"}}>
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
            const finalDayFiled=sSess.some((session)=>session.date===season.end);
            const ended=season.end<=now||finalDayFiled;
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
                        <Avatar p={a.p} size={26}/>
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
                    <Avatar p={player} size={52} glow/>
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
        <ArenaView ctx={{
          arenaRangeMeta,
          arenaRangeOptions,
          arenaRangeKey,
          setLbSeason,
          setLbPeriod,
          SORT_LABELS,
          sortBy,
          filteredLB,
          lbSearch,
          players,
          setLbSearch,
          setSpotlight,
          sortedLB,
          sessions,
          foolsDay,
          leaderboardShiftData,
          selectGetLiveStreaks,
          arenaScopeSessions,
          getOnDeckPressure,
          lbSeason,
          lbPeriod,
          dn,
          getArenaStats,
          getRank,
          getBadges,
          getArenaStreak,
          card,
          Avatar,
          getArenaCarry,
          getArenaConsistency,
          getArenaBenchmark,
          getArenaFormGuide,
          getPlayerLevel,
          renderPlayerIntel,
          goProfile,
          spotlight,
          getPressureQueue,
          activeCampaign,
          activeCampaignClosed,
          seasonThreeWaiting,
        }}/>
      )}

      {/* ═══════════════ RIVALS ═══════════════ */}
      {view==="rivals"&&(
        <RivalsView ctx={{
          sessions,
          rivalryBoard,
          rivalOpsState,
          setRivalOpsState,
          store,
          setSelectedRivalOpId,
          dn,
          rivalSearch,
          setRivalSearch,
          players,
          h2hA,
          setH2hA,
          h2hB,
          setH2hB,
          getH2H,
          getStats,
          getRank,
          rivals,
          filteredRivals,
          card,
          Avatar,
        }}/>
      )}

      {/* ═══════════════ LOBBIES ═══════════════ */}
      {view==="lobbies"&&(
        <WarRoomView ctx={{
          sessions,
          players,
          compareSessionsDesc,
          getLatestSessionDate,
          getLatestDayConsequences,
          getPlayer,
          getLatestDayHeatRun,
          getLobbyTotalKills,
          getLobbySearchHaystack,
          getLobbyTopDamage,
          hasCustomLobbyNote,
          getLobbyBeatTags,
          getLobbyDateMarker,
          getLobbyReport,
          formatLobbyDate,
          lobbySearch,
          lobbyFilter,
          lobbyDate,
          lobbyLimit,
          expandedSid,
          setExpandedSid,
          updateLobbyFilter,
          updateLobbyDate,
          updateLobbySearch,
          clearLobbyFilters,
          setLobbyLimit,
          setShareCard,
          goProfile,
          handleEditSession,
          handleDelSession,
          adminMode,
          card,
          lbl,
          inp,
          primaryBtn,
          Avatar,
          dn,
          activeCampaign,
        }}/>
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
                <Avatar p={{username:np.username||"?",color:np.color}} size={38}/>
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
                      <Avatar p={p} size={30}/>
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
      {view==="profile"&&(
        <CombatFileView ctx={{
          profileId,
          players,
          sessions,
          setProfileId,
          getStats,
          getRank,
          getBadges,
          getLiveDayStreak,
          filterSessionsBySeason,
          activeCampaignId,
          activeCampaign,
          getFormGuide,
          getDrought,
          getCarryScore,
          getConsistency,
          getLastSeen,
          getDaysActive,
          getRivals,
          getBenchmark,
          getDailyOrdersForPlayer,
          dailyOrdersSchedule,
          dn,
          getPlayerLevel,
          getPlayerFileState,
          compareSessionsDesc,
          Avatar,
          renderPlayerIntel,
          getMilestones,
          go,
          setH2hA,
          setH2hB,
        }}/>
      )}

      {/* ═══════════════ RECORDS / THE VAULT ═══════════════ */}
      {view==="records"&&(
        <VaultView ctx={{
          sessions,
          players,
          getRecords,
          dn,
          Avatar,
          renderPlayerIntel,
          goProfile,
          getStats,
          getLobbyDateMarker,
          activeCampaign,
        }}/>
      )}

      {view==="charts"&&(
        <div className="fade-up" style={{minHeight:"calc(100vh - 120px)"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <p style={{color:"var(--text3)",fontWeight:800,fontSize:".7rem",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>Player read</p>
            <h2 style={{fontFamily:"Fredoka One",fontSize:"clamp(2rem,8vw,3.2rem)",
              background:"linear-gradient(135deg,#00E5FF,#C77DFF)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
              📈 Intel
            </h2>
          </div>
          {(()=>{
            const activePlayers=players.filter(p=>getStats(p.id).appearances>=3)
              .map(p=>({...p,...getStats(p.id)}))
              .sort((a,b)=>b.wins-a.wins);
            const effectivePid=chartPid||activePlayers[0]?.id||"";
            const chartPlayer=players.find(p=>p.id===effectivePid);
            const chartData=getChartData(effectivePid);
            const maxW=Math.max(1,...chartData.map(d=>d.wins));
            const maxK=Math.max(1,...chartData.map(d=>d.kills));
            const selectedStats=effectivePid?getStats(effectivePid):null;
            const bestDamageDay=chartData.reduce((best,day)=>day.kills>(best?.kills||0)?day:best,null);
            const bestWinDay=chartData.reduce((best,day)=>day.wins>(best?.wins||0)?day:best,null);
            const latestDay=[...chartData].reverse().find((day)=>day.games>0)||null;
            const latestLabel=latestDay
              ?new Date(latestDay.date+"T12:00:00Z").toLocaleDateString("en",{month:"short",day:"numeric"})
              :"No recent file";
            const bestDamageLabel=bestDamageDay&&bestDamageDay.kills>0
              ?`${bestDamageDay.kills}K on ${new Date(bestDamageDay.date+"T12:00:00Z").toLocaleDateString("en",{month:"short",day:"numeric"})}`
              :"No damage spike";
            const bestWinLabel=bestWinDay&&bestWinDay.wins>0
              ?`${bestWinDay.wins}W on ${new Date(bestWinDay.date+"T12:00:00Z").toLocaleDateString("en",{month:"short",day:"numeric"})}`
              :"No win spike";
            const leaderIndex=activePlayers.findIndex((player)=>player.id===effectivePid);
            const rankLabel=leaderIndex>=0?`#${leaderIndex+1} by wins`:"Off board";
            const intelRead=chartPlayer&&selectedStats
              ?selectedStats.wins>0
                ?`${dn(chartPlayer.username)} is carrying ${selectedStats.wins} wins and ${selectedStats.kills} kills across ${selectedStats.appearances} lobbies. The file is not just volume. It has closing pressure.`
                :`${dn(chartPlayer.username)} is still hunting the first close. ${selectedStats.kills} kills across ${selectedStats.appearances} lobbies keeps the file visible, but the board is waiting for payoff.`
              :"Pick a file to read the pressure line.";
            return(
              <div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
                  {activePlayers.map(p=>(
                    <button key={p.id} onClick={()=>setChartPid(p.id)}
                      className="pill" style={{
                        padding:"6px 14px",borderRadius:50,fontWeight:800,fontSize:".78rem",
                        background:effectivePid===p.id?p.color:"var(--card)",
                        color:effectivePid===p.id?"#000":"var(--text2)",
                        border:effectivePid===p.id?"none":`1.5px solid ${p.color}44`,
                        boxShadow:effectivePid===p.id?`0 0 16px ${p.color}66`:"none"}}>
                      {p.host?"👑 ":""}{dn(p.username)}
                    </button>
                  ))}
                </div>
                {chartPlayer&&chartData.length>0?(
                  <div>
                    <div style={{
                      background:`linear-gradient(135deg,${chartPlayer.color}12,rgba(0,0,0,.38))`,
                      border:`1px solid ${chartPlayer.color}30`,
                      borderLeft:`3px solid ${chartPlayer.color}`,
                      borderRadius:"0 8px 8px 0",
                      padding:"16px 18px",
                      marginBottom:18,
                    }}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                        <div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,
                          background:`linear-gradient(135deg,${chartPlayer.color},${chartPlayer.color}88)`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontFamily:"Fredoka One",fontSize:"1.1rem",color:"#fff"}}>
                          {chartPlayer.username[0]}
                        </div>
                        <div style={{minWidth:0}}>
                          <div className="bc7" style={{fontSize:".58rem",letterSpacing:".22em",color:`${chartPlayer.color}bb`,textTransform:"uppercase",marginBottom:5}}>
                            Intel brief
                          </div>
                          <div style={{fontFamily:"Fredoka One",fontSize:"1.2rem",color:chartPlayer.color,lineHeight:1.1}}>
                            {chartPlayer.host?"👑 ":""}{dn(chartPlayer.username)}
                          </div>
                        </div>
                      </div>
                      <div className="bc7" style={{fontSize:".8rem",lineHeight:1.72,color:"var(--text2)",marginBottom:13}}>
                        {intelRead}
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8}}>
                        {[
                          {label:"Board position",value:rankLabel,color:"#00E5FF"},
                          {label:"Best close",value:bestWinLabel,color:"#FFD700"},
                          {label:"Damage spike",value:bestDamageLabel,color:"#FF4D8F"},
                          {label:"Latest file",value:latestDay?`${latestDay.games}G · ${latestDay.wins}W · ${latestDay.kills}K on ${latestLabel}`:"No latest file",color:"#00FF94"},
                        ].map((marker)=>(
                          <div key={marker.label} style={{background:"rgba(0,0,0,.24)",border:`1px solid ${marker.color}24`,borderRadius:8,padding:"10px 11px"}}>
                            <div className="bc7" style={{fontSize:".54rem",letterSpacing:".16em",color:`${marker.color}cc`,textTransform:"uppercase",marginBottom:5}}>
                              {marker.label}
                            </div>
                            <div className="bc7" style={{fontSize:".72rem",lineHeight:1.45,color:"var(--text)"}}>
                              {marker.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{background:"rgba(0,0,0,.25)",borderRadius:16,padding:"20px 16px",marginBottom:20}}>
                      <div style={{fontSize:".75rem",color:"var(--text3)",fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>
                        🏆 Win line
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
                        💀 Damage line
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
                        📅 Day log
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
              The first campaign file, from the opening shot to the final lock
            </p>
          </div>

          {/* ── FINAL stamp — shows after March 31 ── */}
          {todayStr()>=SEASON_TWO_LAUNCH_DATE&&(
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
            </div>
          )}

          {(()=>{
            const w=getS1Wrap();
            if(!w)return <p style={{textAlign:"center",color:"var(--text3)"}}>Season 1 data loading…</p>;
            const s1Sessions=getSeasonSessions("s1");
            const s1Campaign=buildSeasonCampaignFile(s1Sessions);
            const s1Ordered=[...s1Sessions].sort(compareSessionsAsc);
            const s1Opener=s1Ordered[0]||null;
            const s1OpenerWinner=s1Opener?players.find((player)=>player.id===s1Opener.winner):null;
            const s1RunnerUp=w.podium[1]?players.find((player)=>player.id===w.podium[1].id):null;
            const s1Gap=w.podium[0]&&w.podium[1]?w.podium[0].wins-w.podium[1].wins:0;
            const s1LoudestDay=s1Campaign?.loudestDay||null;
            const s1TurningNight=s1Campaign?.turningNight||null;
            const s1TurningNightChampion=s1Campaign?.leader||null;
            const s1TurningNightRunner=s1Campaign?.chaser||null;
            const s1LockNight=s1Campaign?.lockNight||null;
            const s1BestRun=s1Campaign?.bestRun||null;
            const s1CrowdDay=s1Campaign?.biggestCrowd||null;
            const s1SpreadDay=s1Campaign?.widestWinnerDay||null;
            const s1ChampionPlayer=w.champion?players.find((player)=>player.id===w.champion.id):null;
            const s1ReaperPlayer=w.topKiller?players.find((player)=>player.id===w.topKiller.id):null;
            const s1TopGameLobby=w.topGame?.sid?`Lobby ${parseSessionIdNumber(w.topGame.sid)||w.topGame.sid}`:"";
            const s1NumberMarkers=[
              s1ChampionPlayer&&w.champion
                ?{
                  label:"Top winner",
                  value:`${dn(s1ChampionPlayer.username)} · ${w.champion.wins}W`,
                  note:"closed the crown line",
                  color:"#FFD700",
                }
                :null,
              s1ReaperPlayer&&w.topKiller
                ?{
                  label:"Top reaper",
                  value:`${dn(s1ReaperPlayer.username)} · ${w.topKiller.kills}K`,
                  note:"held the damage pace",
                  color:"#FF4D8F",
                }
                :null,
              s1BestRun?.player&&s1BestRun.streak>0
                ?{
                  label:"Longest streak",
                  value:`${dn(s1BestRun.player.username)} · ${s1BestRun.streak} straight`,
                  note:s1BestRun.start?formatLobbyDate(s1BestRun.start.date,{weekday:"short",day:"numeric",month:"short"}):"season peak run",
                  color:"#00E5FF",
                }
                :null,
              s1LoudestDay
                ?{
                  label:"Loudest night",
                  value:`${s1LoudestDay.totalKills}K on ${formatLobbyDate(s1LoudestDay.date,{weekday:"short",day:"numeric",month:"short"})}`,
                  note:`${s1LoudestDay.lobbies} lobbies on file`,
                  color:"#FF6B35",
                }
                :null,
              s1CrowdDay
                ?{
                  label:"Biggest crowd",
                  value:`${s1CrowdDay.uniquePlayers} players on ${formatLobbyDate(s1CrowdDay.date,{weekday:"short",day:"numeric",month:"short"})}`,
                  note:`${s1CrowdDay.lobbies} lobbies kept the room full`,
                  color:"#00FF94",
                }
                :null,
              s1SpreadDay&&s1SpreadDay.winnerSpread>1
                ?{
                  label:"Widest winner spread",
                  value:`${s1SpreadDay.winnerSpread} winners on ${formatLobbyDate(s1SpreadDay.date,{weekday:"short",day:"numeric",month:"short"})}`,
                  note:"the room refused one clean owner",
                  color:"#C77DFF",
                }
                :null,
            ].filter(Boolean).slice(0,5);
            const s1CampaignDossier=s1Campaign?.openerWinner&&w.champion&&s1RunnerUp
              ?`${dn(s1Campaign.openerWinner.username)} fired the opener on ${formatLobbyDate(s1Campaign.opener.date,{weekday:"short",day:"numeric",month:"short"})}, but the table did not really bend until ${s1TurningNight&&s1TurningNightChampion?`${dn(s1TurningNightChampion.username)} made ${formatLobbyDate(s1TurningNight.date,{weekday:"short",day:"numeric",month:"short"})} the swing night that changed the crown race.`:"the middle of the file broke open."} ${s1LockNight?`${dn(players.find((player)=>player.id===w.champion.id)?.username||"")} then held the top line from ${formatLobbyDate(s1LockNight.date,{weekday:"short",day:"numeric",month:"short"})} to the close.`:`${dn(players.find((player)=>player.id===w.champion.id)?.username||"")} still closed the file ${s1Gap} win${s1Gap===1?"":"s"} clear of ${dn(s1RunnerUp.username)}.`}`
              :`${w.uniqueWins} different winners left fingerprints on the first campaign file.`;
            const s1MemoryCards=[
              {
                label:"OPENING SHOT",
                color:"#FFD700",
                value:s1OpenerWinner?`${dn(s1OpenerWinner.username)} landed the first real hit of Season 1`:"Season opener is still sealed",
                note:s1Opener
                  ?s1BestRun?.player&&s1BestRun.streak>=2&&s1BestRun.start&&s1BestRun.end
                    ?`${formatLobbyDate(s1Opener.date,{weekday:"short",day:"numeric",month:"short"})} opened the campaign, then ${dn(s1BestRun.player.username)} produced the first run the room had to take seriously with ${s1BestRun.streak} straight wins from Lobby ${parseSessionIdNumber(s1BestRun.start.id)||s1BestRun.start.id} to Lobby ${parseSessionIdNumber(s1BestRun.end.id)||s1BestRun.end.id}.`
                    :`${formatLobbyDate(s1Opener.date,{weekday:"short",day:"numeric",month:"short"})} set the file in motion and the room never really got a quiet week after that.`
                  :"",
              },
              {
                label:"TURNING NIGHT",
                color:"#FF4D8F",
                value:s1TurningNight&&s1TurningNightChampion&&s1TurningNightRunner
                  ?`${dn(s1TurningNightChampion.username)} turned ${formatLobbyDate(s1TurningNight.date,{weekday:"short",day:"numeric",month:"short"})} into the night the table moved`
                  :"The archive never settled on one swing night",
                note:s1TurningNight&&s1TurningNightChampion&&s1TurningNightRunner
                  ?`${dn(s1TurningNightChampion.username)} won ${s1TurningNight.championDayWins} lobbies while ${dn(s1TurningNightRunner.username)} only managed ${s1TurningNight.runnerUpDayWins}. The crown gap left that night at ${s1TurningNight.gap} wins. ${s1LoudestDay&&s1LoudestDay.date!==s1TurningNight.date?`${formatLobbyDate(s1LoudestDay.date,{weekday:"short",day:"numeric",month:"short"})} still owns the raw-damage record, but this was the night that changed the race.`:""}`
                  :s1LoudestDay?.topKiller?.player
                    ?`${dn(s1LoudestDay.topKiller.player.username)} owned the loudest night on ${formatLobbyDate(s1LoudestDay.date,{weekday:"short",day:"numeric",month:"short"})} with ${s1LoudestDay.totalKills} total kills on file.`
                    :"The middle of the campaign stayed live long enough for every lead to feel temporary.",
              },
              {
                label:"SIGNATURE RUN",
                color:"#00E5FF",
                value:s1BestRun?.player&&s1BestRun.streak>=2
                  ?`${dn(s1BestRun.player.username)} produced the run Season 1 still gets judged against`
                  :w.champion?`${dn(players.find((player)=>player.id===w.champion.id)?.username||"")} still finished Season 1 on top`:"The crown line never sealed",
                note:s1BestRun?.player&&s1BestRun.start&&s1BestRun.end
                  ?`${s1BestRun.streak} straight wins from ${formatLobbyDate(s1BestRun.start.date,{weekday:"short",day:"numeric",month:"short"})}. ${s1LockNight?`${dn(players.find((player)=>player.id===w.champion.id)?.username||"")} made the lead feel final on ${formatLobbyDate(s1LockNight.date,{weekday:"short",day:"numeric",month:"short"})}.`:s1TopGameLobby?`${s1TopGameLobby} is still the single room people point to first.`:""}`
                  :s1RunnerUp
                    ?s1Gap===0
                      ?`${dn(s1RunnerUp.username)} finished level on wins and the tiebreak came from the wider file.`
                      :`${dn(s1RunnerUp.username)} finished ${s1Gap} win${s1Gap===1?"":"s"} back when the archive locked. ${s1TopGameLobby?`${s1TopGameLobby} is still the single room people point to first.`:""}`
                    :"No runner-up line was needed once the campaign closed.",
              },
            ];
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
                      {l:"Longest Streak",v:s1BestRun?.streak?`${s1BestRun.streak}W`:"0W",c:"#C77DFF",i:"🔥"},
                      {l:"Loudest Night",v:s1LoudestDay?`${s1LoudestDay.totalKills}K`:"0K",c:"#FF6B35",i:"🌋"},
                    ].map((s,i)=>(
                      <div key={i} style={{background:"rgba(0,0,0,.3)",borderRadius:12,padding:"12px 10px"}}>
                        <div style={{fontSize:"1.4rem",marginBottom:4}}>{s.i}</div>
                        <div style={{fontFamily:"Fredoka One",fontSize:"1.6rem",color:s.c,lineHeight:1}}>{s.v}</div>
                        <div style={{fontSize:".68rem",color:"var(--text3)",fontWeight:800,textTransform:"uppercase",letterSpacing:1,marginTop:4}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    marginTop:14,paddingTop:14,borderTop:"1px solid rgba(255,255,255,.08)",
                    display:"grid",gap:8,textAlign:"left"}}>
                    <div style={{fontSize:".6rem",color:"rgba(255,215,0,.62)",fontWeight:800,
                      letterSpacing:".26em",textTransform:"uppercase"}}>Campaign dossier</div>
                    <div style={{fontSize:".8rem",color:"var(--text2)",fontWeight:700,lineHeight:1.7}}>
                      {s1CampaignDossier}
                    </div>
                    {s1NumberMarkers.length>0&&(
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:8,marginTop:4}}>
                        {s1NumberMarkers.map((marker)=>(
                          <div key={marker.label} style={{
                            background:`linear-gradient(135deg,${marker.color}10,rgba(0,0,0,.26))`,
                            border:`1px solid ${marker.color}26`,
                            borderLeft:`3px solid ${marker.color}`,
                            borderRadius:"0 8px 8px 0",
                            padding:"11px 12px",
                          }}>
                            <div className="bc7" style={{fontSize:".55rem",letterSpacing:".18em",color:`${marker.color}bb`,marginBottom:5,textTransform:"uppercase"}}>
                              {marker.label}
                            </div>
                            <div className="bc9" style={{fontSize:".84rem",lineHeight:1.2,color:marker.color,marginBottom:4}}>
                              {marker.value}
                            </div>
                            <div className="bc7" style={{fontSize:".64rem",lineHeight:1.55,color:"var(--text3)"}}>
                              {marker.note}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8,marginBottom:28}}>
                  {s1MemoryCards.map((card)=>(
                    <div key={card.label} style={{
                      background:`linear-gradient(135deg,${card.color}10,rgba(0,0,0,.32))`,
                      border:`1px solid ${card.color}30`,
                      borderLeft:`3px solid ${card.color}`,
                      borderRadius:"0 8px 8px 0",
                      padding:"14px 16px",
                    }}>
                      <div className="bc7" style={{fontSize:".56rem",letterSpacing:".22em",color:`${card.color}bb`,marginBottom:8}}>
                        {card.label}
                      </div>
                      <div className="bc9" style={{fontSize:".94rem",color:card.color,lineHeight:1.2,marginBottom:7}}>
                        {card.value}
                      </div>
                      <div className="bc7" style={{fontSize:".72rem",color:"var(--text2)",lineHeight:1.65}}>
                        {card.note}
                      </div>
                    </div>
                  ))}
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
                    {icon:"👑",color:"#FFD700",title:"Season Champion",player:w.champion,stat:`${w.champion?.wins}W · ${w.champion?.kills}K`,desc:s1RunnerUp
                      ?s1Gap===0
                        ?`Finished level on wins with ${dn(s1RunnerUp.username)} and took the file on the deeper body of work.`
                        :`Closed the archive ${s1Gap} win${s1Gap===1?"":"s"} clear of ${dn(s1RunnerUp.username)}.`
                      :"Most wins in Season 1"},
                    {icon:"💀",color:"#FF4D8F",title:"Season Reaper",player:w.topKiller,stat:`${w.topKiller?.kills} total kills`,desc:w.champion&&w.topKiller
                      ?w.champion.id===w.topKiller.id
                        ?"Held both the crown line and the deadliest file from the first campaign."
                        :`Kept the heaviest damage line even while ${dn(players.find((player)=>player.id===w.champion.id)?.username||"")} closed the crown.`
                      :"Most kills across all lobbies"},
                    {icon:"🎯",color:"#00E5FF",title:"Most Efficient",player:w.sharpshooter,stat:`${w.sharpshooter?.kd} K/G ratio`,desc:"Best kills per lobby once the season had enough tape to trust the rate."},
                    {icon:"🎮",color:"#FFAB40",title:"Most Loyal",player:w.loyalist,stat:`${w.loyalist?.appearances} lobbies`,desc:"Showed up more than anyone and kept the first campaign moving every week."},
                    ...(w.mostImproved?[{icon:"📈",color:"#00FF94",title:"Most Improved",player:w.mostImproved.player,stat:`${w.mostImproved.earlyWR}% → ${w.mostImproved.lateWR}% WR`,desc:`The sharpest late-season climb in the file at +${w.mostImproved.gain}% win rate.`}]:[]),
                    {icon:"☄️",color:"#FF6B35",title:"Best Single Game",player:w.topGamePlayer,stat:`${w.topGame.k} kills in ${s1TopGameLobby}`,desc:`${formatLobbyDate(w.topGame.date,{weekday:"short",day:"numeric",month:"short"})} · the single room people still mention first.`},
                    ...(w.topDayKillPlayer?[{icon:"🌋",color:"#FF4D8F",title:"Most Kills in a Day",player:w.topDayKillPlayer,stat:`${w.topDayKill.k} kills`,desc:`${formatLobbyDate(w.topDayKill.date,{weekday:"short",day:"numeric",month:"short"})} · the day the campaign stopped pretending to be calm.`}]:[]),
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
                    {activeCampaign?.name ? `${activeCampaign.name} is live ⚔️` : "Current campaign is live ⚔️"}
                  </div>
                  <p style={{color:"var(--text2)",fontSize:".85rem",fontWeight:600,
                    maxWidth:460,margin:"0 auto",lineHeight:1.6}}>
                    Season 1 is sealed. The current campaign is live, and the room is chasing a new crown now.
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
        <Season2View ctx={{
          todayStr,
          SEASON_TWO_ID,
          campaignSeasonId:activeCampaignId,
          SEASONS,
          sessions,
          allStats,
          players,
          compareSessionsAsc,
          getLatestSessionDate,
          getLatestDayConsequences,
          buildSeasonCampaignFile,
          joinHumanList,
          dn,
          formatLobbyDate,
          parseSessionIdNumber,
          go,
          goProfile,
          Avatar,
          s2CdClock,
          SEASON_TWO_LAUNCH_DATE,
        }}/>
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
        const recapStorylines=getDayStorylines(shareCard.date).slice(0,3);
        if(!recap)return null;
        const dd=new Date(shareCard.date+"T12:00:00Z");
        const dateLabel=dd.toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
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
                {recapStorylines.length>0&&(
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:".62rem",color:"rgba(255,255,255,.3)",fontWeight:800,
                      letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Storylines</div>
                    <div style={{display:"grid",gap:7}}>
                      {recapStorylines.map((line,i)=>(
                        <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",
                          background:"rgba(255,215,0,.08)",border:"1px solid rgba(255,215,0,.14)",
                          borderRadius:10,padding:"8px 10px"}}>
                          <span style={{color:"#FFD700",fontSize:".8rem",lineHeight:1.4}}>◆</span>
                          <div style={{fontSize:".76rem",color:"rgba(255,255,255,.82)",lineHeight:1.6,fontWeight:700}}>
                            {line}
                          </div>
                        </div>
                      ))}
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
