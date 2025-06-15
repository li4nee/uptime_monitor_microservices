import express, { Request} from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import morgan from 'morgan'
import { IncomingMessage } from 'http'

dotenv.config()

const app = express()


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
  createProxyMiddleware({
    target: 'http://monitor-service:3002',
    changeOrigin: true,
    pathRewrite: { '^/monitor': '' },
  })
)

app.listen(3000, () => {
  console.log('API Gateway listening on port 3000')
})
