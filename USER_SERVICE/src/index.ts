import 'reflect-metadata'
import { GlobalSettings } from './globalSettings'
import express from 'express'
import dotenv from 'dotenv'
import { AppDataSource } from './db.config'
import { UserController } from './modules/user/user.controller'
import { GlobalErrorHandler } from './utility/base.utility'

dotenv.config()


const app = express()
app.use(express.json())

app.post('/register',UserController.signup)

// app.post('/login', UserController.login)

app.use(GlobalErrorHandler)

app.listen(GlobalSettings.port, () => {
  console.log(`User Service listening on port ${GlobalSettings.port}`)
  AppDataSource.initialize()
    .then(async () => {
      console.log('User Service DB connected')
      const pendingMigrations = await AppDataSource.showMigrations()
      if (pendingMigrations) {
        console.log('Running migrations...')
        await AppDataSource.runMigrations()
        console.log('Migrations completed.')
      }
    })
    .catch((error) => console.error('DB connection error:', error))
})

