const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const root = path.resolve(__dirname, "..");
const source = JSON.parse(fs.readFileSync(path.join(__dirname, "legacy-dashboard-source.json"), "utf8"));
const page = zlib.gunzipSync(Buffer.from(source.page, "base64"));
const css = zlib.gunzipSync(Buffer.from(source.css, "base64"));

fs.writeFileSync(path.join(root, "app/dashboard/page.tsx"), page);
fs.writeFileSync(path.join(root, "app/dashboard/legacy.css"), css);
console.log("CircusPay ChatGPT Sites v25 restored exactly.");
