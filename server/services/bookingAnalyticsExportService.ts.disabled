import { getDb } from "../db";
import { bookings, users } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface BookingRecord {
  id: number;
  artistName: string;
  venueName: string;
  eventDate: Date;
  eventTime: string | null;
  status: string;
  amount: number;
  eventDetails: string | null;
}

export interface AnalyticsData {
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  bookings: BookingRecord[];
}

/**
 * Get booking analytics for export
 */
export async function getBookingAnalytics(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsData> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // Get all bookings for the user (as artist)
  const bookingData = await database
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.artistId, userId),
        gte(bookings.eventDate, startDate),
        lte(bookings.eventDate, endDate)
      )
    );

  // Enrich with venue names
  const enrichedBookings: BookingRecord[] = [];
  let totalRevenue = 0;

  for (const booking of bookingData) {
    const venueData = await database
      .select()
      .from(users)
      .where(eq(users.id, booking.venueId));

    const venue = venueData[0];
    const artistData = await database
      .select()
      .from(users)
      .where(eq(users.id, booking.artistId));

    const artist = artistData[0];

    const record: BookingRecord = {
      id: booking.id,
      artistName: artist?.name || "Unknown Artist",
      venueName: venue?.name || "Unknown Venue",
      eventDate: booking.eventDate,
      eventTime: booking.eventTime,
      status: booking.status,
      amount: booking.totalAmount || 0,
      eventDetails: booking.eventDetails,
    };

    enrichedBookings.push(record);

    if (booking.status === "completed" || booking.status === "confirmed") {
      totalRevenue += booking.totalAmount || 0;
    }
  }

  const confirmedCount = bookingData.filter(
    (b) => b.status === "confirmed"
  ).length;
  const completedCount = bookingData.filter(
    (b) => b.status === "completed"
  ).length;
  const averageValue =
    enrichedBookings.length > 0 ? totalRevenue / enrichedBookings.length : 0;

  return {
    totalBookings: bookingData.length,
    confirmedBookings: confirmedCount,
    completedBookings: completedCount,
    totalRevenue,
    averageBookingValue: averageValue,
    bookings: enrichedBookings,
  };
}

/**
 * Generate CSV export
 */
export function generateCSV(analytics: AnalyticsData): string {
  const headers = [
    "Booking ID",
    "Venue Name",
    "Event Date",
    "Event Time",
    "Status",
    "Amount",
    "Details",
  ];

  const rows = analytics.bookings.map((booking) => [
    booking.id,
    booking.venueName,
    new Date(booking.eventDate).toLocaleDateString(),
    booking.eventTime || "",
    booking.status,
    `$${booking.amount.toFixed(2)}`,
    booking.eventDetails || "",
  ]);

  // Add summary rows
  rows.push([]);
  rows.push(["Summary"]);
  rows.push(["Total Bookings", analytics.totalBookings.toString()]);
  rows.push(["Confirmed Bookings", analytics.confirmedBookings.toString()]);
  rows.push(["Completed Bookings", analytics.completedBookings.toString()]);
  rows.push(["Total Revenue", `$${analytics.totalRevenue.toFixed(2)}`]);
  rows.push([
    "Average Booking Value",
    `$${analytics.averageBookingValue.toFixed(2)}`,
  ]);

  // Convert to CSV format
  const csvContent = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}

/**
 * Generate PDF export (returns HTML that can be converted to PDF)
 */
export function generatePDFHTML(analytics: AnalyticsData): string {
  const bookingRows = analytics.bookings
    .map(
      (booking) => `
    <tr>
      <td>${booking.id}</td>
      <td>${booking.venueName}</td>
      <td>${new Date(booking.eventDate).toLocaleDateString()}</td>
      <td>${booking.eventTime || "-"}</td>
      <td><span style="padding: 4px 8px; border-radius: 4px; background-color: ${
        booking.status === "completed"
          ? "#d1fae5"
          : booking.status === "confirmed"
          ? "#dbeafe"
          : "#fef3c7"
      }; color: ${
        booking.status === "completed"
          ? "#065f46"
          : booking.status === "confirmed"
          ? "#0c4a6e"
          : "#92400e"
      };">${booking.status.toUpperCase()}</span></td>
      <td>$${booking.amount.toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #7c3aed; }
        .summary { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .summary-item { display: flex; justify-content: space-between; padding: 8px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #7c3aed; color: white; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        tr:hover { background-color: #f9fafb; }
      </style>
    </head>
    <body>
      <h1>Booking Analytics Report</h1>
      <p>Generated on: ${new Date().toLocaleDateString()}</p>
      
      <div class="summary">
        <h2>Summary</h2>
        <div class="summary-item">
          <span>Total Bookings:</span>
          <strong>${analytics.totalBookings}</strong>
        </div>
        <div class="summary-item">
          <span>Confirmed Bookings:</span>
          <strong>${analytics.confirmedBookings}</strong>
        </div>
        <div class="summary-item">
          <span>Completed Bookings:</span>
          <strong>${analytics.completedBookings}</strong>
        </div>
        <div class="summary-item">
          <span>Total Revenue:</span>
          <strong style="color: #059669;">$${analytics.totalRevenue.toFixed(2)}</strong>
        </div>
        <div class="summary-item">
          <span>Average Booking Value:</span>
          <strong>$${analytics.averageBookingValue.toFixed(2)}</strong>
        </div>
      </div>
      
      <h2>Booking Details</h2>
      <table>
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Venue</th>
            <th>Event Date</th>
            <th>Event Time</th>
            <th>Status</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${bookingRows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}
