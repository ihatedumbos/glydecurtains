interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export default function SummaryCard({ title, value, icon, color }: SummaryCardProps) {
  return (
    <div className="bg-[#faf5ea] rounded-xl shadow-sm border border-[#2c2c2c]/12 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div
        className="flex items-center justify-center w-12 h-12 rounded-lg text-white text-xl"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#6b5d52] truncate">{title}</p>
        <p className="text-2xl font-bold text-[#2c2c2c]">{value}</p>
      </div>
    </div>
  );
}
