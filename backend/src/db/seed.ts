import { db } from "./index.js";
import { manga, chapters, pages, genres, mangaToGenres } from "./schema/index.js";
import { cache } from "../lib/cache/redis.js";
import "dotenv/config";

async function seed() {
    console.log("🌱 Seeding database...");
    await cache.delPattern("manga:list:*");
    await cache.delPattern("manga:*");

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

    const mangaData = [
        {
            title: "One Piece",
            slug: "one-piece",
            description: "A pirate adventure to find the ultimate treasure, One Piece.",
            coverUrl: "https://placehold.co/300x400/f97316/ffffff?text=One+Piece",
            author: "Eiichiro Oda",
            artist: "Eiichiro Oda",
            status: "ongoing" as const,
            type: "manga" as const,
            releaseYear: 1997,
        },
        {
            title: "Jujutsu Kaisen",
            slug: "jujutsu-kaisen",
            description: "A student enters the world of curses and sorcerers.",
            coverUrl: "https://placehold.co/300x400/dc2626/ffffff?text=Jujutsu+Kaisen",
            author: "Gege Akutami",
            artist: "Gege Akutami",
            status: "ongoing" as const,
            type: "manga" as const,
            releaseYear: 2018,
        },
        {
            title: "Solo Leveling",
            slug: "solo-leveling",
            description: "The weakest hunter rises through mysterious leveling powers.",
            coverUrl: "https://placehold.co/300x400/2563eb/ffffff?text=Solo+Leveling",
            author: "Chugong",
            artist: "Dubu",
            status: "completed" as const,
            type: "manhwa" as const,
            releaseYear: 2018,
        },
        {
            title: "Demon Slayer",
            slug: "demon-slayer",
            description: "A boy fights demons to save his sister and avenge his family.",
            coverUrl: "https://placehold.co/300x400/0f766e/ffffff?text=Demon+Slayer",
            author: "Koyoharu Gotouge",
            artist: "Koyoharu Gotouge",
            status: "completed" as const,
            type: "manga" as const,
            releaseYear: 2016,
        },
        {
            title: "Tower of God",
            slug: "tower-of-god",
            description: "A boy climbs a mysterious tower to find his closest friend.",
            coverUrl: "https://placehold.co/300x400/7c3aed/ffffff?text=Tower+of+God",
            author: "SIU",
            artist: "SIU",
            status: "ongoing" as const,
            type: "webtoon" as const,
            releaseYear: 2010,
        },
        {
            title: "Chainsaw Man",
            slug: "chainsaw-man",
            description: "A devil hunter with chainsaw powers battles terrifying enemies.",
            coverUrl: "https://placehold.co/300x400/b91c1c/ffffff?text=Chainsaw+Man",
            author: "Tatsuki Fujimoto",
            artist: "Tatsuki Fujimoto",
            status: "ongoing" as const,
            type: "manga" as const,
            releaseYear: 2018,
        },
    ];

    const insertedManga = await db.insert(manga).values(mangaData).returning();
    console.log(`✅ Created ${insertedManga.length} manga`);

    const genreBySlug = Object.fromEntries(insertedGenres.map((g) => [g.slug, g.id])) as Record<string, string>;
    const mangaBySlug = Object.fromEntries(insertedManga.map((m) => [m.slug, m.id])) as Record<string, string>;

    const getMangaId = (slug: string): string => {
        const id = mangaBySlug[slug];
        if (!id) throw new Error(`Manga slug "${slug}" not found in seeded data`);
        return id;
    };

    const getGenreId = (slug: string): string => {
        const id = genreBySlug[slug];
        if (!id) throw new Error(`Genre slug "${slug}" not found in seeded data`);
        return id;
    };

    await db.insert(mangaToGenres).values([
        { mangaId: getMangaId("one-piece"), genreId: getGenreId("action") },
        { mangaId: getMangaId("one-piece"), genreId: getGenreId("adventure") },
        { mangaId: getMangaId("one-piece"), genreId: getGenreId("fantasy") },
        { mangaId: getMangaId("one-piece"), genreId: getGenreId("shounen") },
        { mangaId: getMangaId("jujutsu-kaisen"), genreId: getGenreId("action") },
        { mangaId: getMangaId("jujutsu-kaisen"), genreId: getGenreId("supernatural") },
        { mangaId: getMangaId("jujutsu-kaisen"), genreId: getGenreId("shounen") },
        { mangaId: getMangaId("solo-leveling"), genreId: getGenreId("action") },
        { mangaId: getMangaId("solo-leveling"), genreId: getGenreId("fantasy") },
        { mangaId: getMangaId("demon-slayer"), genreId: getGenreId("action") },
        { mangaId: getMangaId("demon-slayer"), genreId: getGenreId("fantasy") },
        { mangaId: getMangaId("tower-of-god"), genreId: getGenreId("adventure") },
        { mangaId: getMangaId("tower-of-god"), genreId: getGenreId("fantasy") },
        { mangaId: getMangaId("chainsaw-man"), genreId: getGenreId("action") },
        { mangaId: getMangaId("chainsaw-man"), genreId: getGenreId("supernatural") },
    ]);

    console.log("✅ Linked genres to manga");
    await cache.delPattern("manga:list:*");
    await cache.delPattern("manga:*");
    console.log("🎉 Seeding complete!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seeding failed:", err);
    console.error(err);
    process.exit(1);
});
