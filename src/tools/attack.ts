interface AttackTechnique {
  id: string;
  name: string;
  nist_controls: string[];
}

interface NistEntry {
  id: string;
  description: string;
  group: string;
  techniques: { id: string; name: string }[];
}

interface AttackData {
  source: {
    project: string;
    repository: string;
    attack_version: string;
    nist_version: string;
    last_update: string;
    mapping_type: string;
  };
  capability_groups: Record<string, string>;
  techniques: AttackTechnique[];
  nist_controls: NistEntry[];
}

let data: AttackData | null = null;

async function load(): Promise<AttackData> {
  if (data) return data;
  const file = Bun.file(
    new URL("../data/attack-nist-mappings.json", import.meta.url).pathname
  );
  data = (await file.json()) as AttackData;
  return data;
}

export async function lookupAttackTechnique(techniqueId: string) {
  const d = await load();
  const normalized = techniqueId.toUpperCase().replace(/^T?(\d)/, "T$1");
  const technique = d.techniques.find((t) => t.id === normalized);
  if (!technique) return null;
  return {
    source: d.source,
    technique,
  };
}

export async function searchAttackTechniques(query: string) {
  const d = await load();
  const q = query.toLowerCase();
  return d.techniques
    .filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    )
    .map((t) => ({
      id: t.id,
      name: t.name,
      nist_control_count: t.nist_controls.length,
    }));
}

export async function attackByNist(nistId: string) {
  const d = await load();
  const normalized = nistId.toUpperCase().replace(/_/g, "-");
  const entry = d.nist_controls.find((n) => n.id === normalized);
  if (!entry) return null;
  return {
    nist_control: {
      id: entry.id,
      description: entry.description,
      group: entry.group,
    },
    mitigated_techniques: entry.techniques,
    technique_count: entry.techniques.length,
  };
}

export async function nistByAttack(techniqueId: string) {
  const d = await load();
  const normalized = techniqueId.toUpperCase().replace(/^T?(\d)/, "T$1");
  const technique = d.techniques.find((t) => t.id === normalized);
  if (!technique) return null;
  return {
    technique: { id: technique.id, name: technique.name },
    mitigating_nist_controls: technique.nist_controls,
    control_count: technique.nist_controls.length,
  };
}

export async function listAttackTechniques() {
  const d = await load();
  // Return just top-level techniques (no sub-techniques) for the list view
  return d.techniques
    .filter((t) => !t.id.includes("."))
    .map((t) => ({
      id: t.id,
      name: t.name,
      nist_control_count: t.nist_controls.length,
    }));
}

export async function attackSource() {
  const d = await load();
  return {
    ...d.source,
    total_techniques: d.techniques.length,
    total_nist_controls: d.nist_controls.length,
    capability_groups: d.capability_groups,
  };
}
