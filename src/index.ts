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

const server = new McpServer({
  name: "mcp-security-audit",
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
