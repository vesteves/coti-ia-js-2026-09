import { NextFunction, Request, Response } from 'express'

export type UserRole = 'guest' | 'employee' | 'manager'

export type AuthContext = {
  userId: string
  role: UserRole
}

const demoTokens: Record<string, AuthContext> = {
  'guest-demo-token': {
    userId: 'guest-demo',
    role: 'guest'
  },

  'employee-demo-token': {
    userId: 'employee-demo',
    role: 'employee'
  },

  'manager-demo-token': {
    userId: 'manager-demo',
    role: 'manager'
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.header('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({
      message: 'Token de acesso não informado',
      data: null
    })

    return
  }

  const token = authorization.slice(7)
  const auth = demoTokens[token]

  if (!auth) {
    res.status(401).json({
      message: 'Token de acesso inválido',
      data: null
    })

    return
  }

  res.locals.auth = auth

  next()
}