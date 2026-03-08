import XLSX from "xlsx";

const wb = XLSX.readFile(
  "/home/anomalous/.claude/projects/-home-anomalous-sv-security-compliance/b414d910-3cb6-43a6-bff8-b6fc37a20de1/tool-results/webfetch-1772930197690-qlo5vh.xlsx"
);

const isoToNist: Record<string, Set<string>> = {};

for (const name of wb.SheetNames) {
  if (name === "Definitions") continue;
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws);

  for (const row of rows as any[]) {
    const nistId = (row["Focal Document\r\nElement"] || "").toString().trim();
    let isoRef = (row["Reference Document Element"] || "").toString().trim();

    if (!nistId || !isoRef) continue;

    // Normalize NIST ID: AC-01 -> AC-1
    const nistNorm = nistId.replace(/-0+(\d)/, "-$1");

    // Prefix with A. if it looks like an Annex A control (starts with 5-8 and has sub-number)
    if (/^[5-8]\.\d+/.test(isoRef)) {
      isoRef = "A." + isoRef;
    }

    // Only keep Annex A mappings
    if (!isoRef.startsWith("A.")) continue;

    if (!isoToNist[isoRef]) isoToNist[isoRef] = new Set();
    isoToNist[isoRef].add(nistNorm);
  }
}

// Sort and output
const sorted = Object.entries(isoToNist)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([iso, nistSet]) => ({ iso, nist: [...nistSet].sort() }));

console.log(JSON.stringify(sorted, null, 2));
