import { Router } from 'express'
import passport from 'passport'
import { requireAuthor } from '@/middlewares/auth'
import { getComments, updateComment, deleteComment } from '@/controllers/commentController'

const router = Router()

router.use(passport.authenticate('jwt', { session: false }))

router.get('/', requireAuthor, getComments)
router.patch('/:id', updateComment)
router.delete('/:id', deleteComment)

export default router
