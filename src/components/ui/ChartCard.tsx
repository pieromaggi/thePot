import type { ReactNode } from "react";
import Card from "./Card";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function ChartCard({
  title,
  subtitle,
  children,
}: ChartCardProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle ? (
          <p className="text-xs text-gray-500">{subtitle}</p>
        ) : null}
      </div>
      <div>{children}</div>
    </Card>
  );
}
