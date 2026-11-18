//src/models/schemas/schedule.js.
import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      trim: true,
    },
    tripId: {
      type: String,
      required: true,
      trim: true,
    },
    departureTime: {
      type: String,
      required: false,
      trim: true,
    },
    arrivalTime: {
      type: String,
      required: true,
      trim: true,
    },
    daysOfWeek: {
      type: [String],
      required: true,
      enum: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday",],
    },
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const schedule = mongoose.model("Schedule", scheduleSchema);

export default schedule;