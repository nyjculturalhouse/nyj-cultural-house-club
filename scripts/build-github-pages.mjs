import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "dist", "github-pages");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, "client", "public"), output, { recursive: true });
await cp(path.join(root, "github-pages"), output, { recursive: true });

async function rewriteHtmlLinks(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return rewriteHtmlLinks(file);
    if (!entry.name.endsWith(".html")) return;
    const source = await readFile(file, "utf8");
    const withRelativeHome = source.replaceAll('href="/"', 'href="./index.html"');
    const rewritten = withRelativeHome.includes("krds-static.css")
      ? withRelativeHome
      : withRelativeHome.replace(
          /(<link\s+rel=["']stylesheet["']\s+href=["']\.\/assets\/site\.css["']\s*\/?>)/i,
          '$1<link rel="stylesheet" href="./assets/krds-static.css">',
        );
    if (rewritten !== source) await writeFile(file, rewritten, "utf8");
  }));
}

await rewriteHtmlLinks(output);
console.log(`GitHub Pages files prepared: ${output}`);
