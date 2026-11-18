//src/models/schemas/trips.js.
import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  region: { type: String },
  startStation: { type: String },
  endStation: { type: String },
  duration: { type: String },
  distance: { type: Number },
  highlights: { type: [String], default: [] },
  bestSeason: { type: String },
  operatingMonths: { type: [Number], default: [] },
  imageUrl: { type: String }
});

export default mongoose.model('Trip', tripSchema, 'trips');