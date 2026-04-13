"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { PhysicsConfig } from "../lib/types";
import { DEFAULT_PHYSICS } from "../lib/types";
import { judgePlayer, submitBugReport } from "../lib/api";
import { updateSession, saveMatch } from "../lib/leaderboard";
import { LOADING_TIPS, PATCH_NOTES } from "./constants";
import { ShareModal } from "./ShareModal";
import { getJumpKeyName, getSlamKeyName } from "../lib/controls";
import { GameAmbience } from "./GameAmbience";

const SESSION_ID = typeof window !== "undefined"
  ? (localStorage.getItem("teapot_session") ?? (() => {
      const id = Math.random().toString(36).slice(2);
      localStorage.setItem("teapot_session", id);
      return id;
    })())
  : Math.random().toString(36).slice(2);

function getSavedDeaths() {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("teapot_deaths") ?? "0", 10);
}
function saveDeaths(n: number) {
  localStorage.setItem("teapot_deaths", String(n));
}
function getSavedSurvivedMs() {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("teapot_survived_ms") ?? "0", 10);
}
function saveSurvivedMs(n: number) {
  localStorage.setItem("teapot_survived_ms", String(n));
}

type Screen = "start" | "loading" | "playing" | "dead" | "support";

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const [screen, setScreen] = useState<Screen>("start");
  const [deaths, setDeaths] = useState(0);
  const deathsRef = useRef(0);

  // hydrate from localStorage on mount
  useEffect(() => {
    const saved = getSavedDeaths();
    if (saved > 0) {
      setDeaths(saved);
      deathsRef.current = saved;
    }
    totalSurvivedMsRef.current = getSavedSurvivedMs();
  }, []);
  const [roast, setRoast] = useState("");
  const [rank, setRank] = useState(0);
  const [tip, setTip] = useState("");
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [supportMsg, setSupportMsg] = useState("");
  const [supportResponse, setSupportResponse] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const physicsRef = useRef<PhysicsConfig>({ ...DEFAULT_PHYSICS });
  const runIndexRef = useRef(0);
  const totalSurvivedMsRef = useRef(0);
  const onEventRef = useRef<(event: string, data?: unknown) => void>(() => {});

  const startRun = useCallback(async (physics: PhysicsConfig) => {
    physicsRef.current = physics;
    setTip(LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]);
    setScreen("loading");
    await new Promise((r) => setTimeout(r, 1200));
    if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; }
    setScreen("playing");
  }, []);

  useEffect(() => {
    onEventRef.current = async (event: string, data?: unknown) => {
      if (event === "win") { window.location.href = "/418"; return; }
      const d = data as { jumps?: number; wallHugs?: number; keyMashCount?: number; survivedMs?: number } | undefined;
      const newDeaths = deathsRef.current + 1;
      deathsRef.current = newDeaths;
      saveDeaths(newDeaths);
      runIndexRef.current += 1;
      const survivedMs = d?.survivedMs ?? 0;
      totalSurvivedMsRef.current += survivedMs;
      saveSurvivedMs(totalSurvivedMsRef.current);
      setDeaths(newDeaths);

      const [judgeRes, playerRank] = await Promise.all([
        judgePlayer({ deaths: newDeaths, avgJumps: d?.jumps ?? 0, wallHugs: d?.wallHugs ?? 0, keyMashCount: d?.keyMashCount ?? 0 }),
        updateSession(SESSION_ID, newDeaths, totalSurvivedMsRef.current),
      ]);

      saveMatch({
        matchNumber: newDeaths,
        survivedMs,
        jumps: d?.jumps ?? 0,
        wallHugs: d?.wallHugs ?? 0,
        keyMashes: d?.keyMashCount ?? 0,
        physicsApplied: judgeRes.physics,
        roast: judgeRes.roast,
        timestamp: Date.now(),
      });

      physicsRef.current = judgeRes.physics;
      setRoast(judgeRes.roast);
      setRank(playerRank);
      setScreen("dead");
    };
  });

  useEffect(() => {
    if (screen !== "playing" || !containerRef.current) return;
    let game: import("phaser").Game;
    (async () => {
      const Phaser = await import("phaser");
      const { RunnerScene } = await import("../game/RunnerScene");
      const stableCallback = (event: string, data?: unknown) => onEventRef.current(event, data);
      const scene = new RunnerScene();
      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 800,
        height: 580,
        backgroundColor: "#1a0a2e",
        parent: containerRef.current!,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 800,
          height: 580,
        },
        physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: false } },
        scene,
      });
      game.events.once("ready", () => {
        game.scene.start("RunnerScene", {
          physics: physicsRef.current,
          runIndex: runIndexRef.current,
          onEvent: stableCallback,
        });
      });
      gameRef.current = game;
    })();
    return () => { game?.destroy(true); };
  }, [screen]);

  const handleSupportSubmit = async () => {
    setSupportLoading(true);
    const res = await submitBugReport(supportMsg, deathsRef.current);
    setSupportResponse(res);
    setSupportLoading(false);
  };

  if (screen === "start") return (
    <div className="relative flex flex-col items-center justify-center h-screen gap-8 text-center px-4 overflow-hidden bg-black">
      <GameAmbience />
      {/* atmospheric background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0a2e_0%,_#000_70%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.015)_2px,rgba(255,255,255,0.015)_4px)]" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="text-7xl mb-2 drop-shadow-[0_0_30px_rgba(251,191,36,0.4)]">☕</div>
        <div>
          <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            418
          </h1>
          <p className="text-amber-400/80 text-sm tracking-[0.3em] uppercase mt-1">I&apos;m a Teapot</p>
        </div>
        <p className="text-zinc-500 max-w-sm text-sm leading-relaxed">
          Everyone who has played this has lost.<br/>
          <span className="text-red-900/70 font-black tracking-widest uppercase text-xs drop-shadow-[0_0_8px_rgba(220,38,38,0.6)] animate-pulse" style={{fontFamily:"'Creepster', cursive", fontSize:"1.1rem", letterSpacing:"0.15em"}}>You will not be different.</span>
        </p>
        <button
          onClick={() => startRun(DEFAULT_PHYSICS)}
          className="mt-2 px-10 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-lg rounded-none tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:shadow-[0_0_40px_rgba(251,191,36,0.5)]"
        >
          Start Losing
        </button>
        <button onClick={() => setShowPatchNotes(true)} className="text-xs text-zinc-700 hover:text-zinc-500 tracking-widest uppercase">
          v2.4.1 patch notes
        </button>
      </div>
      {showPatchNotes && <PatchNotesModal onClose={() => setShowPatchNotes(false)} />}
    </div>
  );

  if (screen === "loading") return (
    <div className="relative flex flex-col items-center justify-center h-screen gap-6 text-center px-4 bg-black overflow-hidden">
      <GameAmbience />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0a2e_0%,_#000_70%)]" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="text-5xl animate-spin drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">☕</div>
        <p className="text-zinc-600 text-xs tracking-widest uppercase">Preparing your failure</p>
        <p className="text-zinc-500 text-sm max-w-xs italic border border-zinc-800 px-4 py-3 bg-zinc-900/50">{tip}</p>
      </div>
    </div>
  );

  if (screen === "dead") return (
    <div className="relative flex flex-col items-center justify-center h-screen gap-5 text-center px-4 bg-black overflow-hidden">
      <GameAmbience />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#2a0000_0%,_#000_60%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,0,0,0.02)_2px,rgba(255,0,0,0.02)_4px)]" />

      <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-lg">
        <div>
          <p className="text-zinc-600 text-xs tracking-[0.4em] uppercase mb-1">System Error</p>
          <h2 className="text-4xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
            You Died.
          </h2>
          <p className="text-zinc-600 text-sm mt-1">Death #{deaths} — still not surprised</p>
        </div>

        {roast && (
          <div className="w-full bg-black border border-red-900/50 p-4 text-left shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <p className="text-red-900 text-xs tracking-widest uppercase mb-2">// AI Assessment</p>
            <p className="text-amber-300/90 italic text-sm leading-relaxed">&ldquo;{roast}&rdquo;</p>
          </div>
        )}

        {rank > 0 && (
          <p className="text-zinc-600 text-xs tracking-wide">
            Global rank: <span className="text-white font-bold">#{rank} most pathetic</span>
          </p>
        )}

        <div className="flex gap-3 flex-wrap justify-center mt-1">
          <button onClick={() => startRun(physicsRef.current)}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black tracking-widest uppercase text-sm transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            Try Again
          </button>
          <button onClick={() => setShowShare(true)}
            className="px-6 py-2 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-sm tracking-wide transition-all">
            Share Shame
          </button>
          {deaths >= 5 && (
            <button onClick={() => setScreen("support")}
              className="px-6 py-2 border border-red-900/40 hover:border-red-700/60 text-red-900 hover:text-red-700 text-sm tracking-wide transition-all">
              Report a Bug
            </button>
          )}
        </div>
        <button onClick={() => setShowPatchNotes(true)} className="text-xs text-zinc-800 hover:text-zinc-600 tracking-widest uppercase mt-1">
          v2.4.1 patch notes
        </button>
      </div>
      {showPatchNotes && <PatchNotesModal onClose={() => setShowPatchNotes(false)} />}
      {showShare && <ShareModal deaths={deaths} roast={roast} onClose={() => setShowShare(false)} />}
    </div>
  );

  if (screen === "support") return (
    <div className="relative flex flex-col items-center justify-center h-screen gap-5 text-center px-4 bg-black overflow-hidden">
      <GameAmbience />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0a0a1a_0%,_#000_70%)]" />
      <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-md">
        <div>
          <p className="text-zinc-700 text-xs tracking-[0.4em] uppercase mb-1">Support Portal</p>
          <h2 className="text-2xl font-black text-zinc-300">Report a Bug</h2>
          <p className="text-zinc-700 text-xs mt-1">Your feedback is important to us. (It is not.)</p>
        </div>
        {!supportResponse ? (
          <>
            <textarea
              className="w-full h-32 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 p-3 text-zinc-300 text-sm resize-none focus:outline-none font-mono"
              placeholder="// describe the issue... (the issue is you)"
              value={supportMsg}
              onChange={(e) => setSupportMsg(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={handleSupportSubmit} disabled={!supportMsg || supportLoading}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black font-black tracking-widest uppercase text-sm transition-all">
                {supportLoading ? "Brewing..." : "Submit"}
              </button>
              <button onClick={() => setScreen("dead")}
                className="px-6 py-2 border border-zinc-800 hover:border-zinc-600 text-zinc-600 hover:text-zinc-400 text-sm transition-all">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-full bg-black border border-red-900/40 p-4 text-left shadow-[0_0_20px_rgba(239,68,68,0.05)]">
              <p className="text-red-900 text-xs tracking-widest uppercase mb-2">HTTP 418 — I&apos;m a Teapot</p>
              <p className="text-zinc-400 text-sm italic leading-relaxed">{supportResponse}</p>
            </div>
            <button onClick={() => { setSupportResponse(""); setSupportMsg(""); setScreen("dead"); }}
              className="px-6 py-2 border border-zinc-800 hover:border-zinc-600 text-zinc-600 hover:text-zinc-400 text-sm transition-all">
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen overflow-hidden">
      <div className="mb-2 flex gap-6 text-sm text-zinc-500">
        <span>Deaths: <span className="text-white">{deaths}</span></span>
        <span>Jump: <span className="text-amber-400 font-mono">{getJumpKeyName(Math.max(0, runIndexRef.current - 1))}</span></span>
        <span>Slam: <span className="text-amber-400 font-mono">{getSlamKeyName(Math.max(0, runIndexRef.current - 1))}</span></span>
      </div>
      <div ref={containerRef} className="w-full flex-1" />
    </div>
  );
}

function PatchNotesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md w-full text-left" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-amber-400 font-bold">v2.4.1 — Patch Notes</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>
        <ul className="space-y-2">
          {PATCH_NOTES.map((note, i) => (
            <li key={i} className="text-zinc-400 text-sm flex gap-2">
              <span className="text-zinc-600">—</span><span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
