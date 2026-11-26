
import schedule from './schemas/schedules.js';
import trip from './schemas/trips.js';

export async function findSchedulesByTripId(tripId, month) {
    if (month) {
        const foundTrip = await trip.findOne({ id: tripId }).lean();

        if (
            !foundTrip ||
            !foundTrip.operatingMonths.includes(Number(month))
        ) {
            return [];
        }
    }

    return schedule.find({ tripId }).sort({ id: 1 }).lean();
}
