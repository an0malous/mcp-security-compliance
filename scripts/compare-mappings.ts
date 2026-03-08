import XLSX from "xlsx";

const wb = XLSX.readFile(
  "/home/anomalous/.claude/projects/-home-anomalous-sv-security-compliance/b414d910-3cb6-43a6-bff8-b6fc37a20de1/tool-results/webfetch-1772930197690-qlo5vh.xlsx"
);

// Build official ISO->NIST map
const officialMap: Record<string, Set<string>> = {};
for (const name of wb.SheetNames) {
  if (name === "Definitions") continue;
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws) as any[];
  for (const row of rows) {
    const nistId = (row["Focal Document\r\nElement"] || "")
      .toString()
      .trim()
      .replace(/-0+(\d)/, "-$1");
    let isoRef = (row["Reference Document Element"] || "").toString().trim();
    if (!nistId || !isoRef) continue;
    if (/^[5-8]\.\d+/.test(isoRef)) isoRef = "A." + isoRef;
    if (!isoRef.startsWith("A.")) continue;
    if (!officialMap[isoRef]) officialMap[isoRef] = new Set();
    officialMap[isoRef].add(nistId);
  }
}

// Load current data
const currentData = await Bun.file("src/data/iso-27001-controls.json").json();

let matches = 0,
  mismatches = 0,
  missing = 0;

for (const cat of currentData.categories) {
  for (const ctrl of cat.controls) {
    const official = officialMap[ctrl.id]
      ? [...officialMap[ctrl.id]].sort()
      : null;
    const current = ctrl.nist ? [...ctrl.nist].sort() : [];

    if (!official) {
      console.log(
        "NO OFFICIAL MAP for " + ctrl.id + " (current: " + current.join(", ") + ")"
      );
      missing++;
      continue;
    }

    const officialStr = official.join(",");
    const currentStr = current.join(",");

    if (officialStr === currentStr) {
      matches++;
    } else {
      const inCurrentNotOfficial = current.filter(
        (x: string) => !official.includes(x)
      );
      const inOfficialNotCurrent = official.filter(
        (x: string) => !current.includes(x)
      );
      console.log(ctrl.id + ":");
      if (inCurrentNotOfficial.length)
        console.log(
          "  CURRENT has (not in official): " + inCurrentNotOfficial.join(", ")
        );
      if (inOfficialNotCurrent.length)
        console.log(
          "  OFFICIAL has (not in current): " + inOfficialNotCurrent.join(", ")
        );
      mismatches++;
    }
  }
}

console.log("\n--- SUMMARY ---");
console.log("Exact matches: " + matches);
console.log("Mismatches: " + mismatches);
console.log("No official mapping found: " + missing);
