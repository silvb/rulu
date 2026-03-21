interface ProgressBarProps {
  done: number;
  total: number;
}

export function ProgressBar({ done, total }: ProgressBarProps) {
  const progress = total ? done / total : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/30">
        <div
          className="bg-yellow h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress * 100}%`,
            transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </div>
      <span className="text-sm font-extrabold whitespace-nowrap">
        {done}/{total} done {progress >= 1 ? "🎉" : progress >= 0.5 ? "💪" : ""}
      </span>
    </div>
  );
}
