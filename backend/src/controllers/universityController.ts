import { Response } from 'express';
import { validationResult } from 'express-validator';
import University from '../models/University';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getUniversities = async (req: AuthRequest, res: Response) => {
  try {
    const universities = await University.find().sort({ name: 1 });
    res.json(universities);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching universities' });
  }
};

export const createUniversity = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super admin can create universities' });
    }

    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const universityCode = code.toUpperCase();

    const existingUniversity = await University.findOne({
      $or: [
        { name: name },
        { code: universityCode }
      ]
    });

    if (existingUniversity) {
      return res.status(400).json({
        error: existingUniversity.name === name
          ? 'University with this name already exists'
          : 'University code already exists'
      });
    }

    const university = new University({
      name,
      code: universityCode
    });

    await university.save();

    res.status(201).json({
      message: 'University created successfully',
      university
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creating university' });
  }
};

export const deleteUniversity = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super admin can delete universities' });
    }

    const { id } = req.params;

    const university = await University.findById(id);
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }

    // Check if there are any users in this university
    const userCount = await User.countDocuments({ universityCode: university.code });
    if (userCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete university with existing users. Please remove all users first.'
      });
    }

    await university.deleteOne();

    res.json({ message: 'University deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting university' });
  }
};

/**
 * Returns the authenticated admin's OWN university.
 * The university is resolved from the JWT's universityCode — never from a
 * client-supplied id — so an admin can only ever read their own institution.
 */
export const getMyUniversity = async (req: AuthRequest, res: Response) => {
  try {
    const code = req.user?.universityCode;
    if (!code || code === 'SUPER') {
      return res.status(404).json({ error: 'No university is associated with this account' });
    }

    const university = await University.findOne({ code });
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }

    res.json(university);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching university' });
  }
};

/**
 * Updates the authenticated admin's OWN university details.
 * Security:
 *  - admin role only (super-admin has no own university; super-admin manages
 *    universities via the create/delete endpoints instead);
 *  - the target university is resolved from the JWT's universityCode, so there
 *    is no client-supplied id to tamper with (prevents IDOR);
 *  - a strict field whitelist (name / description / website) — `code` is
 *    immutable because it links users, challenges and competitions;
 *  - inputs are validated (express-validator) and re-checked by type here, so a
 *    crafted object value (e.g. a Mongo operator) can never reach the document.
 */
export const updateMyUniversity = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only a university admin can edit their university' });
    }

    const code = req.user?.universityCode;
    if (!code || code === 'SUPER') {
      return res.status(404).json({ error: 'No university is associated with this account' });
    }

    const university = await University.findOne({ code });
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }

    const { name, description, website } = req.body as {
      name?: unknown;
      description?: unknown;
      website?: unknown;
    };

    if (typeof name === 'string') {
      const trimmed = name.trim();
      if (trimmed && trimmed !== university.name) {
        const clash = await University.findOne({ name: trimmed, _id: { $ne: university._id } });
        if (clash) {
          return res.status(409).json({ error: 'A university with this name already exists' });
        }
        university.name = trimmed;
      }
    }
    if (typeof description === 'string') {
      university.description = description.trim();
    }
    if (typeof website === 'string') {
      university.website = website.trim();
    }

    await university.save();

    res.json({ message: 'University updated successfully', university });
  } catch (error) {
    res.status(500).json({ error: 'Error updating university' });
  }
};
