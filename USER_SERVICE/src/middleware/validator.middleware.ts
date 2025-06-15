import * as yup from "yup"
import { Request, Response, NextFunction } from "express"
import { validateDTO } from "../utility/base.utility"

function validationCreateFunction(source: "body" | "query") {
  return (schema: yup.AnySchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await validateDTO(schema, req[source])
        next()
      } catch (err: any) {
        if (err instanceof yup.ValidationError) {
          res.status(400).json({
            message: "Validation failed",
            errors: err.inner.map((e) => ({
              path: e.path,
              message: e.message,
            })),
          })
          return
        }

        res.status(500).json({ message: "Internal Server Error" })
        return
      }
    }
  }
}

export const validateRequestBody = validationCreateFunction("body")
export const validateRequestQuery = validationCreateFunction("query")
