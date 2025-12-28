import 'dotenv/config'
import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt, { SignOptions } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined')
}

if (!process.env.BCRYPT_ROUNDS) {
  throw new Error('BCRYPT_ROUNDS must be defined')
}

if (!process.env.JWT_EXPIRES_IN) {
  throw new Error('JWT_EXPIRES_IN must be defined')
}

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS)
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN)

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, signOptions)

    return res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, signOptions)

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
