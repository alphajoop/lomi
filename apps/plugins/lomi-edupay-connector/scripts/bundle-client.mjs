import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "frontend", "vendor");
const outfile = path.join(outDir, "lomi-elements.js");

fs.mkdirSync(outDir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(__dirname, "..", "frontend", "sdk-entry.js")],
  bundle: true,
  format: "esm",
  platform: "browser",
  outfile,
  sourcemap: true,
});

console.log(`Bundled client SDK → ${outfile}`);
