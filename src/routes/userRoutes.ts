import { Router } from 'express'
import passport from 'passport'
import {
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
  getUsers,
  getUserById,
} from '@/controllers/userController'

const router = Router()

// Public: List users
router.get('/', getUsers)

// Authenticated: Profile management (/me MUST come before /:id)
router.get(
  '/me',
  passport.authenticate('jwt', { session: false }),
  getCurrentUser
)

router.patch(
  '/me',
  passport.authenticate('jwt', { session: false }),
  updateCurrentUser
)

router.delete(
  '/me',
  passport.authenticate('jwt', { session: false }),
  deleteCurrentUser
)

// Public: Get user by ID (MUST come after /me)
router.get('/:id', getUserById)

export default router
