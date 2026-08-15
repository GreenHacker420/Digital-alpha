"use client";

import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SpendAnalytics } from "@/lib/types";
import { formatCompactMoney, formatMoney } from "@/lib/format";

const CATEGORY_COLORS = [
  "#83d4ad",
  "#d8ad62",
  "#a798ef",
  "#e58484",
  "#79b5d3",
  "#bdc88d",
  "#d09bbe",
  "#8fa19a",
  "#f0c67c",
  "#65b89d",
  "#aaa3d3",
];

const tooltipStyle = {
  border: "1px solid rgba(17, 25, 22, 0.1)",
  borderRadius: "14px",
  boxShadow: "0 18px 45px rgba(17, 25, 22, 0.12)",
  background: "rgba(255,255,252,.97)",
  color: "#17201b",
  fontSize: "12px",
};

export function Analytics({
  data,
  loading,
  error,
  activeCategory,
  onCategory,
}: {
  data?: SpendAnalytics;
  loading: boolean;
  error: boolean;
  activeCategory: string;
  onCategory: (category: string) => void;
}) {
  if (error) {
    return (
      <div className="analytics-error">
        <strong>Spend analytics couldn’t load.</strong>
        <span>The transaction ledger remains available while you retry the API.</span>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="analytics-skeleton" aria-label="Loading analytics">
        <span />
        <span />
      </div>
    );
  }

  const categories = data.categories.map((item, index) => ({
    ...item,
    amount: Number(item.amount),
    fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    fillOpacity: activeCategory && activeCategory !== item.category ? 0.24 : 1,
  }));

  const monthly = data.monthly.map((item) => ({
    ...item,
    amount: Number(item.amount),
    label: new Date(`${item.month}-01T00:00:00`).toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    }),
  }));

  return (
    <div className="analytics-grid">
      <section className="chart-panel chart-panel--category">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">Category distribution</span>
            <h3>Where the spend landed</h3>
          </div>
          <strong>{formatMoney(data.total_spend)}</strong>
        </div>

        <div className="donut-layout">
          <div className="donut-wrap">
            <div className="chart-canvas chart-canvas--donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius="61%"
                    outerRadius="86%"
                    paddingAngle={2}
                    stroke="none"
                    onClick={(entry) => {
                      const category = String(
                        (entry as unknown as { category?: string })?.category ?? "",
                      );
                      if (category) onCategory(category);
                    }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => formatMoney(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="donut-center">
              <strong>{categories.length}</strong>
              <span>categories</span>
            </div>
          </div>

          <div className="legend-list" aria-label="Spend categories">
            {categories.slice(0, 7).map((item, index) => (
              <button
                key={item.category}
                onClick={() => onCategory(item.category)}
                className={activeCategory === item.category ? "active" : ""}
              >
                <i style={{ background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                <span>{item.category}</span>
                <strong>{formatCompactMoney(item.amount)}</strong>
              </button>
            ))}
          </div>
        </div>

        <p className="chart-hint">Select any category to filter the ledger below.</p>
      </section>

      <section className="chart-panel chart-panel--trend">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">Monthly movement</span>
            <h3>Spend over time</h3>
          </div>
          <span className="success-count">
            <i aria-hidden="true" />
            {data.successful_transactions.toLocaleString("en-IN")} successful
          </span>
        </div>

        <div className="chart-canvas chart-canvas--trend">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 18, right: 4, bottom: 0, left: 4 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#747d77", fontSize: 11 }}
                minTickGap={24}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "rgba(35, 100, 76, .055)" }}
                contentStyle={tooltipStyle}
                formatter={(value) => formatMoney(Number(value))}
              />
              <Bar dataKey="amount" fill="#286c52" radius={[7, 7, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
