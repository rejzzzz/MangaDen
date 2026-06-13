import { pdfToPng } from "pdf-to-png-converter";
import sharp from "sharp";
import { uploadImage, deleteImage } from "../storage/cloudinary.js";
import fs from "fs/promises";
import path from "path";

const TARGET_WIDTH = 1200;

interface ProcessedPage {
    pageNumber: number;
    imageUrl: string;
    width: number;
    height: number;
}

/**
 * Patches the Windows backslash bug in pdf-to-png-converter's normalizePath.
 * pdfjs-dist v6 expects URL-style forward slashes for cMapUrl / standardFontDataUrl,
 * but the library uses path.sep (backslash on Windows), causing "must include trailing slash" errors.
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);

function applyWindowsPathPatch(): void {
    if (process.platform !== "win32") return;

    try {
        const converterDir = path.dirname(require.resolve("pdf-to-png-converter"));
        const normalizePathModule = require(path.join(converterDir, "normalizePath.js"));
        const originalNormalizePath = normalizePathModule.normalizePath;

        normalizePathModule.normalizePath = function patchedNormalizePath(p: string): string {
            const result = originalNormalizePath(p);
            // Convert Windows backslashes to forward slashes for pdfjs-dist URL compatibility.
            return result.replace(/\\/g, "/");
        };
    } catch (e) {
        // If patching fails (e.g. different version structure), proceed without patch.
        // The error will surface naturally during PDF conversion.
        console.warn("Could not apply Windows path patch for pdf-to-png-converter:", e);
    }
}

// Apply once at module load.
applyWindowsPathPatch();

/**
 * Converts a PDF file on disk into AVIF page images, uploads each to Cloudinary,
 * and returns metadata for database insertion. Uses pdfjs-dist via pdf-to-png-converter
 * (pure JS + @napi-rs/canvas, no system binaries required).
 */
export const processPdfToPages = async (
    pdfPath: string,
    chapterId: string,
): Promise<ProcessedPage[]> => {
    let pdfBuffer: Buffer;
    try {
        pdfBuffer = await fs.readFile(pdfPath);
    } catch (err: any) {
        throw new Error(`Failed to read PDF file from disk: ${err.message}`);
    }

    // Convert all PDF pages to PNG buffers at the target viewport scale.
    // viewportScale 2.0 ≈ 150 DPI for most manga PDFs.
    const pngPages = await pdfToPng(pdfBuffer, {
        viewportScale: 2.0,
    });

    const results: ProcessedPage[] = [];
    const uploadedPublicIds: string[] = [];

    try {
        for (const pngPage of pngPages) {
            if (!pngPage.content) continue;

            const pageNumber = pngPage.pageNumber;

            // Resize to target width and convert to AVIF for optimal file size.
            const avifBuffer = await sharp(pngPage.content)
                .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
                .avif({ quality: 75, effort: 4 })
                .toBuffer();

            // Extract dimensions from the final output.
            const metadata = await sharp(avifBuffer).metadata();

            const { secure_url, public_id } = await uploadImage(
                avifBuffer,
                `chapters/${chapterId}`,
                `page-${pageNumber}`,
            );

            uploadedPublicIds.push(public_id);

            results.push({
                pageNumber,
                imageUrl: secure_url,
                width: metadata.width || 0,
                height: metadata.height || 0,
            });
        }

        return results;
    } catch (error) {
        // Roll back any Cloudinary uploads on failure to prevent orphaned images.
        console.error("PDF processing failed, cleaning up...", error);
        for (const publicId of uploadedPublicIds) {
            await deleteImage(publicId).catch(console.error);
        }
        throw error;
    } finally {
        // Always clean up the temporary PDF file from disk.
        await fs.unlink(pdfPath).catch(console.error);
    }
};
