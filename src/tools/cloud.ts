interface CloudControl {
  id: string;
  title: string;
  cloud_guidance: string;
}

interface CloudSection {
  id: string;
  name: string;
  controls: CloudControl[];
}

interface CloudData {
  standard: string;
  version: string;
  description: string;
  sections: CloudSection[];
}

let data: CloudData | null = null;

async function load(): Promise<CloudData> {
  if (data) return data;
  const file = Bun.file(
    new URL("../data/iso-27017-controls.json", import.meta.url).pathname
  );
  data = (await file.json()) as CloudData;
  return data;
}

function allControls(d: CloudData): CloudControl[] {
  return d.sections.flatMap((s) => s.controls);
}

export async function lookupCloudControl(controlId: string) {
  const d = await load();
  const normalized = controlId.toUpperCase().replace(/^CLD\.?/, "CLD.");
  const control = allControls(d).find(
    (c) => c.id.toUpperCase() === normalized
  );
  return control ?? null;
}

export async function searchCloudControls(query: string) {
  const d = await load();
  const q = query.toLowerCase();
  return allControls(d)
    .filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.cloud_guidance.toLowerCase().includes(q)
    )
    .map((c) => ({ id: c.id, title: c.title }));
}

export async function listCloudSection(sectionId: string) {
  const d = await load();
  const section = d.sections.find((s) => s.id === sectionId);
  if (!section) return null;
  return section.controls.map((c) => ({ id: c.id, title: c.title }));
}

export async function listCloudSections() {
  const d = await load();
  return d.sections.map((s) => ({
    id: s.id,
    name: s.name,
    controlCount: s.controls.length,
  }));
}
