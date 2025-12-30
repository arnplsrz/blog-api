import { Request, Response, NextFunction } from 'express'
import { prisma } from '@/lib/prisma'

/**
 * Middleware to verify the authenticated user owns the post
 * Must be used after passport.authenticate and on routes with :id parameter
 */
export const requirePostOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const postId = req.params.id

    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' })
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    })

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    if (post.authorId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden: You can only modify your own posts',
      })
    }

    next()
  } catch (error) {
    console.error('Post ownership verification error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
