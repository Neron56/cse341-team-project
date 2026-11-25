export class BookingQueryError extends Error {}

const positiveInteger = (value, name, fallback, maximum = Number.MAX_SAFE_INTEGER) => {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)
    || !Number.isSafeInteger(Number(value)) || Number(value) > maximum) {
    throw new BookingQueryError(`${name} must be a positive integer${name === 'limit' ? ' from 1 to 100' : ''}.`);
  }
  return Number(value);
};

export function parseBookingQuery(query) {
  const allowed = ['page', 'limit', 'sort'];
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
  return { page, limit, sort };
}
