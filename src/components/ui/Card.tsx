import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export default function Card({ className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`rounded-xl bg-white p-6 shadow-card ${className ?? ""}`}
    />
  );
}
