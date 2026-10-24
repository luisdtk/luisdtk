import { writeFile } from "node:fs/promises";

const USER = process.env.USERNAME;
const TOKEN = process.env.GITHUB_TOKEN;
const OUT = process.env.OUTPUT || "github-metrics.svg";

const QUERY = `query($login: String!) {
  user(login: $login) {
    name login avatarUrl(size: 24) createdAt
    followers { totalCount } following { totalCount }
    starredRepositories { totalCount } watching { totalCount }
    organizations { totalCount }
    pullRequests { totalCount } issues { totalCount } issueComments { totalCount }
    repositoriesContributedTo { totalCount }
    repositories(ownerAffiliations: OWNER, first: 100, orderBy: {field: PUSHED_AT, direction: DESC}) {
      totalCount
      nodes { stargazerCount forkCount primaryLanguage { name color } }
    }
    contributionsCollection {
      totalCommitContributions restrictedContributionsCount
      contributionCalendar { totalContributions weeks { contributionDays { contributionCount } } }
    }
  }
}`;

async function fetchData() {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.user;
}

async function toDataUri(url, mime) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${mime || res.headers.get("content-type")};base64,${buf.toString("base64")}`;
  } catch { return null; }
}

const C = { bg: "#000000", line: "#1f1f1f", text: "#f2f2f2", dim: "#6e6e6e", faint: "#3a3a3a", accent: "#e8e8e8" };
const GRID = ["#111111", "#3a3a3a", "#7a7a7a", "#bdbdbd", "#ffffff"];

const fmt = (n) => n >= 10000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const row = (label, value, x, y, w) =>
  `<text x="${x}" y="${y}" fill="${C.dim}">${label}</text>` +
  `<text x="${x + w}" y="${y}" fill="${C.text}" text-anchor="end">${fmt(value)}</text>`;

async function render(u) {
  const W = 800, H = 390, X = 40;
  const cc = u.contributionsCollection;
  const commits = cc.totalCommitContributions + cc.restrictedContributionsCount;
  const total = cc.contributionCalendar.totalContributions;
  const repos = u.repositories.nodes;
  const stars = repos.reduce((a, r) => a + r.stargazerCount, 0);
  const years = Math.max(0, Math.floor((Date.now() - new Date(u.createdAt)) / 3.15576e10));
  const lvlRaw = Math.sqrt(total / 5);
  const level = Math.floor(lvlRaw) + 1;
  const xpPct = lvlRaw - Math.floor(lvlRaw);

  const langs = {};
  repos.forEach((r) => r.primaryLanguage && (langs[r.primaryLanguage.name] = (langs[r.primaryLanguage.name] || 0) + 1));
  const top = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n]) => n.toUpperCase());

  const fontUri = await toDataUri("https://cdn.jsdelivr.net/npm/@fontsource/press-start-2p@5.0.20/files/press-start-2p-latin-400-normal.woff2", "font/woff2");

  const name = esc((u.name || u.login).toUpperCase());
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
<style>
${fontUri ? `@font-face{font-family:P2P;src:url(${fontUri}) format("woff2")}` : ""}
text{font-family:P2P,"Press Start 2P",monospace;font-size:8px}
.l{font-size:20px}.h{font-size:8px;letter-spacing:1px}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
.cur{animation:blink 1s steps(1) infinite}
</style>
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="${C.line}" stroke-width="2"/>`;

  s += `<text x="${X}" y="62" class="l" fill="${C.text}">${name}</text>`;
  s += `<rect x="${X + name.length * 20 + 6}" y="44" width="14" height="18" fill="${C.text}" class="cur"/>`;
  s += `<text x="${X}" y="86" fill="${C.dim}">@${esc(u.login)}  /  ${years} YEARS ON GITHUB${top.length ? "  /  " + esc(top.join(" · ")) : ""}</text>`;

  const bx = W - X - 200;
  s += `<text x="${bx}" y="50" fill="${C.dim}">LVL</text><text x="${W - X}" y="50" fill="${C.text}" text-anchor="end">${level}</text>`;
  s += `<rect x="${bx}" y="60" width="200" height="6" fill="${C.line}"/><rect x="${bx}" y="60" width="${Math.round(200 * xpPct / 4) * 4}" height="6" fill="${C.text}"/>`;
  s += `<text x="${W - X}" y="86" fill="${C.faint}" text-anchor="end">${total} XP</text>`;

  for (let x = X; x < W - X; x += 8) s += `<rect x="${x}" y="108" width="4" height="2" fill="${C.faint}"/>`;

  const cw = 320, c2 = W - X - cw;
  s += `<text x="${X}" y="140" class="h" fill="${C.faint}">ACTIVITY</text><text x="${c2}" y="140" class="h" fill="${C.faint}">COMMUNITY</text>`;
  [["COMMITS", commits], ["PULL REQUESTS", u.pullRequests.totalCount], ["ISSUES", u.issues.totalCount], ["COMMENTS", u.issueComments.totalCount]]
    .forEach(([l, v], i) => (s += row(l, v, X, 166 + i * 20, cw)));
  [["REPOSITORIES", u.repositories.totalCount], ["STARS EARNED", stars], ["FOLLOWERS", u.followers.totalCount], ["CONTRIBUTED TO", u.repositoriesContributedTo.totalCount]]
    .forEach(([l, v], i) => (s += row(l, v, c2, 166 + i * 20, cw)));

  const weeks = cc.contributionCalendar.weeks.slice(-52);
  const days = weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount));
  const max = Math.max(1, ...days);
  const cell = 8, gap = 2, gy = 300, gx = W - X - weeks.length * (cell + gap) + gap;
  weeks.forEach((w, i) => w.contributionDays.forEach((d, j) => {
    const lv = d.contributionCount === 0 ? 0 : Math.min(4, Math.ceil((d.contributionCount / max) * 4));
    s += `<rect x="${gx + i * (cell + gap)}" y="${gy + j * (cell + gap) - 30}" width="${cell}" height="${cell}" fill="${GRID[lv]}"/>`;
  }));
  s += `<text x="${X}" y="${gy - 22}" class="h" fill="${C.faint}">LAST YEAR</text>`;
  s += `<text x="${X}" y="${gy + 4}" fill="${C.text}">${total}</text><text x="${X}" y="${gy + 20}" fill="${C.dim}">CONTRIBUTIONS</text>`;

  s += `<text x="${W - X}" y="${H - 22}" fill="${C.faint}" text-anchor="end" style="font-size:6px">UPDATED ${new Date().toISOString().slice(0, 10)}</text>`;
  return s + `</svg>`;
}

const data = await fetchData();
await writeFile(OUT, await render(data));
console.log(`✔ ${OUT} gerado`);
