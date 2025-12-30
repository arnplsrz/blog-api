import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import passport from '@/config/passport'
import authRoutes from '@/routes/authRoutes'
import postRoutes from '@/routes/postRoutes'

const app = express()

app.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(passport.initialize())

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World')
})

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)

app.listen(3000, () => {
  console.log(`Server running at port ${process.env.PORT}`)
})
