const express = require('express');
const {
  createDonation,
  getMyDonations,
  getNearbyDonations,
  getDonation,
  acceptDonation,
  updateDonationStatus,
  getMyPickups,
  cancelDonation,
  getAllDonations,
  getStats,
} = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Stats (Admin)
router.get('/stats', authorize('admin'), getStats);

// Donor routes
router.post('/', authorize('donor', 'admin'), createDonation);
router.get('/my', authorize('donor', 'admin'), getMyDonations);

// Volunteer routes
router.get('/nearby', authorize('volunteer', 'admin'), getNearbyDonations);
router.get('/my-pickups', authorize('volunteer', 'admin'), getMyPickups);
router.put('/:id/accept', authorize('volunteer', 'admin'), acceptDonation);
router.put('/:id/status', authorize('volunteer', 'admin'), updateDonationStatus);

// Shared
router.get('/:id', getDonation);
router.put('/:id/cancel', cancelDonation);

// Admin
router.get('/', authorize('admin'), getAllDonations);

module.exports = router;
