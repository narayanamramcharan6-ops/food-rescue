const express = require('express');
const {
  getUsers,
  updateUser,
  deleteUser,
  createAdmin,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route to create first admin (protect this in production!)
router.post('/create-admin', createAdmin);

// Protected admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
