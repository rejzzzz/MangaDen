import { v2 as cloudinary } from "cloudinary";

// Define the Cloudinary configuration interface in case we need to type it strictly later
// For now, process.env is sufficient.

export const configureCloudinary = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        console.warn("Cloudinary credentials are not fully set in environment variables.");
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });
};

/**
 * Upload an image to Cloudinary.
 * @param fileBuffer The file buffer to upload.
 * @param folder The folder in Cloudinary to upload to (e.g., 'covers', 'chapters/one-piece/100').
 * @param publicId Optional public ID for the file.
 */
export const uploadImage = async (
    fileBuffer: Buffer,
    folder: string,
    publicId?: string
): Promise<{ secure_url: string; public_id: string }> => {
    configureCloudinary();

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                resource_type: "auto", // Automatically detect image/video
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                if (!result) {
                    return reject(new Error("Cloudinary upload failed: No result returned"));
                }
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/**
 * Delete an image from Cloudinary.
 * @param publicId The public ID of the image to delete.
 */
export const deleteImage = async (publicId: string): Promise<void> => {
    configureCloudinary();

    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        throw error;
    }
};
