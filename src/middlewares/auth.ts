import { Request, Response, NextFunction } from 'express'
import passport from 'passport'
import { Role } from '@generated/prisma/client'

// Extend Express Request to include user from passport
declare global {
  namespace Express {
    interface User {
      id: string
      email: string
      name: string | null
      role: Role
    }
  }
}

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (_err: unknown, user: Express.User | false) => {
    if (user) req.user = user
    next()
  })(req, res, next)
}

/**
 * Middleware to require user to have AUTHOR role
 * Must be used after passport.authenticate('jwt', { session: false })
 */
export const requireAuthor = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  if (req.user.role !== 'AUTHOR') {
    return res.status(403).json({
      error: 'Forbidden: AUTHOR role required',
    })
  }

  next()
}
