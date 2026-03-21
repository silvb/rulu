import { DAYS } from "../lib/constants";
import type { Item } from "../lib/types";

interface DayTabsProps {
  activeDay: number;
  todayIndex: number;
  items: Item[];
  completions: Record<string, boolean>;
  onSelectDay: (day: number) => void;
}

export function DayTabs({ activeDay, todayIndex, items, completions, onSelectDay }: DayTabsProps) {
  return (
    <div className="from-pink-pale sticky top-26.5 z-15 flex gap-1 overflow-x-auto bg-linear-to-br to-[#FFFDF5] px-2 pt-2 pb-2">
      {DAYS.map((day, i) => {
        const hasCompletions = items.some(
          (it) => it.day === i && it.type === "todo" && completions[it.id],
        );
        return (
          <button
            key={i}
            onClick={() => onSelectDay(i)}
            className={[
              "flex-auto min-w-11 px-3 py-2 rounded-xl border-2 font-extrabold text-[13px] text-center cursor-pointer transition-all duration-200",
              activeDay === i
                ? "bg-pink text-white border-pink"
                : i === todayIndex
                  ? "bg-white text-slate-muted border-pink"
                  : "bg-white text-slate-muted border-transparent",
            ].join(" ")}
          >
            <span className="block text-[13px]">{day}</span>
            {hasCompletions && (
              <span className="text-green mt-0.5 block text-[8px] leading-none">●</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
