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
  getFalloutReport as selectGetFalloutReport,
  getLatestWeeklyRecap as selectGetLatestWeeklyRecap,
  getLeaderboardShiftData as selectGetLeaderboardShiftData,
  getLobbyWipeEvents as selectGetLobbyWipeEvents,
  getPlayerLobbyWipeSummary as selectGetPlayerLobbyWipeSummary,
  getLiveStreaks as selectGetLiveStreaks,
  getMilestones as selectGetMilestones,
  getMissionBoardState as selectGetMissionBoardState,
  getOnDeckPressure as selectGetOnDeckPressure,
  getPressureQueue as selectGetPressureQueue,
  getPeriodSessions as selectGetPeriodSessions,
  getPlayerFileState as selectGetPlayerFileState,
  getPlayerSeasonRead as selectGetPlayerSeasonRead,
  getPlayerLevel as selectGetPlayerLevel,
  getRank as selectGetRank,
  getRecords as selectGetRecords,
  getRivalryBoard as selectGetRivalryBoard,
  getRivalryMatchHistory as selectGetRivalryMatchHistory,
  reconcileRivalOpsState as selectReconcileRivalOpsState,
  getRivals as selectGetRivals,
  getCampaignFronts as selectGetCampaignFronts,
  getSeasonCampaignFile as selectGetSeasonCampaignFile,
  getSeasonOneWrap as selectGetSeasonOneWrap,
  getSeasonOpenerFallout as selectGetSeasonOpenerFallout,
  getSeasonScoutBoard as selectGetSeasonScoutBoard,
  getSeasonSessions as selectGetSeasonSessions,
  getSortedLeaderboard as selectGetSortedLeaderboard,
  getWeeklyLoopState as selectGetWeeklyLoopState,
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
  @keyframes allTimePulseLeft{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @keyframes allTimePulseRight{0%{transform:translateX(-50%)}100%{transform:translateX(0)}}
  .all-time-pulse{
    margin:-8px -18px 34px;
    padding:18px 18px 16px;
    border-top:1px solid rgba(255,255,255,.06);
    border-bottom:1px solid rgba(255,255,255,.04);
    background:linear-gradient(180deg,rgba(255,255,255,.018),rgba(0,0,0,.08));
  }
  .all-time-pulse-head{
    display:flex;
    justify-content:space-between;
    align-items:flex-end;
    gap:14px;
    padding:0 2px 14px;
  }
  .all-time-pulse-label{
    font-family:"Barlow Condensed",sans-serif;
    font-weight:900;
    font-size:.68rem;
    letter-spacing:.28em;
    color:rgba(0,229,255,.78);
  }
  .all-time-pulse-line{
    font-size:.76rem;
    color:var(--text3);
    line-height:1.55;
    font-weight:800;
    margin-top:5px;
  }
  .all-time-pulse-link{
    border:0;
    background:transparent;
    color:rgba(200,186,255,.62);
    font-family:"Barlow Condensed",sans-serif;
    font-weight:800;
    letter-spacing:.16em;
    font-size:.64rem;
    text-transform:uppercase;
    cursor:pointer;
    padding:4px 0;
  }
  .all-time-pulse-link:hover,
  .all-time-pulse-link:focus-visible{color:#00E5FF;outline:none;}
  .all-time-pulse-viewport{
    overflow:hidden;
    padding:2px 0 3px;
    -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 12%,#000 88%,transparent 100%);
    mask-image:linear-gradient(90deg,transparent 0,#000 12%,#000 88%,transparent 100%);
  }
  .all-time-pulse-row{
    display:flex;
    gap:18px;
    width:max-content;
    will-change:transform;
    margin-left:-72px;
    animation:allTimePulseLeft 46s linear infinite;
  }
  .all-time-pulse-row + .all-time-pulse-row{
    margin-top:18px;
    margin-left:-180px;
    animation-name:allTimePulseRight;
    animation-duration:52s;
  }
  .all-time-pulse-mobile-row{display:none;}
  .all-time-pulse:hover .all-time-pulse-row,
  .all-time-pulse:focus-within .all-time-pulse-row{animation-play-state:paused;}
  .all-time-pulse-card{
    width:260px;
    min-height:118px;
    flex:0 0 auto;
    padding:17px 18px 16px;
    background:
      radial-gradient(circle at 18% 10%,var(--pulse-glow,rgba(0,229,255,.12)),transparent 38%),
      linear-gradient(135deg,rgba(255,255,255,.055),rgba(0,0,0,.26));
    border:1px solid rgba(255,255,255,.09);
    border-left:3px solid var(--pulse-color,rgba(0,229,255,.5));
    border-radius:0 18px 18px 0;
    box-shadow:0 14px 34px rgba(0,0,0,.16);
    opacity:.9;
  }
  .all-time-pulse-card-label{
    font-family:"Barlow Condensed",sans-serif;
    font-weight:800;
    font-size:.58rem;
    letter-spacing:.2em;
    color:rgba(200,186,255,.62);
    margin-bottom:12px;
    text-transform:uppercase;
  }
  .all-time-pulse-card-value{
    font-family:"Barlow Condensed",sans-serif;
    font-weight:900;
    color:var(--pulse-color,#00E5FF);
    font-size:1.3rem;
    line-height:1.08;
    white-space:normal;
  }
  .all-time-pulse-card-note{
    font-size:.72rem;
    color:var(--text3);
    line-height:1.5;
    margin-top:8px;
    font-weight:800;
  }
  @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;}}
  @media(prefers-reduced-motion:reduce){
    .all-time-pulse-viewport{overflow:visible!important;-webkit-mask-image:none!important;mask-image:none!important;}
    .all-time-pulse-row{display:none!important;}
    .all-time-pulse-mobile-row{display:flex!important;animation:none!important;width:auto!important;flex-wrap:wrap!important;}
    .all-time-pulse-card{width:min(220px,100%)!important;}
  }

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
    cursor:pointer;
  }
  .rivalry-evidence-card.is-selected{
    outline:2px solid rgba(0,229,255,.62);
    outline-offset:2px;
    box-shadow:0 0 0 1px rgba(0,229,255,.18),0 22px 46px rgba(0,229,255,.09)!important;
  }
  .rival-board-evidence-layout{
    display:grid;
    grid-template-columns:minmax(0,1fr) minmax(280px,340px);
    gap:16px;
    align-items:start;
  }
  .rival-history-desktop-wrap{
    position:sticky;
    top:104px;
  }
  .rival-history-panel{
    border:1px solid rgba(0,229,255,.18);
    border-left:3px solid rgba(0,229,255,.64);
    border-radius:0 16px 16px 0;
    background:
      radial-gradient(circle at 12% 0,rgba(0,229,255,.12),transparent 38%),
      linear-gradient(145deg,rgba(255,255,255,.045),rgba(0,0,0,.32));
    padding:15px;
    box-shadow:0 18px 38px rgba(0,0,0,.2);
  }
  .rival-history-empty{
    color:var(--text2);
    line-height:1.6;
    font-size:.76rem;
  }
  .rival-history-head{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:12px;
    margin-bottom:12px;
  }
  .rival-history-kicker{
    color:#00E5FF;
    font-size:.56rem;
    letter-spacing:.24em;
    margin-bottom:6px;
  }
  .rival-history-title{
    color:#fff;
    font-size:1.02rem;
    line-height:1.12;
    margin:0 0 6px;
  }
  .rival-history-score{
    color:var(--text3);
    font-size:.66rem;
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .rival-history-list{
    display:grid;
    gap:8px;
  }
  .rival-history-row{
    border:1px solid rgba(255,255,255,.08);
    border-radius:12px;
    background:rgba(0,0,0,.28);
    padding:10px 11px;
  }
  .rival-history-row-top,
  .rival-history-result{
    display:flex;
    justify-content:space-between;
    gap:10px;
    align-items:center;
  }
  .rival-history-row-top{
    color:#00E5FF;
    font-size:.68rem;
    margin-bottom:7px;
  }
  .rival-history-row-top span:last-child{
    color:var(--text3);
    font-size:.58rem;
    letter-spacing:.12em;
    text-transform:uppercase;
  }
  .rival-history-result{
    color:var(--text2);
    font-size:.72rem;
    line-height:1.45;
    margin-bottom:6px;
  }
  .rival-history-result span:last-child{
    flex-shrink:0;
    color:#FFD700;
    font-weight:900;
  }
  .rival-history-impact{
    color:rgba(255,255,255,.78);
    font-size:.66rem;
    line-height:1.45;
  }
  .rival-history-showall,
  .rival-history-close{
    border:1px solid rgba(255,255,255,.14);
    background:rgba(255,255,255,.06);
    color:var(--text2);
    border-radius:999px;
    padding:8px 11px;
    margin-top:10px;
    font-size:.66rem;
    font-weight:900;
    letter-spacing:.08em;
    text-transform:uppercase;
    cursor:pointer;
  }
  .rival-history-close{
    margin-top:0;
    flex-shrink:0;
  }
  .rival-history-mobile-sheet{
    display:none;
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
  .rival-evidence-mobile{
    display:none;
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
  .rival-mobile-pressure{
    display:none;
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
  @media(max-width:720px){
    .rival-board-evidence-layout{
      display:block!important;
    }
    .rival-history-desktop-wrap{
      display:none!important;
    }
    .rival-history-mobile-sheet{
      display:block;
      position:fixed;
      inset:0;
      z-index:80;
      pointer-events:none;
    }
    .rival-history-scrim{
      position:absolute;
      inset:0;
      border:0;
      background:rgba(5,2,18,.72);
      backdrop-filter:blur(5px);
      pointer-events:auto;
    }
    .rival-history-sheet-inner{
      position:absolute;
      left:10px;
      right:10px;
      bottom:10px;
      max-height:min(72vh,620px);
      overflow:auto;
      pointer-events:auto;
      border-radius:18px 18px 12px 12px;
      box-shadow:0 -24px 70px rgba(0,0,0,.68);
    }
    .rival-history-mobile-close{
      position:sticky;
      top:0;
      z-index:2;
      width:100%;
      border:1px solid rgba(0,229,255,.36);
      border-bottom:0;
      background:linear-gradient(180deg,rgba(12,6,30,.99),rgba(20,11,48,.98));
      color:#00E5FF;
      border-radius:18px 18px 0 0;
      padding:12px 14px;
      font-size:.72rem;
      font-weight:900;
      letter-spacing:.16em;
      text-transform:uppercase;
      cursor:pointer;
      text-align:center;
    }
    .rival-history-mobile{
      background:
        linear-gradient(180deg,rgba(28,16,62,.98),rgba(12,6,30,.99));
      border-left:1px solid rgba(0,229,255,.2);
      border-top:3px solid rgba(0,229,255,.7);
      border-radius:18px 18px 12px 12px;
      padding:14px;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.08);
    }
    .rival-history-title{
      font-size:.98rem;
    }
    .rival-history-row{
      padding:10px 11px;
      background:rgba(0,0,0,.56);
      border-color:rgba(255,255,255,.14);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.04);
    }
    .rival-history-result{
      display:grid;
      gap:3px;
      font-size:.7rem;
    }
    .rival-history-result span:last-child{
      font-size:.68rem;
    }
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
  .arena-week-chip-mobile{display:none!important;}
  .warroom-weekly-mobile-row{display:none;}
  @media(max-width:720px){
    .arena-page .arena-hero{
      margin-bottom:14px!important;
    }
    .arena-page .arena-coordinate-bar{
      margin-bottom:8px!important;
    }
    .arena-page .arena-coordinate-bar span:last-child{
      display:none!important;
    }
    .arena-page .arena-title{
      font-size:clamp(2rem,12vw,3rem)!important;
      letter-spacing:.08em!important;
    }
    .arena-page .arena-range-rail{
      flex-wrap:nowrap!important;
      overflow-x:auto!important;
      gap:5px!important;
      margin-left:-12px!important;
      margin-right:-12px!important;
      margin-bottom:10px!important;
      padding:0 12px 4px!important;
      -webkit-overflow-scrolling:touch;
      scrollbar-width:none;
    }
    .arena-page .arena-range-rail::-webkit-scrollbar{
      display:none;
    }
    .arena-page .arena-range-rail button{
      flex:0 0 auto!important;
      padding:7px 11px!important;
      font-size:.65rem!important;
      letter-spacing:.12em!important;
    }
    .arena-page .arena-range-rail button div:nth-child(2){
      display:none!important;
    }
    .arena-page .arena-range-rail>div{
      display:none!important;
    }
    .arena-page .arena-week-chip-mobile{
      display:inline-flex!important;
      width:fit-content!important;
      max-width:100%!important;
      margin:-2px 0 10px!important;
      padding:5px 9px!important;
      border-radius:999px!important;
      border:1px solid rgba(0,229,255,.2)!important;
      background:rgba(0,229,255,.07)!important;
      color:#00E5FF!important;
      font-size:.56rem!important;
      letter-spacing:.12em!important;
      line-height:1.25!important;
    }
    .arena-page .arena-search{
      margin-bottom:10px!important;
    }
    .arena-page .pressure-queue-shell{
      gap:7px!important;
      margin-bottom:11px!important;
    }
    .arena-page .pressure-queue-head{
      display:none!important;
    }
    .arena-page .pressure-queue-grid{
      grid-template-columns:1fr!important;
      gap:0!important;
    }
    .arena-page .pressure-queue-card:nth-child(n+2){
      display:none!important;
    }
    .arena-page .pressure-queue-card{
      padding:10px 12px!important;
      border-radius:9px!important;
    }
    .arena-page .pressure-queue-label{
      margin-bottom:5px!important;
      font-size:.5rem!important;
      letter-spacing:.16em!important;
    }
    .arena-page .pressure-queue-headline{
      font-size:.76rem!important;
      line-height:1.28!important;
      margin-bottom:0!important;
    }
    .arena-page .pressure-queue-detail{
      display:none!important;
    }
    .arena-page .arena-board-read{
      margin-bottom:10px!important;
    }
    .arena-page .arena-board-lead{
      padding:11px 12px!important;
      margin-bottom:0!important;
    }
    .arena-page .arena-board-lead .bc9{
      font-size:.9rem!important;
      line-height:1.22!important;
    }
    .arena-page .arena-board-lead .bc7:last-child{
      font-size:.66rem!important;
      line-height:1.45!important;
    }
    .arena-page .arena-pulse-cards{
      display:none!important;
    }
    .arena-page .arena-sort-pills{
      flex-wrap:nowrap!important;
      overflow-x:auto!important;
      margin-left:-12px!important;
      margin-right:-12px!important;
      margin-bottom:10px!important;
      padding:0 12px 4px!important;
      -webkit-overflow-scrolling:touch;
      scrollbar-width:none;
    }
    .arena-page .arena-sort-pills::-webkit-scrollbar{
      display:none;
    }
    .arena-page .arena-sort-pills .pill{
      flex:0 0 auto!important;
      padding:6px 11px!important;
      font-size:.7rem!important;
      box-shadow:none!important;
    }
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
      grid-auto-columns:minmax(258px,74vw);
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
      min-height:158px;
      padding:14px 14px;
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
    .rival-evidence-desktop{
      display:none;
    }
    .rival-evidence-mobile{
      display:inline;
    }
    .rival-card-foot{
      align-items:flex-start;
      margin-bottom:7px;
    }
    .rival-card-pressure-line{
      font-size:.66rem;
      line-height:1.38;
    }
    .rival-desktop-pressure{
      display:none;
    }
    .rival-mobile-pressure{
      display:block;
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
  .campaign-season-switcher{
    display:grid;
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:10px;
    margin:0 auto 26px;
    max-width:760px;
  }
  .campaign-season-switcher button{
    border:1.5px solid rgba(255,255,255,.12);
    border-radius:14px;
    background:rgba(255,255,255,.045);
    color:rgba(255,255,255,.72);
    cursor:pointer;
    padding:12px 14px;
    text-align:left;
    transition:background .12s ease,border-color .12s ease,transform .12s ease;
  }
  .campaign-season-switcher button:hover{
    transform:translateY(-1px);
    border-color:var(--seasonc);
    background:rgba(255,255,255,.07);
  }
  .campaign-season-switcher button.active{
    border-color:var(--seasonc);
    background:linear-gradient(135deg,var(--seasonbg),rgba(255,255,255,.04));
    box-shadow:0 0 22px var(--seasonglow);
  }
  .campaign-season-switcher .season-switch-title{
    display:block;
    font-family:"Fredoka One",cursive;
    font-size:.95rem;
    line-height:1.1;
    margin-bottom:7px;
  }
  .campaign-season-switcher .season-switch-state{
    display:block;
    font-size:.58rem;
    font-weight:900;
    letter-spacing:.18em;
    text-transform:uppercase;
    color:var(--seasonc);
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
    .campaign-season-switcher{grid-template-columns:1fr!important;gap:8px!important;margin-bottom:22px!important;}
    .campaign-season-switcher button{padding:11px 12px!important;}
    .season2-top-shell .campaign-title-gradient{
      background-image:none!important;
      -webkit-text-fill-color:var(--campaign-title-color)!important;
      color:var(--campaign-title-color)!important;
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
    .hof-grid{min-width:0!important;width:100%!important;max-width:100%!important;}
    .hof-honors-grid{display:flex!important;grid-template-columns:none!important;overflow-x:auto!important;scroll-snap-type:x mandatory!important;padding:2px 4px 10px!important;margin-left:-4px;margin-right:-4px;}
    .hof-honors-grid::-webkit-scrollbar,.hof-filter-rail::-webkit-scrollbar{display:none!important;}
    .hof-honors-grid,.hof-filter-rail{scrollbar-width:none!important;-ms-overflow-style:none!important;}
    .hof-honor-card{flex:0 0 82%!important;scroll-snap-align:start!important;}
    .hof-filter-rail{overflow-x:auto!important;flex-wrap:nowrap!important;padding-bottom:6px!important;}
    .hof-filter-rail button{flex:0 0 auto!important;}
    .legacy-player-card{width:auto!important;max-width:100%!important;box-sizing:border-box!important;margin-left:0!important;margin-right:0!important;}
    .legacy-player-card{padding:22px 16px 18px!important;border-radius:24px!important;}
    .legacy-card-head{gap:12px!important;margin-bottom:18px!important;}
    .legacy-card-avatar{width:66px!important;height:66px!important;transform:scale(.78)!important;transform-origin:left center!important;margin-right:-14px!important;}
    .legacy-card-name{font-size:1.45rem!important;white-space:normal!important;}
    .legacy-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;}
    .legacy-stat-grid{width:calc(100vw - 124px)!important;max-width:100%!important;overflow:hidden!important;}
    .legacy-stat-tile{padding:12px 11px!important;text-align:left!important;}
    .legacy-stat-value{font-size:1.45rem!important;}
    .legacy-badge-strip{gap:7px!important;}
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
    .vault-view-shell{width:100%!important;max-width:100%!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important;}
    .vault-view-shell>div{max-width:100%!important;}
    .vault-view-shell .vault-card{width:100%!important;max-width:100%!important;box-sizing:border-box!important;}
    .vault-header-row{display:block!important;}
    .vault-header-row{align-items:flex-start!important;}
    .vault-header-row button{margin-top:8px!important;}
    .vault-header-row button{max-width:100%!important;}
    .vault-support-line{max-width:34ch!important;letter-spacing:.07em!important;line-height:1.5!important;white-space:normal!important;overflow-wrap:break-word!important;}
    .vault-archive-totals{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;border:none!important;overflow:visible!important;background:none!important;margin-bottom:26px!important;}
    .vault-archive-totals>div{border:1px solid rgba(255,255,255,.07)!important;border-radius:8px!important;background:rgba(255,255,255,.03)!important;padding:14px 10px 13px!important;min-width:0!important;}
    .vault-season-files-grid,.vault-historic-grid,.vault-lobby-wipe-grid{grid-template-columns:1fr!important;}
    .vault-season-stat-grid{grid-template-columns:1fr!important;}
    .fade-up{width:100%!important;max-width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important;}
    .card-h,.lb-card,.rival-card,.comm-card{min-width:0!important;width:100%!important;}
    .card-h.legacy-player-card{width:calc(100vw - 68px)!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;}
    .legacy-badge-strip{width:auto!important;min-width:0!important;max-width:100%!important;overflow:visible!important;}
    .legacy-badge-strip span{max-width:100%!important;white-space:normal!important;line-height:1.15!important;font-size:.62rem!important;padding:3px 7px!important;}
    main{padding-left:12px!important;padding-right:12px!important;overflow-x:hidden!important;}
    .combat-picker-shell{
      padding:9px!important;
      border:1px solid rgba(255,255,255,.06);
      border-radius:10px;
      background:rgba(255,255,255,.025);
    }
    .combat-selector{
      display:grid!important;
      grid-template-columns:1fr;
      gap:6px!important;
      max-height:168px;
      overflow:auto;
      align-content:start;
      padding-right:2px;
    }
    .combat-selector button{
      display:flex!important;
      align-items:center!important;
      justify-content:flex-start!important;
      text-align:left!important;
      font-size:.72rem!important;
      padding:8px 11px!important;
      min-height:40px!important;
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
      line-height:1.22;
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
    .home-mobile-shell .all-time-pulse{margin:-8px -12px 30px!important;padding:15px 12px 13px!important;}
    .home-mobile-shell .all-time-pulse-head{align-items:flex-start!important;padding:0 2px 12px!important;}
    .home-mobile-shell .all-time-pulse-line{font-size:.72rem!important;}
    .home-mobile-shell .all-time-pulse-viewport{
      overflow:hidden!important;
      scroll-snap-type:none;
      padding:1px 0 3px;
      -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 7%,#000 90%,transparent 100%)!important;
      mask-image:linear-gradient(90deg,transparent 0,#000 7%,#000 90%,transparent 100%)!important;
      scrollbar-width:none;
    }
    .home-mobile-shell .all-time-pulse-viewport::-webkit-scrollbar{display:none;}
    .home-mobile-shell .all-time-pulse-row{
      display:flex!important;
      width:max-content!important;
      gap:10px!important;
      will-change:transform;
      margin-left:-56px!important;
      animation-duration:40s!important;
    }
    .home-mobile-shell .all-time-pulse-row + .all-time-pulse-row{
      margin-top:10px!important;
      margin-left:-132px!important;
      animation-name:allTimePulseRight!important;
      animation-duration:46s!important;
    }
    .home-mobile-shell .all-time-pulse-mobile-row{display:none!important;}
    .home-mobile-shell .all-time-pulse:hover .all-time-pulse-row,
    .home-mobile-shell .all-time-pulse:focus-within .all-time-pulse-row{
      animation-play-state:paused!important;
    }
    .home-mobile-shell .all-time-pulse-card{
      width:44vw!important;
      max-width:176px!important;
      min-width:148px!important;
      min-height:86px!important;
      padding:12px 13px 12px!important;
      border-radius:0 14px 14px 0!important;
      scroll-snap-align:none;
    }
    .home-mobile-shell .all-time-pulse-card-label{
      font-size:.5rem!important;
      letter-spacing:.18em!important;
      margin-bottom:8px!important;
    }
    .home-mobile-shell .all-time-pulse-card-value{
      font-size:1rem!important;
      line-height:1.08!important;
    }
    .home-mobile-shell .all-time-pulse-card-note{
      font-size:.62rem!important;
      line-height:1.36!important;
      margin-top:6px!important;
    }
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
    .combat-file-page .combat-file-selector{margin-bottom:13px!important;}
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
    .warroom-fallout-report{padding:12px!important;margin-bottom:0!important;}
    .warroom-fallout-head{gap:8px!important;margin-bottom:9px!important;}
    .warroom-fallout-headline{font-size:.9rem!important;line-height:1.22!important;}
    .warroom-fallout-grid{grid-template-columns:1fr!important;gap:7px!important;}
    .warroom-fallout-card{padding:8px 9px!important;}
    .warroom-fallout-card:nth-child(3){display:none!important;}
    .warroom-fallout-card:nth-child(n+5){display:none!important;}
    .warroom-weekly-recap{padding:10px 11px!important;margin-bottom:0!important;}
    .warroom-weekly-head{margin-bottom:8px!important;gap:8px!important;}
    .warroom-weekly-headline{display:none!important;}
    .warroom-weekly-cards{display:none!important;}
    .warroom-weekly-mobile-row{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;}
    .warroom-weekly-mobile-stat{padding:8px 8px 7px!important;border:1px solid color-mix(in srgb,var(--weekly-stat-color) 28%,transparent)!important;border-left:3px solid var(--weekly-stat-color)!important;border-radius:0 7px 7px 0!important;background:rgba(0,0,0,.2)!important;min-width:0!important;}
    .warroom-weekly-mobile-label{font-size:.48rem!important;letter-spacing:.14em!important;color:var(--text3)!important;text-transform:uppercase!important;margin-bottom:4px!important;}
    .warroom-weekly-mobile-value{font-size:.68rem!important;line-height:1.18!important;color:var(--weekly-stat-color)!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}
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
    .intel-v2-page .intel-scout-board{display:flex!important;overflow-x:auto!important;scroll-snap-type:x mandatory!important;gap:10px!important;padding-bottom:4px!important;margin-left:-4px!important;margin-right:-4px!important;}
    .intel-v2-page{width:calc(100vw - 48px)!important;max-width:calc(100vw - 48px)!important;overflow-x:hidden!important;}
    .intel-v2-page .intel-scout-board>div{min-width:78%!important;scroll-snap-align:start!important;}
    .intel-v2-page .intel-scope-switcher{justify-content:flex-start!important;flex-wrap:nowrap!important;overflow-x:auto!important;padding-bottom:4px!important;margin-left:-4px!important;margin-right:-4px!important;}
    .intel-v2-page .intel-scope-switcher button{flex:0 0 auto!important;}
    .intel-v2-page .intel-player-selector{flex-wrap:nowrap!important;overflow-x:auto!important;padding-bottom:4px!important;margin-left:-4px!important;margin-right:-4px!important;}
    .intel-v2-page .intel-player-selector button{flex:0 0 auto!important;}
    .intel-v2-page .intel-marker-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
    .intel-v2-page .intel-marker-grid>div{min-width:0!important;}
    .intel-v2-page table{font-size:.82rem!important;}
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
    .combat-selector{max-height:154px;}
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
  .legacy-player-card{
    isolation:isolate;
    transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease,filter .16s ease;
  }
  .legacy-player-card::before{
    content:"";
    position:absolute;
    inset:0;
    z-index:0;
    pointer-events:none;
    background:
      radial-gradient(circle at 18% 12%,var(--legacy-glow,rgba(255,255,255,.08)),transparent 32%),
      linear-gradient(120deg,transparent 0%,rgba(255,255,255,.055) 42%,transparent 58%);
    opacity:.38;
    transform:translateX(-18%);
    transition:opacity .16s ease,transform .22s ease;
  }
  .legacy-player-card::after{
    content:"";
    position:absolute;
    inset:9px;
    z-index:0;
    pointer-events:none;
    border-radius:14px;
    border:1px solid rgba(255,255,255,.045);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.035);
  }
  .legacy-player-card:hover{
    transform:translateY(-4px);
    filter:saturate(1.08);
  }
  .legacy-player-card:hover::before{
    opacity:.62;
    transform:translateX(10%);
  }
  .legacy-player-card.has-streak-glow{
    animation:legacyHeatBreath 3.8s ease-in-out infinite;
  }
  .legacy-stat-tile{
    transition:transform .14s ease,background .14s ease,border-color .14s ease;
  }
  .legacy-player-card:hover .legacy-stat-tile{
    background:rgba(0,0,0,.46)!important;
  }
  .legacy-player-card:hover .legacy-stat-tile:nth-child(odd){
    transform:translateY(-1px);
  }
  .legacy-badge-strip span{
    transition:background .14s ease,border-color .14s ease,transform .14s ease;
  }
  .legacy-player-card:hover .legacy-badge-strip span{
    border-color:rgba(255,255,255,.28)!important;
  }
  @keyframes legacyHeatBreath{
    0%,100%{box-shadow:0 0 30px rgba(255,107,53,.16),0 0 24px var(--legacy-glow,rgba(255,255,255,.12));}
    50%{box-shadow:0 0 42px rgba(255,107,53,.28),0 0 38px var(--legacy-glow,rgba(255,255,255,.18));}
  }
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
	  @media(max-width:720px) and (prefers-reduced-motion:reduce){
	    .home-mobile-shell .all-time-pulse-viewport{
	      overflow:visible!important;
	      -webkit-mask-image:none!important;
	      mask-image:none!important;
	    }
	    .home-mobile-shell .all-time-pulse-mobile-row{
	      animation:none!important;
	      width:auto!important;
	      flex-wrap:wrap!important;
	    }
	  }
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

const ROUTE_TO_VIEW = {
  "": "home",
  home: "home",
  arena: "leaderboard",
  leaderboard: "leaderboard",
  "combat-file": "profile",
  profile: "profile",
  "war-room": "lobbies",
  lobbies: "lobbies",
  rivals: "rivals",
  vault: "records",
  records: "records",
  "legends-wing": "hof",
  legends: "hof",
  hof: "hof",
  intel: "charts",
  charts: "charts",
  campaign: "campaign",
  briefing: "faq",
  faq: "faq",
  command: "admin",
  admin: "admin",
};

const VIEW_TO_ROUTE = {
  home: "home",
  leaderboard: "arena",
  profile: "combat-file",
  lobbies: "war-room",
  rivals: "rivals",
  records: "vault",
  hof: "legends-wing",
  charts: "intel",
  campaign: "campaign",
  faq: "briefing",
  admin: "command",
};

const parseAppRoute = () => {
  if (typeof window === "undefined") {
    return { view: "home", campaignSeasonId: "s3", valid: true };
  }
  const raw = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
  const parts = raw.split("/").filter(Boolean);
  const route = parts[0] || "home";

  if (route === "season1") {
    return { view: "campaign", campaignSeasonId: "s1", valid: true };
  }
  if (route === "season2") {
    return { view: "campaign", campaignSeasonId: "s2", valid: true };
  }

  const view = ROUTE_TO_VIEW[route];
  if (!view) {
    return { view: "home", campaignSeasonId: "s3", valid: false };
  }

  if (view === "campaign") {
    const seasonRoute = parts[1] || "s3";
    const campaignSeasonId =
      seasonRoute === "season1" || seasonRoute === "season-1" ? "s1" :
      seasonRoute === "season2" || seasonRoute === "season-2" ? "s2" :
      seasonRoute === "season3" || seasonRoute === "season-3" ? "s3" :
      ["s1", "s2", "s3", "s4"].includes(seasonRoute) ? seasonRoute :
      "s3";
    return { view, campaignSeasonId, valid: true };
  }

  return { view, campaignSeasonId: "s3", valid: true };
};

const getRouteHash = (view, campaignSeasonId = "s3") => {
  if (view === "campaign") {
    return campaignSeasonId && campaignSeasonId !== "s3"
      ? `#/campaign/${campaignSeasonId}`
      : "#/campaign";
  }
  return `#/${VIEW_TO_ROUTE[view] || "home"}`;
};

const writeRouteHash = (view, campaignSeasonId, mode = "push") => {
  if (typeof window === "undefined") return;
  const nextHash = getRouteHash(view, campaignSeasonId);
  if (window.location.hash === nextHash) return;
  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
  if (mode === "replace") {
    window.history.replaceState(null, "", nextUrl);
  } else {
    window.history.pushState(null, "", nextUrl);
  }
};

export default function GameNight(){
  const foolsDay=isFoolsDay();
  const initialRoute=parseAppRoute();
  const [view,       setView]      = useState(()=>initialRoute.view);
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
  const [recognitionOpenKeys,setRecognitionOpenKeys]=useState(()=>["recognition-special","recognition-ladder"]);
  const [rivalSearch,setRivalSearch]= useState("");
  const [profileId,  setProfileId]  = useState(null);
  const [expandedSid,setExpandedSid]= useState(null);
  const [lbSeason,   setLbSeason]   = useState("s3");
  const [selectedCampaignSeasonId,setSelectedCampaignSeasonId]=useState(()=>initialRoute.campaignSeasonId);
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
  const [intelScope,setIntelScope]=useState("s3");
  const [legendFilter,setLegendFilter]=useState("all");
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
    if(typeof window==="undefined")return;
    const route=parseAppRoute();
    if(!route.valid) writeRouteHash("home","s3","replace");
    const handleRouteChange=()=>{
      const next=parseAppRoute();
      if(!next.valid){
        setView("home");
        setSelectedCampaignSeasonId("s3");
        writeRouteHash("home","s3","replace");
        return;
      }
      setMobileOpen(false);
      setSelectedCampaignSeasonId(next.campaignSeasonId);
      setView((current)=>{
        if(current!==next.view){
          setZonePulse((count)=>count+1);
          scrollToTop("auto");
        }
        return next.view;
      });
    };
    window.addEventListener("hashchange",handleRouteChange);
    window.addEventListener("popstate",handleRouteChange);
    return()=>{
      window.removeEventListener("hashchange",handleRouteChange);
      window.removeEventListener("popstate",handleRouteChange);
    };
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
    campaign: {label:"CAMPAIGN",      icon:"🚀",color:"#FF4D8F"},
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
  const setCampaignSeasonAndRoute=(seasonId)=>{
    const nextSeasonId=seasonId||"s3";
    setSelectedCampaignSeasonId(nextSeasonId);
    if(view==="campaign") writeRouteHash("campaign",nextSeasonId);
  };
  const go=v=>{
    let routeCampaignSeasonId=selectedCampaignSeasonId||"s3";
    if(v==="season1"){
      routeCampaignSeasonId="s1";
      setSelectedCampaignSeasonId(routeCampaignSeasonId);
      v="campaign";
    }else if(v==="season2"){
      routeCampaignSeasonId="s2";
      setSelectedCampaignSeasonId(routeCampaignSeasonId);
      v="campaign";
    }else if(v==="campaign"){
      routeCampaignSeasonId="s3";
      setSelectedCampaignSeasonId(routeCampaignSeasonId);
    }
    writeRouteHash(v,routeCampaignSeasonId);
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
  const getLobbyWipeEvents=(src=sessions)=>selectGetLobbyWipeEvents(src,players);
  const getPlayerLobbyWipeSummary=pid=>selectGetPlayerLobbyWipeSummary(pid,sessions,players);
  const getPlayerLevel=pid=>selectGetPlayerLevel(pid,sessions);
  const getPlayerFileState=pid=>selectGetPlayerFileState(pid,players,sessions,{seasonId:activeCampaignId});
  const getPlayerSeasonRead=(pid,seasonId=activeCampaignId,options={})=>
    selectGetPlayerSeasonRead(pid,seasonId,players,sessions,options);
  const getSeasonScoutBoard=(seasonId=activeCampaignId,options={})=>
    selectGetSeasonScoutBoard(seasonId,players,sessions,options);
  const getDailyMVP=()=>selectGetDailyMVP(sessions,players);
  const getRivals=()=>selectGetRivals(sessions);
  const getRivalryMatchHistory=(pairId,options={})=>selectGetRivalryMatchHistory(pairId,sessions,players,options);
  const getSeasonSessions=sid=>selectGetSeasonSessions(sessions,sid);
  const getMissionBoardState=()=>selectGetMissionBoardState(sessions,players,{weeklyLoopState});
  const getRecords=()=>selectGetRecords(sessions,players);
  const getChartData=(pid,src=sessions)=>selectGetChartData(pid,src);
  const getLiveStreaks=()=>selectGetLiveStreaks(sessions,players);
  const getLatestDayHeatRun=(date=getLatestSessionDate())=>selectGetLatestDayHeatRun(sessions,players,date);
  const getDayRecap=date=>selectGetDayRecap(date,sessions,players);
  const getDayStorylines=date=>selectGetDayStorylines(date,sessions,players);
  const getDailyOrdersForPlayer=pid=>
    selectGetDailyOrdersForPlayer(pid,players,sessions,{
      dayKey:dailyOrdersSchedule.dayKey,
      isActiveWindow:dailyOrdersSchedule.isActive,
      orderWindow: live || getNextSession().toISOString().slice(0,10)===todayStr() ? "today" : "next-room",
    });
  const getLatestDayConsequences=date=>selectGetLatestDayConsequences(sessions,players,date);
  const getFalloutReport=date=>selectGetFalloutReport(date,sessions,players);
  const getWeeklyRecap=(seasonId=activeCampaignId)=>{
    const scopedSessions=seasonId==="all"?sessions:filterSessionsBySeason(sessions,seasonId);
    return selectGetLatestWeeklyRecap({
      sessions:scopedSessions,
      players,
      weeklyLoopState:seasonId===activeCampaignId?weeklyLoopState:null,
      now:new Date(),
    });
  };
  const getSeasonOpenerFallout=seasonId=>selectGetSeasonOpenerFallout(seasonId, sessions, players);
  const getCampaignFronts=seasonId=>selectGetCampaignFronts(seasonId, sessions, players);
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

    if(latestFallout?.lobbyWipes?.length){
      const wipe=[...latestFallout.lobbyWipes].sort((a,b)=>
        b.kills-a.kills||b.lobbySize-a.lobbySize||b.date.localeCompare(a.date)||parseSessionIdNumber(b.sessionId)-parseSessionIdNumber(a.sessionId),
      )[0];
      const wipeLobbyNo=parseSessionIdNumber(wipe.sessionId)||wipe.sessionId;
      addCandidate("🧹","#00FF94",10,[
        `${dn(wipe.player?.username||"The winner")} wiped Lobby ${wipeLobbyNo} with ${wipe.kills} kills in a ${wipe.lobbySize}-player room.`,
        `Lobby ${wipeLobbyNo} was a full wipe. ${dn(wipe.player?.username||"The winner")} took every possible kill and the crown.`,
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
      const rivalryReads=[
        `${dn(rivalry.leader.username)} pushed the duel board against ${dn(rivalry.trailer.username)} to ${rivalry.leaderWins}-${rivalry.trailerWins} across ${rivalry.total} top-two meetings.`,
      ];
      if(rivalry.leaderDelta>0){
        rivalryReads.push(`${dn(rivalry.leader.username)} added ${rivalry.leaderDelta} more top-two wins over ${dn(rivalry.trailer.username)}. That rivalry is now sitting at ${rivalry.leaderWins}-${rivalry.trailerWins}.`);
      }
      addCandidate("⚔️","#FF4D8F",7,rivalryReads);
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
    const totalKills=Object.values(s.kills||{}).reduce((a,b)=>a+b,0)+(Number(s.unassignedKills)||0);
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
  const weeklyLoopState=selectGetWeeklyLoopState({
    sessions,
    filedSessions:sessions,
    activeCampaignSessions,
    now:new Date(),
  });
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
    {id:"campaign",  l:"CAMPAIGN"},
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
    Object.values(session?.kills||{}).reduce((sum,value)=>sum+value,0)+(Number(session?.unassignedKills)||0);
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
    (total,session)=>total+getLobbyTotalKills(session),
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
        strap:"LATEST FILED DAY",
        summary:arenaScopeLatestDate
          ?`${arenaScopeSessions.length} lobbies filed on ${formatLobbyDate(arenaScopeLatestDate,{weekday:"short",day:"numeric",month:"short"})}`
          :"Waiting on the latest room",
        scopeLabel:"Latest day board",
        emptyTitle:"The freshest day file is still waiting to land.",
        emptyNote:"Once the next set of rooms closes, the newest official board appears here.",
      };
    }
    if(arenaRangeKey==="week"){
      return{
        strap:"THIS WEEK · OFFICIAL BOARD",
        summary:arenaWeekFirstDate&&arenaScopeLatestDate
          ?`${arenaScopeSessions.length} lobbies from ${formatLobbyDate(arenaWeekFirstDate,{day:"numeric",month:"short"})} to ${formatLobbyDate(arenaScopeLatestDate,{day:"numeric",month:"short"})}`
          :"This week is still waiting on its first file",
        scopeLabel:"This week board",
        emptyTitle:"This week has not opened a clean file yet.",
        emptyNote:"The first room of the week opens this board.",
      };
    }
    if(arenaRangeKey==="season"){
      const seasonClosed=arenaCurrentSeason.end<=todayStr();
      return{
        strap:seasonClosed
          ?`${arenaCurrentSeason.name.toUpperCase()} · FINAL BOARD`
          :`${arenaCurrentSeason.name.toUpperCase()} · LIVE OFFICIAL BOARD`,
        summary:`${arenaScopeSessions.length} lobbies, ${arenaScopeKills} kills, ${arenaScopeWinnerCount} winning file${arenaScopeWinnerCount===1?"":"s"}`,
        scopeLabel:`${arenaCurrentSeason.name} board`,
        emptyTitle:`${arenaCurrentSeason.name} has not opened its file yet.`,
        emptyNote:seasonClosed
          ?"This season has no filed rooms in the archive."
          :"Once the opener lands, the season board starts here.",
      };
    }
    return{
      strap:"ALL TIME · OFFICIAL RECORD",
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
    (total,session)=>total+getLobbyTotalKills(session),
    0,
  );
  const seasonTwoClosedWinners=[...new Set(seasonTwoClosedSessions.filter(session=>session.winner).map(session=>session.winner))].length;
  const activeNavView=(view==="season1"||view==="season2")?"campaign":view;
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
    <main style={{maxWidth:view==="hof"?1320:1100,margin:"0 auto",padding:"clamp(12px,4vw,28px) clamp(8px,3vw,14px)",position:"relative",zIndex:2}}>
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
            weeklyLoopState,
          sessions,
          allStats,
          players,
          getStats,
          getRecords,
          dn,
          getMissionBoardState,
          cd,
          live,
          HOSTED_BY,
          FEATURED_GAME,
          getLeaderboardShiftData,
          getLatestDayConsequences,
          getSeasonOpenerFallout,
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
          go,
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
              Permanent records, sealed crowns, names the room keeps forever
            </div>
          </div>

          {/* Top Honor Lane */}
          {(()=>{
            const allTimeRows=allStats().filter((player)=>player.appearances>0);
            const winsLeader=[...allTimeRows].sort((a,b)=>b.wins-a.wins||b.kills-a.kills||b.appearances-a.appearances)[0];
            const killsLeader=[...allTimeRows].sort((a,b)=>b.kills-a.kills||b.wins-a.wins||b.appearances-a.appearances)[0];
            const sharpshooter=[...allTimeRows]
              .filter((player)=>player.appearances>=5&&player.id!==winsLeader?.id&&player.id!==killsLeader?.id)
              .sort((a,b)=>b.kd-a.kd||b.kills-a.kills||b.wins-a.wins)[0];
            const mostPlayed=[...allTimeRows].sort((a,b)=>b.appearances-a.appearances||b.wins-a.wins||b.kills-a.kills)[0];
            const honors=[
              {icon:"👑",label:"Champion",honor:"The Champion",player:winsLeader,value:winsLeader?`${winsLeader.wins} wins`:"Waiting",color:"#FFD700"},
              {icon:"💀",label:"Most Kills",honor:"All-time damage leader",player:killsLeader,value:killsLeader?`${killsLeader.kills} kills`:"Waiting",color:"#FF4D8F"},
              {icon:"🎯",label:"Sharpshooter",honor:"Best K/G file",player:sharpshooter,value:sharpshooter?`${sharpshooter.kd} K/G`:"Waiting",color:"#00E5FF"},
              {icon:"🎮",label:"Ride or Die",honor:"Most filed rooms",player:mostPlayed,value:mostPlayed?`${mostPlayed.appearances} lobbies`:"Waiting",color:"#FFAB40"},
            ];
            return(
              <div style={{...card({border:"1px solid rgba(255,215,0,.22)",background:"linear-gradient(135deg,rgba(255,215,0,.07),rgba(0,0,0,.28),var(--card))"}),padding:16,marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:14}}>
                  <div>
                    <div className="bc7" style={{fontSize:".62rem",letterSpacing:".28em",color:"#FFD700"}}>TOP HONOR LANE</div>
                    <div className="bc7" style={{fontSize:".72rem",color:"var(--text3)",marginTop:4}}>Four all-time plinths from official room history.</div>
                  </div>
                </div>
                <div className="hof-honors-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10}}>
                  {honors.map((honor)=>(
                    <button key={honor.label} type="button" className="hof-honor-card" onClick={()=>honor.player&&goProfile(honor.player.id)} style={{
                      textAlign:"left",
                      background:`linear-gradient(150deg,${honor.color}12,rgba(0,0,0,.42))`,
                      border:`1px solid ${honor.color}38`,
                      borderTop:`3px solid ${honor.color}`,
                      borderRadius:"18px",
                      padding:"13px 14px",
                      cursor:honor.player?"pointer":"default",
                      color:"var(--text)",
                      boxShadow:`0 16px 34px ${honor.color}10`,
                    }}>
                      <div className="bc7" style={{fontSize:".54rem",letterSpacing:".2em",color:`${honor.color}dd`,marginBottom:8}}>{honor.icon} {honor.label}</div>
                      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:9}}>
                        {honor.player&&<Avatar p={honor.player} size={30}/>}
                        <div style={{minWidth:0}}>
                          <div style={{fontFamily:"Fredoka One",color:honor.color,fontSize:".95rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{honor.player?dn(honor.player.username):"Waiting"}</div>
                          <div className="bc7" style={{color:"var(--text3)",fontSize:".62rem",letterSpacing:".1em",textTransform:"uppercase"}}>{honor.honor}</div>
                        </div>
                      </div>
                      <div className="bc9" style={{color:"#fff",fontSize:"1.05rem",lineHeight:1.05}}>{honor.value}</div>
                      <div className="bc7" style={{color:"var(--text3)",fontSize:".6rem",letterSpacing:".12em",marginTop:8,textTransform:"uppercase"}}>Open Combat File</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Legacy Files */}
          {(()=>{
            const rowsWithMeta=allStats()
              .filter((player)=>player.appearances>0)
              .map((row,index)=>{
                const player=players.find((entry)=>entry.id===row.id);
                const badges=player?getBadges(player.id):[];
                const rank=player?getRank(player.id):{title:"",color:"var(--text3)"};
                const majorBadgeCount=badges.filter((badge)=>/Champion|Invincible|Reaper|First Blood|Record|LOBBY WIPE/.test(badge.label)).length;
                const legacyStrength=
                  (rank.title.includes("Champion")?1000000:0)+
                  (rank.title.includes("Reaper")?900000:0)+
                  (rank.title.includes("Sharpshooter")?800000:0)+
                  (rank.title.includes("Ride or Die")?700000:0)+
                  majorBadgeCount*65000+
                  row.wins*1000+
                  row.kills*8+
                  row.appearances*4;
                return{...row,player,badges,rank,legacyStrength,sourceIndex:index};
              })
              .filter((row)=>row.player)
              .filter((row)=>{
                if(legendFilter==="champions")return row.rank.title.includes("Champion")||row.badges.some((badge)=>/Champion/.test(badge.label));
                if(legendFilter==="100w")return row.wins>=100;
                if(legendFilter==="500k")return row.kills>=500;
                if(legendFilter==="attendance")return row.appearances>=100;
                return true;
              })
              .sort((a,b)=>{
                if(legendFilter==="all")return b.wins-a.wins||b.kills-a.kills||b.appearances-a.appearances||a.sourceIndex-b.sourceIndex;
                return b.legacyStrength-a.legacyStrength||b.wins-a.wins||b.kills-a.kills||b.appearances-a.appearances||a.sourceIndex-b.sourceIndex;
              });
            const allFileCount=allStats().filter((player)=>player.appearances>0).length;
            const filters=[
              {id:"all",label:"All"},
              {id:"champions",label:"Champions"},
              {id:"100w",label:"100W+"},
              {id:"500k",label:"500K+"},
              {id:"attendance",label:"High attendance"},
            ];
            const getBadgePriority=(badge)=>{
              if(/Champion|Invincible|Reaper|First Blood|S1 Record Breaker/.test(badge.label))return 1000;
              if(/1K|1.5K|2K|3K|5K|750 Kills|500 Kills/.test(badge.label))return 800;
              if(/300 Kills|200 Kills|150 Kills|100 Kills|50 Kills|25 Kills/.test(badge.label))return 700;
              if(/Full House|Marathon|No Days Off|S1 Iron Man/.test(badge.label))return 600;
              if(/LOBBY WIPE|No Kills Bandit|Best Run|Hot Hand|Rampage|Big Game|Assassin|Fool/.test(badge.label))return 500;
              return badge.hot?450:100;
            };
            return(
              <div style={{...card({border:"2px solid rgba(0,229,255,.18)",background:"linear-gradient(135deg,rgba(0,229,255,.05),rgba(0,0,0,.22),var(--card))"}),padding:20,marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:14}}>
                  <div>
                    <div className="bc7" style={{fontSize:".62rem",letterSpacing:".28em",color:"#00E5FF"}}>LEGACY FILES</div>
                    <div className="bc7" style={{fontSize:".72rem",color:"var(--text3)",marginTop:4}}>All-time player cards from official room history.</div>
                  </div>
                  <div className="bc7" style={{fontSize:".62rem",letterSpacing:".16em",color:"var(--text3)"}}>{rowsWithMeta.length} OF {allFileCount} FILES</div>
                </div>
                <div className="hof-filter-rail" style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                  {filters.map((filter)=>(
                    <button key={filter.id} type="button" onClick={()=>setLegendFilter(filter.id)} style={{
                      border:legendFilter===filter.id?"1px solid rgba(255,215,0,.62)":"1px solid rgba(255,255,255,.12)",
                      background:legendFilter===filter.id?"rgba(255,215,0,.14)":"rgba(255,255,255,.045)",
                      color:legendFilter===filter.id?"#FFD700":"var(--text2)",
                      borderRadius:999,
                      padding:"8px 12px",
                      fontSize:".68rem",
                      fontWeight:900,
                      letterSpacing:".08em",
                      textTransform:"uppercase",
                      cursor:"pointer",
                    }}>
                      {filter.label}
                    </button>
                  ))}
                </div>
                <div className="hof-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:18}}>
                  {rowsWithMeta.map((row,index)=>{
                    const player=row.player;
                    const rank=row.rank;
                    const badges=row.badges;
                    const badgeLimit=badges.length>3?2:3;
                    const sortedBadges=[...badges].sort((a,b)=>getBadgePriority(b)-getBadgePriority(a));
                    const banditBadge=sortedBadges.find((badge)=>badge.label==="No Kills Bandit");
                    const displayBadges=banditBadge
                      ?[
                        banditBadge,
                        ...sortedBadges.filter((badge)=>badge.label!=="No Kills Bandit").slice(0,badgeLimit-1),
                      ]
                      :sortedBadges.slice(0,badgeLimit);
                    const hiddenBadgeCount=Math.max(0,badges.length-displayBadges.length);
                    const streak=getStreak(player.id);
                    const hasStreakGlow=streak>=3;
                    return(
                      <div key={player.id} className={`card-h legacy-player-card${hasStreakGlow?" has-streak-glow":""}`} onClick={()=>goProfile(player.id)} style={{
                        "--legacy-glow":`${player.color}33`,
                        ...card({
                          borderTop:`4px solid ${player.color}`,
                          boxShadow:hasStreakGlow
                            ?`0 0 34px rgba(255,107,53,.2), 0 0 28px ${player.color}18`
                            :`0 0 28px ${player.color}14`,
                        }),
                        padding:20,
                        position:"relative",
                        overflow:"hidden",
                        cursor:"pointer",
                      }}>
                        {hasStreakGlow&&(
                          <div className="fire" style={{
                            position:"absolute",
                            top:8,
                            left:10,
                            zIndex:2,
                            fontSize:".8rem",
                            background:"rgba(255,107,53,.2)",
                            borderRadius:50,
                            padding:"2px 7px",
                            border:"1px solid rgba(255,107,53,.4)",
                            color:"#FF6B35",
                            fontWeight:800,
                            boxShadow:"0 0 16px rgba(255,107,53,.25)",
                          }}>
                            🔥 {streak} streak
                          </div>
                        )}
                        {index<3&&(
                          <div style={{position:"absolute",top:8,right:10,fontSize:"1.5rem",zIndex:2,
                            animation:index===0?"floatY 3s ease-in-out infinite":"none"}}>
                            {["👑","🥈","🥉"][index]}
                          </div>
                        )}
                        <div className="legacy-card-head" style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,marginTop:hasStreakGlow?20:0,position:"relative",zIndex:1}}>
                          <Avatar p={player} size={52} glow/>
                          <div style={{minWidth:0,flex:1,position:"relative",zIndex:1}}>
                            <div className="legacy-card-name" style={{fontFamily:"Fredoka One",color:"#fff",fontSize:"1.15rem",overflow:"visible",textOverflow:"clip",whiteSpace:"normal",wordBreak:"break-word",lineHeight:1.08}}>
                              {player.host?"👑 ":""}{dn(player.username)}
                            </div>
                            <div style={{fontSize:".72rem",color:rank.color,fontWeight:700,marginTop:2}}>
                              {rank.title}
                            </div>
                          </div>
                        </div>
                        <div className="legacy-stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:6,position:"relative",zIndex:1,marginBottom:12}}>
                          {[
                            {icon:"🏆",label:"Wins",value:row.wins,color:"#FFD700"},
                            {icon:"💀",label:"Kills",value:row.kills,color:"#FF4D8F"},
                            {icon:"⚡",label:"K/G",value:row.kd,color:"#00E5FF"},
                            {icon:"🎯",label:"Win Rate",value:`${row.winRate}%`,color:"#00FF94"},
                            {icon:"📅",label:"Lobbies",value:row.appearances,color:"#FFAB40"},
                            {icon:"🌟",label:"Best Game",value:`${row.biggestGame}K`,color:"#C77DFF"},
                          ].map((stat)=>(
                            <div key={stat.label} className="legacy-stat-tile" style={{background:"rgba(0,0,0,.38)",border:`1px solid ${stat.color}18`,borderRadius:8,padding:"7px 10px",textAlign:"left"}}>
                              <div style={{fontSize:".6rem",color:"var(--text3)",fontWeight:700,marginBottom:1}}>{stat.icon} {stat.label}</div>
                              <div className="legacy-stat-value" style={{fontFamily:"Fredoka One",color:stat.color,fontSize:"1.08rem"}}>{stat.value}</div>
                            </div>
                          ))}
                        </div>
                        {badges.length>0&&(
                          <div className="legacy-badge-strip" style={{display:"flex",flexWrap:"wrap",gap:5,position:"relative",zIndex:1}}>
                            {displayBadges.map((badge,index)=>(
                              <span key={`${badge.label}-${index}`} style={{
                              background:badge.hot?"rgba(255,107,53,.15)":"rgba(255,255,255,.09)",
                              borderRadius:999,
                              padding:"3px 9px",
                              fontSize:".68rem",
                              fontWeight:700,
                              color:"#fff",
                              border:badge.hot?"1px solid rgba(255,107,53,.36)":"1px solid rgba(255,255,255,.18)",
                              boxShadow:badge.hot?"0 0 14px rgba(255,107,53,.12)":"none",
                            }}>
                                {badge.hot?<span className="fire" style={{display:"inline-block"}}>{badge.icon}</span>:badge.icon} {badge.label}
                              </span>
                            ))}
                            {hiddenBadgeCount>0&&(
                              <span style={{
                                background:"rgba(255,255,255,.06)",
                                borderRadius:999,
                                padding:"3px 9px",
                                fontSize:".68rem",
                                fontWeight:800,
                                color:"var(--text2)",
                                border:"1px solid rgba(255,255,255,.14)",
                              }}>
                                +{hiddenBadgeCount} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
          setSortBy,
          filteredLB,
          lbSearch,
          players,
          setLbSearch,
          setSpotlight,
          sortedLB,
          sessions,
          foolsDay,
          leaderboardShiftData,
          arenaScopeSessions,
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
          activeCampaign,
          activeCampaignClosed,
          seasonThreeWaiting,
          weeklyLoopState,
        }}/>
      )}

      {/* ═══════════════ RIVALS ═══════════════ */}
      {view==="rivals"&&(
        <RivalsView ctx={{
          sessions,
          rivalryBoard,
          getRivalryMatchHistory,
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
          getFalloutReport,
          getSeasonOpenerFallout,
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
          weeklyLoopState,
          weeklyRecap:getWeeklyRecap(activeCampaignId),
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
          getPlayerLobbyWipeSummary,
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
          getPlayerSeasonRead,
          getSeasonOpenerFallout,
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
          getLobbyWipeEvents,
          getLobbyDateMarker,
          activeCampaign,
          SEASONS,
          go,
        }}/>
      )}

      {view==="charts"&&(
        <div className="fade-up intel-v2-page" style={{minHeight:"calc(100vh - 120px)"}}>
          <div style={{textAlign:"center",marginBottom:22}}>
            <p style={{color:"var(--text3)",fontWeight:800,fontSize:".7rem",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>{intelScope==="all"?"Comparative scouting":`${SEASONS.find((season)=>season.id===intelScope)?.name || "Season"} scouting`}</p>
            <h2 style={{fontFamily:"Fredoka One",fontSize:"clamp(2rem,8vw,3.2rem)",
              background:"linear-gradient(135deg,#00E5FF,#C77DFF)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
              Intel
            </h2>
            <div className="intel-scope-switcher" style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap",marginTop:14}}>
              {[
                {id:"s3",label:"Season 3"},
                {id:"s2",label:"Season 2"},
                {id:"s1",label:"Season 1"},
                {id:"all",label:"All Time"},
              ].map((scope)=>(
                <button key={scope.id} type="button" onClick={()=>{
                  setIntelScope(scope.id);
                  setChartPid("");
                }} className="pill" style={{
                  padding:"7px 13px",
                  borderRadius:999,
                  fontSize:".68rem",
                  fontWeight:900,
                  letterSpacing:".08em",
                  textTransform:"uppercase",
                  background:intelScope===scope.id?"#00E5FF":"rgba(255,255,255,.05)",
                  color:intelScope===scope.id?"#030014":"var(--text2)",
                  border:intelScope===scope.id?"1px solid #00E5FF":"1px solid rgba(255,255,255,.1)",
                  boxShadow:intelScope===scope.id?"0 0 16px rgba(0,229,255,.32)":"none",
                }}>
                  {scope.label}
                </button>
              ))}
            </div>
          </div>
          {(()=>{
            const scopeMeta=intelScope==="all"
              ?{id:"all",name:"All Time",mode:"all-time",sessions}
              :{
                id:intelScope,
                name:SEASONS.find((season)=>season.id===intelScope)?.name || "Season",
                mode:intelScope==="s3"?"live":"archive",
                sessions:filterSessionsBySeason(sessions,intelScope),
              };
            const scopeSess=scopeMeta.sessions;
            const baseScout=getSeasonScoutBoard(scopeMeta.id);
            const activePlayers=players
              .map(p=>({...p,...getStats(p.id,scopeSess)}))
              .filter(p=>p.appearances>0)
              .sort((a,b)=>b.wins-a.wins||b.kills-a.kills||b.appearances-a.appearances);
            const chartPidInScope=activePlayers.some((player)=>player.id===chartPid);
            const effectivePid=(chartPidInScope&&chartPid)||baseScout.defaultPlayerId||activePlayers[0]?.id||"";
            const scout=getSeasonScoutBoard(scopeMeta.id,{playerId:effectivePid});
            const chartPlayer=players.find(p=>p.id===effectivePid);
            const chartData=getChartData(effectivePid,scopeSess);
            const maxW=Math.max(1,...chartData.map(d=>d.wins));
            const maxK=Math.max(1,...chartData.map(d=>d.kills));
            const selectedBrief=scout.selectedPlayerBrief;
            const scoutLanes=[
              {label:"Rising files",color:"#00FF94",items:scout.risingPlayers},
              {label:"Damage watch",color:"#FF4D8F",items:scout.damageWatchPlayers},
              {label:"Quiet files",color:"#7B8CDE",items:scout.quietFiles},
              {label:scopeMeta.mode==="archive"?"Final movement":scopeMeta.mode==="all-time"?"Recent marker":"Latest movement",color:"#FFD700",items:scout.latestMovement},
            ];
            return(
              <div>
                <div className="intel-scout-board" style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8,marginBottom:18}}>
                  {scoutLanes.map((lane)=>{
                    const item=lane.items?.[0];
                    return(
                      <div key={lane.label} style={{
                        background:`linear-gradient(135deg,${lane.color}12,rgba(0,0,0,.3))`,
                        border:`1px solid ${lane.color}2c`,
                        borderLeft:`3px solid ${lane.color}`,
                        borderRadius:"0 8px 8px 0",
                        padding:"12px 13px",
                        minHeight:118,
                      }}>
                        <div className="bc7" style={{fontSize:".54rem",letterSpacing:".2em",color:`${lane.color}cc`,textTransform:"uppercase",marginBottom:8}}>
                          {lane.label}
                        </div>
                        <div className="bc9" style={{fontSize:".92rem",lineHeight:1.2,color:lane.color,marginBottom:6}}>
                          {item?.headline || "No clean read yet."}
                        </div>
                        <div className="bc7" style={{fontSize:".64rem",lineHeight:1.5,color:"var(--text3)",marginBottom:8}}>
                          {item?.detail || `Official ${scopeMeta.name} data has not made this lane useful yet.`}
                        </div>
                        {item?.statLine&&(
                          <div className="bc7" style={{fontSize:".58rem",letterSpacing:".14em",color:"var(--text2)"}}>
                            {item.statLine}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="intel-player-selector" style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
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
                            Selected scout file
                          </div>
                          <div style={{fontFamily:"Fredoka One",fontSize:"1.2rem",color:chartPlayer.color,lineHeight:1.1}}>
                            {chartPlayer.host?"👑 ":""}{dn(chartPlayer.username)}
                          </div>
                        </div>
                      </div>
                      <div className="bc9" style={{fontSize:"1rem",lineHeight:1.28,color:chartPlayer.color,marginBottom:6}}>
                        {selectedBrief.headline}
                      </div>
                      <div className="bc7" style={{fontSize:".76rem",lineHeight:1.55,color:"var(--text2)",marginBottom:13}}>
                        {selectedBrief.supportLine}
                      </div>
                      <div className="intel-marker-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8}}>
                        {selectedBrief.markers.map((marker,index)=>(
                          <div key={marker.label} style={{background:"rgba(0,0,0,.24)",border:`1px solid ${marker.color}24`,borderRadius:8,padding:"10px 11px"}}>
                            <div className="bc7" style={{fontSize:".54rem",letterSpacing:".16em",color:index===0?"#00E5FF":index===1?"#00FF94":"#FFD700",textTransform:"uppercase",marginBottom:5}}>
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
                      <div className="bc7" style={{fontSize:".68rem",color:"var(--text3)",lineHeight:1.5,margin:"-4px 0 12px"}}>
                        The chart shows where the file moved, not just what it totaled.
                      </div>
                      <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120,overflowX:"auto",paddingBottom:4}}>
                        {chartData.map((d,i)=>{
                          const h=maxW>0?Math.round((d.wins/maxW)*96):0;
                          const dd=new Date(d.date+"T12:00:00Z");
                          const label=`${dd.toLocaleDateString("en",{month:"short",day:"numeric"})}: ${d.wins}W`;
                          return(
                            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:32,flex:"0 0 auto"}}>
                              <div style={{fontSize:".65rem",color:"var(--gold)",fontWeight:800,height:16,display:"flex",alignItems:"center"}}>
                                {d.wins>0?d.wins:""}
                              </div>
                              <div className="chart-bar" title={label} style={{
                                width:28,height:`${Math.max(6,h)}px`,minHeight:6,
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
                      <div className="bc7" style={{fontSize:".68rem",color:"var(--text3)",lineHeight:1.5,margin:"-4px 0 12px"}}>
                        Damage spikes show pressure even when the crown does not move.
                      </div>
                      <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120,overflowX:"auto",paddingBottom:4}}>
                        {chartData.map((d,i)=>{
                          const h=maxK>0?Math.round((d.kills/maxK)*96):0;
                          const dd=new Date(d.date+"T12:00:00Z");
                          const label=`${dd.toLocaleDateString("en",{month:"short",day:"numeric"})}: ${d.kills}K`;
                          return(
                            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:32,flex:"0 0 auto"}}>
                              <div style={{fontSize:".65rem",color:"var(--pink)",fontWeight:800,height:16,display:"flex",alignItems:"center"}}>
                                {d.kills>0?d.kills:""}
                              </div>
                              <div className="chart-bar" title={label} style={{
                                width:28,height:`${Math.max(6,h)}px`,minHeight:6,
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
          CAMPAIGN VIEW
      ══════════════════════════════════════════════ */}
      {view==="campaign"&&(
        <Season2View ctx={{
          todayStr,
          SEASON_TWO_ID,
          campaignSeasonId:selectedCampaignSeasonId||activeCampaignId,
          selectedCampaignSeasonId,
          setSelectedCampaignSeasonId:setCampaignSeasonAndRoute,
          activeCampaignId,
          SEASONS,
          sessions,
          allStats,
          players,
          compareSessionsAsc,
          getLatestSessionDate,
          getLatestDayConsequences,
          getCampaignFronts,
          getWeeklyRecap,
          getSeasonOpenerFallout,
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
          weeklyLoopState,
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

          {(()=>{
            const specialRoleNames=["The Champion","The Reaper","Sharpshooter","Ride or Die"];
            const specialRoles=RANK_FAQ.filter((rank)=>specialRoleNames.includes(rank.name));
            const ladderNames=["Rookie","Rising Star","Gunslinger","Veteran","Legend","Elite","Mythic","Immortal","Warlord","Apex","Ascendant","Eternal"];
            const callsignLadder=ladderNames.map((name)=>RANK_FAQ.find((rank)=>rank.name===name)).filter(Boolean);
            const badgeByName=(name)=>BADGE_CATALOGUE.find((badge)=>badge.name===name);
            const badgeGroups=[
              {id:"board",title:"Board Roles",color:"#FFD700",items:["The Champion","The Reaper","Sharpshooter","Ride or Die"].map(badgeByName).filter(Boolean)},
              {id:"wins",title:"Win Progression",color:"#C77DFF",items:["Winner","Win Streak","Rising Star","Gunslinger","Veteran","Legend","Elite","Mythic","Immortal","Warlord","Apex","Ascendant","Eternal"].map(badgeByName).filter(Boolean)},
              {id:"kills",title:"Kill Milestones",color:"#FF4D8F",items:BADGE_CATALOGUE.filter((badge)=>/Kills$/.test(badge.name))},
              {id:"performance",title:"Performance Feats",color:"#00E5FF",items:["2.0+ K/G","Big Game","50% Win Rate","Assassin","LOBBY WIPE","No Kills Bandit","Iron Wall","Hot Hand","Rampage"].map(badgeByName).filter(Boolean)},
              {id:"attendance",title:"Attendance",color:"#FFAB40",items:["Full House","Marathon","Never 1st","Day One"].map(badgeByName).filter(Boolean)},
              {id:"season",title:"Season Honors",color:"#00FF94",items:BADGE_CATALOGUE.filter((badge)=>/^S[12] |S2 |Opening Night|First Blood S2/.test(badge.name))},
              {id:"limited",title:"Limited Events",color:"#FF6B35",items:["Easter Egg","No Days Off","Fool's Crown"].map(badgeByName).filter(Boolean)},
            ].filter((group)=>group.items.length);
            const killMilestones=badgeGroups.find((group)=>group.id==="kills")?.items||[];
            const recognitionOpen=(key)=>recognitionOpenKeys.includes(key);
            const toggleRecognition=(key)=>setRecognitionOpenKeys((openKeys)=>openKeys.includes(key)?openKeys.filter((item)=>item!==key):[...openKeys,key]);
            const renderSectionShell=({keyId,title,label,color,children,openByDefault=false,count=""})=>{
              const open=recognitionOpen(keyId,openByDefault);
              return(
                <div style={{...card({border:`2px solid ${color}38`,background:`linear-gradient(135deg,${color}0f,var(--card))`}),padding:0,marginBottom:16,overflow:"hidden"}}>
                  <button type="button" onClick={()=>toggleRecognition(keyId)} style={{
                    width:"100%",border:0,background:"transparent",color:"var(--text)",cursor:"pointer",
                    padding:"18px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,textAlign:"left",
                  }}>
                    <span>
                      <span className="bc7" style={{display:"block",fontSize:".58rem",letterSpacing:".24em",color,marginBottom:5,textTransform:"uppercase"}}>{label}</span>
                      <span style={{fontFamily:"Fredoka One",fontSize:"1.18rem",color:"#fff"}}>{title}</span>
                    </span>
                    <span className="bc7" style={{color:"var(--text3)",fontSize:".72rem",letterSpacing:".12em",textTransform:"uppercase",whiteSpace:"nowrap"}}>
                      {count||""} {open?"▲":"▼"}
                    </span>
                  </button>
                  {open&&<div style={{padding:"0 20px 20px"}}>{children}</div>}
                </div>
              );
            };
            const renderBadgeCard=(badge)=>(
              <div key={badge.name} style={{background:"rgba(0,0,0,.3)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:"1.1rem"}}>{badge.icon}</span>
                  <span style={{fontFamily:"Fredoka One",color:"#fff",fontSize:".95rem"}}>{badge.name}</span>
                </div>
                <p style={{color:"var(--text3)",fontSize:".74rem",lineHeight:1.5,marginBottom:7}}>{badge.desc}</p>
                <p style={{color:"var(--text2)",fontSize:".74rem",lineHeight:1.5}}><span style={{color:"#00FF94",fontWeight:900}}>How to earn: </span>{badge.how}</p>
              </div>
            );
            return(
              <>
                <div style={{...card({border:"2px solid rgba(0,229,255,.25)",background:"linear-gradient(135deg,rgba(0,229,255,.08),var(--card))"}),padding:18,marginBottom:16}}>
                  <div className="bc7" style={{fontSize:".6rem",letterSpacing:".26em",color:"#00E5FF",marginBottom:7}}>OFFICIAL GUIDE NOTE</div>
                  <div style={{fontFamily:"Fredoka One",fontSize:"1.1rem",color:"#fff",marginBottom:5}}>Only official filed sessions count.</div>
                  <p style={{color:"var(--text2)",fontSize:".82rem",lineHeight:1.65}}>
                    Recognition comes from filed lobbies only. Callsigns, badges, levels, and records do not move until the room result is official.
                  </p>
                </div>

                {renderSectionShell({
                  keyId:"recognition-special",
                  title:"Special Roles",
                  label:"Board-held identities",
                  color:"#FFD700",
                  openByDefault:true,
                  count:"4 roles",
                  children:(
                    <>
                      <p style={{color:"var(--text3)",fontSize:".78rem",lineHeight:1.65,marginBottom:12}}>
                        These roles belong to the current board holders. They can change when the official board changes.
                      </p>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
                        {specialRoles.map((role)=>(
                          <div key={role.name} style={{background:"rgba(0,0,0,.32)",border:`1px solid ${role.color}33`,borderLeft:`3px solid ${role.color}`,borderRadius:"0 12px 12px 0",padding:"13px 15px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                              <span style={{fontSize:"1.2rem"}}>{role.icon}</span>
                              <span style={{fontFamily:"Fredoka One",color:role.color,fontSize:"1rem"}}>{role.name==="The Reaper"?"The Reaper / Most Kills":role.name}</span>
                            </div>
                            <p style={{color:"var(--text2)",fontSize:".78rem",lineHeight:1.55}}>{role.desc}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ),
                })}

                {renderSectionShell({
                  keyId:"recognition-ladder",
                  title:"Callsign Ladder",
                  label:"Win-based progression",
                  color:"#C77DFF",
                  openByDefault:true,
                  count:`${callsignLadder.length} callsigns`,
                  children:(
                    <div style={{display:"grid",gap:8}}>
                      {callsignLadder.map((rank,index)=>(
                        <div key={rank.name} style={{display:"grid",gridTemplateColumns:"34px minmax(0,1fr)",gap:10,alignItems:"start",background:"rgba(0,0,0,.26)",border:`1px solid ${rank.color}28`,borderRadius:12,padding:"11px 13px"}}>
                          <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:`${rank.color}1f`,border:`1px solid ${rank.color}44`,fontSize:".92rem"}}>{index+1}</div>
                          <div>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                              <span>{rank.icon}</span>
                              <span style={{fontFamily:"Fredoka One",color:rank.color,fontSize:".98rem"}}>{rank.name}</span>
                            </div>
                            <p style={{color:"var(--text2)",fontSize:".76rem",lineHeight:1.5}}>{rank.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                })}

                <div style={{...card({border:"2px solid rgba(255,77,143,.28)",background:"linear-gradient(135deg,rgba(255,77,143,.08),var(--card))"}),padding:20,marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginBottom:12}}>
                    <div>
                      <div className="bc7" style={{fontSize:".58rem",letterSpacing:".24em",color:"#FF4D8F",marginBottom:5}}>DAMAGE LADDER</div>
                      <h3 style={{fontFamily:"Fredoka One",fontSize:"1.18rem",color:"#fff"}}>Kill Milestones</h3>
                    </div>
                    <div className="bc7" style={{fontSize:".7rem",letterSpacing:".12em",color:"var(--text3)",textTransform:"uppercase"}}>{killMilestones.length} damage milestones</div>
                  </div>
                  <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
                    {killMilestones.map((badge)=>(
                      <div key={badge.name} style={{flex:"0 0 150px",background:"rgba(0,0,0,.34)",border:"1px solid rgba(255,77,143,.22)",borderRadius:12,padding:"12px 13px"}}>
                        <div style={{fontSize:"1.2rem",marginBottom:8}}>{badge.icon}</div>
                        <div style={{fontFamily:"Fredoka One",fontSize:".92rem",color:"#FF4D8F",marginBottom:5}}>{badge.name}</div>
                        <div style={{fontSize:".68rem",color:"var(--text3)",lineHeight:1.45}}>{badge.how}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{...card({border:"2px solid rgba(255,215,0,.3)"}),padding:20,marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                    <span style={{fontSize:"1.5rem"}}>🎖️</span>
                    <div>
                      <h3 style={{fontFamily:"Fredoka One",color:"#FFD700",fontSize:"1.2rem"}}>Commendation Groups</h3>
                      <p style={{color:"var(--text3)",fontSize:".78rem",marginTop:2}}>Display groups only. Earning rules stay exactly the same.</p>
                    </div>
                  </div>
                  <div style={{display:"grid",gap:8}}>
                    {badgeGroups.map((group)=>(
                      <div key={group.id} className="faq-item" style={{border:`1px solid ${group.color}22`,borderRadius:12,overflow:"hidden",background:"rgba(0,0,0,.18)"}}>
                        <div className="faq-q" onClick={()=>toggleRecognition(`badge-${group.id}`)} style={{padding:"13px 14px"}}>
                          <span style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
                            <span style={{width:8,height:8,borderRadius:"50%",background:group.color,boxShadow:`0 0 12px ${group.color}66`,flexShrink:0}}/>
                            <strong style={{color:"#fff"}}>{group.title}</strong>
                            <span style={{color:"var(--text3)",fontWeight:800,fontSize:".78rem"}}>{group.items.length} {group.id==="kills"?"damage milestones":"commendations"}</span>
                          </span>
                          <span style={{color:"var(--text3)",marginLeft:8,flexShrink:0,fontSize:"1rem"}}>{recognitionOpen(`badge-${group.id}`)?"▲":"▼"}</span>
                        </div>
                        {recognitionOpen(`badge-${group.id}`)&&(
                          <div style={{padding:"0 14px 14px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8}}>
                            {group.items.map(renderBadgeCard)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {renderSectionShell({
                  keyId:"recognition-levels",
                  title:"Levels and XP",
                  label:"Progression layer",
                  color:"#C77DFF",
                  count:"5 XP sources",
                  children:(
                    <>
                      <p style={{color:"var(--text3)",fontSize:".78rem",lineHeight:1.65,marginBottom:12}}>
                        Levels are separate from callsigns and badges. They show long-term file growth from official activity.
                      </p>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8,marginBottom:12}}>
                        {[
                          {icon:"📅",label:"1 XP",desc:"Per lobby played"},
                          {icon:"🏆",label:"3 XP",desc:"Per lobby won"},
                          {icon:"💀",label:"0.5 XP",desc:"Per kill"},
                          {icon:"🎖️",label:"10 XP",desc:"Per badge earned"},
                          {icon:"🚀",label:"25 XP",desc:"Per season played in"},
                        ].map((s)=>(
                          <div key={s.label} style={{background:"rgba(199,125,255,.06)",border:"1px solid rgba(199,125,255,.18)",borderRadius:10,padding:"11px 13px",display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontSize:"1.2rem",flexShrink:0}}>{s.icon}</span>
                            <div>
                              <div className="bc9" style={{fontSize:".98rem",color:"#C77DFF"}}>{s.label}</div>
                              <div className="bc7" style={{fontSize:".7rem",color:"var(--text3)"}}>{s.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p style={{color:"var(--text2)",fontSize:".78rem",lineHeight:1.65}}>
                        Level uses total XP on a square-root curve. Early levels move quickly, higher levels need real staying power.
                      </p>
                    </>
                  ),
                })}

                {renderSectionShell({
                  keyId:"recognition-rules",
                  title:"Filed Session Rules",
                  label:"Board language",
                  color:"#00E5FF",
                  count:"12 terms",
                  children:(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
                      {[
                        {icon:"🏆",term:"Wins",color:"#FFD700",def:"Lobbies finished in first place."},
                        {icon:"💀",term:"Kills",color:"#FF4D8F",def:"Confirmed eliminations across filed lobbies."},
                        {icon:"⚡",term:"K/G",color:"#00E5FF",def:"Total kills divided by lobbies played."},
                        {icon:"🎯",term:"Win Rate %",color:"#00FF94",def:"Wins divided by appearances."},
                        {icon:"📅",term:"Appearances",color:"#FFAB40",def:"Every official lobby where the player was listed."},
                        {icon:"🌟",term:"Best Game",color:"#C77DFF",def:"Highest single-lobby kill count on file."},
                        {icon:"🔥",term:"Win Streak",color:"#FF6B35",def:"Consecutive wins on the same session day."},
                        {icon:"⚔️",term:"Duels",color:"#FF4D8F",def:"Two players finishing first and second in the same lobby."},
                        {icon:"⚡",term:"Latest Day",color:"#00E5FF",def:"The most recent filed session date."},
                        {icon:"🎖️",term:"Carry Score",color:"#FF6B35",def:"Wins where the winner also led the lobby in kills."},
                        {icon:"🧱",term:"Consistency",color:"#00FF94",def:"Percent of lobbies finished in the top half."},
                        {icon:"🌵",term:"Drought",color:"#FFAB40",def:"Lobbies since the player last won."},
                      ].map((s)=>(
                        <div key={s.term} style={{background:"rgba(0,0,0,.3)",borderRadius:12,padding:"12px 14px",border:`1px solid ${s.color}22`}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                            <span>{s.icon}</span>
                            <span style={{fontFamily:"Fredoka One",color:s.color,fontSize:".95rem"}}>{s.term}</span>
                          </div>
                          <p style={{color:"var(--text2)",fontSize:".76rem",lineHeight:1.5}}>{s.def}</p>
                        </div>
                      ))}
                    </div>
                  ),
                })}

                {renderSectionShell({
                  keyId:"recognition-questions",
                  title:"Room Questions",
                  label:"Joining and schedule",
                  color:"#FF6B35",
                  count:"7 answers",
                  children:(
                    <div>
                      {[
                        {q:"When do sessions run?",a:"Mon-Sat, 5:00 PM to 7:00 PM UTC. Mekula hosts. Discord is where the room call goes out."},
                        {q:"How do I get added to the roster?",a:"Join the Discord and ask Mekula. Once your name is on the roster, your file starts tracking from the next official session you play."},
                        {q:"What is Bullet League?",a:"Bullet League is the featured battleground for Games Night."},
                        {q:"How are winners determined?",a:"Whoever finishes first on the in-game leaderboard at the end of a round takes that lobby."},
                        {q:"Why does my Win Rate show 0% even if I played?",a:"Win Rate only moves once you close a lobby. Until then the file still tracks appearances, kills, and pressure."},
                        {q:"What is the Rivals page?",a:"Rivals tracks official 1st vs 2nd finishes and the running score between those pairs."},
                        {q:"How do I watch the stream?",a:"Most sessions go live on Twitch at twitch.tv/mekulavick."},
                      ].map((item,i)=>(
                        <div key={item.q} className="faq-item">
                          <div className="faq-q" onClick={()=>setFaqOpen(`room-${i}`===faqOpen?null:`room-${i}`)}>
                            <span>{item.q}</span>
                            <span style={{color:"var(--text3)",marginLeft:8,flexShrink:0,fontSize:"1rem"}}>{`room-${i}`===faqOpen?"▲":"▼"}</span>
                          </div>
                          {`room-${i}`===faqOpen&&<div className="faq-a">{item.a}</div>}
                        </div>
                      ))}
                    </div>
                  ),
                })}
              </>
            );
          })()}
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
