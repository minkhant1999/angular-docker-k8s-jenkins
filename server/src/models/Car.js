const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1990, max: new Date().getFullYear() + 1 },
    pricePerDay: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true },
    carType: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

carSchema.index({ location: 'text', name: 'text', model: 'text', carType: 'text' });

module.exports = mongoose.model('Car', carSchema);
