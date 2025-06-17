export enum SITE_PRIORITY {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3,
    CRITICAL = 4
}

export enum NOTIFICATION_FREQUENCY {
  ONCE = 'ONCE',                // Only first time it goes down
  EVERY = 'EVERY',              // Every time it's checked and still down
  HOURLY = 'HOURLY',            // At most once every hour
  DAILY = 'DAILY',              // At most once per day
  NONE = 'NONE'                 // Don't send notifications
}

export class CustomError {
    statusCode: number
    message: string | null

    constructor(message: string, statusCode: number) {
        this.statusCode = statusCode
        this.message = message
    }

}

export class InvalidInputError extends CustomError{
    constructor(message:string="Invalid input") {
        super(message,400)
    }
}

export class PermissionNotGranted extends CustomError{
    constructor(messag:string="Permission not granted") {
        super(messag,403)
    }
}