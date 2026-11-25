import {
  createBooking,
  getBookingsPage,
  getBookingById
} from '../models/bookings.js';
import { getBookingOptions } from '../models/booking-options.js';
import { BookingQueryError, parseBookingQuery } from '../includes/booking-query.js';

export async function getAllBookings(req, res) {
  res.set('Cache-Control', 'no-store');
  try {
    const options = parseBookingQuery(req.query);
    const { bookings, totalItems } = await getBookingsPage(options);
    const totalPages = Math.ceil(totalItems / options.limit);
    return res.status(200).json({
      bookings,
      pagination: {
        page: options.page, limit: options.limit, totalItems, totalPages,
        hasPreviousPage: totalItems > 0 && options.page > 1,
        hasNextPage: options.page < totalPages
      },
      sort: { by: 'createdAt', order: options.sort },
      filters: options.filters
    });
  } catch (error) {
    if (error instanceof BookingQueryError) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

export function bookingsAdminPage(req, res) {
  res.set('Cache-Control', 'no-store');
  return res.render('bookings', { title: 'Bookings Admin' });
}

export async function bookingPage(req, res, next) {
  try {
    const options = await getBookingOptions(req.params.scheduleId);
    if (!options) {
      return next(Object.assign(new Error('Schedule not found'), { status: 404 }));
    }
    return res.render('trips/book', { title: 'Book Trip', ...options });
  } catch (error) {
    return next(error);
  }
}

export async function processBookingRequest(req, res, next) {
  try {
    const { scheduleId, ticketClass, selectedDay, passengers } = req.body || {};
    // Reject objects/arrays before any values are used as query filters.
    if (!['string', 'number'].includes(typeof scheduleId)
      || typeof ticketClass !== 'string' || typeof selectedDay !== 'string'
      || !Array.isArray(passengers)) {
      return res.status(400).json({ error: 'Invalid booking details' });
    }

    const options = await getBookingOptions(scheduleId);
    if (!options) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    if (!options.schedule.daysOfWeek.includes(selectedDay)
      || !options.ticketOptions.some((ticket) => ticket.class === ticketClass)) {
      return res.status(400).json({ error: 'Invalid ticket class or travel day' });
    }

    const booking = await createBooking({
      scheduleId: options.schedule.id,
      tripId: options.schedule.tripId,
      ticketClass,
      selectedDay,
      passengers
    });
    return res.redirect(`/trips/confirmation/${booking.id}`);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid passenger or booking details' });
    }
    return next(error);
  }
}

export async function bookingConfirmationPage(req, res, next) {
  try {
    const booking = await getBookingById(req.params.bookingId);
    if (!booking) {
      return next(Object.assign(new Error('Booking not found'), { status: 404 }));
    }
    return res.render('trips/confirm', { title: 'Trip Confirmation', booking });
  } catch (error) {
    return next(error);
  }
}
