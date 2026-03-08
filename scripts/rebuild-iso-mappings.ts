/**
 * Rebuilds iso-27001-controls.json with official NIST mappings from
 * the NIST SP 800-53 Rev 5 to ISO 27001 OLIR spreadsheet.
 */
import XLSX from "xlsx";

const wb = XLSX.readFile(
  "/home/anomalous/.claude/projects/-home-anomalous-sv-security-compliance/b414d910-3cb6-43a6-bff8-b6fc37a20de1/tool-results/webfetch-1772930197690-qlo5vh.xlsx"
);

// Build official ISO->NIST map from all sheets
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

// Replace nist arrays with official mappings
let updated = 0;
let kept = 0;
for (const cat of currentData.categories) {
  for (const ctrl of cat.controls) {
    const official = officialMap[ctrl.id];
    if (official) {
      ctrl.nist = [...official].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      );
      updated++;
    } else {
      // Keep existing mapping for controls not in the official spreadsheet
      console.log(`Kept existing mapping for ${ctrl.id} (no official mapping found)`);
      kept++;
    }
  }
}

// Add source metadata
currentData.nist_mapping_source = {
  document: "NIST SP 800-53 Rev 5 to ISO 27001 Mapping (OLIR)",
  url: "https://csrc.nist.gov/projects/olir/informative-reference-catalog/details?referenceId=99",
  last_updated: "2023-10-12",
};

await Bun.write(
  "src/data/iso-27001-controls.json",
  JSON.stringify(currentData, null, 2)
);

console.log(`\nUpdated ${updated} controls with official NIST mappings`);
console.log(`Kept ${kept} controls with existing mappings (no official data)`);
