//src/controllers/schedules.js
import { findSchedulesByTripId } from "../models/schedules.js";

export async function getSchedulesByTripId(req, res) {
  try {
    const { tripId } = req.params;
    const { month } = req.query;
    const schedule = await findSchedulesByTripId(tripId, month);
    
    if (!schedule || schedule.length === 0) {
      return res.status(404).json({
        error: "schedule not found",
      });
    }

    return res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error);

    return res.status(500).json({
      error: "Failed to fetch schedule",
    });
  }
}

export async function getSchedulesByTripAndMonth(req, res) {
  try {
    const { tripId } = req.params;
    const { month } = req.query;

    const schedule = await findSchedulesByTripAndMonth(tripId, month);

    if (!schedule) {
      return res.status(404).json({
        error: "schedule not found",
      });
    }

    return res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error);

    return res.status(500).json({
      error: "Failed to fetch schedule",
    });
  }
}