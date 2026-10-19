// `createOptimizer` is declared in the types of `@qwik.dev/core/optimizer` but not exported at runtime.
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("node_modules/@qwik.dev/core/package.json", "utf8"));
const entry = pkg.exports["./optimizer"];
const typesPath = `node_modules/@qwik.dev/core/${(entry.types ?? entry.import?.types).replace(/^\.\//, "")}`;
const declared = /export declare const createOptimizer/.test(readFileSync(typesPath, "utf8"));
const mod = await import("@qwik.dev/core/optimizer");
console.log(`@qwik.dev/core ${pkg.version}`);
console.log(`createOptimizer declared in ${typesPath}: ${declared}`);
console.log(`runtime exports of @qwik.dev/core/optimizer: ${Object.keys(mod).join(", ")}`);
console.log(`typeof createOptimizer at runtime: ${typeof mod.createOptimizer}`);
