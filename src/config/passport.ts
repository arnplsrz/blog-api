import 'dotenv/config'
import passport from 'passport'
import { Strategy, ExtractJwt, StrategyOptions, VerifiedCallback } from 'passport-jwt'
import { prisma } from '@/lib/prisma'
import { JwtPayload } from 'jsonwebtoken'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined')
}

const JWT_SECRET = process.env.JWT_SECRET

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET,
}

export default passport.use(
  new Strategy(opts, async (payload: JwtPayload, done: VerifiedCallback) => {
    try {
      const userId = payload.userId || payload.sub

      if (!userId || typeof userId !== 'string') {
        return done(null, false)
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      })

      if (!user) {
        return done(null, false)
      }

      return done(null, user)
    } catch (error) {
      return done(error, false)
    }
  })
)
