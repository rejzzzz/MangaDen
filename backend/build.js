import esbuild from "esbuild";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

// Externalize all dependencies except our internal workspace packages (like @mangaden/shared)
const externals = Object.keys(pkg.dependencies || {}).filter(
    (dep) => dep !== "@mangaden/shared"
);

esbuild
    .build({
        entryPoints: ["./src/index.ts"],
        bundle: true,
        platform: "node",
        target: "node20",
        format: "esm",
        outfile: "./dist/index.js",
        external: externals,
    })
    .catch(() => process.exit(1));
