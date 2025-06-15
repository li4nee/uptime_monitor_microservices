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