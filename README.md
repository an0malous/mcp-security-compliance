# MCP Security Compliance

Give your AI assistant deep knowledge of security frameworks so it can answer compliance questions, map between standards, and connect real threats to the controls that mitigate them.

This server exists because security work constantly requires jumping between frameworks. A developer finds a vulnerability and needs to know which compliance controls apply. An auditor reviewing NIST controls wants to understand what real-world attacks they're defending against. A team adopting ISO 27001 needs to know how their existing NIST controls map over. These lookups are tedious, spread across multiple documents, and easy to get wrong. This server makes your AI assistant the one that remembers all of it.

## What You Can Do

**Compliance lookups** — Look up any control by ID, search by keyword, or list entire control families. Covers ISO 27001:2022 (93 Annex A controls), NIST SP 800-53 Rev 5 (full catalog), ISO 27017:2015 (cloud security), and NIST cloud security guidance (SP 800-144, 800-210, 800-146).

**Threat-to-control mapping** — Start from a MITRE ATT&CK technique (470 enterprise techniques) and find which NIST 800-53 controls mitigate it. Or go the other direction: pick a NIST control and see all the ATT&CK techniques it defends against.

**Cross-framework translation** — ISO 27001 controls resolve their NIST 800-53 mappings inline. NIST 800-53 sits at the center, connecting compliance frameworks to real-world threats.

## How the Mappings Work

NIST 800-53 is the hub that connects the frameworks:

```
ISO 27001 ←→ NIST 800-53 ←→ MITRE ATT&CK
                  ↕
ISO 27017 ←→ NIST Cloud Guidance (SP 800-144, 800-210, 800-146)
```

All cross-framework mappings come from official sources:

| Mapping | Source |
|---------|--------|
| ISO 27001 → NIST 800-53 | [NIST OLIR program](https://csrc.nist.gov/projects/olir/informative-reference-catalog/details?referenceId=99) |
| ATT&CK → NIST 800-53 | [Center for Threat-Informed Defense](https://github.com/center-for-threat-informed-defense/mappings-explorer) |
| ISO 27017 → NIST Cloud | NIST SP 800-144, SP 800-210 (Table 4), SP 800-146 |

## Setup

Requires [Bun](https://bun.sh).

```bash
git clone <repo-url>
cd mcp-security-compliance
bun install
```

### Claude Code

```bash
claude mcp add mcp-security-compliance -- bun run /absolute/path/to/mcp-security-compliance/src/index.ts
```

### Claude Desktop / Cursor

Add to your MCP config (`claude_desktop_config.json` or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "mcp-security-compliance": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "cwd": "/absolute/path/to/mcp-security-compliance"
    }
  }
}
```

## Example Prompts

```
"Look up ISO 27001 control A.8.24"
"What NIST controls relate to access management?"
"What does ISO 27017 say about virtual machine segregation?"
"What does NIST say about hypervisor access control in the cloud?"
"How do I defend against ATT&CK T1566 phishing?"
"What ATT&CK techniques does NIST AC-2 mitigate?"
"What compliance controls cover encryption?"
```

## Tools

### ISO 27001:2022

| Tool | Description |
|------|-------------|
| `iso_lookup_control` | Look up a control by ID with mapped NIST guidance |
| `iso_search_controls` | Search controls by keyword |
| `iso_list_controls_by_category` | List controls in a category (A.5–A.8) |
| `iso_list_categories` | List categories with control counts |

### NIST SP 800-53 Rev 5

| Tool | Description |
|------|-------------|
| `nist_lookup_control` | Look up a control by ID |
| `nist_search_controls` | Search controls by keyword |
| `nist_list_family` | List controls in a family (AC, SC, IA, etc.) |
| `nist_list_families` | List all families with control counts |

### ISO 27017:2015 (Cloud)

| Tool | Description |
|------|-------------|
| `cloud_lookup_control` | Look up a cloud control by ID with resolved NIST cloud guidance |
| `cloud_search_controls` | Search cloud controls by keyword |
| `cloud_list_controls_by_section` | List controls in a section |
| `cloud_list_sections` | List all sections with control counts |

### NIST Cloud Security Guidance

| Tool | Description |
|------|-------------|
| `nist_cloud_lookup_topic` | Look up a cloud guidance topic by ID (e.g. SP800-210.3.1) |
| `nist_cloud_search` | Search cloud guidance by keyword |
| `nist_cloud_list_by_source` | List topics from a specific publication |
| `nist_cloud_list_sources` | List all NIST cloud publications with topic counts |

### MITRE ATT&CK v16.1

| Tool | Description |
|------|-------------|
| `attack_lookup_technique` | Look up a technique by ID with mapped NIST controls |
| `attack_search_techniques` | Search techniques by keyword |
| `attack_list_techniques` | List top-level techniques with NIST control counts |
| `attack_map_from_nist` | NIST control → ATT&CK techniques it mitigates |
| `attack_map_to_nist` | ATT&CK technique → NIST controls that defend against it |
| `attack_source_info` | Mapping data version and coverage stats |

## Data

All data is bundled locally in `src/data/` — no API calls at runtime.

| File | What it is |
|------|------------|
| `iso-27001-controls.json` | 93 Annex A controls with official NIST mappings |
| `iso-27017-controls.json` | Cloud controls with NIST guidance references |
| `nist-cloud-guidance.json` | 30 cloud security topics from NIST SP 800-144, 800-210, 800-146 (verbatim language from source PDFs) |
| `nist-800-53.json` | Full NIST catalog parsed from [OSCAL](https://github.com/usnistgov/oscal-content) |
| `attack-nist-mappings.json` | ATT&CK ↔ NIST mappings parsed from CTID |
| `sp800-53r5-to-iso-27001-mapping-OLIR.xlsx` | Raw NIST OLIR source spreadsheet |
| `nist-to-attack-mapping-ctid.json` | Raw CTID source data |

## Data Provenance

All guidance text is taken directly from official publications — no AI-generated summaries.

| Dataset | Source Format | How It Was Extracted |
|---------|--------------|---------------------|
| NIST 800-53 | Machine-readable [OSCAL JSON](https://github.com/usnistgov/oscal-content) | Parsed directly |
| ISO 27001 → NIST mappings | [OLIR spreadsheet](https://csrc.nist.gov/projects/olir/informative-reference-catalog/details?referenceId=99) | Parsed directly |
| ATT&CK → NIST mappings | [CTID JSON](https://github.com/center-for-threat-informed-defense/mappings-explorer) | Parsed directly |
| NIST cloud guidance | PDFs only (SP 800-144, 800-210, 800-146) | Verbatim text extracted from source PDFs; NIST 800-53 control mappings from SP 800-210 Table 4 |

## Using with Claude Code

This server is a compliance reference tool, not a vulnerability scanner or fixer. It pairs well with Claude Code's `/security-review` for documenting and contextualizing security work.

To get Claude to reference compliance frameworks when documenting security fixes, add something like this to the `CLAUDE.md` in your project:

```markdown
## Security Documentation

After fixing a security vulnerability, use the mcp-security-compliance tools to add
compliance context to commit messages and PR descriptions:

- `attack_search_techniques` to identify the relevant ATT&CK technique
- `attack_map_to_nist` to find which NIST 800-53 controls the fix satisfies
- `nist_search_controls` or `iso_search_controls` for compliance requirements

Reference specific control IDs (e.g. "Mitigates T1566, satisfies NIST SI-10")
so security fixes are traceable to compliance frameworks during audits.
```

## Development

```bash
bun run dev
```
