import express from 'express';
import { body } from 'express-validator';
import {
  getUniversities,
  createUniversity,
  deleteUniversity,
  getMyUniversity,
  updateMyUniversity,
} from '../controllers/universityController';
import { authenticate, authenticateSuperAdmin, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Partial-update validators for an admin editing their own university.
// `code` is intentionally not accepted here — it is immutable.
const updateMyUniversityValidators = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('Name must be 1-120 characters'),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be 1000 characters or fewer'),
  body('website')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Website URL is too long')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Website must be a valid http(s) URL'),
];

router.get('/', authenticate, getUniversities);

// An admin's own university (resolved from the token, not a client id).
router.get('/mine', authenticate, requireAdmin, getMyUniversity);
router.patch('/mine', authenticate, requireAdmin, updateMyUniversityValidators, updateMyUniversity);

router.post('/', authenticate, authenticateSuperAdmin, createUniversity);
router.delete('/:id', authenticate, authenticateSuperAdmin, deleteUniversity);

export default router;
