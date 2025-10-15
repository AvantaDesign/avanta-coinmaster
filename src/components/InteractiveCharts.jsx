import { useState } from 'react';
import { formatCurrency } from '../utils/calculations';

/**
 * Interactive Charts Component
 * 
 * Provides advanced, interactive data visualization:
 * - Interactive bar charts with hover effects
 * - Line charts for trend analysis
 * - Pie/donut charts for distribution
 * - Drill-down capabilities
 * - Real-time updates
 * - Mobile-optimized
 */

export default function InteractiveCharts({ data, type = 'bar', title, onDrillDown }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
        No hay datos para visualizar
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}
      
      {type === 'bar' && (
        <InteractiveBarChart
          data={data}
          hoveredIndex={hoveredIndex}
          selectedIndex={selectedIndex}
          onHover={setHoveredIndex}
          onSelect={(index) => {
            setSelectedIndex(index);
            if (onDrillDown) onDrillDown(data[index]);
          }}
        />
      )}
      
      {type === 'line' && (
        <InteractiveLineChart
          data={data}
          hoveredIndex={hoveredIndex}
          onHover={setHoveredIndex}
        />
      )}
      
      {type === 'donut' && (
        <InteractiveDonutChart
          data={data}
          hoveredIndex={hoveredIndex}
          selectedIndex={selectedIndex}
          onHover={setHoveredIndex}
          onSelect={(index) => {
            setSelectedIndex(index);
            if (onDrillDown) onDrillDown(data[index]);
          }}
        />
      )}
      
      {type === 'comparison' && (
        <InteractiveComparisonChart
          data={data}
          hoveredIndex={hoveredIndex}
          onHover={setHoveredIndex}
        />
      )}
    </div>
  );
}

// Interactive Bar Chart Component
function InteractiveBarChart({ data, hoveredIndex, selectedIndex, onHover, onSelect }) {
  // Find max value for scaling
  const maxValue = Math.max(...data.map(d => Math.abs(d.value || d.amount || 0)));

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const value = item.value || item.amount || 0;
        const isPositive = value >= 0;
        const percentage = maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0;
        const isHovered = hoveredIndex === index;
        const isSelected = selectedIndex === index;

        return (
          <div
            key={index}
            className="relative"
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(index)}
          >
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-32 text-sm font-medium truncate" title={item.label || item.name}>
                {item.label || item.name}
              </div>
              <div className="flex-1 relative">
                <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className={`h-full flex items-center justify-end px-2 text-xs font-medium text-white transition-all duration-300 ${
                      isPositive ? 'bg-green-500' : 'bg-red-500'
                    } ${isHovered ? 'opacity-90 scale-105' : ''} ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 15 && formatCurrency(value)}
                  </div>
                </div>
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute z-10 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded text-xs whitespace-nowrap">
                    {formatCurrency(value)}
                    {item.count && ` (${item.count} transacciones)`}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
              <div className="w-24 text-right text-sm font-bold">
                {formatCurrency(value)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Interactive Line Chart Component
function InteractiveLineChart({ data, hoveredIndex, onHover }) {
  const maxValue = Math.max(...data.map(d => d.value || d.amount || 0));
  const minValue = Math.min(...data.map(d => d.value || d.amount || 0));
  const range = maxValue - minValue;

  // Calculate points for SVG path
  const width = 800;
  const height = 300;
  const padding = 40;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const value = item.value || item.amount || 0;
    const y = height - padding - ((value - minValue) / range) * (height - 2 * padding);
    return { x, y, value, label: item.label || item.name };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: '300px' }}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => {
          const y = height - padding - (percent / 100) * (height - 2 * padding);
          return (
            <g key={percent}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={padding - 10}
                y={y + 5}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {formatCurrency(minValue + (range * percent) / 100)}
              </text>
            </g>
          );
        })}

        {/* Area under line */}
        <path
          d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${
            points[0].x
          } ${height - padding} Z`}
          fill="url(#gradient)"
          opacity="0.3"
        />

        {/* Line */}
        <path d={pathD} stroke="#3b82f6" strokeWidth="3" fill="none" />

        {/* Points */}
        {points.map((point, index) => (
          <g
            key={index}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? 8 : 5}
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-200"
            />
            {/* Label */}
            <text
              x={point.x}
              y={height - padding + 20}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {point.label}
            </text>
          </g>
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Hover tooltip */}
      {hoveredIndex !== null && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded shadow-lg text-sm z-10">
          <div className="font-bold">{points[hoveredIndex].label}</div>
          <div>{formatCurrency(points[hoveredIndex].value)}</div>
        </div>
      )}
    </div>
  );
}

