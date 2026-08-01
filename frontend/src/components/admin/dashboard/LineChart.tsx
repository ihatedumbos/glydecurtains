interface LineChartProps {
  labels: string[];
  data: number[];
  color?: string;
  height?: number;
}

export default function LineChart({ labels, data, color = '#10b981', height = 200 }: LineChartProps) {
  const maxValue = Math.max(...data, 1);
  const padding = 20;
  const chartWidth = 100; // percentage-based via viewBox
  const chartHeight = height - padding * 2;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        No data available
      </div>
    );
  }

  const points = data.map((value, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (chartWidth - padding * 2);
    const y = padding + chartHeight - (value / maxValue) * chartHeight;
    return { x, y };
  });

  const pathD = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {/* Area fill */}
        <path d={areaD} fill={color} opacity="0.1" />
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points */}
        {points.map((point, i) => (
          <circle key={i} cx={point.x} cy={point.y} r="2" fill={color} className="hover:r-[4]" />
        ))}
      </svg>
      <div className="flex justify-between mt-2 px-2">
        {labels.filter((_, i) => i % Math.ceil(labels.length / 6) === 0 || i === labels.length - 1).map((label, index) => (
          <span key={index} className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        ))}
      </div>
    </div>
  );
}
