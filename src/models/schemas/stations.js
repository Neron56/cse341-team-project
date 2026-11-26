
import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        prefecture: {
            type: String,
            required: true,
            trim: true,
        },
        region: {
            type: String,
            required: true,
            trim: true,
        },
        facilities: {
            type: [{ type: String, trim: true }],
            default: [],
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        collection: 'stations',
        autoCreate: false,
        autoIndex: false,
    }
);

const station = mongoose.model('Station', stationSchema);

export default station;
