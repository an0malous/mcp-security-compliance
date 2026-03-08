import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  lookupControl,
  searchControls,
  listByCategory,
  listCategories,
} from "./tools/controls.js";
import {
  lookupNistControl,
  searchNistControls,
  listNistFamily,
  listNistFamilies,
} from "./tools/nist.js";
import {
  lookupCloudControl,
  searchCloudControls,
  listCloudSection,
  listCloudSections,
} from "./tools/cloud.js";
import {
  lookupNistCloudTopic,
  searchNistCloudTopics,
  listNistCloudBySource,
  listNistCloudSources,
} from "./tools/nist-cloud.js";
import {
  lookupAttackTechnique,
  searchAttackTechniques,
  attackByNist,
  nistByAttack,
  listAttackTechniques,
  attackSource,
} from "./tools/attack.js";

const server = new McpServer({
  name: "mcp-security-compliance",
  version: "0.1.0",
});

// --- ISO 27001 Tools ---

server.tool(
  "iso_lookup_control",
  "Look up an ISO 27001:2022 Annex A control by ID and get its mapped NIST 800-53 guidance. Summary by default, detailed=true for full NIST guidance.",
  {
    control_id: z.string().describe("Control ID, e.g. A.8.24"),
    detailed: z
      .boolean()
      .default(false)
      .describe("If true, return full NIST guidance text and enhancements"),
  },
  async ({ control_id, detailed }) => {
    const control = await lookupControl(control_id, detailed);
    if (!control) {
      return {
        content: [{ type: "text", text: `Control ${control_id} not found.` }],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(control, null, 2) }],
    };
  }
);

