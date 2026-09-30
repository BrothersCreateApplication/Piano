/**
 * Workaround bug đóng gói của tonal 6.x / @tonaljs/* 5.x:
 * các package build bằng tsdown và sinh ra `dist/index.d.mts` + `dist/index.d.cts`,
 * nhưng trường `types` trong package.json lại trỏ tới `dist/index.d.ts` (không tồn tại)
 * → TypeScript báo "Cannot find module 'tonal'".
 *
 * Script này copy `index.d.mts` → `index.d.ts` cho cả `tonal` lẫn mọi package `@tonaljs/*`
 * (nội dung hai file tương đương, chỉ khác thứ tự import). Chạy tự động qua `postinstall`.
 */
import { existsSync, copyFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const modules = join(root, "node_modules");

function patch(pkgDir) {
  const from = join(pkgDir, "dist", "index.d.mts");
  const to = join(pkgDir, "dist", "index.d.ts");
  if (existsSync(from) && !existsSync(to)) {
    copyFileSync(from, to);
    return true;
  }
  return false;
}

let count = 0;

const tonal = join(modules, "tonal");
if (existsSync(tonal) && patch(tonal)) count++;

const scope = join(modules, "@tonaljs");
if (existsSync(scope)) {
  for (const name of readdirSync(scope)) {
    const dir = join(scope, name);
    if (statSync(dir).isDirectory() && patch(dir)) count++;
  }
}

console.log(`[patch-tonal-types] created ${count} missing index.d.ts shim(s).`);
