"use client";

interface ShareModalProps {
  deaths: number;
  roast: string;
  onClose: () => void;
}

export function ShareModal({ deaths, roast, onClose }: ShareModalProps) {
  const text = `I just died ${deaths} time${deaths !== 1 ? "s" : ""} in a row on a game designed for me to lose. The AI said: "${roast}" 💀☕ #418ImaTeapot`;
  const url = typeof window !== "undefined" ? window.location.origin : "";
  const encoded = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  const platforms = [
    {
      name: "X / Twitter",
      icon: "𝕏",
      href: `https://twitter.com/intent/tweet?text=${encoded}`,
    },
    {
      name: "Facebook",
      icon: "f",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encoded}`,
    },
    {
      name: "WhatsApp",
      icon: "💬",
      href: `https://wa.me/?text=${encoded}%20${encodedUrl}`,
    },
    {
      name: "Telegram",
      icon: "✈️",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encoded}`,
    },
    {
      name: "Reddit",
      icon: "🤖",
      href: `https://reddit.com/submit?url=${encodedUrl}&title=${encoded}`,
    },
    {
      name: "LinkedIn",
      icon: "in",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${text} ${url}`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold">Share Your Shame</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>
        <p className="text-zinc-500 text-xs mb-4 italic">&ldquo;{text}&rdquo;</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {platforms.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <span className="text-lg">{p.icon}</span>
              <span className="text-zinc-400 text-xs">{p.name}</span>
            </a>
          ))}
        </div>
        <button
          onClick={copyToClipboard}
          className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm rounded-lg transition-colors"
        >
          Copy to clipboard
        </button>
      </div>
    </div>
  );
}
