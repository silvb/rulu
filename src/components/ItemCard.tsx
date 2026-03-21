import { useLongPress } from "../hooks/useLongPress";
import type { Item, ContextMenuState } from "../lib/types";

interface ItemCardProps {
  item: Item;
  isDone: boolean;
  isInactive: boolean;
  isCelebrating: boolean;
  isMobile: boolean;
  onToggle: (id: string) => void;
  onContextMenu: (state: ContextMenuState) => void;
  onDragStart?: (e: React.DragEvent, item: Item) => void;
  onDragEnd?: () => void;
}

export function ItemCard({
  item,
  isDone,
  isInactive,
  isCelebrating,
  isMobile,
  onToggle,
  onContextMenu,
  onDragStart,
  onDragEnd,
}: ItemCardProps) {
  const { handlers, wasLongPress } = useLongPress((pos) =>
    onContextMenu({ item, x: pos.x, y: pos.y }),
  );

  const isEvent = item.type === "event";
  const isPersonal = !!item.owner_id;

  return (
    <div
      draggable={!isMobile}
      onDragStart={(e) => onDragStart?.(e, item)}
      onDragEnd={onDragEnd}
      onTouchStart={handlers.onTouchStart}
      onTouchMove={handlers.onTouchMove}
      onTouchEnd={handlers.onTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu({ item, x: e.clientX, y: e.clientY });
      }}
      onClick={() => {
        if (wasLongPress()) return;
        if (item.type === "todo" && !isInactive) onToggle(item.id);
      }}
      className={[
        "relative rounded-xl border-2 px-2.5 py-2 select-none transition-all duration-200",
        isEvent
          ? "bg-linear-to-br from-[#FFF9E0] to-yellow-light border-yellow"
          : isPersonal
            ? "bg-linear-to-br from-[#F5F3FF] to-[#EDE9FE] border-[#C4B5FD]"
            : "bg-white border-pink-light",
        isDone && !isInactive && "bg-green-light border-green opacity-80",
        isInactive && "opacity-40 grayscale",
        isCelebrating && "scale-105 border-green shadow-[0_0_20px_rgba(74,222,128,0.25)]",
        isMobile ? "cursor-default" : "cursor-grab",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 text-base">{item.emoji || "📋"}</span>
        <div className="min-w-0 flex-1">
          <span
            className={[
              "text-xs font-bold block leading-tight overflow-hidden text-ellipsis",
              isDone && "line-through text-green-dark",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {item.title}
            {isPersonal && (
              <span className="ml-1 text-[10px] text-[#8B5CF6]" title="Personal">
                👤
              </span>
            )}
          </span>
          {item.time && (
            <span className="mt-0.5 block text-[10px] font-bold text-[#B8860B]">
              ⏰ {item.time}
            </span>
          )}
          {item.frequency && item.frequency !== "weekly" && (
            <span className="text-slate-muted mt-0.5 block text-[10px] font-bold">
              {item.frequency === "biweekly" ? "every 2 weeks" : "monthly"}
            </span>
          )}
        </div>
        {item.type === "todo" && (
          <div
            className={[
              "w-5.5 h-5.5 rounded-[7px] border-2 flex items-center justify-center shrink-0 text-[13px] font-black text-white transition-all duration-200",
              isDone ? "bg-green border-green" : "border-pink-light",
            ].join(" ")}
          >
            {isDone && "✓"}
          </div>
        )}
      </div>
      {isCelebrating && (
        <div className="pointer-events-none absolute -top-2 -right-1 animate-[confetti-pop_0.8s_ease-out_forwards] text-xl">
          🎉
        </div>
      )}
    </div>
  );
}
