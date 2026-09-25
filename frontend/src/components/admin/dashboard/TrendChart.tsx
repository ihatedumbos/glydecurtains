import { useState } from 'react';
import BarChart from '@/components/admin/dashboard/BarChart';
import LineChart from '@/components/admin/dashboard/LineChart';

type ChartType = 'bar' | 'line';
type Period = '7d' | '30d' | '90d' | '1y';

interface TrendChartProps {
  title: string;
  labels: string[];
  data: number[];
  color?: string;
  chartType?: ChartType;
  onPeriodChange?: (period: Period) => void;
  loading?: boolean;
}

const PERIODS: { label: string; value: Period }[] = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '1Y', value: '1y' },
];

export default function TrendChart({
  title,
  labels,
  data,
  color = '#c27d56',
  chartType = 'bar',
  onPeriodChange,
  loading = false,
}: TrendChartProps) {
  const [activePeriod, setActivePeriod] = useState<Period>('30d');

  const handlePeriodChange = (period: Period) => {
    setActivePeriod(period);
    onPeriodChange?.(period);
  };

  return (
    <div className="bg-[#ffffff] rounded-xl shadow-sm border border-[#2f3e46]/12 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#2f3e46]">{title}</h3>
        <div className="flex gap-1 bg-[#ffffff] rounded-lg p-0.5">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              onClick={() => handlePeriodChange(period.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activePeriod === period.value
                  ? 'bg-[#ffffff] text-[#2f3e46] shadow-sm'
                  : 'text-[#5c6b73] hover:text-[#2f3e46]'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin h-6 w-6 border-2 border-[#f2f4f5] border-t-[#c27d56] rounded-full" />
        </div>
      ) : chartType === 'bar' ? (
        <BarChart labels={labels} data={data} color={color} />
      ) : (
        <LineChart labels={labels} data={data} color={color} />
      )}
    </div>
  );
}
