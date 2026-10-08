import { Router } from 'express'
import passport from 'passport'
import { optionalAuth, requireAuthor } from '@/middlewares/auth'
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} from '@/controllers/postController'
import { createComment } from '@/controllers/commentController'

const router = Router()

// Public routes - anyone can view published posts
router.get('/', optionalAuth, getPosts)
router.get('/:id', optionalAuth, getPostById)

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
  updatePost
)

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  requireAuthor,
  deletePost
)

router.post('/:id/comments', passport.authenticate('jwt', { session: false }), createComment)

export default router
