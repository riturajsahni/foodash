const express = require('express');
const router  = express.Router();
const {
  updateProfile, uploadAvatar,
  getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress,
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.put  ('/update',                    updateProfile);
router.post ('/avatar',                    ...uploadAvatar);
router.get  ('/addresses',                 getAddresses);
router.post ('/addresses',                 addAddress);
router.put  ('/addresses/:addressId',      updateAddress);
router.delete('/addresses/:addressId',     deleteAddress);
router.put  ('/addresses/:addressId/default', setDefaultAddress);

module.exports = router;