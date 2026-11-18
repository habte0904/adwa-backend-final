import pool from "../config/db.config.js";
import { format } from "date-fns";

// Helper to get ticket types dynamically
async function getTicketTypes() {
  const res = await pool.query("SELECT type FROM ticket_types WHERE type IS NOT NULL");
  return res.rows.map(r => r.type);
}

export const getTicketActivityDashboard = async (req, res) => {
  try {
    const { currency } = req.query;
    const ticketTypes = await getTicketTypes();

    // ------------------------------
    // 1. Daily Summary (booking-level totals)
    // ------------------------------
    const dailySql = `
      SELECT
        to_char(bt.bought_date, 'YYYY-MM-DD') AS date,
        SUM(bt.total_tickets) AS total_tickets,
        SUM(bt.paid_amount) AS total_sales
      FROM bought_ticket bt
      WHERE EXISTS (
        SELECT 1
        FROM bought_ticket_types btt
        JOIN ticket_types tt ON btt.ticket_id = tt.ticket_id
        WHERE btt.ticket_booking_id = bt.ticket_booking_id
        ${currency ? "AND tt.currency = $1" : ""}
      )
      GROUP BY date
      ORDER BY date DESC
    `;
    const dailyRows = (await pool.query(dailySql, currency ? [currency] : [])).rows;

    // ------------------------------
    // 2. Ticket Type Breakdown (per-type revenue from ticket_types.price)
    // ------------------------------
    const typeSql = `
      SELECT
        to_char(bt.bought_date, 'YYYY-MM-DD') AS date,
        tt.type AS ticket_type,
        tt.currency,
        COUNT(*) AS count,
        SUM(btt.unit_price) AS revenue
      FROM bought_ticket bt
      JOIN bought_ticket_types btt ON bt.ticket_booking_id = btt.ticket_booking_id
      JOIN ticket_types tt ON btt.ticket_id = tt.ticket_id
      WHERE 1=1
      ${currency ? "AND tt.currency = $1" : ""}
      GROUP BY date, tt.type, tt.currency
      ORDER BY date DESC
    `;
    const typeRows = (await pool.query(typeSql, currency ? [currency] : [])).rows;

    // Build daily summary including per-ticket-type breakdown
    const dailySummary = dailyRows.map(day => {
      const summary = {
        date: day.date,
        totalTickets: Number(day.total_tickets),
        totalSales: Number(day.total_sales),
      };
      ticketTypes.forEach(type => {
        const typeRow = typeRows.find(r => r.date === day.date && r.ticket_type === type);
        summary[type.toLowerCase()] = {
          count: typeRow ? Number(typeRow.count) : 0,
          revenue: typeRow ? Number(typeRow.revenue) : 0,
        };
      });
      return summary;
    });

    // ------------------------------
    // 3. Overview Stats (Daily, Weekly, Monthly)
    // ------------------------------
    const today = format(new Date(), "yyyy-MM-dd");
    const weekAgo = format(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
    const monthAgo = format(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

    async function getOverviewStats(startDate, endDate) {
      const overviewSql = `
        SELECT
          SUM(bt.total_tickets) AS total_tickets,
          SUM(bt.paid_amount) AS total_revenue
        FROM bought_ticket bt
        WHERE to_char(bt.bought_date, 'YYYY-MM-DD') BETWEEN $1 AND $2
        AND EXISTS (
          SELECT 1
          FROM bought_ticket_types btt
          JOIN ticket_types tt ON btt.ticket_id = tt.ticket_id
          WHERE btt.ticket_booking_id = bt.ticket_booking_id
          ${currency ? "AND tt.currency = $3" : ""}
        )
      `;

      const byTypeSql = `
        SELECT
          tt.type AS ticket_type,
          tt.currency,
          COUNT(*) AS count,
          SUM(btt.unit_price) AS revenue
        FROM bought_ticket bt
        JOIN bought_ticket_types btt ON bt.ticket_booking_id = btt.ticket_booking_id
        JOIN ticket_types tt ON btt.ticket_id = tt.ticket_id
        WHERE to_char(bt.bought_date, 'YYYY-MM-DD') BETWEEN $1 AND $2
        ${currency ? "AND tt.currency = $3" : ""}
        GROUP BY tt.type, tt.currency
      `;

      const [overview, byType] = await Promise.all([
        pool.query(overviewSql, currency ? [startDate, endDate, currency] : [startDate, endDate]),
        pool.query(byTypeSql, currency ? [startDate, endDate, currency] : [startDate, endDate]),
      ]);

      return {
        totalTicketsSold: Number(overview.rows[0]?.total_tickets) || 0,
        totalRevenue: Number(overview.rows[0]?.total_revenue) || 0,
        ticketsSoldByType: byType.rows.map(row => ({
          type: row.ticket_type,
          count: Number(row.count),
          revenue: Number(row.revenue),
          color: "#92400e",
        })),
      };
    }

    const dailyOverview = await getOverviewStats(today, today);
    const weeklyOverview = await getOverviewStats(weekAgo, today);
    const monthlyOverview = await getOverviewStats(monthAgo, today);

    // ------------------------------
    // 4. Pie Chart Data
    // ------------------------------
    async function getPieChartData(startDate, endDate) {
      const pieSql = `
        SELECT
          LOWER(tt.type) AS name,
          tt.currency,
          COUNT(*) AS value
        FROM bought_ticket bt
        JOIN bought_ticket_types btt ON bt.ticket_booking_id = btt.ticket_booking_id
        JOIN ticket_types tt ON btt.ticket_id = tt.ticket_id
        WHERE to_char(bt.bought_date, 'YYYY-MM-DD') BETWEEN $1 AND $2
        ${currency ? "AND tt.currency = $3" : ""}
        GROUP BY LOWER(tt.type), tt.currency
      `;
      const rows = (await pool.query(pieSql, currency ? [startDate, endDate, currency] : [startDate, endDate])).rows;

      const palette = ["#f59e0b", "#d97706", "#92400e", "#451a03", "#fbbf24", "#f3a847", "#ea580c", "#dc2626"];
      let colorIndex = 0;
      const colorMap = {};

      function getColor(type) {
        if (!colorMap[type]) {
          colorMap[type] = palette[colorIndex % palette.length];
          colorIndex++;
        }
        return colorMap[type];
      }

      return rows.map(r => ({
        name: r.name,
        value: Number(r.value),
        color: getColor(r.name),
      }));
    }

    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const pieOverall = await getPieChartData("2025-01-01", today);
    const pieWeekly = await getPieChartData(weekAgo, today);
    const pieMonthly = await getPieChartData(monthAgo, today);
    const pieYearly = await getPieChartData(yearStart, today);

    // ------------------------------
    // 5. Response
    // ------------------------------
    res.json({
      currency: currency || "ALL",
      dailyOverviewStats: dailyOverview,
      weeklyOverviewStats: weeklyOverview,
      monthlyOverviewStats: monthlyOverview,
      dailyTicketSalesSummary: dailySummary,
      pieChartData: { overall: pieOverall, weekly: pieWeekly, monthly: pieMonthly, yearly: pieYearly },
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ error: "Failed to fetch ticket activity dashboard data" });
  }
};
