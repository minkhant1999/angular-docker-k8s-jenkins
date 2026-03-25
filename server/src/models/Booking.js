const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    destination: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    totalDays: { type: Number, required: true, min: 1 },
    estimatedTotal: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

bookingSchema.index({ carId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
