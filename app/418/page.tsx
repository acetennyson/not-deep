export default function TeapotPage() {
  const json = {
    status: 418,
    message: "I'm a Teapot",
    reason: "Server is currently brewing. Your victory has been lost in transit.",
    RFC: "RFC 2324",
    suggestion: "Try losing faster next time.",
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 text-center px-4">
      <div className="text-8xl animate-bounce">☕</div>
      <h1 className="text-2xl font-bold text-amber-400">418 — I&apos;m a Teapot</h1>
      <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 text-left text-sm text-green-400 max-w-md w-full">
        {JSON.stringify(json, null, 2)}
      </pre>
      <p className="text-zinc-600 text-xs max-w-xs">
        You survived long enough to almost win. The server was busy brewing. Your victory has been discarded.
      </p>
      <a href="/" className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors text-sm">
        Try Again
      </a>
    </div>
  );
}
