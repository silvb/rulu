import { useState } from "react";
import { DAYS, EMOJI_OPTIONS } from "../lib/constants";
import type { Item, ItemType } from "../lib/types";

interface ItemModalProps {
  /** When editing, pass the existing item. For adding, pass null. */
  editItem: Item | null;
  /** The day to default to when adding a new item. */
  defaultDay: number;
  onSave: (data: {
    title: string;
    type: ItemType;
    time: string;
    emoji: string;
    day: number;
  }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function ItemModal({ editItem, defaultDay, onSave, onDelete, onClose }: ItemModalProps) {
  const isEdit = !!editItem;
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [type, setType] = useState<ItemType>(editItem?.type ?? "todo");
  const [time, setTime] = useState(editItem?.time ?? "");
  const [emoji, setEmoji] = useState(editItem?.emoji ?? "📋");
  const [day, setDay] = useState(editItem?.day ?? defaultDay);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), type, time: type === "event" ? time : "", emoji, day });
  };

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/30 p-5"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-100 overflow-y-auto rounded-3xl bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-pink m-0 mb-5 text-[22px] font-black">
          {isEdit ? "Edit Item" : "New Item"}
        </h3>

        {/* Type toggle */}
        <div className="mb-4">
          <label className="text-slate-muted mb-1.5 block text-[13px] font-extrabold tracking-wide uppercase">
            What type?
          </label>
          <div className="flex gap-2">
            {(["todo", "event"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={[
                  "flex-1 py-2.5 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all duration-200",
                  type === t
                    ? "bg-pink-pale border-pink text-pink"
                    : "bg-white border-pink-light text-slate-dark",
                ].join(" ")}
              >
                {t === "todo" ? "☑️ To-Do" : "📅 Event"}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="text-slate-muted mb-1.5 block text-[13px] font-extrabold tracking-wide uppercase">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Bath the kids"
            autoFocus
            className="border-pink-light focus:border-pink box-border w-full rounded-xl border-2 px-3.5 py-3 text-base font-bold transition-colors duration-200 outline-none focus:shadow-[0_0_0_3px_rgba(255,107,157,0.12)]"
          />
        </div>

        {/* Time (events only) */}
        {type === "event" && (
          <div className="mb-4">
            <label className="text-slate-muted mb-1.5 block text-[13px] font-extrabold tracking-wide uppercase">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="border-pink-light focus:border-pink box-border w-full rounded-xl border-2 px-3.5 py-3 text-base font-bold transition-colors duration-200 outline-none focus:shadow-[0_0_0_3px_rgba(255,107,157,0.12)]"
            />
          </div>
        )}

        {/* Emoji picker */}
        <div className="mb-4">
          <label className="text-slate-muted mb-1.5 block text-[13px] font-extrabold tracking-wide uppercase">
            Pick an emoji
          </label>
          <div className="grid grid-cols-10 gap-1">
            {EMOJI_OPTIONS.map((em) => (
              <button
                key={em}
                onClick={() => setEmoji(em)}
                className={[
                  "aspect-square rounded-[10px] border-2 text-lg flex items-center justify-center cursor-pointer transition-all duration-150 p-0",
                  emoji === em
                    ? "border-pink bg-pink-light scale-110"
                    : "border-transparent bg-pink-pale",
                ].join(" ")}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* Day picker (edit mode only) */}
        {isEdit && (
          <div className="mb-4">
            <label className="text-slate-muted mb-1.5 block text-[13px] font-extrabold tracking-wide uppercase">
              Day
            </label>
            <div className="flex gap-1">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setDay(i)}
                  className={[
                    "flex-1 py-2 px-1 rounded-[10px] border-2 text-xs font-extrabold cursor-pointer transition-all duration-150",
                    day === i
                      ? "bg-pink border-pink text-white"
                      : "bg-white border-pink-light text-slate-muted",
                  ].join(" ")}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          {isEdit && onDelete && (
            <button
              onClick={() => onDelete(editItem.id)}
              className="cursor-pointer rounded-xl border-none bg-[#FEE2E2] px-4.5 py-3 text-[15px] font-extrabold text-[#DC2626]"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="border-pink-light text-slate-muted flex-1 cursor-pointer rounded-xl border-2 bg-white py-3 text-[15px] font-extrabold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="from-pink flex-1 cursor-pointer rounded-xl border-none bg-linear-to-br to-[#FF8FB1] py-3 text-[15px] font-extrabold text-white shadow-[0_4px_15px_rgba(255,107,157,0.25)]"
          >
            {isEdit ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
