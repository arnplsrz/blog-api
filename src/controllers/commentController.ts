import { Request, Response } from 'express'
import { prisma } from '@/lib/prisma'

export const getComments = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10))

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        select: {
          id: true,
          content: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
          post: { select: { id: true, title: true } },
          author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count(),
    ])

    return res.status(200).json({
      message: 'Comments retrieved successfully',
      data: {
        comments,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateComment = async (req: Request, res: Response) => {
  try {
    const { content } = req.body

    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' })
    }

    const existing = await prisma.comment.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    })
    if (!existing) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    const comment = await prisma.comment.update({
      where: { id: req.params.id },
      data: { content: content.trim() },
      select: { id: true, content: true, updatedAt: true },
    })

    return res.status(200).json({ message: 'Comment updated successfully', comment })
  } catch (error) {
    console.error('Update comment error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.comment.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    })
    if (!existing) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    await prisma.$transaction(async (tx) => {
      let ids = [req.params.id as string]
      const all = [...ids]
      while (ids.length) {
        const children = await tx.comment.findMany({
          where: { parentId: { in: ids } },
          select: { id: true },
        })
        ids = children.map((c) => c.id)
        all.push(...ids)
      }
      await tx.comment.deleteMany({ where: { id: { in: all } } })
    })

    return res.status(200).json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Delete comment error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
