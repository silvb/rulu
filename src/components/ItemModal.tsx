import { useState } from "react";
import { DAYS, EMOJI_OPTIONS } from "../lib/constants";
import type { Item, ItemType, Frequency } from "../lib/types";
import { getScheduledWeekForOneTimeItem, getWeekStart } from "../lib/week";

interface ItemModalProps {
  editItem: Item | null;
  defaultDay: number;
  memberId: string;
  onSave: (data: {
    title: string;
    type: ItemType;
    time: string;
    emoji: string;
    day: number;
    personal: boolean;
    frequency: Frequency;
    frequency_phase: number;
    is_one_time: boolean;
    scheduled_for_week?: string;
  }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function ItemModal({
  editItem,
  defaultDay,
  memberId,
  onSave,
  onDelete,
  onClose,
}: ItemModalProps) {
  const isEdit = !!editItem;
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [type, setType] = useState<ItemType>(editItem?.type ?? "todo");
  const [time, setTime] = useState(editItem?.time ?? "");
  const [emoji, setEmoji] = useState(editItem?.emoji ?? "📋");
  const [day, setDay] = useState(editItem?.day ?? defaultDay);
  const [frequency, setFrequency] = useState<Frequency>(editItem?.frequency ?? "weekly");
  const [frequencyPhase, setFrequencyPhase] = useState(editItem?.frequency_phase ?? 0);
  const [personal, setPersonal] = useState(isEdit ? editItem.owner_id === memberId : false);
  const [isOneTime, setIsOneTime] = useState(editItem?.is_one_time ?? false);

  const handleSave = () => {
    if (!title.trim()) return;
    const scheduledForWeek = isOneTime && !isEdit ? getScheduledWeekForOneTimeItem(day) : editItem?.scheduled_for_week;
    onSave({
      title: title.trim(),
      type,
      time: type === "event" ? time : "",
      emoji,
      day,
      personal,
      frequency: type === "todo" && !isOneTime ? frequency : "weekly",
      frequency_phase: type === "todo" && !isOneTime && frequency !== "weekly" ? frequencyPhase : 0,
      is_one_time: isOneTime,
      scheduled_for_week: scheduledForWeek,
    });
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

        {/* Frequency picker (todos only, not one-time) */}
        {type === "todo" && !isOneTime && (
          <div className="mb-4">
            <label className="text-slate-muted mb-1.5 block text-[13px] font-extrabold tracking-wide uppercase">
              How often?
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: "weekly", label: "Weekly" },
                  { value: "biweekly", label: "Bi-weekly" },
                  { value: "monthly", label: "Monthly" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFrequency(opt.value);
                    if (opt.value !== frequency) setFrequencyPhase(0);
                  }}
                  className={[
                    "flex-1 py-2.5 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all duration-200",
                    frequency === opt.value
                      ? "bg-pink-pale border-pink text-pink"
                      : "bg-white border-pink-light text-slate-dark",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Frequency phase picker */}
        {type === "todo" && !isOneTime && frequency === "biweekly" && (
          <div className="mb-4">
            <label className="text-slate-muted mb-1.5 block text-[13px] font-extrabold tracking-wide uppercase">
              Which weeks?
            </label>
            <div className="flex gap-2">
              {([
                { value: 0, label: "Odd weeks" },
                { value: 1, label: "Even weeks" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFrequencyPhase(opt.value)}
                  className={[
                    "flex-1 py-2.5 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all duration-200",
                    frequencyPhase === opt.value
                      ? "bg-pink-pale border-pink text-pink"
                      : "bg-white border-pink-light text-slate-dark",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === "todo" && !isOneTime && frequency === "monthly" && (
          <div className="mb-4">
            <label className="text-slate-muted mb-1.5 block text-[13px] font-extrabold tracking-wide uppercase">
              Which week of the month?
            </label>
            <div className="flex gap-2">
              {([
                { value: 0, label: "1st" },
                { value: 1, label: "2nd" },
                { value: 2, label: "3rd" },
                { value: 3, label: "4th" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFrequencyPhase(opt.value)}
                  className={[
                    "flex-1 py-2.5 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all duration-200",
                    frequencyPhase === opt.value
                      ? "bg-pink-pale border-pink text-pink"
                      : "bg-white border-pink-light text-slate-dark",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Personal toggle */}
        <div className="mb-4">
          <button
            onClick={() => setPersonal((p) => !p)}
            className={[
              "flex w-full items-center gap-3 rounded-xl border-2 px-3.5 py-3 cursor-pointer transition-all duration-200",
              personal
                ? "bg-[#EDE9FE] border-[#8B5CF6] text-[#7C3AED]"
                : "bg-white border-pink-light text-slate-muted",
            ].join(" ")}
          >
            <span className="text-lg">{personal ? "👤" : "👥"}</span>
            <span className="text-sm font-bold">
              {personal ? "Just for me" : "Shared with household"}
            </span>
          </button>
        </div>

        {/* One-time toggle */}
        <div className="mb-4">
          <button
            onClick={() => {
              setIsOneTime((p) => !p);
              if (!isOneTime) {
                setFrequency("weekly");
                setFrequencyPhase(0);
              }
            }}
            className={[
              "flex w-full items-center gap-3 rounded-xl border-2 px-3.5 py-3 cursor-pointer transition-all duration-200",
              isOneTime
                ? "bg-[#FEF3C7] border-[#F59E0B] text-[#D97706]"
                : "bg-white border-pink-light text-slate-muted",
            ].join(" ")}
          >
            <span className="text-lg">{isOneTime ? "⚡" : "🔄"}</span>
            <div className="text-left flex-1">
              <span className="text-sm font-bold block">
                {isOneTime ? "One-time item" : "Recurring item"}
              </span>
              {isOneTime && !isEdit && (
                <span className="text-xs opacity-75">
                  {getScheduledWeekForOneTimeItem(day) === getWeekStart() ? "Scheduled for this week" : "Scheduled for next week"}
                </span>
              )}
            </div>
          </button>
        </div>

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
