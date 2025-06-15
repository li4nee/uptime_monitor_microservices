import dotenv from 'dotenv'
dotenv.config()
const GlobalSettings = {
    database:{
        url:process.env.DATABASE_URL
    },
    port:Number(3001),
    JWT_SECRET:process.env.JWT_SECRET || "dkjhwekjrhioejqilej",
    JWT_EXPIRY:process.env.JWT_EXPIRY || "1h",
    JWT_REFRESH_EXPIRY:process.env.JWT_REFRESH_EXPIRY || "30d",
    redis:{
        url: process.env.REDIS_URL || "redis://redis:6379"
    }
}

export {GlobalSettings}