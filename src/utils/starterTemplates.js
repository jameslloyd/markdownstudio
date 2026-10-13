export const STARTER_TEMPLATES = {
  architecture: `# System Architecture Specification

Welcome to **Markdown Studio** — a native macOS GitHub Flavored Markdown editor with live WYSIWYG editing, relative image persistence, and diagramming.

## 1. High Level Component Architecture

The following diagram illustrates the interaction between the macOS client, renderer, and file storage:

\`\`\`mermaid
graph TD
  User([User Interaction]) -->|Type / Format| WYSIWYG[WYSIWYG Editor]
  User -->|Paste Screenshot| ImageHandler[Relative Image Pipeline]
  User -->|Toggle Source| SourceView[Raw GFM Editor]

  WYSIWYG --> IPC[Electron IPC Bridge]
  ImageHandler -->|Save to ./assets| Disk[(Local Disk Storage)]
  WYSIWYG --> MermaidEngine[Mermaid Local SVG Engine]
  WYSIWYG --> PlantUMLEngine[PlantUML Encoder]

  IPC --> FS[Node.js File System]
  FS --> Disk
\`\`\`

## 2. Service Sequence Flow

\`\`\`mermaid
sequenceDiagram
  autonumber
  actor Developer as James (macOS)
  participant App as Markdown Studio
  participant Disk as Local Filesystem

  Developer->>App: Cmd+V (Paste Image from Clipboard)
  App->>Disk: Write binary to ./assets/image-20261013.png
  Disk-->>App: Saved successfully
  App->>Developer: Embed ![image](./assets/image-20261013.png)
  Developer->>App: Cmd+S (Save Markdown Document)
  App->>Disk: Write document.md
\`\`\`

## 3. Implementation Checklist

- [x] Full GitHub Flavored Markdown (GFM) support
- [x] Typora / Notion-style WYSIWYG editing
- [x] Local Mermaid diagram engine (100% offline)
- [x] PlantUML diagram rendering
- [x] Relative image saving on paste into configurable folder (\`./assets\`)
- [ ] Export to PDF / HTML (Upcoming)

---

> **Tip:** You can toggle between this rendered WYSIWYG view and raw markdown source at any time with **Cmd+E** or the top toggle!
`,

  gfm: `# GitHub Flavored Markdown (GFM) Tour

This document showcases the full GitHub Flavored Markdown formatting capabilities supported by Markdown Studio.

## Typography & Emphasis

You can write in **bold**, *italics*, ~~strikethrough~~, or \`inline code\`.

### Blockquotes

> "Simplicity is the prerequisite for reliability."
> — *Edsger W. Dijkstra*

## Task Lists (Interactive Checklists)

Click directly on the checkboxes to toggle them:

- [x] Setup macOS Electron desktop application
- [x] Implement TipTap GFM WYSIWYG editor
- [x] Add clipboard image pasting to relative directory
- [ ] Try writing your own notes!

## GFM Tables

| Feature | Support | Engine | Offline |
| :--- | :---: | :--- | :---: |
| **Markdown** | GFM | TipTap + Markdown-it | Yes |
| **Mermaid** | All Types | Mermaid.js 11 | Yes |
| **PlantUML** | Sequence/Class | Deflate Encoder | Yes / Server |
| **Images** | Relative (\`./assets\`) | Local FS | Yes |

## Code Blocks

\`\`\`javascript
function calculateReadingTime(text) {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
\`\`\`

## Mermaid Git Graph

\`\`\`mermaid
gitGraph
  commit id: "Initial commit"
  branch release
  checkout release
  commit id: "v1.0.0"
  checkout main
  merge release
  commit id: "Docs update"
\`\`\`
`,

  plantuml: `# PlantUML Microservices Architecture

This document demonstrates live **PlantUML** sequence and component diagrams rendered directly inside Markdown Studio.

## Authentication Flow

\`\`\`plantuml
@startuml
autonumber
actor Client
participant "API Gateway" as Gateway
participant "Auth Service" as Auth
database "Token Store" as Redis

Client -> Gateway: POST /login { email, password }
Gateway -> Auth: Validate credentials
Auth -> Redis: Store refresh token
Redis --> Auth: OK
Auth --> Gateway: 200 OK + JWT Access Token
Gateway --> Client: Set-Cookie: token
@enduml
\`\`\`

## Relative Asset Images

When you paste an image anywhere in this document, it automatically writes to your configured settings folder (default: \`./assets/\`) and inserts a clean relative markdown link!
`,
};
