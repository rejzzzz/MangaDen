import "dotenv/config";
import { AdminService } from "./src/services/admin.service.js";

async function testAdmin() {
    console.log("🧪 Testing AdminService...");
    try {
        console.log("\n1️⃣  Testing getStats()...");
        const stats = await AdminService.getStats();
        console.log("✅ getStats() returned:", stats);

        console.log("\n2️⃣  Testing getSettings()...");
        const settings = await AdminService.getSettings();
        console.log("✅ getSettings() returned:", settings);

        console.log("\n3️⃣  Testing getActivity()...");
        const activity = await AdminService.getActivity(5);
        console.log(`✅ getActivity() returned ${activity.length} entries.`);

        console.log("\n4️⃣  Testing listManga()...");
        const manga = await AdminService.listManga(1, 5);
        console.log(`✅ listManga() returned ${manga.data.length} manga. (Total: ${manga.pagination.total})`);

        console.log("\n🎉 All tests passed!");
    } catch (e: any) {
        console.error("\n❌ Test failed with error:", e.message || e);
    }
    process.exit(0);
}

testAdmin();
