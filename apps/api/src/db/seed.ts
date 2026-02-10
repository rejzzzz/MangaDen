import { db } from "./index";
import { manga, chapters, pages, genres, mangaToGenres } from "./schema/index";
import "dotenv/config";

async function seed() {
    console.log("🌱 Seeding database...");

    // Clear existing data
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
        { name: "Romance", slug: "romance" },
        { name: "Comedy", slug: "comedy" },
        { name: "Drama", slug: "drama" },
        { name: "Supernatural", slug: "supernatural" },
        { name: "Horror", slug: "horror" },
    ];

    const insertedGenres = await db.insert(genres).values(genreData).returning();
    console.log(`✅ Created ${insertedGenres.length} genres`);

    // Create manga with placeholder covers
    const mangaData = [
        {
            title: "Solo Leveling",
            slug: "solo-leveling",
            description: "10 years ago, after the Gate that connected the real world with the monster world opened, some of the ordinary, extract everyday people received the power to hunt monsters within the Gate.",
            coverUrl: "https://placehold.co/300x400/8b5cf6/ffffff?text=Solo+Leveling",
            author: "Chugong",
            artist: "DUBU",
            status: "completed" as const,
            type: "manhwa" as const,
            releaseYear: 2018,
            viewCount: 1500000,
        },
        {
            title: "One Piece",
            slug: "one-piece",
            description: "Gol D. Roger, a man referred to as the King of the Pirates, is set to be executed by the World Government.",
            coverUrl: "https://placehold.co/300x400/ec4899/ffffff?text=One+Piece",
            author: "Eiichiro Oda",
            artist: "Eiichiro Oda",
            status: "ongoing" as const,
            type: "manga" as const,
            releaseYear: 1997,
            viewCount: 3000000,
        },
        {
            title: "Jujutsu Kaisen",
            slug: "jujutsu-kaisen",
            description: "Yuji Itadori is an unnaturally fit high school student living in Sendai with his grandfather.",
            coverUrl: "https://placehold.co/300x400/22c55e/ffffff?text=Jujutsu+Kaisen",
            author: "Gege Akutami",
            artist: "Gege Akutami",
            status: "ongoing" as const,
            type: "manga" as const,
            releaseYear: 2018,
            viewCount: 2000000,
        },
        {
            title: "Chainsaw Man",
            slug: "chainsaw-man",
            description: "Denji has a simple dream—to live a happy and peaceful life, spending time with a girl he likes.",
            coverUrl: "https://placehold.co/300x400/f59e0b/ffffff?text=Chainsaw+Man",
            author: "Tatsuki Fujimoto",
            artist: "Tatsuki Fujimoto",
            status: "ongoing" as const,
            type: "manga" as const,
            releaseYear: 2018,
            viewCount: 1800000,
        },
        {
            title: "Tower of God",
            slug: "tower-of-god",
            description: "What do you desire? Money and wealth? Honor and pride? Authority and power? Revenge? Or something that transcends them all?",
            coverUrl: "https://placehold.co/300x400/6366f1/ffffff?text=Tower+of+God",
            author: "SIU",
            artist: "SIU",
            status: "ongoing" as const,
            type: "manhwa" as const,
            releaseYear: 2010,
            viewCount: 1200000,
        },
        {
            title: "Demon Slayer",
            slug: "demon-slayer",
            description: "Tanjiro is the oldest son in his family who has lost his father. One day, Tanjiro ventures off to another town to sell charcoal.",
            coverUrl: "https://placehold.co/300x400/dc2626/ffffff?text=Demon+Slayer",
            author: "Koyoharu Gotouge",
            artist: "Koyoharu Gotouge",
            status: "completed" as const,
            type: "manga" as const,
            releaseYear: 2016,
            viewCount: 2500000,
        },
        {
            title: "The Beginning After The End",
            slug: "the-beginning-after-the-end",
            description: "King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability.",
            coverUrl: "https://placehold.co/300x400/14b8a6/ffffff?text=TBATE",
            author: "TurtleMe",
            artist: "Fuyuki23",
            status: "ongoing" as const,
            type: "manhwa" as const,
            releaseYear: 2018,
            viewCount: 900000,
        },
        {
            title: "Omniscient Reader",
            slug: "omniscient-reader",
            description: "Dokja was an average office worker whose sole interest was reading his favorite web novel.",
            coverUrl: "https://placehold.co/300x400/a855f7/ffffff?text=Omniscient+Reader",
            author: "Sing Shong",
            artist: "Sleepy-C",
            status: "ongoing" as const,
            type: "manhwa" as const,
            releaseYear: 2020,
            viewCount: 1100000,
        },
    ];

    const insertedManga = await db.insert(manga).values(mangaData).returning();
    console.log(`✅ Created ${insertedManga.length} manga`);

    // Create chapters with placeholder pages
    for (const m of insertedManga) {
        const chapterCount = Math.floor(Math.random() * 50) + 10; // 10-60 chapters

        for (let i = 1; i <= chapterCount; i++) {
            const [chapter] = await db
                .insert(chapters)
                .values({
                    mangaId: m.id,
                    number: i,
                    title: i === 1 ? "Prologue" : `Chapter ${i}`,
                    slug: `chapter-${i}`,
                    pageCount: Math.floor(Math.random() * 20) + 15, // 15-35 pages
                })
                .returning();

            // Add placeholder pages (only for first 3 chapters to save time)
            if (i <= 3 && chapter) {
                const pageData = Array.from({ length: chapter.pageCount }, (_, j) => ({
                    chapterId: chapter.id,
                    pageNumber: j + 1,
                    imageUrl: `https://placehold.co/800x1200/1a1a24/8b5cf6?text=${m.slug}+Ch${i}+Pg${j + 1}`,
                    width: 800,
                    height: 1200,
                }));
                await db.insert(pages).values(pageData);
            }
        }
    }

    console.log(`✅ Created chapters and pages`);
    console.log("🎉 Seeding complete!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
