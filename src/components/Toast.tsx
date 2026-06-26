import { Icon } from "@iconify/react";

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "info" | "error";
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-10 left-1/2 z-[99999] flex flex-col items-center gap-2 pointer-events-none"
      style={{ transform: "translateX(-50%)" }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 px-3 py-2 flex items-center gap-2 text-xs font-bold text-black shadow-lg max-w-[280px] w-max"
        >
          {toast.type === "success" && (
            <Icon
              icon="dinkie-icons:slightly-smiling-face-filled"
              className="w-4 h-4 text-green-700 flex-shrink-0"
            />
          )}
          {toast.type === "info" && (
            <Icon
              icon="dinkie-icons:circled-information-source-filled"
              className="w-4 h-4 text-[#000080] flex-shrink-0"
            />
          )}
          {toast.type === "error" && (
            <Icon
              icon="dinkie-icons:slightly-frowning-face-filled"
              className="w-4 h-4 text-[#800000] flex-shrink-0"
            />
          )}
          <span className="flex-1 leading-tight">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="flex-shrink-0 w-4 h-4 border border-gray-600 bg-[#c0c0c0] flex items-center justify-center hover:bg-gray-300 text-[11px] leading-none cursor-pointer ml-1"
            title="关闭"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