// Interactive Donut Chart Component
function InteractiveDonutChart({ data, hoveredIndex, selectedIndex, onHover, onSelect }) {
  const total = data.reduce((sum, item) => sum + Math.abs(item.value || item.amount || 0), 0);
  
  if (total === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No hay datos para visualizar
      </div>
    );
  }

  const size = 300;
  const strokeWidth = 60;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  // Color palette
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#06b6d4', '#6366f1', '#f43f5e', '#14b8a6', '#84cc16'
  ];

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* Donut Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {data.map((item, index) => {
            const value = Math.abs(item.value || item.amount || 0);
            const percentage = (value / total) * 100;
            const segmentLength = (percentage / 100) * circumference;
            const isHovered = hoveredIndex === index;
            const isSelected = selectedIndex === index;

            const segment = (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth={isHovered || isSelected ? strokeWidth + 5 : strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-currentOffset}
                className="transition-all duration-300 cursor-pointer"
                opacity={isHovered || isSelected ? 1 : 0.8}
                onMouseEnter={() => onHover(index)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onSelect(index)}
              />
            );

            currentOffset += segmentLength;
            return segment;
          })}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold">{formatCurrency(total)}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {data.map((item, index) => {
          const value = Math.abs(item.value || item.amount || 0);
          const percentage = ((value / total) * 100).toFixed(1);
          const isHovered = hoveredIndex === index;
          const isSelected = selectedIndex === index;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                isHovered || isSelected ? 'bg-gray-100' : ''
              }`}
              onMouseEnter={() => onHover(index)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(index)}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {item.label || item.name}
                </div>
                <div className="text-xs text-gray-500">{percentage}%</div>
              </div>
              <div className="text-sm font-bold">{formatCurrency(value)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Interactive Comparison Chart Component
function InteractiveComparisonChart({ data, hoveredIndex, onHover }) {
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.value1 || 0, d.value2 || 0))
  );

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const value1 = item.value1 || 0;
        const value2 = item.value2 || 0;
        const percentage1 = maxValue > 0 ? (value1 / maxValue) * 100 : 0;
        const percentage2 = maxValue > 0 ? (value2 / maxValue) * 100 : 0;
        const isHovered = hoveredIndex === index;

        return (
          <div
            key={index}
            className={`p-3 rounded-lg transition-colors ${
              isHovered ? 'bg-gray-50' : ''
            }`}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
          >
            <div className="text-sm font-medium mb-2">{item.label || item.name}</div>
            
            {/* Value 1 */}
            <div className="mb-1">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>{item.label1 || 'Valor 1'}</span>
                <span className="font-bold">{formatCurrency(value1)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${percentage1}%` }}
                ></div>
              </div>
            </div>

            {/* Value 2 */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>{item.label2 || 'Valor 2'}</span>
                <span className="font-bold">{formatCurrency(value2)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4">
                <div
                  className="bg-purple-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${percentage2}%` }}
                ></div>
              </div>
            </div>

            {/* Difference */}
            {item.showDifference !== false && (
              <div className="mt-2 text-xs text-gray-600 text-right">
                Diferencia: 
                <span className={`ml-1 font-bold ${
                  value1 > value2 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(value1 - value2)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Export chart types as named exports
export {
  InteractiveBarChart,
  InteractiveLineChart,
  InteractiveDonutChart,
  InteractiveComparisonChart
};
