
import {
    findSchedulesByTripId,
} from '../models/schedules.js';

export async function getSchedulesByTripId(req, res) {
    try {
        const schedules = await findSchedulesByTripId(req.params.tripId);

        return res.status(200).json(schedules || []);
    } catch (error) {
        console.error('Failed to fetch schedules:', error);
        return res.status(500).json({
            error: 'Failed to fetch schedules',
        });
    }
}

export async function getSchedulesByTripAndMonth(req, res) {
    try {
        const { tripId } = req.params;
        const { month } = req.query;

        const monthNumber = Number(month);

        if (
            !Number.isInteger(monthNumber) ||
            monthNumber < 1 ||
            monthNumber > 12
        ) {
            return res.status(400).json({
                error: 'Month must be a number between 1 and 12',
            });
        }

        const schedules = await findSchedulesByTripId(
            tripId,
            monthNumber
        );

        return res.status(200).json(schedules || []);
    } catch (error) {
        console.error('Failed to fetch schedules by month:', error);
        return res.status(500).json({
            error: 'Failed to fetch schedules',
        });
    }
}
