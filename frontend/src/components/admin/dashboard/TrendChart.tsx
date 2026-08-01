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
  color = '#6366f1',
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              onClick={() => handlePeriodChange(period.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activePeriod === period.value
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-indigo-600 rounded-full" />
        </div>
      ) : chartType === 'bar' ? (
        <BarChart labels={labels} data={data} color={color} />
      ) : (
        <LineChart labels={labels} data={data} color={color} />
      )}
    </div>
  );
}
