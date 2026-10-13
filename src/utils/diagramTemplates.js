export const DIAGRAM_TEMPLATES = [
  {
    id: 'mermaid-flowchart',
    type: 'mermaid',
    title: 'Mermaid: Flowchart',
    description: 'Decision tree and process flow',
    code: `graph TD
    A[Start] --> B{Is user authenticated?}
    B -->|Yes| C[Open Dashboard]
    B -->|No| D[Redirect to Login]
    D --> E[Enter Credentials]
    E --> B
    C --> F[Complete Task]`,
  },
  {
    id: 'mermaid-sequence',
    type: 'mermaid',
    title: 'Mermaid: Sequence Diagram',
    description: 'Message interactions between actors',
    code: `sequenceDiagram
    autonumber
    actor User
    participant Client as Web App
    participant API as Backend Service
    participant DB as Database

    User->>Client: Click "Save Document"
    Client->>API: POST /api/document (Payload)
    API->>DB: INSERT into documents
    DB-->>API: 201 Created (ID: 42)
    API-->>Client: Success { id: 42, savedAt: now }
    Client-->>User: Notification: "Document Saved!"`,
  },
  {
    id: 'mermaid-class',
    type: 'mermaid',
    title: 'Mermaid: Class Diagram',
    description: 'Object-oriented model & relationships',
    code: `classDiagram
    class Document {
      +String title
      +String content
      +String filePath
      +Boolean isDirty
      +save()
      +exportToPdf()
    }
    class ImageAsset {
      +String relativePath
      +String absolutePath
      +Number size
      +saveToDisk()
    }
    class Settings {
      +String imageFolder
      +String theme
      +Boolean autoSave
    }
    Document "1" *-- "many" ImageAsset : contains
    Document ..> Settings : uses`,
  },
  {
    id: 'mermaid-state',
    type: 'mermaid',
    title: 'Mermaid: State Diagram',
    description: 'State machine lifecycle',
    code: `stateDiagram-v2
    [*] --> Draft
    Draft --> Editing : User types
    Editing --> AutoSaving : Timer triggers
    AutoSaving --> Saved : Success
    AutoSaving --> Draft : Error
    Saved --> Editing : User modifies
    Saved --> [*] : App Closed`,
  },
  {
    id: 'mermaid-git',
    type: 'mermaid',
    title: 'Mermaid: Git Graph',
    description: 'Branching and merge strategy',
    code: `gitGraph
    commit
    commit
    branch feature/wysiwyg
    checkout feature/wysiwyg
    commit id: "add-tiptap"
    commit id: "add-mermaid"
    checkout main
    merge feature/wysiwyg
    commit id: "v1.0.0-release"`,
  },
  {
    id: 'mermaid-mindmap',
    type: 'mermaid',
    title: 'Mermaid: Mindmap',
    description: 'Hierarchical concept brainstorming',
    code: `mindmap
  root((Markdown App))
    Editing
      WYSIWYG
      Raw GFM
      Split Sync
    Diagrams
      Mermaid
      PlantUML
    Storage
      Local FS
      Relative Assets
      Settings`,
  },
  {
    id: 'plantuml-sequence',
    type: 'plantuml',
    title: 'PlantUML: Sequence Diagram',
    description: 'Classic PlantUML sequence diagram',
    code: `@startuml
autonumber
actor Client
participant "API Gateway" as Gateway
database "Cache" as Redis
database "Database" as Postgres

Client -> Gateway: GET /user/profile
Gateway -> Redis: Check cache
alt Cache Hit
    Redis --> Gateway: Cached User Data
else Cache Miss
    Gateway -> Postgres: Query User Record
    Postgres --> Gateway: User Data
    Gateway -> Redis: Cache for 10 min
end
Gateway --> Client: 200 OK (User Data)
@enduml`,
  },
  {
    id: 'plantuml-component',
    type: 'plantuml',
    title: 'PlantUML: Component Diagram',
    description: 'System architectural components',
    code: `@startuml
package "Client Layer" {
  [macOS App] as App
  [WYSIWYG Editor] as Editor
}

package "Storage" {
  folder "Local Markdown" as Doc
  folder "./assets" as Assets
}

App --> Editor : Hosts
Editor --> Doc : Reads/Writes .md
Editor --> Assets : Saves pasted images
@enduml`,
  },
];
