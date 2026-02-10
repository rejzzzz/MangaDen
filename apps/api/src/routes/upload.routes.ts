import { Hono } from "hono";

import { uploadImage } from "../lib/cloudinary";

export const uploadRoutes = new Hono();

// POST /api/upload - Upload a single file
uploadRoutes.post("/", async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body["file"];
        const folder = typeof body["folder"] === "string" ? body["folder"] : "uploads";

        if (!file || !(file instanceof File)) {
            return c.json({ success: false, error: "No file uploaded" }, 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await uploadImage(buffer, folder);

        return c.json({ success: true, data: result });
    } catch (error) {
        console.error("Upload error:", error);
        return c.json({ success: false, error: "Failed to upload file" }, 500);
    }
});
