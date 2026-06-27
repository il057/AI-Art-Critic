import { Icon } from "@iconify/react";

export function WinBadges({ wins = 0 }: { wins?: number }) {
  if (wins <= 0) return null;
  const crowns = Math.floor(wins / 125);
  const suns = Math.floor((wins % 125) / 25);
  const moons = Math.floor((wins % 25) / 5);
  const stars = wins % 5;

  return (
    <span className="inline-flex items-center gap-0.5 ml-1 flex-shrink-0">
      {Array.from({ length: crowns }).map((_, i) => (
        <Icon key={`c-${i}`} icon="dinkie-icons:crown" className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" title="皇冠 (125胜)" />
      ))}
      {Array.from({ length: suns }).map((_, i) => (
        <Icon key={`s-${i}`} icon="dinkie-icons:black-sun-with-rays-filled" className="w-3.5 h-3.5 text-red-500 flex-shrink-0" title="太阳 (25胜)" />
      ))}
      {Array.from({ length: moons }).map((_, i) => (
        <Icon key={`m-${i}`} icon="dinkie-icons:crescent-moon-filled" className="w-3 h-3 text-indigo-400 flex-shrink-0" title="月亮 (5胜)" />
      ))}
      {Array.from({ length: stars }).map((_, i) => (
        <Icon key={`st-${i}`} icon="dinkie-icons:white-medium-star-filled" className="w-3 h-3 text-yellow-400 flex-shrink-0" title="星星 (1胜)" />
      ))}
    </span>
  );
}

