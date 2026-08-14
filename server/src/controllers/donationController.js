const QRCode = require('qrcode');
const Donation = require('../models/Donation');
const User = require('../models/User');

// @desc    Create a new donation
// @route   POST /api/donations
// @access  Private (Donor)
exports.createDonation = async (req, res, next) => {
  try {
    const {
      foodType,
      quantity,
      description,
      address,
      longitude,
      latitude,
      availableFrom,
      availableUntil,
      expiryTime,
      notes,
    } = req.body;

    if (!foodType || !quantity || !address || !longitude || !latitude || !availableUntil || !expiryTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: foodType, quantity, address, coordinates, availableUntil, expiryTime',
      });
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      type: 'food-rescue-donation',
      foodType,
      quantity,
      donorId: req.user.id,
    });

    const qrCode = await QRCode.toDataURL(qrData);

    const donation = await Donation.create({
      donor: req.user.id,
      foodType,
      quantity,
      description: description || '',
      pickupLocation: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address,
      },
      availableFrom: availableFrom || Date.now(),
      availableUntil,
      expiryTime,
      notes: notes || '',
      qrCode,
      status: 'pending',
    });

    // Increment donor's total donations
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalDonations: 1 } });

    // Populate donor info
    await donation.populate('donor', 'name email phone');

    // Emit socket event for nearby volunteers (handled in server.js)
    if (req.app.get('io')) {
      req.app.get('io').emit('newDonation', {
        donation: {
          _id: donation._id,
          foodType: donation.foodType,
          quantity: donation.quantity,
          address: donation.pickupLocation.address,
          coordinates: donation.pickupLocation.coordinates,
          availableUntil: donation.availableUntil,
          expiryTime: donation.expiryTime,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all donations of logged-in donor
// @route   GET /api/donations/my
// @access  Private (Donor)
exports.getMyDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({ donor: req.user.id })
      .populate('assignedVolunteer', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby pending donations for volunteers
// @route   GET /api/donations/nearby
// @access  Private (Volunteer)
exports.getNearbyDonations = async (req, res, next) => {
  try {
    const { longitude, latitude, maxDistance = 15000 } = req.query; // maxDistance in meters (default 15km)

    let query = { status: 'pending', expiryTime: { $gt: new Date() } };

    // If coordinates provided, use geo query
    if (longitude && latitude) {
      query.pickupLocation = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      };
    }

    const donations = await Donation.find(query)
      .populate('donor', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single donation by ID
// @route   GET /api/donations/:id
// @access  Private
exports.getDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name phone email address')
      .populate('assignedVolunteer', 'name phone email');

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a donation (Volunteer)
// @route   PUT /api/donations/:id/accept
// @access  Private (Volunteer)
exports.acceptDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Donation is already ${donation.status}`,
      });
    }

    if (new Date(donation.expiryTime) < new Date()) {
      donation.status = 'expired';
      await donation.save();
      return res.status(400).json({ success: false, message: 'Donation has expired' });
    }

    donation.status = 'accepted';
    donation.assignedVolunteer = req.user.id;
    donation.acceptedAt = new Date();
    await donation.save();

    await donation.populate('donor', 'name phone email');
    await donation.populate('assignedVolunteer', 'name phone email');

    // Notify via socket
    if (req.app.get('io')) {
      req.app.get('io').emit('donationAccepted', {
        donationId: donation._id,
        volunteerName: req.user.name,
        status: 'accepted',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Donation accepted successfully',
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update donation status (picked / delivered)
// @route   PUT /api/donations/:id/status
// @access  Private (Volunteer who accepted it)
exports.updateDonationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['picked', 'delivered', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: picked, delivered, cancelled',
      });
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    // Only the assigned volunteer or admin can update
    if (
      donation.assignedVolunteer?.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this donation',
      });
    }

    donation.status = status;

    if (status === 'picked') {
      donation.pickedAt = new Date();
    } else if (status === 'delivered') {
      donation.deliveredAt = new Date();
      // Increment volunteer's total pickups
      await User.findByIdAndUpdate(req.user.id, { $inc: { totalPickups: 1 } });
    }

    await donation.save();
    await donation.populate('donor', 'name phone email');
    await donation.populate('assignedVolunteer', 'name phone email');

    if (req.app.get('io')) {
      req.app.get('io').emit('donationStatusUpdated', {
        donationId: donation._id,
        status,
        volunteerName: req.user.name,
      });
    }

    res.status(200).json({
      success: true,
      message: `Donation marked as ${status}`,
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get volunteer's accepted / active donations
// @route   GET /api/donations/my-pickups
// @access  Private (Volunteer)
exports.getMyPickups = async (req, res, next) => {
  try {
    const donations = await Donation.find({
      assignedVolunteer: req.user.id,
      status: { $in: ['accepted', 'picked', 'delivered'] },
    })
      .populate('donor', 'name phone email address')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a donation (Donor or Admin)
// @route   PUT /api/donations/:id/cancel
// @access  Private
exports.cancelDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    // Only donor who created it or admin can cancel
    if (donation.donor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['delivered', 'expired', 'cancelled'].includes(donation.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a donation that is already ${donation.status}`,
      });
    }

    donation.status = 'cancelled';
    await donation.save();

    res.status(200).json({
      success: true,
      message: 'Donation cancelled successfully',
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all donations (Admin)
// @route   GET /api/donations
// @access  Private (Admin)
exports.getAllDonations = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const donations = await Donation.find(query)
      .populate('donor', 'name email phone')
      .populate('assignedVolunteer', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Donation.countDocuments(query);

    res.status(200).json({
      success: true,
      count: donations.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: donations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/donations/stats
// @access  Private (Admin)
exports.getStats = async (req, res, next) => {
  try {
    const totalDonations = await Donation.countDocuments();
    const pending = await Donation.countDocuments({ status: 'pending' });
    const accepted = await Donation.countDocuments({ status: 'accepted' });
    const delivered = await Donation.countDocuments({ status: 'delivered' });
    const expired = await Donation.countDocuments({ status: 'expired' });
    const cancelled = await Donation.countDocuments({ status: 'cancelled' });

    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });

    // Top donors
    const topDonors = await User.find({ role: 'donor' })
      .sort({ totalDonations: -1 })
      .limit(5)
      .select('name email totalDonations');

    // Top volunteers
    const topVolunteers = await User.find({ role: 'volunteer' })
      .sort({ totalPickups: -1 })
      .limit(5)
      .select('name email totalPickups');

    res.status(200).json({
      success: true,
      data: {
        donations: {
          total: totalDonations,
          pending,
          accepted,
          delivered,
          expired,
          cancelled,
        },
        users: {
          donors: totalDonors,
          volunteers: totalVolunteers,
        },
        topDonors,
        topVolunteers,
      },
    });
  } catch (error) {
    next(error);
  }
};
