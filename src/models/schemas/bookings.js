import mongoose from 'mongoose';

const passengerSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: { type: String, required: true, trim: true }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true },
  scheduleId: {
    type: Number,
    required: true,
    min: 1,
    validate: Number.isSafeInteger
  },
  tripId: { type: String, required: true, trim: true },
  ticketClass: { type: String, required: true, trim: true },
  selectedDay: {
    type: String,
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  passengers: {
    type: [passengerSchema],
    required: true,
    validate: {
      validator: (passengers) => passengers.length >= 1 && passengers.length <= 8,
      message: 'A booking must include between 1 and 8 passengers.'
    }
  }
}, {
  collection: 'bookings',
  timestamps: true,
  // Index creation is explicit so connecting cannot interfere with migration.
  autoCreate: false,
  autoIndex: false
});

export default mongoose.model('Booking', bookingSchema);
