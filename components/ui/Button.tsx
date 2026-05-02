import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full py-3 rounded-2xl text-white font-medium
      bg-gradient-to-r from-indigo-500 to-indigo-600
      hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}