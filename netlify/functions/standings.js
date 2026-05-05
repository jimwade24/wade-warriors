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

const CODE_LABELS = {
  "B01B":"Boys · 1st Degree BB · Age 9-10",
  "B01C":"Boys · 1st Degree BB · Age 11-12",
  "B01D":"Boys · 1st Degree BB · Age 13-14",
  "B01E":"Boys · 1st Degree BB · Age 15-17",
  "B123A":"Boys · 1st-3rd Degree BB · Age 1-8",
  "B23B":"Boys · 2nd/3rd Degree BB · Age 9-10",
  "B23C":"Boys · 2nd/3rd Degree BB · Age 11-12",
  "B23D":"Boys · 2nd/3rd Degree BB · Age 13-14",
  "B23E":"Boys · 2nd/3rd Degree BB · Age 15-17",
  "BCOA":"Boys · Color Belt · Age 1-8",
  "BCOB":"Boys · Color Belt · Age 9-10",
  "BCOC":"Boys · Color Belt · Age 11-12",
  "BCOD":"Boys · Color Belt · Age 13-14",
  "BCOE":"Boys · Color Belt · Age 15-17",
  "BCAA":"Boys · Special Abilities Color Belt",
  "G01B":"Girls · 1st Degree BB · Age 9-10",
  "G01C":"Girls · 1st Degree BB · Age 11-12",
  "G01D":"Girls · 1st Degree BB · Age 13-14",
  "G01E":"Girls · 1st Degree BB · Age 15-17",
  "G123A":"Girls · 1st-3rd Degree BB · Age 1-8",
  "G23B":"Girls · 2nd/3rd Degree BB · Age 9-10",
  "G23C":"Girls · 2nd/3rd Degree BB · Age 11-12",
  "G23D":"Girls · 2nd/3rd Degree BB · Age 13-14",
  "G23E":"Girls · 2nd/3rd Degree BB · Age 15-17",
  "GCOA":"Girls · Color Belt · Age 1-8",
  "GCOB":"Girls · Color Belt · Age 9-10",
  "GCOC":"Girls · Color Belt · Age 11-12",
  "GCOD":"Girls · Color Belt · Age 13-14",
  "GCOE":"Girls · Color Belt · Age 15-17",
  "GCAA":"Girls · Special Abilities Color Belt",
  "A01F":"Adults · 1st Degree BB · Women",
  "A01G":"Adults · 1st Degree BB · Men",
  "A23F":"Adults · 2nd/3rd Degree BB · Women",
  "A23G":"Adults · 2nd/3rd Degree BB · Men",
  "ACOF":"Adults · Color Belt · Women",
  "ACOG":"Adults · Color Belt · Men",
  "WB01B":"Boys · 1st Degree BB · Age 9-10",
  "WB01C":"Boys · 1st Degree BB · Age 11-12",
  "WB01D":"Boys · 1st Degree BB · Age 13-14",
  "WB01E":"Boys · 1st Degree BB · Age 15-17",
  "WB123A":"Boys · 1st-3rd Degree BB · Age 1-8",
  "WB23B":"Boys · 2nd/3rd Degree BB · Age 9-10",
  "WB23C":"Boys · 2nd/3rd Degree BB · Age 11-12",
  "WB23D":"Boys · 2nd/3rd Degree BB · Age 13-14",
  "WB23E":"Boys · 2nd/3rd Degree BB · Age 15-17",
  "WBCOA":"Boys · Color Belt · Age 1-8",
  "WBCOB":"Boys · Color Belt · Age 9-10",
  "WBCOC":"Boys · Color Belt · Age 11-12",
  "WBCOD":"Boys · Color Belt · Age 13-14",
  "WBCOE":"Boys · Color Belt · Age 15-17",
  "WG01B":"Girls · 1st Degree BB · Age 9-10",
  "WG01C":"Girls · 1st Degree BB · Age 11-12",
  "WG01D":"Girls · 1st Degree BB · Age 13-14",
  "WG01E":"Girls · 1st Degree BB · Age 15-17",
  "WG123A":"Girls · 1st-3rd Degree BB · Age 1-8",
  "WG23B":"Girls · 2nd/3rd Degree BB · Age 9-10",
  "WG23C":"Girls · 2nd/3rd Degree BB · Age 11-12",
  "WG23D":"Girls · 2nd/3rd Degree BB · Age 13-14",
  "WG23E":"Girls · 2nd/3rd Degree BB · Age 15-17",
  "WGCOA":"Girls · Color Belt · Age 1-8",
  "WGCOB":"Girls · Color Belt · Age 9-10",
  "WGCOC":"Girls · Color Belt · Age 11-12",
  "WGCOD":"Girls · Color Belt · Age 13-14",
  "WGCOE":"Girls · Color Belt · Age 15-17",
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://atamartialarts.com/",
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
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

// Parse the HTML page - each page has ONE discipline (Forms OR Weapons OR Sparring)
// We extract discipline from the bullet list on the page itself
function parseHtml(html, code) {
  const athletes = [];
  const baseLabel = CODE_LABELS[code] || code;

  // Extract discipline from bullet list (first bullet is always Forms, Weapons, or Sparring)
  const bulletMatches = html.match(/<li>\s*(.*?)\s*<\/li>/gi) || [];
  const bullets = bulletMatches
    .map(b => b.replace(/<[^>]+>/g, "").trim())
    .filter(b => b && !b.includes("following tournaments") && b.length < 60);
  const discipline = bullets[0] || ""; // e.g. "Forms", "Weapons", "Sparring"
  const category = discipline ? `${baseLabel} · ${discipline}` : baseLabel;

  // Parse table rows
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

// Each category page on ATA actually covers multiple disciplines (Forms, Weapons, Sparring)
// shown as separate tables on the same page. We need to parse all of them.
function parseAllDisciplines(html, code) {
  const athletes = [];
  const baseLabel = CODE_LABELS[code] || code;

  // Split the page by discipline sections using the bullet list headers
  // Each section starts with a <ul> containing discipline info
  // Strategy: find all table blocks and associate each with nearby bullet lists
  
  // Find all <ul>...</ul> blocks and <table>...</table> blocks with their positions
  const sections = [];
  const ulRegex = /<ul>([\s\S]*?)<\/ul>/gi;
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  
  let ulMatch, tableMatch;
  const uls = [];
  const tables = [];
  
  while ((ulMatch = ulRegex.exec(html)) !== null) {
    const bullets = (ulMatch[1].match(/<li>([\s\S]*?)<\/li>/gi) || [])
      .map(b => b.replace(/<[^>]+>/g, "").trim())
      .filter(b => b && b.length < 80 && !b.includes("following tournaments"));
    if (bullets.length > 0) {
      uls.push({ pos: ulMatch.index, bullets });
    }
  }
  
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    tables.push({ pos: tableMatch.index, html: tableMatch[0] });
  }

  // For each table, find the closest preceding <ul> to get the discipline
  for (const table of tables) {
    // Find the last <ul> that appears before this table
    const precedingUls = uls.filter(u => u.pos < table.pos);
    const closestUl = precedingUls.length > 0 ? precedingUls[precedingUls.length - 1] : null;
    const discipline = closestUl ? (closestUl.bullets[0] || "") : "";
    const category = discipline ? `${baseLabel} · ${discipline}` : baseLabel;

    // Parse this table's rows
    const rows = table.html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
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
  }

  // Fallback to simple parse if nothing found
  if (athletes.length === 0) return parseHtml(html, code);
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
    const chunkSize = 8;

    for (let i = 0; i < codes.length; i += chunkSize) {
      const chunk = codes.slice(i, i + chunkSize);
      const results = await Promise.allSettled(
        chunk.map(async (code) => {
          try {
            const html = await fetchUrl(baseUrl + code);
            return parseAllDisciplines(html, code);
          } catch(e) { return []; }
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled") allAthletes.push(...r.value);
      }
    }

    // Deduplicate by name + place + category (now includes discipline so Forms/Weapons won't clash)
    const seen = new Set();
    const athletes = allAthletes.filter(a => {
      const key = `${a.name}|${a.place}|${a.category}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by name first, then place within each athlete
    athletes.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return a.place - b.place;
    });

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
