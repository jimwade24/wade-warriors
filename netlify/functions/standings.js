// netlify/functions/standings.js
const https = require("https");

const STATE_CODES = [
  "B01B","B01C","B01D","B01E","B123A","B23B","B23C","B23D","B23E",
  "BCOA","BCOB","BCOC","BCOD","BCOE","BCAA",
  "G01B","G01C","G01D","G01E","G123A","G23B","G23C","G23D","G23E",
  "GCOA","GCOB","GCOC","GCOD","GCOE","GCAA",
  "A01F","A01G","A23F","A23G","ACOF","ACOG"
];

const WORLDS_CODES = [
  "WB01B","WB01C","WB01D","WB01E","WB123A","WB23B","WB23C","WB23D","WB23E",
  "WBCOA","WBCOB","WBCOC","WBCOD","WBCOE",
  "WG01B","WG01C","WG01D","WG01E","WG123A","WG23B","WG23C","WG23D","WG23E",
  "WGCOA","WGCOB","WGCOC","WGCOD","WGCOE"
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WadeWarriorsApp/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

function parsePage(html, code, type) {
  const athletes = [];
  const bulletMatches = html.match(/<li>\s*(.*?)\s*<\/li>/gi) || [];
  const bullets = bulletMatches
    .map(b => b.replace(/<[^>]+>/g, "").trim())
    .filter(b => b && !b.includes("following tournaments") && b.length < 60);
  const category = bullets.slice(0, 4).join(" · ") || code;

  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const row of rows) {
    const cells = [];
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let m;
    while ((m = cellRe.exec(row)) !== null) {
      cells.push(m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim());
    }
    if (cells.length < 4) continue;
    const place = parseInt(cells[0]);
    if (isNaN(place)) continue;
    const name = cells[1] || "";
    const pts = parseInt(cells[2]) || 0;
    const location = cells[3] || "";
    if (location.toUpperCase().includes("FRANKLIN PARK")) {
      athletes.push({ place, name, pts, location, category });
    }
  }
  return athletes;
}

exports.handler = async function(event) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const type = (event.queryStringParameters || {}).type || "state";
  const codes = type === "worlds" ? WORLDS_CODES : STATE_CODES;
  const baseUrl = type === "worlds"
    ? "https://atamartialarts.com/events/tournament-standings/worlds-standings/?code="
    : "https://atamartialarts.com/events/tournament-standings/state-standings?country=US&state=il&code=";

  try {
    const allAthletes = [];
    const chunkSize = 10;
    for (let i = 0; i < codes.length; i += chunkSize) {
      const chunk = codes.slice(i, i + chunkSize);
      const results = await Promise.allSettled(
        chunk.map(code =>
          fetchUrl(baseUrl + code)
            .then(html => parsePage(html, code, type))
            .catch(() => [])
        )
      );
      for (const r of results) {
        if (r.status === "fulfilled") allAthletes.push(...r.value);
      }
    }

    const seen = new Set();
    const athletes = allAthletes.filter(a => {
      const key = `${a.name}|${a.category}|${a.place}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    athletes.sort((a, b) => a.place - b.place);

    const updated = new Date().toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric"
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ athletes, updated, count: athletes.length }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message, athletes: [] }),
    };
  }
};
