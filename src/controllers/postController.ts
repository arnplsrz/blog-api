import { Request, Response } from 'express'
import { prisma } from '@/lib/prisma'

/**
 * Create a new post
 * Requires: AUTHOR role (enforced by middleware)
 */
export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, content, published } = req.body

    // Input validation
    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required',
      })
    }

    if (title.length < 3) {
      return res.status(400).json({
        error: 'Title must be at least 3 characters long',
      })
    }

    if (content.length < 10) {
      return res.status(400).json({
        error: 'Content must be at least 10 characters long',
      })
    }

    // Create post with authenticated user as author
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published: published === true, // Explicit boolean conversion
        authorId: req.user!.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return res.status(201).json({
      message: 'Post created successfully',
      post,
    })
  } catch (error) {
    console.error('Create post error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Get all posts
 * Public route - returns only published posts by default
 * Query params:
 *   - page: number (default: 1)
 *   - limit: number (default: 10, max: 100)
 */
export const getPosts = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10' } = req.query

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)))
    const skip = (pageNum - 1) * limitNum

    // Only show published posts
    const where = { published: true }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          published: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.post.count({ where }),
    ])

    return res.status(200).json({
      message: 'Posts retrieved successfully',
      data: {
        posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    })
  } catch (error) {
    console.error('Get posts error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Get a single post by ID
 * Public route for published posts
 * Authors can view their own unpublished posts
 */
export const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: req.user ? true : false,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Check if post is unpublished
    if (!post.published) {
      // Only allow author to view unpublished post
      if (!req.user || post.author.id !== req.user.id) {
        return res.status(404).json({ error: 'Post not found' })
      }
    }

    return res.status(200).json({
      message: 'Post retrieved successfully',
      post,
    })
  } catch (error) {
    console.error('Get post error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Update a post
 * Requires: AUTHOR role + post ownership (enforced by middleware)
 */
export const updatePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { title, content, published } = req.body

    // Build update data object with only provided fields
    const updateData: any = {}

    if (title !== undefined) {
      if (title.length < 3) {
        return res.status(400).json({
          error: 'Title must be at least 3 characters long',
        })
      }
      updateData.title = title
    }

    if (content !== undefined) {
      if (content.length < 10) {
        return res.status(400).json({
          error: 'Content must be at least 10 characters long',
        })
      }
      updateData.content = content
    }

    if (published !== undefined) {
      updateData.published = published === true
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update',
      })
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return res.status(200).json({
      message: 'Post updated successfully',
      post,
    })
  } catch (error) {
    console.error('Update post error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Delete a post
 * Requires: AUTHOR role + post ownership (enforced by middleware)
 */
export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Delete post (cascade will delete comments per Prisma schema)
    await prisma.post.delete({
      where: { id },
    })

    return res.status(200).json({
      message: 'Post deleted successfully',
    })
  } catch (error) {
    console.error('Delete post error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
