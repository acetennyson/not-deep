export default function TeapotPage() {
  const json = {
    status: 418,
    message: "I'm a Teapot",
    reason: "Server is currently brewing. Your victory has been lost in transit.",
    RFC: "RFC 2324",
    suggestion: "Try losing faster next time.",
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen gap-6 text-center px-4 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0a00_0%,_#000_70%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(251,191,36,0.015)_2px,rgba(251,191,36,0.015)_4px)]" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="text-7xl drop-shadow-[0_0_40px_rgba(251,191,36,0.4)]">☕</div>
        <div>
          <p className="text-amber-900 text-xs tracking-[0.4em] uppercase mb-1">You Almost Won</p>
          <h1 className="text-4xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">418</h1>
          <p className="text-amber-600/60 text-sm tracking-widest mt-1">I&apos;m a Teapot</p>
        </div>
        <pre className="bg-black border border-amber-900/30 p-5 text-left text-xs text-amber-500/70 max-w-md w-full font-mono shadow-[0_0_30px_rgba(251,191,36,0.05)]">
          {JSON.stringify(json, null, 2)}
        </pre>
        <p className="text-zinc-700 text-xs max-w-xs">
          The server was busy brewing. Your victory has been discarded.
        </p>
        <a href="/" className="px-6 py-2 border border-zinc-800 hover:border-zinc-600 text-zinc-600 hover:text-zinc-400 text-sm tracking-wide transition-all">
          Try Again
        </a>
      </div>
    </div>
  );
}
