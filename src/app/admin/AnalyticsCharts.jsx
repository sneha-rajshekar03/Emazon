// app/admin/AnalyticsCharts.jsx
"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Balanced color palette - colorful but not overwhelming
const CHART_COLORS = [
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Green
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#6366F1", // Indigo
];

const PAYMENT_COLORS = {
  UPI: "#10B981",
  Card: "#3B82F6",
  COD: "#F59E0B",
  Fallback: "#EF4444",
};

/**
 * Interactive User Preferences Chart
 */
function InteractionChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyState title="No preference data available" />;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[180px]">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {payload[0].payload.category}
          </p>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">
              Average Score:{" "}
              <span className="font-medium text-blue-600">
                {payload[0].value.toFixed(2)}
              </span>
            </p>
            <p className="text-xs text-gray-600">
              Interactions:{" "}
              <span className="font-medium text-gray-900">
                {payload[0].payload.interactions}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard
      title="User Preferences"
      subtitle="Average interaction scores by category"
      icon={
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      }
      iconColor="text-pink-600"
      iconBg="bg-pink-50"
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 60 }}
        >
          <defs>
            <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E5E7EB"
            vertical={false}
          />
          <XAxis
            dataKey="category"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 400 }}
            axisLine={{ stroke: "#D1D5DB" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 400 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(59, 130, 246, 0.05)" }}
          />
          <Bar
            dataKey="avgScore"
            fill="url(#colorBar)"
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/**
 * Search Categories Distribution Chart - Bar Chart
 */
function SearchCategoriesChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyState title="No search data available" />;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[180px]">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {payload[0].payload.category}
          </p>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">
              Searches:{" "}
              <span className="font-medium text-gray-900">
                {payload[0].payload.searchCount}
              </span>
            </p>
            <p className="text-xs text-gray-600">
              Share:{" "}
              <span className="font-medium text-purple-600">
                {payload[0].payload.percentage}%
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard
      title="Search Categories"
      subtitle="Distribution of search queries"
      icon={
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      iconColor="text-purple-600"
      iconBg="bg-purple-50"
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 60 }}
        >
          <defs>
            <linearGradient id="colorSearch" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E5E7EB"
            vertical={false}
          />
          <XAxis
            dataKey="category"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 400 }}
            axisLine={{ stroke: "#D1D5DB" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 400 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(139, 92, 246, 0.05)" }}
          />
          <Bar
            dataKey="searchCount"
            fill="url(#colorSearch)"
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/**
 * Payment Method Distribution Chart - Enhanced Pie Chart
 */
function PaymentMethodChart({ data }) {
  if (!data || !data.distribution || data.distribution.length === 0) {
    return <EmptyState title="No payment data available" />;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-[200px]">
          <div className="flex items-center space-x-2 mb-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: PAYMENT_COLORS[item.method] || "#6B7280",
              }}
            />
            <p className="text-sm font-semibold text-gray-900">{item.method}</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Transactions:</span>
              <span className="text-sm font-bold text-gray-900">
                {item.count.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Market Share:</span>
              <span className="text-sm font-bold text-green-600">
                {item.percentage}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm font-bold drop-shadow-lg"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartCard
      title="Payment Methods Distribution"
      subtitle={`${data.totalPredictions.toLocaleString()} total predictions • ${
        data.fallbackRate
      }% fallback rate`}
      icon={
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      }
      iconColor="text-green-600"
      iconBg="bg-green-50"
    >
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* Pie Chart */}
        <div className="relative">
          <ResponsiveContainer width={320} height={320}>
            <PieChart>
              <defs>
                {data.distribution.map((entry, index) => {
                  const color =
                    PAYMENT_COLORS[entry.method] ||
                    CHART_COLORS[index % CHART_COLORS.length];
                  return (
                    <linearGradient
                      key={`gradient-${index}`}
                      id={`paymentGradient-${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                    </linearGradient>
                  );
                })}
              </defs>
              <Pie
                data={data.distribution}
                dataKey="count"
                nameKey="method"
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={75}
                paddingAngle={3}
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {data.distribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#paymentGradient-${index})`}
                    stroke="white"
                    strokeWidth={4}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {data.totalPredictions.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 font-medium mt-1">Total</p>
            </div>
          </div>
        </div>

        {/* Enhanced Legend with Stats */}
        <div className="flex-1 space-y-3 min-w-[200px]">
          {data.distribution.map((item, index) => {
            const color =
              PAYMENT_COLORS[item.method] ||
              CHART_COLORS[index % CHART_COLORS.length];
            return (
              <div
                key={index}
                className="group bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-semibold text-gray-900">
                      {item.method}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {item.percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 group-hover:opacity-90"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  {item.count.toLocaleString()} transactions
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}

/**
 * Reusable Chart Card Wrapper
 */
function ChartCard({ title, subtitle, icon, iconColor, iconBg, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start space-x-3 mb-6">
        <div
          className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}
        >
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState({ title }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center min-h-[340px]">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 border border-gray-200">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        Data will appear here once users start interacting with the platform
      </p>
    </div>
  );
}

// Export all components
export { InteractionChart, SearchCategoriesChart, PaymentMethodChart };
