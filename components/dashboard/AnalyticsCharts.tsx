"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Package = {
  destination: string;
  views: number;
  whatsappClicks: number;
  messengerClicks: number;
};

const COLORS = ["#4f46e5", "#22c55e", "#06b6d4"];

export default function AnalyticsCharts({
  packages,
}: {
  packages: Package[];
}) {
  // -------------------------
  // DATA TRANSFORMATION
  // -------------------------
  const barData = packages.map((p) => ({
    name: p.destination,
    views: p.views,
    clicks: p.whatsappClicks + p.messengerClicks,
  }));

  const totalViews = packages.reduce((a, b) => a + b.views, 0);
  const totalClicks = packages.reduce(
    (a, b) => a + b.whatsappClicks + b.messengerClicks,
    0
  );

  const pieData = [
    { name: "Views", value: totalViews },
    { name: "Clicks", value: totalClicks },
  ];

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="space-y-10">

      {/* BAR CHART */}
      <div className="bg-white p-6 rounded-2xl border">
        <h2 className="font-semibold mb-4">
          Performance per Package
        </h2>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#4f46e5" />
              <Bar dataKey="clicks" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PIE CHART */}
      <div className="bg-white p-6 rounded-2xl border">
        <h2 className="font-semibold mb-4">
          Views vs Clicks
        </h2>

        <div className="h-72 flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={100}
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}