import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");
const W = 1284;
const H = 2778;

const c = {
  bg: "#efe0be",
  paper: "#fff8e6",
  card: "#f9edcf",
  ink: "#24201a",
  muted: "#8d7358",
  blue: "#dff3ff",
  red: "#b42318",
  redSoft: "#ffd6d6",
  gold: "#ffd166",
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function frame(content) {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    ${Array.from({ length: 46 }, (_, i) => `<path d="M${i * 28} 0V${H}" stroke="rgba(36,32,26,0.05)" stroke-width="2"/>`).join("")}
    ${Array.from({ length: 100 }, (_, i) => `<path d="M0 ${i * 28}H${W}" stroke="rgba(36,32,26,0.05)" stroke-width="2"/>`).join("")}
    ${content}
  </svg>`;
}

function header(title, subtitle) {
  return `
    <rect x="54" y="54" width="1176" height="270" fill="${c.paper}" stroke="${c.ink}" stroke-width="5"/>
    <text x="92" y="126" font-family="Courier New, monospace" font-size="34" font-weight="900" fill="${c.muted}">PROOF POSTCARD</text>
    <text x="92" y="212" font-family="Arial, sans-serif" font-size="76" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    <text x="96" y="274" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="${c.muted}">${esc(subtitle)}</text>
  `;
}

function card(x, y, w, h, label, lines, fill = c.paper) {
  return `
    <rect x="${x + 8}" y="${y + 8}" width="${w}" height="${h}" fill="${c.ink}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${c.ink}" stroke-width="5"/>
    <text x="${x + 28}" y="${y + 54}" font-family="Courier New, monospace" font-size="22" font-weight="900" fill="${c.muted}">${esc(label)}</text>
    ${lines.map((line, i) => `<text x="${x + 28}" y="${y + 112 + i * 40}" font-family="Arial, sans-serif" font-size="${i === 0 ? 36 : 28}" font-weight="900" fill="${c.ink}">${esc(line)}</text>`).join("")}
  `;
}

function postcard(x, y, title, place, stamp, note) {
  const lines = wrap(note, 36);
  return `
    <rect x="${x + 12}" y="${y + 12}" width="1030" height="760" fill="${c.ink}"/>
    <rect x="${x}" y="${y}" width="1030" height="760" fill="${c.paper}" stroke="${c.ink}" stroke-width="5"/>
    <rect x="${x + 42}" y="${y + 42}" width="650" height="676" fill="${c.card}" stroke="${c.muted}" stroke-width="4" stroke-dasharray="14 12"/>
    <path d="M${x + 724} ${y + 42}V${y + 718}" stroke="${c.muted}" stroke-width="4" stroke-dasharray="14 12"/>
    <text x="${x + 78}" y="${y + 112}" font-family="Courier New, monospace" font-size="26" font-weight="900" fill="${c.muted}">PROOF POSTCARD</text>
    <text x="${x + 78}" y="${y + 210}" font-family="Arial, sans-serif" font-size="60" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    <rect x="${x + 78}" y="${y + 258}" width="430" height="66" fill="${c.blue}" stroke="${c.ink}" stroke-width="4"/>
    <text x="${x + 102}" y="${y + 302}" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="${c.ink}">${esc(place)}</text>
    ${lines.map((line, i) => `<text x="${x + 78}" y="${y + 398 + i * 42}" font-family="Arial, sans-serif" font-size="31" font-weight="700" fill="${c.ink}">${esc(line)}</text>`).join("")}
    <rect x="${x + 774}" y="${y + 82}" width="190" height="190" fill="${c.redSoft}" stroke="${c.ink}" stroke-width="5"/>
    <g transform="translate(${x + 870} ${y + 178}) rotate(-9)">
      <rect x="-74" y="-46" width="148" height="92" fill="none" stroke="${c.red}" stroke-width="8"/>
      <text x="0" y="10" text-anchor="middle" font-family="Courier New, monospace" font-size="24" font-weight="900" fill="${c.red}">${esc(stamp)}</text>
    </g>
    <path d="M${x + 774} ${y + 382}H${x + 964}" stroke="${c.muted}" stroke-width="4"/>
    <path d="M${x + 774} ${y + 462}H${x + 964}" stroke="${c.muted}" stroke-width="4"/>
    <path d="M${x + 774} ${y + 542}H${x + 964}" stroke="${c.muted}" stroke-width="4"/>
  `;
}

function screenshot1() {
  return frame(`
    ${header("Mail proof on Base.", "Write a title, place, stamp, and proof note.")}
    ${card(72, 380, 548, 245, "COMPOSER", ["Demo Day Proof", "Base Builder Space", "ATTENDED"], c.gold)}
    ${card(664, 380, 548, 245, "FAST READ", ["Postcard proof", "Clear sender and timestamp"], c.blue)}
    ${postcard(127, 700, "Demo Day Proof", "Base Builder Space", "ATTENDED", "A simple postcard proof for a place, launch, event, or milestone worth remembering on Base.")}
    <rect x="72" y="2528" width="1140" height="116" fill="${c.gold}" stroke="${c.ink}" stroke-width="5"/>
    <text x="642" y="2600" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="${c.ink}">SAVE ON BASE</text>
  `);
}

function screenshot2() {
  return frame(`
    ${header("A proof that feels human.", "The postcard view makes a small milestone easier to understand and revisit.")}
    ${postcard(127, 390, "Launch Proof", "Online Studio", "SHIPPED", "This marks the day the small product went live, with enough context to remember what happened.")}
    ${card(72, 1240, 548, 245, "USE CASES", ["Events, launches, visits", "Milestones and attendance"], c.paper)}
    ${card(664, 1240, 548, 245, "CHAIN VALUE", ["Sender and timestamp", "Loadable by ID"], c.paper)}
  `);
}

function screenshot3() {
  return frame(`
    ${header("Look up prior postcards.", "Enter an ID to reload the place, stamp, note, sender, and date.")}
    ${card(72, 380, 1140, 230, "LOOKUP", ["Postcard ID 12", "Sender 0x9936...9652", "Saved on Base"], c.blue)}
    ${postcard(127, 690, "Meetup Proof", "Builder Cafe", "ATTENDED", "A compact proof for a meetup, saved with place, stamp, sender, and a short note.")}
    ${card(72, 1530, 548, 245, "ARCHIVE", ["Small public proofs", "No long feed needed"], c.paper)}
    ${card(664, 1530, 548, 245, "READER", ["Know what happened", "Read it like mail"], c.gold)}
  `);
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${c.bg}"/>
    <rect x="132" y="198" width="760" height="568" fill="${c.paper}" stroke="${c.ink}" stroke-width="28"/>
    <path d="M664 238V726" stroke="${c.muted}" stroke-width="16" stroke-dasharray="38 24"/>
    <rect x="712" y="280" width="128" height="128" fill="${c.redSoft}" stroke="${c.ink}" stroke-width="16"/>
    <text x="236" y="392" font-family="Arial, sans-serif" font-size="80" font-weight="900" fill="${c.ink}">PROOF</text>
    <text x="236" y="500" font-family="Arial, sans-serif" font-size="80" font-weight="900" fill="${c.ink}">CARD</text>
    <path d="M236 612H560" stroke="${c.muted}" stroke-width="16"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1910" height="1000" fill="${c.bg}"/>
    <text x="96" y="168" font-family="Arial, sans-serif" font-size="116" font-weight="900" fill="${c.ink}">Proof Postcard</text>
    <text x="102" y="236" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="${c.muted}">Create compact postcard proofs on Base.</text>
    ${postcard(140, 315, "Demo Day Proof", "Base Builder Space", "ATTENDED", "A simple postcard proof for a place, launch, event, or milestone worth remembering on Base.")}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).jpeg({ quality: 86, mozjpeg: true }).toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

await writeFile(
  join(outDir, "asset-manifest.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2),
  "utf8",
);

for (const file of files) console.log(file);
