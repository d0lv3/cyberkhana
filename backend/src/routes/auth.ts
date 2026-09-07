import express from 'express';
import {
  register,
  login,
  loginAdmin,
  loginSuperAdmin,
  logout,
  registerValidation,
  loginValidation,
  changeSuperAdminPassword,
  changeSuperAdminPasswordValidation,
  acceptTerms,
  acceptAmbassadorAgreement
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/login-admin', loginValidation, loginAdmin);
router.post('/login-super-admin', loginValidation, loginSuperAdmin);
router.post('/logout', logout);
// Deliberately NOT behind requireTermsAccepted — it is the way out of that gate.
router.post('/accept-terms', authenticate, acceptTerms);
// Not behind requireAdmin: that middleware is what this unlocks.
router.post('/accept-ambassador-agreement', authenticate, acceptAmbassadorAgreement);
router.patch(
  '/super-admin/password',
  authenticate,
  changeSuperAdminPasswordValidation,
  changeSuperAdminPassword
);

export default router;
