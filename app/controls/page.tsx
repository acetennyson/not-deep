export default function ControlsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 px-4">
      <h1 className="text-3xl font-bold text-amber-400">Controls</h1>
      <p className="text-zinc-500 text-sm">Last updated: v2.4.1</p>
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md w-full">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800">
              <th className="text-left pb-2">Key</th>
              <th className="text-left pb-2">Action</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300 space-y-2">
            <tr className="border-b border-zinc-800/50">
              <td className="py-2 font-mono text-amber-400">SPACE</td>
              <td className="py-2">Crouch</td>
            </tr>
            <tr className="border-b border-zinc-800/50">
              <td className="py-2 font-mono text-amber-400">↑ Arrow</td>
              <td className="py-2">Jump (sometimes)</td>
            </tr>
            <tr className="border-b border-zinc-800/50">
              <td className="py-2 font-mono text-amber-400">↓ Arrow</td>
              <td className="py-2">Jump (other times)</td>
            </tr>
            <tr className="border-b border-zinc-800/50">
              <td className="py-2 font-mono text-amber-400">W</td>
              <td className="py-2">Pour tea (no effect)</td>
            </tr>
            <tr>
              <td className="py-2 font-mono text-amber-400">ESC</td>
              <td className="py-2">Pause (unimplemented)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-zinc-700 text-xs max-w-xs text-center">
        Note: The actual jump key rotates based on run number. This page is not updated to reflect that.
      </p>
      <a href="/" className="text-zinc-600 hover:text-zinc-400 text-sm underline">Back to game</a>
    </div>
  );
}
