// ISO 27001 types
export interface IsoControl {
  id: string;
  title: string;
  description: string;
  category: string;
  theme: string;
  guidance: string;
  evidence_examples: string[];
}

export interface IsoCategory {
  id: string;
  name: string;
  controls: IsoControl[];
}

export interface IsoData {
  standard: string;
  version: string;
  categories: IsoCategory[];
}

// NIST 800-53 types
export interface NistControl {
  id: string;
  title: string;
  statement: string;
  guidance: string;
  related_controls: string[];
  enhancements: NistControl[];
}

export interface NistFamily {
  id: string;
  name: string;
  controls: NistControl[];
}

export interface NistData {
  standard: string;
  version: string;
  last_modified: string;
  families: NistFamily[];
}
