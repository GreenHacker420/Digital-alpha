"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SpendAnalytics } from "@/lib/types";
import { formatCompactMoney, formatMoney } from "@/lib/format";

const CATEGORY_COLORS = [
  "#5B5CE2",
  "#3E91E8",
  "#8B74E8",
  "#E58A63",
  "#D9657C",
  "#E3AA43",
  "#58A7A1",
  "#79839B",
  "#B06AB3",
  "#7D9E68",
  "#A87D62",
];

const tooltipStyle = {
  border: "1px solid rgba(31, 36, 58, 0.1)",
  borderRadius: "14px",
  boxShadow: "0 18px 50px rgba(26, 31, 54, 0.14)",
  background: "rgba(255,255,255,.98)",
  color: "#181b2c",
  fontSize: "12px",
};

function compactAxis(value: number) {
  return formatCompactMoney(value).replace("₹", "₹");
}

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
        <span>Your transaction table is still available while you retry the API.</span>
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

  const totalSpend = Number(data.total_spend);
  const categories = data.categories.map((item, index) => ({
    ...item,
    amount: Number(item.amount),
    fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    percent: totalSpend > 0 ? (Number(item.amount) / totalSpend) * 100 : 0,
  }));

  const monthly = data.monthly.map((item) => ({
    ...item,
    amount: Number(item.amount),
    label: new Date(`${item.month}-01T00:00:00`).toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    }),
  }));

  const averageMonthly = monthly.length
    ? monthly.reduce((sum, item) => sum + item.amount, 0) / monthly.length
    : 0;
  const highestMonth = monthly.reduce<(typeof monthly)[number] | undefined>(
    (highest, item) => (!highest || item.amount > highest.amount ? item : highest),
    undefined,
  );
  const latestMonth = monthly.at(-1);
  const previousMonth = monthly.at(-2);
  const latestChange = latestMonth && previousMonth && previousMonth.amount !== 0
    ? ((latestMonth.amount - previousMonth.amount) / previousMonth.amount) * 100
    : null;

  return (
    <div className="analytics-grid">
      <section className="chart-panel chart-panel--category">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">By category</span>
            <h3>Where your money went</h3>
          </div>
          {activeCategory ? (
            <button className="chart-reset" onClick={() => onCategory(activeCategory)}>
              Clear {activeCategory}
            </button>
          ) : null}
        </div>

        <div className="category-chart-layout">
          <div className="donut-wrap">
            <div className="chart-canvas chart-canvas--donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius="66%"
                    outerRadius="89%"
                    paddingAngle={1.7}
                    cornerRadius={4}
                    stroke="none"
                    onClick={(entry) => {
                      const category = String(
                        (entry as unknown as { category?: string })?.category ?? "",
                      );
                      if (category) onCategory(category);
                    }}
                  >
                    {categories.map((item) => (
                      <Cell
                        key={item.category}
                        fill={item.fill}
                        opacity={activeCategory && activeCategory !== item.category ? 0.26 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => formatMoney(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="donut-center">
              <strong>{categories.length}</strong>
              <span>{categories.length === 1 ? "category" : "categories"}</span>
            </div>
          </div>

          <div className="category-ranking" aria-label="Spend categories ranked by amount">
            {categories.slice(0, 6).map((item) => (
              <button
                key={item.category}
                className={activeCategory === item.category ? "active" : ""}
                onClick={() => onCategory(item.category)}
              >
                <span className="category-ranking__label">
                  <i style={{ background: item.fill }} />
                  <span>{item.category}</span>
                </span>
                <span className="category-ranking__value">
                  <strong>{formatCompactMoney(item.amount)}</strong>
                  <small>{item.percent.toFixed(item.percent >= 10 ? 0 : 1)}%</small>
                </span>
                <span className="category-ranking__bar" aria-hidden="true">
                  <i style={{ width: `${Math.max(4, item.percent)}%`, background: item.fill }} />
                </span>
              </button>
            ))}
          </div>
        </div>
        <p className="chart-hint">Select any slice or category to filter the transaction table.</p>
      </section>

      <section className="chart-panel chart-panel--trend">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">Monthly trend</span>
            <h3>How your spend changed</h3>
          </div>
          <div className="chart-value-block">
            <span>Total spend</span>
            <strong>{formatCompactMoney(totalSpend)}</strong>
          </div>
        </div>

        <div className="trend-insights">
          <div>
            <span>Monthly average</span>
            <strong>{formatCompactMoney(averageMonthly)}</strong>
          </div>
          <div>
            <span>Highest month</span>
            <strong>{highestMonth?.label ?? "—"}</strong>
            <small>{highestMonth ? formatCompactMoney(highestMonth.amount) : "—"}</small>
          </div>
          <div>
            <span>Latest vs previous</span>
            <strong className={latestChange !== null && latestChange > 0 ? "trend-up" : "trend-down"}>
              {latestChange === null ? "—" : `${latestChange > 0 ? "+" : ""}${latestChange.toFixed(1)}%`}
            </strong>
            <small>{latestMonth?.label ?? ""}</small>
          </div>
        </div>

        <div className="chart-canvas chart-canvas--trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthly} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B5CE2" stopOpacity={0.24} />
                  <stop offset="72%" stopColor="#5B5CE2" stopOpacity={0.04} />
                  <stop offset="100%" stopColor="#5B5CE2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(58, 64, 92, .09)" strokeDasharray="4 6" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#777d92", fontSize: 11 }}
                minTickGap={22}
                tickMargin={12}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8b90a2", fontSize: 10 }}
                width={56}
                tickFormatter={(value) => compactAxis(Number(value))}
              />
              <ReferenceLine
                y={averageMonthly}
                stroke="#C7A44E"
                strokeDasharray="5 5"
                strokeOpacity={0.75}
              />
              <Tooltip
                cursor={{ stroke: "rgba(91,92,226,.28)", strokeDasharray: "4 4" }}
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#666c80", marginBottom: "4px" }}
                formatter={(value) => formatMoney(Number(value))}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#5B5CE2"
                strokeWidth={2.5}
                fill="url(#spendGradient)"
                activeDot={{ r: 4.5, fill: "#5B5CE2", stroke: "#ffffff", strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="trend-key"><i /> Monthly average</div>
      </section>
    </div>
  );
}
