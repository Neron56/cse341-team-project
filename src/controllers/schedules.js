//src/controllers/schedules.js
import { findSchedulesByTripId } from "../models/schedules.js";

export async function getSchedulesByTripId(req, res) {
  try {
    const { tripId } = req.params;
    const schedule = await findSchedulesByTripId(tripId);
    
    if (!schedule || schedule.length === 0) {
      schedule = [];
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
    const month = Number(req.query.month);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'month must be a number from 1 to 12' });
    }
    let schedule = await findSchedulesByTripId(tripId, month);
    
    if (!schedule || schedule.length === 0) {
      schedule = [];
    }

    return res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error);

    return res.status(500).json({
      error: "Failed to fetch schedule",
    });
  }
}