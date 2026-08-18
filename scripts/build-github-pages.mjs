import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "dist", "github-pages");
const staticStyleVersion = "20260818-03";
const adminGridStyleVersion = "20260818-02";
const adminSaveFlowVersion = "20260818-01";
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
    const withTypography = withRelativeHome.includes("krds-static.css")
      ? withRelativeHome
      : withRelativeHome.replace(/<\/head>/i, '<link rel="stylesheet" href="./assets/krds-static.css"></head>');
    const withFreshStaticStyles = withTypography.replace(
      /href="\.\/assets\/krds-static\.css(?:\?[^\"]*)?"/g,
      `href="./assets/krds-static.css?v=${staticStyleVersion}"`,
    );
    const withAdminGrid = entry.name === "admin.html"
      ? withFreshStaticStyles.replace(
        /<\/head>/i,
        `<link rel="stylesheet" href="./assets/admin-grid.css?v=${adminGridStyleVersion}"><script src="./assets/admin-save-flow.js?v=${adminSaveFlowVersion}" defer></script></head>`,
      )
      : withFreshStaticStyles;
    const staticBrand = '<a class="brand" href="./index.html"><span>N</span><span class="brand-copy"><strong>남양주시 문화의집</strong><small>웹시스템</small></span></a>';
    const rewritten = withAdminGrid
      .replaceAll('<a class="brand" href="./index.html"><span>N</span>남양주시 문화의집</a>', staticBrand)
      .replaceAll('<a class="brand" href="./index.html"><span>N</span>남양주시 문화의집 운영 관리</a>', staticBrand);
    if (rewritten !== source) await writeFile(file, rewritten, "utf8");
  }));
}

await rewriteHtmlLinks(output);
console.log(`GitHub Pages files prepared: ${output}`);
