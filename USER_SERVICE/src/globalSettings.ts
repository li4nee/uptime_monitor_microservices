import dotenv from 'dotenv'
dotenv.config()
const GlobalSettings = {
    database:{
        url:process.env.DATABASE_URL
    },
    port:Number(3001),
    JWT_SECRET:process.env.JWT_SECRET || "dkjhwekjrhioejqilej"
}

export {GlobalSettings}