const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    foodType: {
      type: String,
      required: [true, 'Food type is required'],
      trim: true,
    },
    quantity: {
      type: String,
      required: [true, 'Quantity is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    images: [
      {
        type: String,
      },
    ],
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: [true, 'Pickup address is required'],
      },
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    availableUntil: {
      type: Date,
      required: [true, 'Available until time is required'],
    },
    expiryTime: {
      type: Date,
      required: [true, 'Expiry time is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'picked', 'delivered', 'expired', 'cancelled'],
      default: 'pending',
    },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    qrCode: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
    },
    acceptedAt: Date,
    pickedAt: Date,
    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

// Geo index for nearby donations
donationSchema.index({ pickupLocation: '2dsphere' });
donationSchema.index({ status: 1, expiryTime: 1 });
donationSchema.index({ donor: 1 });
donationSchema.index({ assignedVolunteer: 1 });

module.exports = mongoose.model('Donation', donationSchema);
