import express from 'express';
import {
  register,
  login,
  loginAdmin,
  loginSuperAdmin,
  registerValidation,
  loginValidation,
  changeSuperAdminPassword,
  changeSuperAdminPasswordValidation
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/login-admin', loginValidation, loginAdmin);
router.post('/login-super-admin', loginValidation, loginSuperAdmin);
router.patch(
  '/super-admin/password',
  authenticate,
  changeSuperAdminPasswordValidation,
  changeSuperAdminPassword
);

export default router;