server.tool(
  "iso_search_controls",
  "Search ISO 27001:2022 Annex A controls by keyword",
  { query: z.string().describe("Search keyword or phrase") },
  async ({ query }) => {
    const results = await searchControls(query);
    if (results.length === 0) {
      return {
        content: [{ type: "text", text: `No controls matching "${query}".` }],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.tool(
  "iso_list_controls_by_category",
  "List all controls in an ISO 27001:2022 Annex A category",
  { category_id: z.string().describe("Category ID: A.5, A.6, A.7, or A.8") },
  async ({ category_id }) => {
    const controls = await listByCategory(category_id);
    if (!controls) {
      return {
        content: [{ type: "text", text: `Category ${category_id} not found.` }],
      };
    }
    const summary = controls
      .map((c: any) => `${c.id} - ${c.title} → NIST: ${c.nist_mappings.join(", ")}`)
      .join("\n");
    return { content: [{ type: "text", text: summary }] };
  }
);

server.tool(
  "iso_list_categories",
  "List all ISO 27001:2022 Annex A categories with control counts",
  {},
  async () => {
    const categories = await listCategories();
    const summary = categories
      .map((c) => `${c.id} - ${c.name} (${c.controlCount} controls)`)
      .join("\n");
    return { content: [{ type: "text", text: summary }] };
  }
);

// --- NIST 800-53 Tools ---

server.tool(
  "nist_lookup_control",
  "Look up a NIST 800-53 control by ID. Returns summary by default, set detailed=true for full guidance and enhancements.",
  {
    control_id: z.string().describe("Control ID, e.g. AC-1, SC-8, IA-2"),
    detailed: z
      .boolean()
      .default(false)
      .describe("If true, return full guidance text and enhancements"),
  },
  async ({ control_id, detailed }) => {
    const control = await lookupNistControl(control_id, detailed);
    if (!control) {
      return {
        content: [{ type: "text", text: `Control ${control_id} not found.` }],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(control, null, 2) }],
    };
  }
);

server.tool(
  "nist_search_controls",
  "Search NIST 800-53 controls by keyword across titles, statements, and guidance",
  { query: z.string().describe("Search keyword or phrase") },
  async ({ query }) => {
    const results = await searchNistControls(query);
    if (results.length === 0) {
      return {
        content: [{ type: "text", text: `No controls matching "${query}".` }],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.tool(
  "nist_list_family",
  "List all controls in a NIST 800-53 family (e.g. AC, SC, IA)",
  { family_id: z.string().describe("Family ID, e.g. AC, SC, IA, AU") },
  async ({ family_id }) => {
    const controls = await listNistFamily(family_id);
    if (!controls) {
      return {
        content: [{ type: "text", text: `Family ${family_id} not found.` }],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(controls, null, 2) }],
    };
  }
);

server.tool(
  "nist_list_families",
  "List all NIST 800-53 control families with control counts",
  {},
  async () => {
    const families = await listNistFamilies();
    const summary = families
      .map((f: any) => `${f.id} - ${f.name} (${f.control_count} controls)`)
      .join("\n");
    return { content: [{ type: "text", text: summary }] };
  }
);

// --- ISO 27017 Cloud Tools ---

server.tool(
  "cloud_lookup_control",
  "Look up an ISO 27017:2015 cloud security control by ID. Returns the control with cloud-specific guidance.",
  {
    control_id: z.string().describe("Control ID, e.g. CLD.9.5.1 or 10.1.1"),
  },
  async ({ control_id }) => {
    const control = await lookupCloudControl(control_id);
    if (!control) {
      return {
        content: [{ type: "text", text: `Control ${control_id} not found.` }],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(control, null, 2) }],
    };
  }
);

server.tool(
  "cloud_search_controls",
  "Search ISO 27017:2015 cloud security controls by keyword across titles and guidance",
  { query: z.string().describe("Search keyword or phrase") },
  async ({ query }) => {
    const results = await searchCloudControls(query);
    if (results.length === 0) {
      return {
        content: [{ type: "text", text: `No controls matching "${query}".` }],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.tool(
  "cloud_list_controls_by_section",
  "List all controls in an ISO 27017:2015 section",
  { section_id: z.string().describe("Section ID, e.g. 5, 6, 9, 12") },
  async ({ section_id }) => {
    const controls = await listCloudSection(section_id);
    if (!controls) {
      return {
        content: [{ type: "text", text: `Section ${section_id} not found.` }],
      };
    }
    const summary = controls
      .map((c: any) => `${c.id} - ${c.title}`)
      .join("\n");
    return { content: [{ type: "text", text: summary }] };
  }
);

server.tool(
  "cloud_list_sections",
  "List all ISO 27017:2015 sections with control counts",
  {},
  async () => {
    const sections = await listCloudSections();
    const summary = sections
      .map((s) => `${s.id} - ${s.name} (${s.controlCount} controls)`)
      .join("\n");
    return { content: [{ type: "text", text: summary }] };
  }
);

// --- NIST Cloud Guidance Tools ---

server.tool(
  "nist_cloud_lookup_topic",
  "Look up a NIST cloud security guidance topic by ID (e.g. SP800-144.4.5, SP800-210.3.1). Returns guidance from NIST SP 800-144, 800-210, or 800-146 with mapped NIST 800-53 controls.",
  {
    topic_id: z
      .string()
      .describe("Topic ID, e.g. SP800-144.4.5, SP800-210.3.1, SP800-146.9"),
  },
  async ({ topic_id }) => {
    const topic = await lookupNistCloudTopic(topic_id);
    if (!topic) {
      return {
        content: [{ type: "text", text: `Topic ${topic_id} not found.` }],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(topic, null, 2) }],
    };
  }
);

server.tool(
  "nist_cloud_search",
  "Search NIST cloud security guidance (SP 800-144, 800-210, 800-146) by keyword across topic titles and guidance text",
  {
    query: z
      .string()
      .describe("Search keyword or phrase, e.g. 'multi-tenancy', 'encryption', 'hypervisor'"),
  },
  async ({ query }) => {
    const results = await searchNistCloudTopics(query);
    if (results.length === 0) {
      return {
        content: [
          { type: "text", text: `No NIST cloud guidance matching "${query}".` },
        ],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.tool(
  "nist_cloud_list_by_source",
  "List all cloud security guidance topics from a specific NIST publication",
  {
    source_id: z
      .string()
      .describe("Publication ID: SP800-144, SP800-210, or SP800-146"),
  },
  async ({ source_id }) => {
    const topics = await listNistCloudBySource(source_id);
    if (!topics) {
      return {
        content: [
          { type: "text", text: `No topics found for source ${source_id}.` },
        ],
      };
    }
    const summary = topics
      .map(
        (t) =>
          `${t.id} - ${t.title} (§${t.section}) → NIST 800-53: ${t.nist_controls.join(", ")}`
      )
      .join("\n");
    return { content: [{ type: "text", text: summary }] };
  }
);

server.tool(
  "nist_cloud_list_sources",
  "List all NIST cloud security publications available with topic counts",
  {},
  async () => {
    const sources = await listNistCloudSources();
    const summary = sources
      .map(
        (s) =>
          `${s.id} - ${s.title} (${s.date}, ${s.topic_count} topics)`
      )
      .join("\n");
    return { content: [{ type: "text", text: summary }] };
  }
);

// --- MITRE ATT&CK Tools ---

server.tool(
  "attack_lookup_technique",
  "Look up a MITRE ATT&CK technique by ID (e.g. T1059, T1566.001). Returns the technique with its mapped NIST 800-53 controls that mitigate it. Source: Center for Threat-Informed Defense.",
  {
    technique_id: z
      .string()
      .describe("ATT&CK technique ID, e.g. T1059, T1566.001"),
  },
  async ({ technique_id }) => {
    const result = await lookupAttackTechnique(technique_id);
    if (!result) {
      return {
        content: [
          {
            type: "text",
            text: `ATT&CK technique ${technique_id} not found.`,
          },
        ],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "attack_search_techniques",
  "Search MITRE ATT&CK techniques by keyword across technique names and IDs",
  {
    query: z
      .string()
      .describe("Search keyword or phrase, e.g. 'phishing', 'credential'"),
  },
  async ({ query }) => {
    const results = await searchAttackTechniques(query);
    if (results.length === 0) {
      return {
        content: [
          { type: "text", text: `No ATT&CK techniques matching "${query}".` },
        ],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.tool(
  "attack_list_techniques",
  "List all top-level MITRE ATT&CK techniques (excludes sub-techniques) with their NIST control counts",
  {},
  async () => {
    const techniques = await listAttackTechniques();
    const summary = techniques
      .map(
        (t) =>
          `${t.id} - ${t.name} (${t.nist_control_count} NIST controls mitigate)`
      )
      .join("\n");
    return { content: [{ type: "text", text: summary }] };
  }
);

server.tool(
  "attack_map_from_nist",
  "Find which ATT&CK techniques a NIST 800-53 control mitigates. Useful for understanding the threat coverage of a specific control.",
  {
    nist_id: z
      .string()
      .describe("NIST control ID, e.g. AC-2, SI-4, CM-7"),
  },
  async ({ nist_id }) => {
    const result = await attackByNist(nist_id);
    if (!result) {
      return {
        content: [
          {
            type: "text",
            text: `No ATT&CK mappings found for NIST ${nist_id}.`,
          },
        ],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "attack_map_to_nist",
  "Find which NIST 800-53 controls mitigate a specific ATT&CK technique. Useful for building defensive coverage against a known threat.",
  {
    technique_id: z
      .string()
      .describe("ATT&CK technique ID, e.g. T1059, T1566.001"),
  },
  async ({ technique_id }) => {
    const result = await nistByAttack(technique_id);
    if (!result) {
      return {
        content: [
          {
            type: "text",
            text: `No NIST mappings found for ATT&CK ${technique_id}.`,
          },
        ],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "attack_source_info",
  "Show metadata about the ATT&CK mapping data: version, source, coverage stats",
  {},
  async () => {
    const info = await attackSource();
    return {
      content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
