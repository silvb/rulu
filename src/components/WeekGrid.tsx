import { useState, useCallback, useEffect } from "react";
import { DayColumn } from "./DayColumn";
import { DayTabs } from "./DayTabs";
import { ProgressBar } from "./ProgressBar";
import { ContextMenu } from "./ContextMenu";
import { ItemModal } from "./ItemModal";
import { useItems } from "../hooks/useItems";
import { getWeekStart, getTodayIndex } from "../lib/week";
import { DAYS } from "../lib/constants";
import type { Item, Member, ContextMenuState } from "../lib/types";

interface WeekGridProps {
  currentMember: Member;
  onLogout: () => void;
}

export function WeekGrid({ currentMember, onLogout }: WeekGridProps) {
  const {
    items,
    completions,
    loaded,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    toggleCompletion,
  } = useItems(currentMember.id);

  const [isMobile, setIsMobile] = useState(false);
  const [mobileDay, setMobileDay] = useState<number | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [addModalDay, setAddModalDay] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);

  const todayIndex = getTodayIndex();
  const weekStart = getWeekStart();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleToggle = useCallback(
    (id: string) => {
      const wasDone = !!completions[id];
      toggleCompletion(id);
      if (!wasDone) {
        setCelebratingId(id);
        setTimeout(() => setCelebratingId(null), 800);
      }
    },
    [completions, toggleCompletion],
  );

  const handleDragStart = useCallback((e: React.DragEvent, item: Item) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    setDragOverDay(dayIndex);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dayIndex: number) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      if (id) moveItem(id, dayIndex);
      setDragOverDay(null);
    },
    [moveItem],
  );

  const handleDragEnd = useCallback(() => {
    setDragOverDay(null);
  }, []);

  const totalTodos = items.filter((i) => i.type === "todo").length;
  const doneTodos = items.filter((i) => i.type === "todo" && completions[i.id]).length;

  if (!loaded) {
    return (
      <div className="bg-pink-pale flex h-screen flex-col items-center justify-center">
        <div className="animate-[pulse_1s_ease-in-out_infinite] text-5xl">📋</div>
        <p className="text-slate-muted mt-3 text-lg font-bold">Loading Rulu...</p>
      </div>
    );
  }

  const activeMobileDay = mobileDay ?? todayIndex;

  return (
    <div className="from-pink-pale to-pink-pale text-slate-dark min-h-screen bg-linear-to-br via-[#FFFDF5] pb-15">
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <header className="from-pink sticky top-0 z-20 bg-linear-to-br to-[#FF8FB1] px-5 pt-5 pb-4 text-white shadow-[0_4px_20px_rgba(255,107,157,0.3)]">
        <div className="mb-3 flex items-baseline justify-between">
          <h1 className="m-0 text-[28px] font-black tracking-tight">Rulu</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold opacity-90">
              ✨ Week of{" "}
              {new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <button
              onClick={onLogout}
              className="cursor-pointer rounded-full border-2 border-white/30 bg-white/20 px-2.5 py-0.5 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30"
              title="Switch user"
            >
              {currentMember.emoji} {currentMember.name}
            </button>
          </div>
        </div>
        <ProgressBar done={doneTodos} total={totalTodos} />
      </header>

      {/* Content */}
      {isMobile ? (
        <>
          <DayTabs
            activeDay={activeMobileDay}
            todayIndex={todayIndex}
            items={items}
            completions={completions}
            onSelectDay={setMobileDay}
          />
          <div className="p-2">
            <DayColumn
              dayIndex={activeMobileDay}
              items={items}
              completions={completions}
              celebratingId={celebratingId}
              isToday={activeMobileDay === todayIndex}
              isDropTarget={false}
              isMobile={isMobile}
              onToggle={handleToggle}
              onContextMenu={setContextMenu}
              onOpenAdd={setAddModalDay}
            />
          </div>
        </>
      ) : (
        <div className="grid min-h-[calc(100vh-160px)] grid-cols-7 gap-0.5 p-1">
          {DAYS.map((_, i) => (
            <DayColumn
              key={i}
              dayIndex={i}
              items={items}
              completions={completions}
              celebratingId={celebratingId}
              isToday={i === todayIndex}
              isDropTarget={dragOverDay === i}
              isMobile={isMobile}
              onToggle={handleToggle}
              onContextMenu={setContextMenu}
              onOpenAdd={setAddModalDay}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
            />
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          state={contextMenu}
          onEdit={() => {
            setEditItem(contextMenu.item);
            setContextMenu(null);
          }}
          onDelete={() => {
            deleteItem(contextMenu.item.id);
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Add Modal */}
      {addModalDay !== null && (
        <ItemModal
          editItem={null}
          defaultDay={addModalDay}
          memberId={currentMember.id}
          onSave={(data) => {
            addItem({
              type: data.type,
              title: data.title,
              day: data.day,
              emoji: data.emoji,
              owner_id: data.personal ? currentMember.id : null,
              ...(data.type === "event" && data.time ? { time: data.time } : {}),
            });
            setAddModalDay(null);
          }}
          onClose={() => setAddModalDay(null)}
        />
      )}

      {/* Edit Modal */}
      {editItem && (
        <ItemModal
          editItem={editItem}
          defaultDay={editItem.day}
          memberId={currentMember.id}
          onSave={(data) => {
            updateItem(editItem.id, {
              title: data.title,
              type: data.type,
              emoji: data.emoji,
              day: data.day,
              time: data.type === "event" ? data.time : undefined,
              owner_id: data.personal ? currentMember.id : null,
            });
            setEditItem(null);
          }}
          onDelete={(id) => {
            deleteItem(id);
            setEditItem(null);
          }}
          onClose={() => setEditItem(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-pink-pale/90 fixed right-0 bottom-0 left-0 z-10 p-3 text-center backdrop-blur-[10px]">
        <span className="text-slate-muted text-xs font-bold">
          tap to check · long-press to edit · drag to move
        </span>
      </footer>
    </div>
  );
}
