import { memo } from 'react';

function PeriodSelector({ value, onChange }) {
  const periods = [
    { value: 'month', label: 'Este Mes' },
    { value: 'quarter', label: 'Este Trimestre' },
    { value: 'year', label: 'Este Año' },
    { value: 'all', label: 'Todo' }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            value === period.value
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

export default memo(PeriodSelector);
