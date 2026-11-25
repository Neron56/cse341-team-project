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

export async function getBookingsPage({ page, limit, sort }) {
  const direction = sort === 'asc' ? 1 : -1;
  const [bookings, totalItems] = await Promise.all([
    Booking.find({}).sort({ createdAt: direction, _id: direction })
      .skip((page - 1) * limit).limit(limit).lean(),
    Booking.countDocuments({})
  ]);
  return { bookings, totalItems };
}

export async function getBookingById(id) {
  return Booking.findOne({ id }).lean();
}
