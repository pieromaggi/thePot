import Card from "./Card";
import Badge from "./Badge";

type StatCardProps = {
  label: string;
  value: string;
  delta?: { value: string; trend: "up" | "down" };
};

export default function StatCard({ label, value, delta }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {delta ? (
          <Badge variant={delta.trend === "up" ? "success" : "danger"}>
            {delta.value}
          </Badge>
        ) : null}
      </div>
    </Card>
  );
}
