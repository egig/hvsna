import React from "react";
import { X, RotateCcw } from "lucide-react";

interface CustomToastProps {
  message: string;
  type?: "success" | "error" | "loading";
  onUndo?: () => void;
  onDismiss?: () => void;
}

export function CustomToast({ message, onUndo, onDismiss }: CustomToastProps) {
  return (
    <div className="flex">
      <div className="flex-1 mr-3">
        <p className="text-sm font-medium">{message}</p>
      </div>

      <div className="flex items-center gap-2">
        {onUndo && (
          <button
            onClick={onUndo}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
          >
            <RotateCcw size={12} />
            Undo
          </button>
        )}

        <button
          onClick={onDismiss}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default CustomToast;
