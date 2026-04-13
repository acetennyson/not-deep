"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { PhysicsConfig } from "../lib/types";
import { DEFAULT_PHYSICS } from "../lib/types";
import { judgePlayer, submitBugReport } from "../lib/api";
import { recordDeath } from "../lib/leaderboard";
import { LOADING_TIPS, PATCH_NOTES } from "./constants";
import { ShareModal } from "./ShareModal";
import { getJumpKeyName, getSlamKeyName } from "../lib/controls";

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
      const d = data as { jumps?: number; wallHugs?: number; keyMashCount?: number } | undefined;
      const newDeaths = deathsRef.current + 1;
      deathsRef.current = newDeaths;
      saveDeaths(newDeaths);
      runIndexRef.current += 1;
      setDeaths(newDeaths);
      const [judgeRes, playerRank] = await Promise.all([
        judgePlayer({ deaths: newDeaths, avgJumps: d?.jumps ?? 0, wallHugs: d?.wallHugs ?? 0, keyMashCount: d?.keyMashCount ?? 0 }),
        recordDeath(SESSION_ID, newDeaths),
      ]);
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
    <div className="flex flex-col items-center justify-center h-screen gap-6 text-center px-4">
      <h1 className="text-4xl font-bold text-amber-400">☕ 418: I&apos;m a Teapot</h1>
      <p className="text-zinc-400 max-w-md">A high-performance, AI-integrated gaming platform built solely to ensure you never win.</p>
      <button onClick={() => startRun(DEFAULT_PHYSICS)} className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors">
        Start Losing
      </button>
      <button onClick={() => setShowPatchNotes(true)} className="text-xs text-zinc-600 hover:text-zinc-400 underline">v2.4.1 patch notes</button>
      {showPatchNotes && <PatchNotesModal onClose={() => setShowPatchNotes(false)} />}
    </div>
  );

  if (screen === "loading") return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-4">
      <div className="text-4xl animate-spin">☕</div>
      <p className="text-zinc-400 text-sm max-w-xs italic">{tip}</p>
    </div>
  );

  if (screen === "dead") return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-4">
      <h2 className="text-3xl font-bold text-red-500">You Died. Again.</h2>
      <p className="text-zinc-300 text-lg">Death #{deaths}</p>
      {roast && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 max-w-md">
          <p className="text-xs text-zinc-500 mb-1">AI Assessment:</p>
          <p className="text-amber-300 italic">&ldquo;{roast}&rdquo;</p>
        </div>
      )}
      {rank > 0 && <p className="text-zinc-500 text-sm">You are ranked <span className="text-white font-bold">#{rank}</span> most pathetic globally.</p>}
      <div className="flex gap-3 flex-wrap justify-center mt-2">
        <button onClick={() => startRun(physicsRef.current)} className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors">
          Try Again (Don&apos;t)
        </button>
        <button onClick={() => setShowShare(true)} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm">
          Share Your Shame
        </button>
        {deaths >= 5 && (
          <button onClick={() => setScreen("support")} className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg transition-colors text-sm">
            Report a Bug
          </button>
        )}
      </div>
      <button onClick={() => setShowPatchNotes(true)} className="text-xs text-zinc-700 hover:text-zinc-500 underline mt-2">v2.4.1 patch notes</button>
      {showPatchNotes && <PatchNotesModal onClose={() => setShowPatchNotes(false)} />}
      {showShare && <ShareModal deaths={deaths} roast={roast} onClose={() => setShowShare(false)} />}
    </div>
  );

  if (screen === "support") return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-4">
      <h2 className="text-2xl font-bold text-zinc-300">Report a Bug</h2>
      <p className="text-zinc-500 text-sm">Your feedback is important to us. (It is not.)</p>
      {!supportResponse ? (
        <>
          <textarea
            className="w-full max-w-md h-32 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-zinc-300 text-sm resize-none focus:outline-none focus:border-zinc-500"
            placeholder="Describe the issue... (the issue is you)"
            value={supportMsg}
            onChange={(e) => setSupportMsg(e.target.value)}
          />
          <div className="flex gap-3">
            <button onClick={handleSupportSubmit} disabled={!supportMsg || supportLoading}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-lg transition-colors">
              {supportLoading ? "Brewing response..." : "Submit"}
            </button>
            <button onClick={() => setScreen("dead")} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors">Cancel</button>
          </div>
        </>
      ) : (
        <>
          <div className="bg-zinc-900 border border-red-900 rounded-lg p-4 max-w-md text-left">
            <p className="text-xs text-red-500 mb-1">HTTP 418 — I&apos;m a Teapot</p>
            <p className="text-zinc-300 text-sm italic">{supportResponse}</p>
          </div>
          <button onClick={() => { setSupportResponse(""); setSupportMsg(""); setScreen("dead"); }}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors">Back</button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="mb-2 flex gap-6 text-sm text-zinc-500">
        <span>Deaths: <span className="text-white">{deaths}</span></span>
        <span>Jump: <span className="text-amber-400 font-mono">{getJumpKeyName(Math.max(0, runIndexRef.current - 1))}</span></span>
        <span>Slam: <span className="text-amber-400 font-mono">{getSlamKeyName(Math.max(0, runIndexRef.current - 1))}</span></span>
      </div>
      <div ref={containerRef} className="rounded-lg overflow-hidden border border-zinc-800" />
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
