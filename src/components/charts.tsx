interface BarChartItem {
  label: string;
  value: number;
}

interface BarChartProps {
  title: string;
  data: BarChartItem[];
  color?: string;
  formatValue?: (v: number) => string;
}

export function BarChart({
  title,
  data,
  color = "bg-blue-500",
  formatValue = (v) => v.toLocaleString("ar-SA"),
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">لا توجد بيانات</p>
      ) : (
        <div className="space-y-2.5">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-16 text-xs text-gray-500 text-left shrink-0 truncate">
                {item.label}
              </span>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0)}%` }}
                />
              </div>
              <span className="w-16 text-xs font-medium text-gray-700 text-right shrink-0">
                {formatValue(item.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface HorizontalBarChartProps {
  title: string;
  data: Array<{ label: string; value: number; secondary?: number }>;
  color?: string;
  secondaryColor?: string;
  formatValue?: (v: number) => string;
  formatSecondary?: (v: number) => string;
  maxItems?: number;
}

export function HorizontalBarChart({
  title,
  data,
  color = "bg-blue-500",
  formatValue = (v) => v.toLocaleString("ar-SA"),
  maxItems = 8,
}: HorizontalBarChartProps) {
  const items = data.slice(0, maxItems);
  const max = Math.max(...items.map((d) => d.value), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">لا توجد بيانات</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
                <span className="text-xs text-gray-500">{formatValue(item.value)}</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface StatGridProps {
  items: Array<{
    label: string;
    value: string;
    sub?: string;
  }>;
}

export function StatGrid({ items }: StatGridProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((item, i) => (
          <div key={i} className="text-center p-3 rounded-lg bg-gray-50">
            <p className="text-xl font-bold text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            {item.sub && (
              <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
