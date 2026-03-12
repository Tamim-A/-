"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 200);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors =
    type === "success"
      ? "bg-green-50 border-green-200 text-green-800"
      : "bg-red-50 border-red-200 text-red-800";

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-lg border px-4 py-3 text-sm shadow-lg transition-opacity duration-200 ${colors} ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {message}
    </div>
  );
}
