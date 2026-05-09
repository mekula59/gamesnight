import { useEffect, useState } from "react";
import { BADGE_CATALOGUE } from "../game/config";

export function BadgeFlip({ b, playerColor }) {
  const displayLabel = b.label === "S2 Invincible" ? "Season 2 Invincible" : b.label;
  const streakRunMatch = b.label.match(/^Best Run (\d+)$/);
  const bc = streakRunMatch
    ? { how: `Longest single-day win run on file: ${streakRunMatch[1]} straight` }
    : b.how
      ? { how: b.how }
      : BADGE_CATALOGUE.find((x) => x.name === b.label) || { how: "Earned through gameplay" };
  const [flipped, setFlipped] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!flipped) return;
    const t = setTimeout(() => setFlipped(false), 5000);
    return () => clearTimeout(t);
  }, [flipped]);

  const handle = (e) => {
    e.preventDefault();
    if (locked) return;
    setLocked(true);
    setTimeout(() => setLocked(false), 400);
    setFlipped((f) => !f);
  };

  return (
    <div
      className={`badge-flip-wrap${flipped ? " flipped" : ""}`}
      title={flipped ? "" : "Tap to reveal"}
      onClick={handle}
      onTouchEnd={handle}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
    >
      <div className="badge-flip-inner">
        <div
          className="badge-flip-front"
          style={{ background: `${playerColor}14`, border: `1px solid ${playerColor}33` }}
        >
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>{b.icon}</span>
          <span
            className="bc7"
            style={{
              fontSize: ".62rem",
              color: playerColor,
              letterSpacing: ".04em",
              lineHeight: 1.3,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {displayLabel}
          </span>
        </div>
        <div className="badge-flip-back" style={{ border: `1px solid ${playerColor}44` }}>
          <span
            style={{
              fontFamily: "Nunito",
              fontWeight: 700,
              fontSize: ".6rem",
              color: "#c8baff",
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            {bc.how}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LeaderSlideshow({ slides }) {
  const [idx, setIdx] = useState(0);
  const [animDir, setAnimDir] = useState("in");

  useEffect(() => {
    if (!slides.length) return;
    let timeout = null;
    const iv = setInterval(() => {
      setAnimDir("out");
      timeout = setTimeout(() => {
        setIdx((i) => (i + 1) % slides.length);
        setAnimDir("in");
      }, 340);
    }, 5000);
    return () => {
      clearInterval(iv);
      if (timeout) clearTimeout(timeout);
    };
  }, [slides.length]);

  if (!slides.length) return null;
  const activeIdx = slides[idx] ? idx : 0;
  const s = slides[activeIdx] || slides[0];
  if (!s || !s.player) return null;

  const goTo = (i) => {
    if (i === activeIdx) return;
    setAnimDir("out");
    setTimeout(() => {
      setIdx(i);
      setAnimDir("in");
    }, 280);
  };

  const slideStyle = {
    opacity: animDir === "in" ? 1 : 0,
    transform: animDir === "in" ? "translateX(0)" : "translateX(14px)",
    transition: "opacity .3s ease, transform .3s ease",
  };

  return (
    <div style={{ marginBottom: 0 }}>
      <div
        style={{
          background: `linear-gradient(135deg,${s.player.color}0e,rgba(0,0,0,.55))`,
          border: `1px solid ${s.player.color}33`,
          borderLeft: `3px solid ${s.player.color}`,
          borderRadius: "0 8px 8px 0",
          padding: "18px 20px",
          position: "relative",
          overflow: "hidden",
          minHeight: 92,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -6,
            top: -8,
            fontFamily: "Barlow Condensed",
            fontWeight: 900,
            fontSize: "7rem",
            color: s.player.color,
            opacity: 0.05,
            lineHeight: 1,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {s.player.username[0]}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, ...slideStyle }}>
          <div
            style={{
              flexShrink: 0,
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: `linear-gradient(135deg,${s.player.color},${s.player.color}88)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Barlow Condensed",
              fontWeight: 900,
              fontSize: "1.5rem",
              color: "#fff",
              boxShadow: `0 0 22px ${s.player.color}55`,
            }}
          >
            {s.player.username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
            <div className="bc7" style={{ fontSize: ".58rem", letterSpacing: ".3em", color: `${s.player.color}66`, marginBottom: 4 }}>
              ▸ {s.label}
            </div>
            <div
              className="bc9"
              style={{
                fontSize: "clamp(1.2rem,5vw,1.9rem)",
                letterSpacing: ".06em",
                color: s.player.color,
                textShadow: `0 0 18px ${s.player.color}44`,
                lineHeight: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {s.player.host ? "👑 " : ""}
              {s.player.username.toUpperCase()}
            </div>
            <div className="bc7" style={{ fontSize: ".75rem", color: "var(--text2)", marginTop: 5, letterSpacing: ".05em" }}>
              {s.stat}
            </div>
            {s.sub && <div className="bc7" style={{ fontSize: ".62rem", color: "var(--text3)", marginTop: 2 }}>{s.sub}</div>}
          </div>
          <div style={{ fontSize: "clamp(1.8rem,5vw,2.8rem)", flexShrink: 0, textShadow: `0 0 20px ${s.player.color}55` }}>
            {s.icon}
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 12, position: "relative", zIndex: 2 }}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === activeIdx ? 18 : 6,
                height: 6,
                borderRadius: 3,
                cursor: "pointer",
                background: i === activeIdx ? s.player.color : "rgba(255,255,255,.18)",
                transition: "all .3s ease",
                boxShadow: i === activeIdx ? `0 0 8px ${s.player.color}77` : "none",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function MotionReveal({
  children,
  className = "",
  style,
  delay = 0,
  shift = 16,
  as: Tag = "div",
  threshold = 0.18,
  triggerOnce = true,
  disabled = false,
  revealKey = "",
}) {
  return (
    <Tag
      className={`${className} motion-reveal is-visible`.trim()}
      style={{
        ...style,
        "--motion-delay": `${delay}ms`,
        "--motion-shift": `${shift}px`,
        "--motion-threshold": threshold,
        "--motion-trigger-once": triggerOnce ? 1 : 0,
        "--motion-disabled": disabled ? 1 : 0,
        "--motion-key": revealKey,
      }}
    >
      {children}
    </Tag>
  );
}

export function HomeStage({ tag, title, sub, accent, children, marginBottom = 30 }) {
  return (
    <MotionReveal as="section" className="home-stage-shell" style={{ marginBottom }}>
      <div className="home-stage-head" style={{ marginBottom: 15 }}>
        <div className="home-stage-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <div>
            <div className="bc9" style={{ fontSize: ".62rem", letterSpacing: ".3em", color: `${accent}bb`, marginBottom: 6 }}>
              ▸ {tag}
            </div>
            {title && <div className="bc7 home-stage-title" style={{ fontSize: ".8rem", color: "var(--text2)", letterSpacing: ".04em", lineHeight: 1.62, maxWidth: 820 }}>{title}</div>}
          </div>
          {sub && <div className="bc7 home-stage-sub" style={{ fontSize: ".64rem", letterSpacing: ".16em", color: "var(--text3)", textTransform: "uppercase", paddingBottom: 2 }}>{sub}</div>}
        </div>
        <div style={{ height: 1, background: `linear-gradient(90deg,${accent}66,rgba(255,255,255,.05),transparent)` }} />
      </div>
      {children}
    </MotionReveal>
  );
}

export function TypedBio({ text, color }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        marginBottom: 12,
        background: "rgba(255,255,255,.02)",
        borderLeft: `3px solid ${color}33`,
        borderRadius: "0 6px 6px 0",
        minHeight: 52,
      }}
    >
      <span
        style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: ".77rem",
          lineHeight: 1.9,
          color: "var(--text3)",
          letterSpacing: ".04em",
          display: "block",
          wordBreak: "break-word",
        }}
      >
        {text}
      </span>
    </div>
  );
}

export function BriefingFeed({ stories }) {
  const visibleCount = stories.length;
  const storyCount = stories.length;

  if (!storyCount) return null;

  return (
    <div
      className="briefing-feed"
      style={{
        background: "rgba(0,0,0,.45)",
        border: "1px solid rgba(255,255,255,.08)",
        borderTop: "2px solid rgba(0,255,148,.3)",
        borderRadius: "0 6px 6px 0",
        borderLeft: "3px solid rgba(0,255,148,.35)",
        padding: "17px 18px 18px",
      }}
    >
      <div style={{ display: "grid", gap: 9 }}>
        {stories.slice(0, visibleCount).map((story, index) => (
          <div
            key={`${story.icon}-${story.text}-${index}`}
            className="bc7"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              color: "var(--text2)",
              fontSize: ".74rem",
              lineHeight: 1.72,
            }}
          >
            <span style={{ color: story.color, flexShrink: 0 }}>{story.icon}</span>
            <span>{story.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
