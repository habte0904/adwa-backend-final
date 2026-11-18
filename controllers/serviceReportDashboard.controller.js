import { query } from '../config/db.config.js';

/**
 * GET /api/service-report-dashboard
 * Returns analytics for service requests dashboard
 */
const getServiceReportDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Filter condition for the main query
    let dateFilterClause = "";
    const queryParams = [];

    // For date filtering, we check if the request has any dates within the range
    // We'll filter the request_dates in the subquery

    // 0. Fetch all venues and their maximum capacities to ensure robust metrics
    const baseVenueData = await query(`
      SELECT vs.venue, MAX(sf.capacity) as max_capacity
      FROM venue_schedule vs
      LEFT JOIN service_facility sf ON vs.venue_id = sf.venue_id
      GROUP BY vs.venue
    `);
    const venueCapacityMap = {};
    baseVenueData.forEach(v => {
      venueCapacityMap[v.venue] = Number(v.max_capacity) || 0;
    });

    // 1. Get all service requests - Filter by request dates (event dates)
    const requests = await query(`
      SELECT *
      FROM (
          SELECT DISTINCT ON (sr.id) 
              sr.id,
              sr.paid,
              sr.org_name,
              sr.venue,
              sr.category,
              sr.status,
              sr.exp_attendees,
              sr.created_at,
              sr.updated_at,
              sr.area_sqm as request_area_sqm,
              sr.amount,
              COALESCE(d.dates, ARRAY[]::date[]) AS dates,
              sf.price AS price,
              sf.price_half_day,
              sf.price_full_day,
              sf.currency,
              sf.duration,
              sf.capacity,
              sf.price_per_sqm
          FROM service_requests sr
          JOIN (
              SELECT request_id, ARRAY_AGG(date ORDER BY date) AS dates
              FROM request_dates
              GROUP BY request_id
          ) d ON sr.id = d.request_id
          LEFT JOIN venue_schedule vs ON sr.venue = vs.venue
          LEFT JOIN service_facility sf ON sf.venue_id = vs.venue_id AND sf.category_id = (SELECT id FROM service_category WHERE category = sr.category LIMIT 1)
          WHERE sr.status != 'draft'
          ${startDate && endDate ? `AND EXISTS (
              SELECT 1 FROM request_dates rd 
              WHERE rd.request_id = sr.id 
              AND rd.date >= '${startDate}' AND rd.date <= '${endDate}'
          )` : ''}
          ORDER BY sr.id, sr.updated_at DESC
      ) t
      ORDER BY t.updated_at DESC;
    `);

    // 2. Prepare date and timeslot lookup
    const requestIds = requests.map(r => r.id);

    const datesRows = requestIds.length
      ? await query(`
          SELECT rd.* 
          FROM request_dates rd 
          WHERE rd.request_id = ANY($1::int[])
        `, [requestIds])
      : [];

    const datesByRequest = {};
    datesRows.forEach(dr => {
      if (!datesByRequest[dr.request_id]) datesByRequest[dr.request_id] = [];
      datesByRequest[dr.request_id].push(dr);
    });

    // Timeslots lookup
    const getTimeSlotId = (dr) => dr.time_slot_id ?? dr.timeslot_id ?? dr.timeslot ?? dr.slot_id ?? dr.unavailable_time_slot_id ?? dr.unavailable_slot_id ?? null;
    const timeslotIds = Array.from(new Set(datesRows.map(getTimeSlotId).filter(Boolean)));

    const timeslotRows = timeslotIds.length
      ? await query(`SELECT id, start_time, end_time FROM unavailable_time_slots WHERE id = ANY($1::int[])`, [timeslotIds])
      : [];

    const timeslotById = {};
    timeslotRows.forEach(ts => (timeslotById[ts.id] = ts));

    const computeHours = (start, end) => {
      if (!start || !end) return 0;
      try {
        const s = new Date(`1970-01-01T${start}`);
        const e = new Date(`1970-01-01T${end}`);
        const diff = (e - s) / 3600000;
        return diff > 0 ? diff : 0;
      } catch (err) { return 0; }
    };

    // 3. Compute per-request totals and metrics
    let totalRevenue = 0;

    // Performance Analysis Data Containers
    const venueMetrics = {};

    // Helper to initialize venue metric
    const initVenueMetric = (venueName) => {
      if (!venueMetrics[venueName]) {
        venueMetrics[venueName] = {
          venue: venueName,
          capacity: venueCapacityMap[venueName] || 0,
          totalSoldHours: 0,
          totalSoldCapacity: 0,
        };
      }
    };

    // Calculate the report span for capacity/hours metrics
    let startD, endD;
    if (startDate && endDate) {
      startD = new Date(startDate);
      endD = new Date(endDate);
    } else {
      // If no filter is applied, we calculate metrics based on the actual span of dates present in the data
      // This ensures that "All Time" metrics reflect the actual operational period seen in the system.
      const allDates = datesRows.map(dr => new Date(dr.date).getTime());
      if (allDates.length > 0) {
        startD = new Date(Math.min(...allDates));
        endD = new Date(Math.max(...allDates));
      } else {
        // Fallback to 30 days if there's no data at all
        startD = new Date(new Date().setDate(new Date().getDate() - 30));
        endD = new Date();
      }
    }
    const rangeDurationDays = Math.max(1, Math.round((endD - startD) / (1000 * 60 * 60 * 24)) + 1);

    const cleanedRequests = requests.map(r => {
      const occurrences = Array.isArray(r.dates) && r.dates.length ? r.dates.length : 0;
      let price = Number(r.price || 0);
      const isPlaza = r.category?.toLowerCase() === 'plaza';

      // Initialize venue metric for this request's venue
      initVenueMetric(r.venue);

      const durationType = r.duration;
      let totalPrice = 0;

      // Calculation Logic - Only count dates within the specified dashboard range
      let soldHoursForRequest = 0;
      let soldCapacityForRequest = 0;

      const allDateRows = datesByRequest[r.id] || [];
      const dateRows = allDateRows.filter(dr => {
        if (!startDate || !endDate) return true;
        const d = new Date(dr.date);
        const s = new Date(startDate);
        const e = new Date(endDate);
        return d >= s && d <= e;
      });

      if (r.paid) {
        if (isPlaza) {
          // For Plaza: Price is per sqm. Total Price = Sum(Area * Price_Per_Sqm)
          let totalAreaBasedPrice = 0;
          let totalPlazaDays = 0;

          dateRows.forEach(dr => {
            const area = Number(dr.area_sqm) || Number(r.request_area_sqm) || 0;
            totalAreaBasedPrice += (area * (Number(r.price_per_sqm) || 0));
            soldHoursForRequest += 12;
            totalPlazaDays++;
          });

          // Price calculation (pro-rated based on dateRows)
          totalPrice = totalAreaBasedPrice;

          // Capacity for Plaza: Attendees * Days within range
          soldCapacityForRequest += (Number(r.exp_attendees) || 0) * (totalPlazaDays || 0);

        } else {
          // Standard Venues
          let totalDays = 0;
          dateRows.forEach(dr => {
            const hours = dr.is_half_day ? 6 : 12;
            soldHoursForRequest += hours;
            totalDays++;
          });

          // Use the per-unit price * number of dates within range
          totalPrice = price * totalDays;

          // Capacity usage: Attendees * Days within range
          soldCapacityForRequest += (Number(r.exp_attendees) || 0) * totalDays;
        }

        // Pro-rate the actual 'amount' from DB if it exists and request spans multiple dates
        if (r.paid && r.amount && allDateRows.length > 0) {
          const fullAmount = Number(r.amount);
          // Pro-rate based on days count
          totalPrice = (fullAmount / allDateRows.length) * dateRows.length;
        }

        // Add to venue metrics
        venueMetrics[r.venue].totalSoldHours += soldHoursForRequest;
        venueMetrics[r.venue].totalSoldCapacity += soldCapacityForRequest;

      } else {
        totalPrice = 0;
      }

      totalRevenue += totalPrice;

      // Prepare detailed dates information for frontend
      // We send all dates metadata so the modal can show them, but highlights those in range
      const datesDetails = allDateRows.map(dr => ({
        date: dr.date,
        area_sqm: dr.area_sqm || null,
        is_half_day: dr.is_half_day || false,
        is_full_day: !dr.is_half_day,
        hours: isPlaza ? 12 : (dr.is_half_day ? 6 : 12),
        isInRange: !startDate || !endDate || (new Date(dr.date) >= new Date(startDate) && new Date(dr.date) <= new Date(endDate))
      }));

      // In the grid, show the full amount if available, otherwise calculated pro-rated?
      // Actually, for consistency in the grid's "Total Amount" column, we usually show the whole request price.
      // But for report calculations, we use the pro-rated 'totalPrice'.
      const displayTotalPrice = (r.paid && r.amount) ? Number(r.amount) : 0;

      return {
        id: r.id,
        title: r.org_name,
        venue: r.venue,
        category: r.category,
        status: r.status,
        attendees: r.exp_attendees,
        dates: Array.isArray(r.dates) ? r.dates : [],
        datesDetails: datesDetails,
        date: Array.isArray(r.dates) && r.dates.length ? r.dates[0] : null,
        price: r.price,
        price_half_day: r.price_half_day,
        price_full_day: r.price_full_day,
        price_per_sqm: r.price_per_sqm,
        area_sqm: r.request_area_sqm,
        updated_at: r.updated_at,
        durationType: durationType,
        occurrences: occurrences,
        totalPrice: displayTotalPrice, // Show full request price in the grid
        reportedTotalPrice: displayTotalPrice, // Pro-rated price for summary stats/reporting
        organization: r.org_name,
        paid: r.paid,
        amount: r.amount
      };
    });

    const totalRequests = requests.length;
    const avgRevenuePerRequest = totalRequests > 0 ? totalRevenue / totalRequests : 0;
    const approvedCount = requests.filter(r => r.status === 'approved').length;
    const approvalRate = totalRequests > 0 ? (approvedCount / totalRequests) * 100 : 0;

    // 4. Monthly trends
    const monthlyMap = {};
    cleanedRequests.forEach(r => {
      const dates = r.dates || [];
      if (!Array.isArray(dates) || dates.length === 0) return;
      const perOccurrence = r.occurrences && r.occurrences > 0 ? r.totalPrice / r.occurrences : r.totalPrice;
      dates.forEach(d => {
        if (!d) return;
        const month = new Date(d).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyMap[month]) monthlyMap[month] = { month, revenue: 0, requests: 0 };
        monthlyMap[month].revenue += perOccurrence;
        monthlyMap[month].requests += 1;
      });
    });
    const monthlyTrends = Object.values(monthlyMap);

    // 5. Venue popularity
    const venueMap = {};
    cleanedRequests.forEach(r => {
      const venue = r.venue;
      if (!venue) return;
      if (!venueMap[venue]) venueMap[venue] = { name: venue, bookings: 0, revenue: 0 };
      venueMap[venue].bookings += 1;
      venueMap[venue].revenue += Number(r.totalPrice || 0);
    });
    const venuePopularity = Object.values(venueMap).sort((a, b) => b.bookings - a.bookings);

    // 6. Status distribution
    const statusCounts = { approved: 0, pending: 0, rejected: 0 };
    requests.forEach(r => {
      if (statusCounts.hasOwnProperty(r.status)) statusCounts[r.status] += 1;
    });
    const totalStatus = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const statusDistribution = [
      { name: 'approved', value: totalStatus ? Math.round((statusCounts.approved / totalStatus) * 100) : 0, color: '#059669' },
      { name: 'pending', value: totalStatus ? Math.round((statusCounts.pending / totalStatus) * 100) : 0, color: '#fbbf24' },
      { name: 'rejected', value: totalStatus ? Math.round((statusCounts.rejected / totalStatus) * 100) : 0, color: '#ef4444' },
    ];

    // 7. Category performance
    const categoryMap = {};
    cleanedRequests.forEach(r => {
      const cat = r.category;
      if (!cat) return;
      if (!categoryMap[cat]) categoryMap[cat] = { category: cat, bookings: 0, revenue: 0 };
      categoryMap[cat].bookings += 1;
      categoryMap[cat].revenue += Number(r.totalPrice || 0);
    });
    const categoryPerformance = Object.values(categoryMap).sort((a, b) => b.bookings - a.bookings);

    // 8. Recent activity
    const recentActivity = requests
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 4)
      .map(r => ({
        id: r.id,
        type: r.status === 'approved' ? 'approval' : r.status === 'pending' ? 'booking' : 'cancellation',
        organization: r.org_name,
        venue: r.venue,
        date: Array.isArray(r.dates) && r.dates.length ? r.dates[0] : null,
        dates: Array.isArray(r.dates) ? r.dates : [],
        status: r.status === 'rejected' ? 'cancelled' : r.status,
      }));

    // 9. Performance Analysis Calculation
    const performanceAnalysis = Object.values(venueMetrics).map(vm => {
      const totalAvailableHours = rangeDurationDays * 12; // 12 hours per day per venue
      const sellHourPercentage = totalAvailableHours > 0 ? (vm.totalSoldHours / totalAvailableHours) * 100 : 0;

      const totalCapacityAvailable = (vm.capacity || 0) * rangeDurationDays;
      const soldCapacityPercentage = totalCapacityAvailable > 0 ? (vm.totalSoldCapacity / totalCapacityAvailable) * 100 : 0;

      let rating = 'Poor';
      if (soldCapacityPercentage >= 85) rating = 'Excellent';
      else if (soldCapacityPercentage >= 70) rating = 'Good';
      else if (soldCapacityPercentage >= 40) rating = 'Satisfactory';

      return {
        venue: vm.venue,
        totalSoldHours: vm.totalSoldHours,
        totalAvailableHours: totalAvailableHours,
        sellHourPercentage: Number(sellHourPercentage.toFixed(1)),

        totalSoldCapacity: vm.totalSoldCapacity,
        totalCapacityAvailable: totalCapacityAvailable,
        soldCapacityPercentage: Number(soldCapacityPercentage.toFixed(1)),
        rating
      };
    });

    // Compute averages
    const avgSellHourPercentage = performanceAnalysis.length > 0
      ? performanceAnalysis.reduce((acc, curr) => acc + curr.sellHourPercentage, 0) / performanceAnalysis.length
      : 0;

    const avgCapacityPercentage = performanceAnalysis.length > 0
      ? performanceAnalysis.reduce((acc, curr) => acc + curr.soldCapacityPercentage, 0) / performanceAnalysis.length
      : 0;

    res.json({
      summaryStats: {
        totalRevenue,
        totalRequests,
        avgRevenuePerRequest,
        approvalRate,
      },
      monthlyTrends,
      venuePopularity,
      statusDistribution,
      categoryPerformance,
      recentActivity,
      requests: cleanedRequests,
      performanceAnalysis: {
        venues: performanceAnalysis,
        avgSellHourPercentage: Number(avgSellHourPercentage.toFixed(1)),
        avgCapacityPercentage: Number(avgCapacityPercentage.toFixed(1))
      }
    });
  } catch (err) {
    console.error('ServiceReportDashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch service report dashboard data.' });
  }
};

export { getServiceReportDashboard };
