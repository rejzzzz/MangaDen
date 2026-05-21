import { fromBuffer } from "pdf2pic";
import sharp from "sharp";
import { uploadImage } from "./cloudinary.js";

interface ProcessedPage {
    pageNumber: number;
    imageUrl: string;
    width: number;
    height: number;
}

export const processPdfToPages = async (
    pdfBuffer: Buffer,
    chapterId: string,
): Promise<ProcessedPage[]> => {
    const converter = fromBuffer(pdfBuffer, {
        density: 150,
        format: "png",
        width: 1200,
    });

    const pages = (await converter.bulk(-1)) as Array<{ buffer: Buffer }>;
    const results: ProcessedPage[] = [];

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page?.buffer) continue;

        const pageNumber = i + 1;

        // Convert to AVIF
        const metadata = await sharp(page.buffer).metadata();
        const avifBuffer = await sharp(page.buffer)
            .avif({ quality: 75, effort: 4 })
            .toBuffer();

        // Upload to Cloudinary
        const { secure_url } = await uploadImage(
            avifBuffer,
            `chapters/${chapterId}`,
            `page-${pageNumber}`,
        );

        results.push({
            pageNumber,
            imageUrl: secure_url,
            width: metadata.width || 0,
            height: metadata.height || 0,
        });
    }

    return results;
};
