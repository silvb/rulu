import { ItemCard } from "./ItemCard";
import { DAYS, DAYS_FULL } from "../lib/constants";
import type { Item, ContextMenuState } from "../lib/types";

interface DayColumnProps {
  dayIndex: number;
  items: Item[];
  completions: Record<string, boolean>;
  celebratingId: string | null;
  isToday: boolean;
  isDropTarget: boolean;
  isMobile: boolean;
  onToggle: (id: string) => void;
  onContextMenu: (state: ContextMenuState) => void;
  onOpenAdd: (dayIndex: number) => void;
  onDragStart?: (e: React.DragEvent, item: Item) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function DayColumn({
  dayIndex,
  items,
  completions,
  celebratingId,
  isToday,
  isDropTarget,
  isMobile,
  onToggle,
  onContextMenu,
  onOpenAdd,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: DayColumnProps) {
  const dayItems = items
    .filter((i) => i.day === dayIndex)
    .sort((a, b) => {
      if (a.type === "event" && b.type !== "event") return -1;
      if (a.type !== "event" && b.type === "event") return 1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return 0;
    });

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={[
        "bg-white rounded-2xl flex flex-col min-h-75 transition-all duration-200 overflow-hidden",
        isDropTarget && "bg-yellow-light shadow-[inset_0_0_0_2px_var(--color-yellow)] scale-[1.02]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "px-2 pt-2.5 pb-2 text-center border-b-2",
          isToday
            ? "bg-linear-to-br from-pink-pale to-yellow-light border-pink"
            : "border-pink-pale",
        ].join(" ")}
      >
        <span className="text-slate-dark text-[13px] font-extrabold tracking-wide uppercase">
          {isMobile ? DAYS_FULL[dayIndex] : DAYS[dayIndex]}
        </span>
        {isToday && (
          <span className="bg-pink ml-1.5 inline-block rounded-full px-1.75 py-px align-middle text-[10px] font-extrabold text-white">
            today
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-1.5">
        {dayItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isDone={item.type === "todo" && !!completions[item.id]}
            isCelebrating={celebratingId === item.id}
            isMobile={isMobile}
            onToggle={onToggle}
            onContextMenu={onContextMenu}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        <button
          onClick={() => onOpenAdd(dayIndex)}
          className="border-pink-light mt-auto flex min-h-9 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed bg-transparent p-1.5 transition-all duration-200 hover:brightness-105 active:scale-[0.97]"
          aria-label={`Add item to ${DAYS_FULL[dayIndex]}`}
        >
          <span className="text-pink text-xl leading-none font-black">+</span>
        </button>
      </div>
    </div>
  );
}
