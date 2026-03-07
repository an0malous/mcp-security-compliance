/**
 * Parses the NIST OSCAL SP 800-53 rev5 catalog JSON into a clean format
 * for the MCP server.
 *
 * Usage: bun run scripts/parse-oscal.ts <path-to-oscal-json>
 */

interface OscalPart {
  id?: string;
  name: string;
  prose?: string;
  parts?: OscalPart[];
}

interface OscalControl {
  id: string;
  title: string;
  params?: { id: string; label?: string }[];
  parts?: OscalPart[];
  controls?: OscalControl[];
  links?: { href: string; rel: string }[];
}

interface OscalGroup {
  id: string;
  title: string;
  controls: OscalControl[];
}

function extractProse(part: OscalPart): string {
  let text = part.prose || "";
  if (part.parts) {
    for (const p of part.parts) {
      const nested = extractProse(p);
      if (nested) text += "\n" + nested;
    }
  }
  return text.trim();
}

function cleanParamRefs(text: string): string {
  return text.replace(/\{\{\s*insert:\s*param,\s*[\w.-]+\s*\}\}/g, "[org-defined]");
}

function parseControl(control: OscalControl) {
  const statementPart = control.parts?.find((p) => p.name === "statement");
  const guidancePart = control.parts?.find((p) => p.name === "guidance");

  const statement = statementPart ? cleanParamRefs(extractProse(statementPart)) : "";
  const guidance = guidancePart ? cleanParamRefs(guidancePart.prose || "") : "";

  const relatedControls = control.links
    ?.filter((l) => l.rel === "related")
    .map((l) => l.href.replace(/^#/, "").toUpperCase()) || [];

  const enhancements = control.controls?.map(parseControl) || [];

  return {
    id: control.id.toUpperCase(),
    title: control.title,
    statement,
    guidance,
    related_controls: relatedControls,
    enhancements,
  };
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: bun run scripts/parse-oscal.ts <oscal-json-path>");
    process.exit(1);
  }

  const raw = await Bun.file(inputPath).json();
  const groups: OscalGroup[] = raw.catalog.groups;

  const output = {
    standard: "NIST SP 800-53",
    version: raw.catalog.metadata.version,
    last_modified: raw.catalog.metadata["last-modified"],
    families: groups.map((g) => {
      const controls = g.controls.map(parseControl);
      return {
        id: g.id.toUpperCase(),
        name: g.title,
        controls,
      };
    }),
  };

  const totalControls = output.families.reduce((sum, f) => sum + f.controls.length, 0);
  const totalEnhancements = output.families.reduce(
    (sum, f) => sum + f.controls.reduce((s, c) => s + c.enhancements.length, 0),
    0
  );

  const outPath = new URL("../src/data/nist-800-53.json", import.meta.url).pathname;
  await Bun.write(outPath, JSON.stringify(output, null, 2));

  console.log(`Parsed ${totalControls} controls + ${totalEnhancements} enhancements`);
  console.log(`Written to ${outPath}`);
}

main().catch(console.error);
