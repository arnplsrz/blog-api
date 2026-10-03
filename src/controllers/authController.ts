import 'dotenv/config'
import { CookieOptions, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { Role } from '@generated/prisma/enums'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined')
}

if (!process.env.BCRYPT_ROUNDS) {
  throw new Error('BCRYPT_ROUNDS must be defined')
}

if (!process.env.JWT_EXPIRES_IN) {
  throw new Error('JWT_EXPIRES_IN must be defined')
}

if (!process.env.REFRESH_SECRET) {
  throw new Error('REFRESH_SECRET must be defined')
}

if (!process.env.REFRESH_MS) {
  throw new Error('REFRESH_MS must be defined')
}

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS)
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN)
const REFRESH_SECRET = process.env.REFRESH_SECRET
const REFRESH_MS = Number(process.env.REFRESH_MS)
const REFRESH_GRACE_MS = 10_000
const DUMMY_HASH = bcrypt.hashSync('dummy', BCRYPT_ROUNDS)

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth',
}

const userSelect = { id: true, email: true, name: true, role: true } as const

const issueTokens = async (res: Response, user: { id: string; role: Role }) => {
  const now = Date.now()
  await prisma.refreshToken.deleteMany({
    where: {
      userId: user.id,
      OR: [{ expiresAt: { lt: new Date(now) } }, { usedAt: { lt: new Date(now - REFRESH_GRACE_MS) } }],
    },
  })

  const row = await prisma.refreshToken.create({
    data: { userId: user.id, expiresAt: new Date(Date.now() + REFRESH_MS) },
  })

  const refreshToken = jwt.sign({ sub: user.id, jti: row.id }, REFRESH_SECRET, {
    expiresIn: REFRESH_MS / 1000,
  })

  res.cookie('refreshToken', refreshToken, { ...refreshCookieOptions, maxAge: REFRESH_MS })

  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
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

    return res.status(201).json({
      message: 'User registered successfully',
      user,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const found = await prisma.user.findUnique({
      where: { email },
    })

    const valid = await bcrypt.compare(password, found?.password ?? DUMMY_HASH)
    if (!found || !valid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const { password: _, ...user } = found
    const accessToken = await issueTokens(res, user)

    return res.status(200).json({ message: 'Login successful', accessToken, user })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const refresh = async (req: Request, res: Response) => {
  try {
    const { sub, jti } = jwt.verify(req.cookies.refreshToken, REFRESH_SECRET) as JwtPayload
    const row = await prisma.refreshToken.findUniqueOrThrow({ where: { id: jti } })
    if (!row.usedAt) {
      await prisma.refreshToken.update({ where: { id: jti }, data: { usedAt: new Date() } })
    } else if (Date.now() - row.usedAt.getTime() > REFRESH_GRACE_MS) {
      throw new Error('Refresh token reused')
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: sub }, select: userSelect })
    const accessToken = await issueTokens(res, user)
    return res.json({ accessToken, user })
  } catch {
    res.clearCookie('refreshToken', refreshCookieOptions)
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
}

export const logout = async (req: Request, res: Response) => {
  try {
    const { jti } = jwt.verify(req.cookies.refreshToken, REFRESH_SECRET) as JwtPayload
    await prisma.refreshToken.deleteMany({ where: { id: jti } })
  } catch {}
  res.clearCookie('refreshToken', refreshCookieOptions)
  return res.status(204).end()
}
