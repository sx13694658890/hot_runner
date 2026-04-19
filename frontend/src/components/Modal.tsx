import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** 宽屏（表单、JSON 等） */
  wide?: boolean;
};

export function Modal({ open, title, onClose, children, footer, wide }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={[
          "max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl",
          wide ? "max-w-3xl" : "max-w-lg",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
