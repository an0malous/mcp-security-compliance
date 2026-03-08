/**
 * Parses the CTID NIST-to-ATT&CK mapping JSON into a compact format
 * for the MCP server. Groups by ATT&CK technique with mapped NIST controls.
 *
 * Source: Center for Threat-Informed Defense (MITRE Engenuity)
 * https://github.com/center-for-threat-informed-defense/mappings-explorer
 */

interface MappingObject {
  capability_id: string | null;
  capability_description: string;
  capability_group: string | null;
  mapping_type: string | null;
  attack_object_id: string;
  attack_object_name: string;
  comments: string;
  status: string;
}

interface RawData {
  metadata: {
    attack_version: string;
    mapping_framework: string;
    mapping_framework_version: string;
    last_update: string;
    capability_groups: Record<string, string>;
  };
  mapping_objects: MappingObject[];
}

const raw: RawData = await Bun.file(
  "src/data/nist-to-attack-mapping-ctid.json"
).json();

// Group by ATT&CK technique
const techniqueMap: Record<
  string,
  { name: string; nist: Record<string, { description: string; group: string }> }
> = {};

for (const obj of raw.mapping_objects) {
  if (obj.status === "non_mappable" || !obj.capability_id) continue;

  const techId = obj.attack_object_id;
  if (!techniqueMap[techId]) {
    techniqueMap[techId] = { name: obj.attack_object_name, nist: {} };
  }

  // Normalize NIST ID: CM-03 -> CM-3
  const nistId = obj.capability_id.replace(/-0+(\d)/, "-$1");
  if (!techniqueMap[techId].nist[nistId]) {
    techniqueMap[techId].nist[nistId] = {
      description: obj.capability_description,
      group: obj.capability_group || "",
    };
  }
}

// Also build reverse map: NIST -> techniques
const nistMap: Record<
  string,
  { description: string; group: string; techniques: Record<string, string> }
> = {};

for (const [techId, tech] of Object.entries(techniqueMap)) {
  for (const [nistId, nistInfo] of Object.entries(tech.nist)) {
    if (!nistMap[nistId]) {
      nistMap[nistId] = {
        description: nistInfo.description,
        group: nistInfo.group,
        techniques: {},
      };
    }
    nistMap[nistId].techniques[techId] = tech.name;
  }
}

// Build compact output
const output = {
  source: {
    project: "Center for Threat-Informed Defense (MITRE Engenuity)",
    repository:
      "https://github.com/center-for-threat-informed-defense/mappings-explorer",
    attack_version: raw.metadata.attack_version,
    nist_version: `SP 800-53 ${raw.metadata.mapping_framework_version}`,
    last_update: raw.metadata.last_update,
    mapping_type: "mitigates",
  },
  capability_groups: raw.metadata.capability_groups,
  // Techniques sorted by ID
  techniques: Object.entries(techniqueMap)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([id, t]) => ({
      id,
      name: t.name,
      nist_controls: Object.keys(t.nist).sort(),
    })),
  // NIST controls sorted by ID
  nist_controls: Object.entries(nistMap)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([id, n]) => ({
      id,
      description: n.description,
      group: n.group,
      techniques: Object.entries(n.techniques)
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([tid, tname]) => ({ id: tid, name: tname })),
    })),
};

const outPath = "src/data/attack-nist-mappings.json";
await Bun.write(outPath, JSON.stringify(output, null, 2));

console.log(`Techniques: ${output.techniques.length}`);
console.log(`NIST controls: ${output.nist_controls.length}`);
console.log(
  `Total mappings: ${output.techniques.reduce((s, t) => s + t.nist_controls.length, 0)}`
);
console.log(`Written to ${outPath}`);
