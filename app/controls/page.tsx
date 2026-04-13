export default function ControlsPage() {
  return (
    <div className="relative flex flex-col items-center justify-center h-screen gap-6 px-4 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0a0a1a_0%,_#000_70%)]" />
      <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-md">
        <div className="text-center">
          <p className="text-zinc-700 text-xs tracking-[0.4em] uppercase mb-1">Documentation</p>
          <h1 className="text-3xl font-black text-zinc-300">Controls</h1>
          <p className="text-zinc-700 text-xs mt-1 tracking-wide">Last updated: v2.4.1</p>
        </div>
        <div className="w-full bg-black border border-zinc-800 p-5">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-zinc-700 border-b border-zinc-900">
                <th className="text-left pb-3 tracking-widest uppercase text-xs">Key</th>
                <th className="text-left pb-3 tracking-widest uppercase text-xs">Action</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              {[
                ["SPACE", "Crouch"],
                ["↑ Arrow", "Jump (sometimes)"],
                ["↓ Arrow", "Jump (other times)"],
                ["W", "Pour tea (no effect)"],
                ["ESC", "Pause (unimplemented)"],
              ].map(([key, action]) => (
                <tr key={key} className="border-b border-zinc-900/50">
                  <td className="py-2 text-amber-500/70">{key}</td>
                  <td className="py-2 text-zinc-500">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-zinc-800 text-xs max-w-xs text-center leading-relaxed">
          Note: The actual jump key rotates based on run number.<br/>
          This page is not updated to reflect that.
        </p>
        <a href="/" className="text-zinc-700 hover:text-zinc-500 text-xs tracking-widest uppercase transition-colors">
          Back to game
        </a>
      </div>
    </div>
  );
}
