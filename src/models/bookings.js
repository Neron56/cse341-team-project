import { randomBytes } from 'node:crypto';
import Booking from './schemas/bookings.js';

export async function createBooking({ scheduleId, tripId, ticketClass, selectedDay, passengers }) {
  const booking = await Booking.create({
    id: `JR${randomBytes(8).toString('hex').toUpperCase()}`,
    scheduleId,
    tripId,
    ticketClass,
    selectedDay,
    passengers: Array.isArray(passengers)
      ? passengers.map((passenger) => ({
          firstName: passenger?.firstName,
          lastName: passenger?.lastName,
          email: passenger?.email,
          phone: passenger?.phone
        }))
      : []
  });
  return booking.toObject();
}

export async function getAllBookings() {
  return Booking.find({}).sort({ createdAt: -1, _id: -1 }).lean();
}

export async function getBookingsPage({ page, limit, sort, filters = {} }) {
  const direction = sort === 'asc' ? 1 : -1;
  const query = {};
  if (filters.ticketClass) query.ticketClass = filters.ticketClass;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(`${filters.startDate}T00:00:00.000Z`);
    if (filters.endDate) {
      const nextMidnight = new Date(`${filters.endDate}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000;
      query.createdAt.$lt = new Date(nextMidnight);
    }
  }
  const [bookings, totalItems] = await Promise.all([
    Booking.find(query).sort({ createdAt: direction, _id: direction })
      .skip((page - 1) * limit).limit(limit).lean(),
    Booking.countDocuments(query)
  ]);
  return { bookings, totalItems };
}

export async function getBookingById(id) {
  return Booking.findOne({ id }).lean();
}
