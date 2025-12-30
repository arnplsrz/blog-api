import { Request, Response, NextFunction } from 'express'
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
