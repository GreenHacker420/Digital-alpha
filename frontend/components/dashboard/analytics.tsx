"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import type { SpendAnalytics } from "@/lib/types";
import { formatCompactMoney, formatMoney } from "@/lib/format";

const COLORS = ["#315cf6", "#7b61ff", "#13a89e", "#f2a93b", "#e85b8c", "#6e7b90", "#91a4ff", "#47c5b7"];

export function Analytics({
  data,
  loading,
  activeCategory,
  onCategory,
}: {
  data?: SpendAnalytics;
  loading: boolean;
  activeCategory: string;
  onCategory: (category: string) => void;
}) {
  if (loading || !data) return <div className="analytics-skeleton" aria-label="Loading analytics"><span /><span /></div>;

  const categories = data.categories.map((item) => ({ ...item, amount: Number(item.amount) }));
  const monthly = data.monthly.map((item) => ({ ...item, amount: Number(item.amount), label: new Date(`${item.month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) }));

  return (
    <div className="analytics-grid">
      <section className="chart-panel">
        <div className="panel-heading"><div><p className="eyebrow">Spend mix</p><h2>Where your money went</h2></div><strong>{formatMoney(data.total_spend)}</strong></div>
        <div className="donut-layout">
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categories} dataKey="amount" nameKey="category" innerRadius={63} outerRadius={88} paddingAngle={2} stroke="none" onClick={(entry) => entry?.category && onCategory(entry.category)}>
                  {categories.map((item, index) => <Cell key={item.category} fill={COLORS[index % COLORS.length]} opacity={activeCategory && activeCategory !== item.category ? 0.34 : 1} />)}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center"><strong>{categories.length}</strong><span>categories</span></div>
          </div>
          <div className="legend-list">
            {categories.slice(0, 6).map((item, index) => (
              <button key={item.category} onClick={() => onCategory(item.category)} className={activeCategory === item.category ? "active" : ""}>
                <i style={{ background: COLORS[index % COLORS.length] }} /><span>{item.category}</span><strong>{formatCompactMoney(item.amount)}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="chart-panel chart-panel--trend">
        <div className="panel-heading"><div><p className="eyebrow">Monthly trend</p><h2>Spend over time</h2></div><span>{data.successful_transactions.toLocaleString("en-IN")} successful</span></div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly} margin={{ top: 12, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#738096", fontSize: 11 }} minTickGap={18} />
            <YAxis hide />
            <Tooltip cursor={{ fill: "rgba(49,92,246,.06)" }} formatter={(value) => formatMoney(Number(value))} />
            <Bar dataKey="amount" fill="#315cf6" radius={[5, 5, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
