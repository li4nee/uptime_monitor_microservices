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