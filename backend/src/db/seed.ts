import { db } from "./index.js";
import {
    manga,
    chapters,
    pages,
    genres,
    mangaToGenres,
} from "./schema/index.js";
import { uploadImage } from "../lib/cloudinary.js";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import "dotenv/config";

async function seed() {
    console.log("🌱 Seeding database...");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await db.delete(mangaToGenres);
    await db.delete(pages);
    await db.delete(chapters);
    await db.delete(manga);
    await db.delete(genres);

    // Create genres
    const genreData = [
        { name: "Action", slug: "action" },
        { name: "Adventure", slug: "adventure" },
        { name: "Fantasy", slug: "fantasy" },
        { name: "Shounen", slug: "shounen" },
        { name: "Comedy", slug: "comedy" },
        { name: "Drama", slug: "drama" },
        { name: "Supernatural", slug: "supernatural" },
        { name: "Pirates", slug: "pirates" },
    ];

    const insertedGenres = await db
        .insert(genres)
        .values(genreData)
        .returning();
    console.log(`✅ Created ${insertedGenres.length} genres`);

    // Create One Piece manga
    console.log("📚 Creating One Piece manga...");
    const [onePiece] = await db
        .insert(manga)
        .values({
            title: "One Piece",
            slug: "one-piece",
            description:
                "Gol D. Roger, a man referred to as the 'King of the Pirates,' is set to be executed by the World Government. But just before his demise, he confirms the existence of a great treasure, One Piece, located somewhere within the vast ocean known as the Grand Line. Announcing that One Piece can be claimed by anyone worthy enough to reach it, the King of the Pirates is executed and the Great Age of Pirates begins.",
            coverUrl:
                "https://placehold.co/300x400/ec4899/ffffff?text=One+Piece",
            author: "Eiichiro Oda",
            artist: "Eiichiro Oda",
            status: "ongoing" as const,
            type: "manga" as const,
            releaseYear: 1997,
            viewCount: 0,
        })
        .returning();

    console.log(`✅ Created One Piece manga`);

    // Link genres to One Piece
    const actionGenre = insertedGenres.find((g) => g.slug === "action");
    const adventureGenre = insertedGenres.find((g) => g.slug === "adventure");
    const fantasyGenre = insertedGenres.find((g) => g.slug === "fantasy");
    const shounenGenre = insertedGenres.find((g) => g.slug === "shounen");

    if (actionGenre && adventureGenre && fantasyGenre && shounenGenre) {
        await db.insert(mangaToGenres).values([
            { mangaId: onePiece.id, genreId: actionGenre.id },
            { mangaId: onePiece.id, genreId: adventureGenre.id },
            { mangaId: onePiece.id, genreId: fantasyGenre.id },
            { mangaId: onePiece.id, genreId: shounenGenre.id },
        ]);
        console.log(`✅ Linked genres to One Piece`);
    }

    // Path to local chapter images
    const chapterPath = join(
        process.cwd(),
        "..",
        "web",
        "public",
        "manga",
        "one-piece",
        "chapter-1",
    );

    console.log(`📂 Looking for images in: ${chapterPath}`);

    // Check if directory exists and get images
    let imageFiles: string[] = [];
    try {
        imageFiles = readdirSync(chapterPath)
            .filter((file) => file.endsWith(".avif"))
            .sort((a, b) => {
                const numA = parseInt(a.split(".")[0]);
                const numB = parseInt(b.split(".")[0]);
                return numA - numB;
            });
        console.log(`✅ Found ${imageFiles.length} images`);
    } catch (error) {
        console.warn(`⚠️  Could not read chapter images: ${error}`);
        console.log("📝 Will use placeholder images instead");
    }

    // Create Chapter 1
    console.log("📖 Creating Chapter 1...");
    const [chapter1] = await db
        .insert(chapters)
        .values({
            mangaId: onePiece.id,
            number: 1,
            title: "Romance Dawn",
            slug: "chapter-1",
            pageCount: imageFiles.length || 17,
        })
        .returning();

    console.log(`✅ Created Chapter 1`);

    // Upload images to Cloudinary and create pages
    if (imageFiles.length > 0) {
        console.log("☁️  Uploading images to Cloudinary...");

        for (let i = 0; i < imageFiles.length; i++) {
            const fileName = imageFiles[i];
            const pageNumber = i + 1;

            try {
                // Read image file
                const imagePath = join(chapterPath, fileName);
                const imageBuffer = readFileSync(imagePath);

                // Upload to Cloudinary
                console.log(
                    `  📤 Uploading page ${pageNumber}/${imageFiles.length}...`,
                );
                const result = await uploadImage(
                    imageBuffer,
                    "manga/one-piece/chapter-1",
                    `page-${pageNumber}`,
                );

                // Create page record
                await db.insert(pages).values({
                    chapterId: chapter1.id,
                    pageNumber,
                    imageUrl: result.secure_url,
                    width: 800,
                    height: 1200,
                });

                console.log(`  ✅ Page ${pageNumber} uploaded`);
            } catch (error) {
                console.error(
                    `  ❌ Failed to upload page ${pageNumber}:`,
                    error,
                );
                // Create placeholder page on error
                await db.insert(pages).values({
                    chapterId: chapter1.id,
                    pageNumber,
                    imageUrl: `https://placehold.co/800x1200/1a1a24/8b5cf6?text=One+Piece+Ch1+Pg${pageNumber}`,
                    width: 800,
                    height: 1200,
                });
            }
        }
    } else {
        // Use placeholder images
        console.log("📝 Creating placeholder pages...");
        const pageData = Array.from({ length: 17 }, (_, i) => ({
            chapterId: chapter1.id,
            pageNumber: i + 1,
            imageUrl: `https://placehold.co/800x1200/1a1a24/8b5cf6?text=One+Piece+Ch1+Pg${i + 1}`,
            width: 800,
            height: 1200,
        }));
        await db.insert(pages).values(pageData);
    }

    console.log(`✅ Created ${imageFiles.length || 17} pages for Chapter 1`);

    // Create a few more placeholder chapters
    console.log("📚 Creating additional chapters...");
    for (let i = 2; i <= 5; i++) {
        const [chapter] = await db
            .insert(chapters)
            .values({
                mangaId: onePiece.id,
                number: i,
                title: `Chapter ${i}`,
                slug: `chapter-${i}`,
                pageCount: 18,
            })
            .returning();

        // Create placeholder pages
        const pageData = Array.from({ length: 18 }, (_, j) => ({
            chapterId: chapter.id,
            pageNumber: j + 1,
            imageUrl: `https://placehold.co/800x1200/1a1a24/8b5cf6?text=One+Piece+Ch${i}+Pg${j + 1}`,
            width: 800,
            height: 1200,
        }));
        await db.insert(pages).values(pageData);
    }

    console.log(`✅ Created 4 additional chapters`);
    console.log("🎉 Seeding complete!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seeding failed:", err);
    console.error(err);
    process.exit(1);
});
