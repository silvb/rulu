import type { ContextMenuState } from "../lib/types";

interface ContextMenuProps {
  state: ContextMenuState;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ContextMenu({ state, onEdit, onDelete, onClose }: ContextMenuProps) {
  return (
    <div className="fixed inset-0 z-100 bg-black/10" onClick={onClose}>
      <div
        className="fixed z-101 min-w-40 overflow-hidden rounded-2xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
        style={{
          top: Math.min(state.y, window.innerHeight - 140),
          left: Math.min(state.x, window.innerWidth - 180),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="text-slate-dark block w-full cursor-pointer border-none bg-transparent px-5 py-3.5 text-left text-[15px] font-bold transition-[background] duration-150 hover:brightness-105 active:scale-[0.97]"
          onClick={onEdit}
        >
          ✏️ Edit
        </button>
        <button
          className="text-slate-dark block w-full cursor-pointer border-none bg-transparent px-5 py-3.5 text-left text-[15px] font-bold transition-[background] duration-150 hover:brightness-105 active:scale-[0.97]"
          onClick={onDelete}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
