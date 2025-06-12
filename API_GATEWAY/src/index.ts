import express, { Request, Response, NextFunction } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import morgan from 'morgan'
import { AuthenticatedRequest } from './typings/base.typings'
import { IncomingMessage } from 'http'

dotenv.config()

const app = express()

const authMiddleware = (req:AuthenticatedRequest,res: Response,next: NextFunction):void => {
  const authHeader = req.headers['authorization']
  if (!authHeader) 
    res.status(401).json({ error: 'No token provided' })

  const token = authHeader?.split(' ')[1]
  if (!token)
  {
    res.status(401).json({ error: 'Malformed token' })
    return 
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error("JWT_SECRET is not defined in environment variables")
    res.status(500).json({ error: 'Internal server error' })
    return
  }
  try {
    const decoded = jwt.verify(token, secret)
    req.user = decoded
    next()
  } catch {
    res.status(403).json({ error: 'Invalid token' })
  }
}

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
)

morgan.token('client-ip', (req: IncomingMessage): string => {
  const expressReq = req as Request;
  const ip = expressReq.header?.('x-forwarded-for') || expressReq.socket?.remoteAddress;
  return ip || '';
});


app.use(
  morgan(':client-ip ":method :url" :status :response-time ms - UA: :user-agent', {
    stream: accessLogStream,
  })
)


app.use(
  '/auth',
  createProxyMiddleware({
    target: 'http://user-service:3001',
    changeOrigin: true,
    pathRewrite: { '^/auth': '' },
  })
)

app.use(
  '/monitor',
  authMiddleware,
  createProxyMiddleware({
    target: 'http://monitor-service:3002',
    changeOrigin: true,
    pathRewrite: { '^/monitor': '' },
  })
)

app.listen(3000, () => {
  console.log('API Gateway listening on port 3000')
})
