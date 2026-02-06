import { db } from "./index";
import { manga, chapters, pages } from "./schema";
import { eq } from "drizzle-orm";
import "dotenv/config";

async function updateOnePiece() {
    console.log("📖 Updating One Piece with real AVIF images...");

    // Find One Piece manga
    const onePiece = await db.query.manga.findFirst({
        where: eq(manga.slug, "one-piece"),
    });

    if (!onePiece) {
        console.error("❌ One Piece not found. Run db:seed first.");
        process.exit(1);
    }

    // Find or create chapter 1
    let chapter = await db.query.chapters.findFirst({
        where: eq(chapters.mangaId, onePiece.id),
    });

    if (!chapter) {
        const [newChapter] = await db
            .insert(chapters)
            .values({
                mangaId: onePiece.id,
                number: 1,
                title: "Romance Dawn",
                slug: "chapter-1",
                pageCount: 17,
            })
            .returning();
        chapter = newChapter;
    } else {
        // Update chapter 1 page count
        await db
            .update(chapters)
            .set({ pageCount: 17, title: "Romance Dawn" })
            .where(eq(chapters.id, chapter.id));
    }

    // Delete existing pages for this chapter
    await db.delete(pages).where(eq(pages.chapterId, chapter!.id));

    // Add real AVIF pages
    const pageData = Array.from({ length: 17 }, (_, i) => ({
        chapterId: chapter!.id,
        pageNumber: i + 1,
        imageUrl: `/manga/one-piece/chapter-1/${i + 1}.avif`,
        width: 800,
        height: 1200,
    }));

    await db.insert(pages).values(pageData);

    // Update cover to use first page
    await db
        .update(manga)
        .set({ coverUrl: "/manga/one-piece/chapter-1/1.avif" })
        .where(eq(manga.id, onePiece.id));

    console.log("✅ One Piece updated with 17 AVIF pages!");
    console.log("📍 Cover: /manga/one-piece/chapter-1/1.avif");
    process.exit(0);
}

updateOnePiece().catch((err) => {
    console.error("❌ Update failed:", err);
    process.exit(1);
});
