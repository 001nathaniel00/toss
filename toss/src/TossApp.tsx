import { useCallback, useEffect, useRef, useState } from "react";
import { playToss } from "./audio";
import {
  extraSpins,
  fairSide,
  loadSaved,
  saveSaved,
  type Side,
  type TossRecord,
} from "./storage";

const SPIN_MS = 2400;
const EDGE = 14;

function label(side: Side) {
  return side === "heads" ? "Heads" : "Tails";
}

function CoinFace({ side }: { side: Side }) {
  const raw = side === "heads" ? "h" : "t";
  const motto = side === "heads" ? "CALL IT" : "FAIR ODDS";
  const foot = side === "heads" ? "HEADS" : "TAILS";
  const top = `${raw}-top`;
  const bot = `${raw}-bot`;
  const metal = `${raw}-metal`;

  return (
    <div className={`coin-face coin-face--${side}`}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <radialGradient id={metal} cx="36%" cy="32%" r="72%">
            <stop offset="0%" stopColor="var(--color-cream)" />
            <stop offset="48%" stopColor="var(--color-gold)" />
            <stop offset="100%" stopColor="color-mix(in oklab, var(--color-gold) 72%, var(--color-ink))" />
          </radialGradient>
          <path id={top} d="M 36 96 A 68 68 0 0 1 164 96" />
          <path id={bot} d="M 48 118 A 54 54 0 0 0 152 118" />
        </defs>
        <circle cx="100" cy="100" r="97" fill={`url(#${metal})`} />
        <circle cx="100" cy="100" r="97" fill="none" stroke="var(--color-cream)" strokeOpacity="0.85" strokeWidth="2.5" />
        <circle cx="100" cy="100" r="90" fill="none" stroke="var(--color-ink)" strokeOpacity="0.45" strokeWidth="1.6" />
        <circle
          cx="100"
          cy="100"
          r="85"
          fill="none"
          stroke="var(--color-ink)"
          strokeOpacity="0.55"
          strokeWidth="2.2"
          strokeDasharray="2.1 2.5"
        />
        <circle cx="100" cy="100" r="76" fill="none" stroke="var(--color-ink)" strokeOpacity="0.22" strokeWidth="1" />
        <text fill="var(--color-ink)" fontSize="11" letterSpacing="3.2" fontFamily="var(--font-sans)">
          <textPath href={`#${top}`} startOffset="50%" textAnchor="middle">
            {motto}
          </textPath>
        </text>
        <text
          x="100"
          y="122"
          textAnchor="middle"
          fill="var(--color-ink)"
          fontFamily="var(--font-display)"
          fontSize="76"
          fontWeight="600"
        >
          {side === "heads" ? "H" : "T"}
        </text>
        <text fill="var(--color-ink)" fontSize="10" letterSpacing="3" fontFamily="var(--font-sans)">
          <textPath href={`#${bot}`} startOffset="50%" textAnchor="middle">
            {foot}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

export function TossApp() {
  const [call, setCall] = useState<Side | null>(null);
  const [history, setHistory] = useState<TossRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [sound, setSound] = useState(true);
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");
  const [angle, setAngle] = useState(0);
  const [instant, setInstant] = useState(true);
  const [landing, setLanding] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [announcement, setAnnouncement] = useState("Call a side, or toss without one.");
  const [resultKey, setResultKey] = useState(0);
  const angleRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const landingTimerRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const saved = loadSaved();
    setHistory(saved.history);
    setStreak(saved.streak);
    setBest(saved.best);
    setSound(saved.sound);
    const last = saved.history[0];
    if (last) {
      const next = last.side === "heads" ? 0 : 180;
      angleRef.current = next;
      setAngle(next);
      setPhase("result");
      setAnnouncement(`${label(last.side)} was the last toss.`);
    }
    setHydrated(true);
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setInstant(false));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveSaved({ history, streak, best, sound });
  }, [hydrated, history, streak, best, sound]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (landingTimerRef.current) window.clearTimeout(landingTimerRef.current);
    };
  }, []);

  const pick = useCallback((side: Side) => {
    if (phaseRef.current === "spinning") return;
    setCall((current) => (current === side ? null : side));
  }, []);

  const flip = useCallback(() => {
    if (phaseRef.current === "spinning") return;
    const side = fairSide();
    const spins = extraSpins();
    const currentMod = ((angleRef.current % 360) + 360) % 360;
    const landingAngle = side === "heads" ? 0 : 180;
    let delta = landingAngle - currentMod;
    if (delta <= 0) delta += 360;
    delta += spins * 360;
    const nextAngle = angleRef.current + delta;
    angleRef.current = nextAngle;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms = reduce ? 20 : SPIN_MS;
    setInstant(reduce);
    setLanding(false);
    setAngle(nextAngle);
    setPhase("spinning");
    setAnnouncement("The coin is in the air.");
    if (sound) playToss(ms);

    const callNow = call;
    const record: TossRecord = { side, call: callNow };
    const nextStreak = callNow ? (callNow === side ? streak + 1 : 0) : streak;
    const nextBest = Math.max(best, nextStreak);

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setHistory((prev) => [record, ...prev].slice(0, 20));
      setStreak(nextStreak);
      setBest(nextBest);
      setPhase("result");
      setLanding(!reduce);
      setResultKey((n) => n + 1);
      if (callNow && callNow === side) {
        setAnnouncement(
          nextBest > best && nextStreak === nextBest
            ? `${label(side)}. You called it. New best streak, ${nextStreak}.`
            : `${label(side)}. You called it.`,
        );
      } else if (callNow) {
        setAnnouncement(`${label(side)}. Not this time.`);
      } else {
        setAnnouncement(`${label(side)}. No call on this one.`);
      }
      if (landingTimerRef.current) window.clearTimeout(landingTimerRef.current);
      landingTimerRef.current = window.setTimeout(() => setLanding(false), 580);
    }, ms);
  }, [best, call, sound, streak]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key === "h" || event.key === "H") pick("heads");
      if (event.key === "t" || event.key === "T") pick("tails");
      if (event.code === "Space") {
        event.preventDefault();
        flip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flip, pick]);

  const reset = () => {
    if (phaseRef.current === "spinning") return;
    setHistory([]);
    setStreak(0);
    setBest(0);
    setPhase("idle");
    setAnnouncement("Record cleared.");
    setResultKey((n) => n + 1);
  };

  const tosses = history.length;
  const heads = history.filter((item) => item.side === "heads").length;
  const tails = tosses - heads;
  const called = history.filter((item) => item.call).length;
  const hits = history.filter((item) => item.call && item.call === item.side).length;
  const spinning = phase === "spinning";
  const last = history[0];
  const hit = phase === "result" && last?.call && last.call === last.side;
  const showSide = phase === "result" && last ? label(last.side) : spinning ? "In the air" : "Call it";

  let detail = "Pick a side, or toss blind.";
  if (spinning) detail = call ? `You called ${label(call).toLowerCase()}.` : "No call. Just the toss.";
  else if (phase === "result" && last?.call && last.call === last.side) {
    detail = streak > 1 ? `You called it. Streak of ${streak}.` : "You called it.";
  } else if (phase === "result" && last?.call) detail = "Not this time.";
  else if (phase === "result" && last) detail = "No call on this one.";

  const dash = (value: number) => (hydrated ? String(value) : "—");

  return (
    <main className="toss">
      <div className="toss-shell">
        <header className="toss-head">
          <div>
            <p className="eyebrow">A fair toss</p>
            <h1>Toss</h1>
          </div>
          <div className="head-actions">
            <button
              type="button"
              className="ghost"
              aria-pressed={sound}
              onClick={() => setSound((on) => !on)}
            >
              {sound ? "Sound on" : "Sound off"}
            </button>
            <button type="button" className="ghost" onClick={reset} disabled={!hydrated || spinning || tosses === 0}>
              Reset
            </button>
          </div>
        </header>

        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>

        <section className={`stage ${spinning ? "is-spinning" : ""} ${landing ? "is-landing" : ""}`}>
          <div className="coin-shadow" />
          <div className="coin-tilt">
            <div
              className={`coin ${instant ? "is-instant" : ""}`}
              style={{ transform: `translateZ(0.1px) rotateY(${angle}deg)` }}
            >
              {Array.from({ length: EDGE }, (_, i) => (
                <div key={i} className="coin-slice" style={{ transform: `translateZ(${-i}px)` }} />
              ))}
              <CoinFace side="heads" />
              <CoinFace side="tails" />
            </div>
          </div>
        </section>

        <div key={resultKey} className={`result ${hit ? "is-hit" : ""} ${phase === "result" ? "result-pop" : ""}`}>
          <h2>{showSide}</h2>
          <p>{detail}</p>
        </div>

        <div className="call-row" role="group" aria-label="Call the toss">
          <button
            type="button"
            className="call-btn"
            aria-pressed={call === "heads"}
            disabled={spinning}
            onClick={() => pick("heads")}
          >
            Heads
          </button>
          <button
            type="button"
            className="call-btn"
            aria-pressed={call === "tails"}
            disabled={spinning}
            onClick={() => pick("tails")}
          >
            Tails
          </button>
        </div>

        <button type="button" className="flip-btn" onClick={flip} disabled={spinning}>
          {spinning ? "In the air" : tosses === 0 ? "Toss the coin" : "Toss again"}
        </button>

        <section className="stats" aria-label="Record">
          <div className="stat">
            <b>{dash(tosses)}</b>
            <span>Tosses</span>
          </div>
          <div className="stat">
            <b>{dash(heads)}</b>
            <span>Heads</span>
          </div>
          <div className="stat">
            <b>{dash(tails)}</b>
            <span>Tails</span>
          </div>
          <div className="stat">
            <b>{dash(streak)}</b>
            <span>Streak</span>
          </div>
        </section>

        <p className="rate">
          {called > 0 ? `${hits} of ${called} calls right · ` : null}
          Best streak {hydrated ? best : "—"}
        </p>

        {history.length > 0 ? (
          <ol className="history" aria-label="Recent tosses, newest first">
            {history.map((item, index) => {
              const scored = item.call !== null;
              const correct = item.call === item.side;
              return (
                <li
                  key={`${index}-${item.side}`}
                  className={`chip ${item.side === "tails" ? "is-tails" : ""} ${scored ? (correct ? "is-hit" : "is-miss") : ""}`}
                  title={
                    item.call
                      ? `${label(item.side)}, called ${label(item.call).toLowerCase()}`
                      : label(item.side)
                  }
                >
                  {item.side === "heads" ? "H" : "T"}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="empty">Each toss is an even chance, drawn on this device. Nothing is sent anywhere.</p>
        )}

        <p className="hint">H heads · T tails · Space tosses</p>
      </div>
    </main>
  );
}
