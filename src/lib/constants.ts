export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const DAYS_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const STORAGE_KEY = "rulu-data";

export const EMOJI_OPTIONS = [
  "📋",
  "🛁",
  "✂️",
  "👕",
  "🛒",
  "🧹",
  "🥋",
  "🎵",
  "🎨",
  "📚",
  "🏃",
  "💊",
  "🧸",
  "🌱",
  "🍳",
  "🗑️",
  "📮",
  "🐈",
  "💤",
  "🎮",
];

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
