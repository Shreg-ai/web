export interface McpClientStep {
  text: string;
  code?: string;
}

export interface McpClient {
  id: string;
  name: string;
  kind: string;
  steps: (mcpUrl: string) => McpClientStep[];
}

/**
 * Setup steps per MCP client, kept as plain data (not JSX) so the guide page
 * can render every client the same way. Verified against each client's own
 * docs -- these UIs/config formats do shift over time, so if a step here
 * goes stale, the client's own "Add MCP server" settings are the source of
 * truth.
 */
export const MCP_CLIENTS: McpClient[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    kind: "CLI",
    steps: (mcpUrl) => [
      { text: "Open a terminal (in your project, or anywhere if you want it available everywhere)." },
      { text: "Run:", code: `claude mcp add --transport http shreg ${mcpUrl}` },
      { text: "Add --scope user instead of the default (local, this project only) to make it available in every project, or --scope project to share it with your team via a committed .mcp.json." },
      { text: "Verify it connected by running /mcp inside a Claude Code session -- \"shreg\" should show as connected." },
    ],
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    kind: "Desktop app",
    steps: (mcpUrl) => [
      { text: "Open Claude Desktop -> Settings (Cmd/Ctrl + ,) -> Connectors." },
      { text: "Click Add, then choose \"Add custom connector\"." },
      { text: "Paste this as the remote MCP server URL, give it a name (e.g. \"Shreg\"), and click Add. Leave Advanced settings blank -- no OAuth or headers needed for a public graph.", code: mcpUrl },
      { text: "Custom connectors require a Pro, Max, Team, or Enterprise plan." },
    ],
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    kind: "Chat app",
    steps: (mcpUrl) => [
      { text: "Open ChatGPT -> Settings -> Connectors -> Advanced, and toggle Developer mode on." },
      { text: "Back in Connectors, click Create (\"Add custom connector\")." },
      { text: "Set the Server URL to this, choose \"No authentication\", check \"I trust this application\", then click Create.", code: mcpUrl },
      { text: "In a chat, click + -> More -> Developer mode, and enable the connector to start using it." },
    ],
  },
  {
    id: "cursor",
    name: "Cursor",
    kind: "IDE",
    steps: (mcpUrl) => [
      { text: "Open Cursor Settings -> MCP -> \"Add new global MCP server\" (or create .cursor/mcp.json in a project for project-only access)." },
      {
        text: "Paste this into the JSON:",
        code: `{\n  "mcpServers": {\n    "shreg": {\n      "url": "${mcpUrl}"\n    }\n  }\n}`,
      },
      { text: "Save -- Cursor shows the server as connected once it can reach the URL." },
    ],
  },
  {
    id: "windsurf",
    name: "Windsurf",
    kind: "IDE",
    steps: (mcpUrl) => [
      { text: "Open Windsurf Settings -> Cascade -> MCP Servers -> \"View raw config\" (or use \"Add server\")." },
      {
        text: "Windsurf is the one major client that uses serverUrl instead of url for remote servers:",
        code: `{\n  "mcpServers": {\n    "shreg": {\n      "serverUrl": "${mcpUrl}"\n    }\n  }\n}`,
      },
      { text: "Click the refresh button next to MCP Servers so Cascade picks up the change." },
    ],
  },
  {
    id: "vscode",
    name: "VS Code",
    kind: "IDE",
    steps: (mcpUrl) => [
      { text: "Open the Command Palette (Cmd/Ctrl+Shift+P) and run \"MCP: Add Server\"." },
      { text: "Choose HTTP, paste this as the URL, and pick Workspace (saved to .vscode/mcp.json, shareable via git) or Global.", code: mcpUrl },
      { text: "VS Code adds inline Start/Stop/Restart controls once the server's added -- click Start if it doesn't connect automatically." },
    ],
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI",
    kind: "CLI",
    steps: (mcpUrl) => [
      { text: "In a terminal, run:", code: `gemini mcp add --transport http shreg ${mcpUrl}` },
      { text: "Add -s user to make it available in every project instead of just the current one." },
      { text: "Run /mcp inside a Gemini CLI session to confirm \"shreg\" is listed." },
    ],
  },
  {
    id: "cline",
    name: "Cline",
    kind: "IDE extension",
    steps: (mcpUrl) => [
      { text: "Open the Cline panel in VS Code -> MCP Servers icon -> Remote Servers tab." },
      { text: "Enter a name (e.g. \"shreg\") and paste this as the server URL, then click Add.", code: mcpUrl },
      {
        text: "Or edit the config directly via \"Configure MCP Servers\" -- make sure to set the type explicitly, since servers without it default to the deprecated SSE transport:",
        code: `{\n  "mcpServers": {\n    "shreg": {\n      "type": "streamableHttp",\n      "url": "${mcpUrl}"\n    }\n  }\n}`,
      },
    ],
  },
  {
    id: "other",
    name: "Other / any MCP client",
    kind: "Generic",
    steps: (mcpUrl) => [
      {
        text: "Most MCP clients that support remote servers use some variation of this JSON shape -- look for \"MCP servers\", \"Add server\", or a config file in your tool's settings:",
        code: `{\n  "mcpServers": {\n    "shreg": {\n      "url": "${mcpUrl}",\n      "type": "http"\n    }\n  }\n}`,
      },
      {
        text: "If your client only supports local/stdio servers, bridge to this remote endpoint with mcp-remote:",
        code: `npx mcp-remote ${mcpUrl}`,
      },
    ],
  },
];
