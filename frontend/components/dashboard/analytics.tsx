"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SpendAnalytics } from "@/lib/types";
import { formatCompactMoney, formatMoney } from "@/lib/format";

const CATEGORY_COLORS = [
  "#96a99e",
  "#c6a56a",
  "#7f8fca",
  "#ba7778",
  "#6596a7",
  "#9ca473",
  "#9d8193",
  "#7e8983",
  "#ceb77a",
  "#6b9c89",
  "#9a95b2",
];

const tooltipStyle = {
  border: "1px solid rgba(15, 20, 18, 0.1)",
  borderRadius: "12px",
  boxShadow: "0 18px 48px rgba(15, 20, 18, 0.14)",
  background: "rgba(255,255,253,.98)",
  color: "#111714",
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
    fillOpacity: activeCategory && activeCategory !== item.category ? 0.18 : 1,
  }));

  const monthly = data.monthly.map((item) => ({
    ...item,
    amount: Number(item.amount),
    label: new Date(`${item.month}-01T00:00:00`).toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    }),
  }));

  const largestCategory = categories[0];

  return (
    <div className="analytics-grid">
      <section className="chart-panel chart-panel--trend">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">Monthly movement</span>
            <h3>Spend trajectory</h3>
          </div>
          <div className="chart-value-block">
            <span>Total eligible spend</span>
            <strong>{formatMoney(data.total_spend)}</strong>
          </div>
        </div>

        <div className="trend-summary-row">
          <span className="success-count"><i /> {data.successful_transactions.toLocaleString("en-IN")} successful</span>
          <span>13-month view</span>
        </div>

        <div className="chart-canvas chart-canvas--trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthly} margin={{ top: 18, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#354a40" stopOpacity={0.24} />
                  <stop offset="68%" stopColor="#354a40" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="#354a40" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(17,23,20,.07)" strokeDasharray="4 6" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#7c847f", fontSize: 11 }}
                minTickGap={24}
                tickMargin={12}
              />
              <YAxis hide domain={["dataMin - 1000", "dataMax + 1000"]} />
              <Tooltip
                cursor={{ stroke: "rgba(17,23,20,.18)", strokeDasharray: "4 4" }}
                contentStyle={tooltipStyle}
                formatter={(value) => formatMoney(Number(value))}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#354a40"
                strokeWidth={2.2}
                fill="url(#spendGradient)"
                activeDot={{ r: 4.5, fill: "#111714", stroke: "#f6f7f3", strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="chart-panel chart-panel--category">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">Category mix</span>
            <h3>Spend concentration</h3>
          </div>
          {activeCategory ? (
            <button className="chart-reset" onClick={() => onCategory(activeCategory)}>Clear filter</button>
          ) : null}
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
                    innerRadius="67%"
                    outerRadius="89%"
                    paddingAngle={1.5}
                    cornerRadius={3}
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

          <div className="category-insight">
            <span>Largest category</span>
            <strong>{largestCategory?.category ?? "—"}</strong>
            <p>{largestCategory ? formatCompactMoney(largestCategory.amount) : "—"} in eligible spend</p>
          </div>
        </div>

        <div className="legend-list" aria-label="Spend categories">
          {categories.slice(0, 6).map((item, index) => (
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
      </section>
    </div>
  );
}
