import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'

const app = express()

app.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World')
})

app.listen(3000, () => {
  console.log(`Server running at port ${process.env.PORT}`)
})
