import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-sm border ${className}`}
    >
      {children}
    </div>
  );
}