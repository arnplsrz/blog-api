import 'dotenv/config'
import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'

if (!process.env.BCRYPT_ROUNDS) {
  throw new Error('BCRYPT_ROUNDS must be defined')
}

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS)

/**
 * GET /api/users/me
 * Get current user's full profile
 * Authentication: Required (JWT)
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({
      message: 'User profile retrieved',
      user,
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * PATCH /api/users/me
 * Update current user's profile
 * Authentication: Required (JWT)
 */
export const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { name, email, password } = req.body

    // Build update data object
    const updateData: any = {}

    // Validate and add name if provided
    if (name !== undefined) {
      // Allow null to clear name
      if (name === null) {
        updateData.name = null
      } else {
        // If string, must not be empty
        if (typeof name !== 'string' || name.trim().length === 0) {
          return res.status(400).json({ error: 'Name must not be empty' })
        }
        updateData.name = name.trim()
      }
    }

    // Validate email and add if provided
    if (email !== undefined) {
      if (typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email' })
      }
      updateData.email = email
    }

    // Validate and hash password if provided
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters',
        })
      }
      updateData.password = await bcrypt.hash(password, BCRYPT_ROUNDS)
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return res.status(200).json({
      message: 'Profile updated successfully',
      user,
    })
  } catch (error) {
    console.error('Update user error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * DELETE /api/users/me
 * Delete current user account (hard delete with cascade)
 * Authentication: Required (JWT)
 */
export const deleteCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Hard delete user (cascade will delete posts and comments)
    await prisma.user.delete({
      where: { id: req.user.id },
    })

    return res.status(200).json({
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/users
 * List all users (paginated, public data only)
 * Authentication: Not required
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10' } = req.query

    // Parse and validate pagination
    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)))
    const skip = (pageNum - 1) * limitNum

    // Fetch users with post count (public data only)
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.user.count(),
    ])

    // Transform data to include postCount at root level
    const usersWithPostCount = users.map((user) => ({
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
      postCount: user._count.posts,
    }))

    return res.status(200).json({
      message: 'Users retrieved',
      data: {
        users: usersWithPostCount,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    })
  } catch (error) {
    console.error('Get users error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/users/:id
 * Get public profile of specific user
 * Authentication: Not required
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        posts: {
          where: {
            published: true, // Only show published posts
          },
          select: {
            id: true,
            title: true,
            content: true,
            published: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Structure response with stats
    const response = {
      id: user.id,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      posts: user.posts,
      stats: {
        postCount: user._count.posts,
        commentCount: user._count.comments,
      },
    }

    return res.status(200).json({
      message: 'User profile retrieved',
      user: response,
    })
  } catch (error) {
    console.error('Get user by ID error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
