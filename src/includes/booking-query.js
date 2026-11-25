export class BookingQueryError extends Error {}

const calendarDate = (value, name) => {
  if (value === undefined) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BookingQueryError(`${name} must be a valid date in YYYY-MM-DD format.`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new BookingQueryError(`${name} must be a valid calendar date.`);
  }
  return value;
};

const positiveInteger = (value, name, fallback, maximum = Number.MAX_SAFE_INTEGER) => {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)
    || !Number.isSafeInteger(Number(value)) || Number(value) > maximum) {
    throw new BookingQueryError(`${name} must be a positive integer${name === 'limit' ? ' from 1 to 100' : ''}.`);
  }
  return Number(value);
};

export function parseBookingQuery(query) {
  const allowed = ['page', 'limit', 'sort', 'ticketClass', 'startDate', 'endDate'];
  if (Object.keys(query).some((key) => !allowed.includes(key))) {
    throw new BookingQueryError('Unsupported booking query parameter.');
  }
  const page = positiveInteger(query.page, 'page', 1);
  const limit = positiveInteger(query.limit, 'limit', 10, 100);
  const sort = query.sort === undefined ? 'desc' : query.sort;
  if (sort !== 'asc' && sort !== 'desc') {
    throw new BookingQueryError('sort must be asc or desc.');
  }
  if (!Number.isSafeInteger((page - 1) * limit)) {
    throw new BookingQueryError('The requested page offset is too large.');
  }
  const ticketClass = query.ticketClass === undefined ? null : query.ticketClass;
  if (ticketClass !== null && !['standard', 'premium', 'first'].includes(ticketClass)) {
    throw new BookingQueryError('ticketClass must be standard, premium, or first.');
  }
  const startDate = calendarDate(query.startDate, 'startDate');
  const endDate = calendarDate(query.endDate, 'endDate');
  if (startDate && endDate && startDate > endDate) {
    throw new BookingQueryError('startDate must not be after endDate.');
  }
  return { page, limit, sort, filters: { ticketClass, startDate, endDate } };
}
