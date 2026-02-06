import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export const errorHandler: ErrorHandler = (err, c) => {
    console.error(`[ERROR] ${err.message}`, err.stack);

    // Zod validation errors
    if (err instanceof ZodError) {
        return c.json(
            {
                success: false,
                error: "Validation Error",
                details: err.errors.map((e) => ({
                    field: e.path.join("."),
                    message: e.message,
                })),
            },
            400
        );
    }

    // HTTP exceptions
    if (err instanceof HTTPException) {
        return c.json(
            {
                success: false,
                error: err.message,
            },
            err.status
        );
    }

    // Generic errors
    return c.json(
        {
            success: false,
            error: "Internal Server Error",
            message:
                process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
        },
        500
    );
};
