# MCP Security Audit Server

An MCP server for looking up security compliance controls. Ask your AI assistant about compliance requirements, search controls by keyword, and get cross-framework mappings.

### Supported Frameworks

- **ISO/IEC 27001:2022 Annex A** — All 93 controls across categories A.5–A.8
- **ISO/IEC 27017:2015** — Cloud security controls with cloud-specific guidance for CSPs and CSCs, including CLD extended controls
- **NIST SP 800-53 Rev 5** — Full control catalog with statements, guidance, and enhancements

## Tools

| Tool | Description |
|------|-------------|
| `iso_lookup_control` | Look up an ISO 27001:2022 control by ID with mapped NIST guidance |
| `iso_search_controls` | Search ISO 27001 controls by keyword |
| `iso_list_controls_by_category` | List all controls in a category (A.5, A.6, A.7, A.8) |
| `iso_list_categories` | List all ISO 27001 categories with control counts |
| `nist_lookup_control` | Look up a NIST 800-53 control by ID |
| `nist_search_controls` | Search NIST 800-53 controls by keyword |
| `nist_list_family` | List all controls in a NIST family (AC, SC, IA, etc.) |
| `nist_list_families` | List all NIST 800-53 families with control counts |
| `cloud_lookup_control` | Look up an ISO 27017 cloud security control by ID |
| `cloud_search_controls` | Search ISO 27017 cloud controls by keyword |
| `cloud_list_controls_by_section` | List all controls in an ISO 27017 section |
| `cloud_list_sections` | List all ISO 27017 sections with control counts |

## Prerequisites

- [Bun](https://bun.sh) runtime

## Setup

```bash
git clone <repo-url>
cd mcp-security-audit
bun install
```

## Usage

### Claude Desktop

Add to your config file:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-security-audit": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "cwd": "/absolute/path/to/mcp-security-audit"
    }
  }
}
```

### Claude Code

```bash
claude mcp add mcp-security-audit -- bun run /absolute/path/to/mcp-security-audit/src/index.ts
```

### Cursor

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "mcp-security-audit": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "cwd": "/absolute/path/to/mcp-security-audit"
    }
  }
}
```

Then restart your MCP client. The tools will be available automatically.

## Example Prompts

- "Look up ISO 27001 control A.8.24"
- "What NIST controls relate to access management?"
- "List all controls in the NIST AC family"
- "Search for controls about encryption"
- "What does ISO 27017 say about virtual machine segregation?"
- "List all cloud controls in section 9"

## How the Data Works

The server bundles three local JSON datasets in `src/data/`:

- **`iso-27001-controls.json`** — All 93 Annex A controls from ISO/IEC 27001:2022, organized by their four categories (A.5 Organizational, A.6 People, A.7 Physical, A.8 Technological). Each control includes its ISO-to-NIST mapping.
- **`iso-27017-controls.json`** — ISO/IEC 27017:2015 cloud security controls organized by sections 5–18, with cloud-specific guidance for cloud service providers (CSPs) and cloud service customers (CSCs). Includes CLD extended controls for virtual segregation, VM hardening, and cloud monitoring.
- **`nist-800-53.json`** — NIST SP 800-53 Rev 5 controls with full statements, guidance text, related controls, and control enhancements.

Everything runs locally — no API calls, no external dependencies at runtime. When you look up an ISO 27001 control, the server resolves its NIST mappings inline so you get both frameworks in a single response.

## Development

```bash
bun run dev
```
