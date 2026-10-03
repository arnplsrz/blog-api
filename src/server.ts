import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import passport from '@/config/passport'
import authRoutes from '@/routes/authRoutes'
import postRoutes from '@/routes/postRoutes'
import userRoutes from '@/routes/userRoutes'
import commentRoutes from '@/routes/commentRoutes'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

if (!process.env.ALLOWED_ORIGINS) {
  throw new Error('ALLOWED_ORIGINS must be defined')
}

const PORT = Number(process.env.PORT) || 3000

const app = express()

app.use(cors({ origin: process.env.ALLOWED_ORIGINS.split(','), credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(passport.initialize())
app.use(helmet())
app.use(cookieParser())

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World')
})

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/users', userRoutes)
app.use('/api/comments', commentRoutes)

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`)
})
