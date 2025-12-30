import { Router } from 'express'
import passport from 'passport'
import { requireAuthor } from '@/middlewares/auth'
import { requirePostOwnership } from '@/middlewares/postOwnership'
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} from '@/controllers/postController'

const router = Router()

// Public routes - anyone can view published posts
router.get('/', getPosts)
router.get('/:id', getPostById)

// Protected routes - require authentication and AUTHOR role
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  requireAuthor,
  createPost
)

// Protected routes - require authentication, AUTHOR role, and ownership
router.patch(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  requireAuthor,
  requirePostOwnership,
  updatePost
)

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  requireAuthor,
  requirePostOwnership,
  deletePost
)

export default router
