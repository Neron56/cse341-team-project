import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['customer', 'admin'],
    required: true,
    unique: true
  }
});

export default mongoose.models.Role || mongoose.model('Role', roleSchema);
