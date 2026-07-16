"use client";

type Line = { speaker: string; text: string };

function parseTranscript(raw: string | null): Line[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(Agent|User|AI|Customer)\s*:\s*(.*)$/i);
      if (match) {
        return { speaker: match[1], text: match[2] };
      }
      return { speaker: "", text: line };
    });
}

export default function CallTranscriptView({ transcript }: { transcript: string | null }) {
  const lines = parseTranscript(transcript);

  if (lines.length === 0) {
    return <p className="text-sm text-base-500 italic">No transcript available for this call.</p>;
  }

  return (
    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
      {lines.map((line, i) => {
        const isAgent = /agent|ai/i.test(line.speaker);
        return (
          <div
            key={i}
            className={`flex ${isAgent ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                isAgent
                  ? "bg-base-800 text-base-200 rounded-tl-sm"
                  : "bg-accent-500/15 text-accent-100 rounded-tr-sm"
              }`}
            >
              {line.speaker && (
                <div className="text-[10px] uppercase tracking-wide text-base-500 mb-1">
                  {isAgent ? "AI Agent" : "Customer"}
                </div>
              )}
              {line.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
