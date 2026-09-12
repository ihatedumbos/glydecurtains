interface BarChartProps {
  labels: string[];
  data: number[];
  color?: string;
  height?: number;
}

export default function BarChart({ labels, data, color = '#a06b3a', height = 200 }: BarChartProps) {
  const maxValue = Math.max(...data, 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-1 justify-between" style={{ height }}>
        {data.map((value, index) => {
          const barHeight = (value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div
                className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#2c2c2c] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
              >
                {value.toLocaleString()}
              </div>
              <div
                className="w-full max-w-[32px] rounded-t transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: color,
                  minHeight: value > 0 ? '4px' : '0px',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 justify-between mt-2">
        {labels.map((label, index) => (
          <div key={index} className="flex-1 text-center">
            <span className="text-xs text-[#8a7a6b] truncate block">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
