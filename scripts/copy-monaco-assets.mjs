import { cp, mkdir } from "node:fs/promises";

const source = new URL("../node_modules/monaco-editor/min/vs/", import.meta.url);
const destination = new URL("../public/monaco/vs/", import.meta.url);

await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true, force: true });
