import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from './components/Editor';
import SourceEditor from './components/SourceEditor';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
import SettingsModal from './components/SettingsModal';
import { STARTER_TEMPLATES } from './utils/starterTemplates';
import {
  FileText,
  FolderOpen,
  Save,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Code2,
  Eye,
  Plus,
} from 'lucide-react';

export default function App() {
  const [markdown, setMarkdown] = useState(STARTER_TEMPLATES.architecture);
  const [filePath, setFilePath] = useState(null);
  const [fileName, setFileName] = useState('Untitled.md');
  const [isDirty, setIsDirty] = useState(false);
  const [mode, setMode] = useState('wysiwyg'); // 'wysiwyg' | 'source'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [settings, setSettings] = useState({
    imageFolder: './assets',
    filenamePattern: 'image-{timestamp}',
    theme: 'dark',
    fontSize: 16,
    autoSave: true,
    autoSaveInterval: 30,
    plantUmlServer: 'https://www.plantuml.com/plantuml/svg',
    recentFiles: [],
  });

  const markdownRef = useRef(markdown);
  markdownRef.current = markdown;
  const filePathRef = useRef(filePath);
  filePathRef.current = filePath;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Apply theme to HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, [settings.theme]);

  // Set platform class on document.body for platform-specific styling
  useEffect(() => {
    const platform = window.electronAPI?.platform || (navigator.userAgent.includes('Windows') ? 'win32' : 'darwin');
    document.body.classList.add(`platform-${platform}`);
  }, []);

  // Load initial settings from Electron
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSettings().then((loaded) => {
        if (loaded) setSettings(loaded);
      });
    }
  }, []);

  // Compute currentBaseDir
  const currentBaseDir = filePath ? filePath.substring(0, filePath.lastIndexOf('/')) : null;

  // Handle Save
  const handleSave = useCallback(async () => {
    if (!window.electronAPI) return;

    if (!filePathRef.current) {
      // Save As...
      const res = await window.electronAPI.saveFileAs({
        content: markdownRef.current,
        defaultName: fileName,
      });
      if (res && !res.canceled && res.filePath) {
        setFilePath(res.filePath);
        setFileName(res.fileName);
        setIsDirty(false);
      }
    } else {
      // Direct Save
      const res = await window.electronAPI.saveFile({
        filePath: filePathRef.current,
        content: markdownRef.current,
      });
      if (res && res.success) {
        setIsDirty(false);
      }
    }
  }, [fileName]);

  // Handle Save As
  const handleSaveAs = useCallback(async () => {
    if (!window.electronAPI) return;
    const res = await window.electronAPI.saveFileAs({
      content: markdownRef.current,
      defaultName: fileName,
    });
    if (res && !res.canceled && res.filePath) {
      setFilePath(res.filePath);
      setFileName(res.fileName);
      setIsDirty(false);
    }
  }, [fileName]);

  // Handle Open File
  const handleOpenFile = useCallback(async () => {
    if (!window.electronAPI) return;
    const res = await window.electronAPI.openFile();
    if (res && !res.canceled && res.filePath) {
      setFilePath(res.filePath);
      setFileName(res.fileName);
      setMarkdown(res.content);
      setIsDirty(false);
    }
  }, []);

  // Handle Open File by path (from recent files)
  const handleOpenFileByPath = async (targetPath) => {
    if (!window.electronAPI) return;
    const res = await window.electronAPI.readFile(targetPath);
    if (res && res.success) {
      setFilePath(targetPath);
      setFileName(res.fileName);
      setMarkdown(res.content);
      setIsDirty(false);
    }
  };

  // Handle navigation to linked markdown file (from clicking a link inside editor)
  const handleNavigateToFile = useCallback(async (relOrAbsPath) => {
    if (!window.electronAPI) return;

    let targetPath = relOrAbsPath;
    if (filePathRef.current && !relOrAbsPath.startsWith('/')) {
      const res = await window.electronAPI.resolveRelativePath({
        relativePath: relOrAbsPath,
        currentFilePath: filePathRef.current,
      });
      if (res && res.exists) {
        targetPath = res.absolutePath;
      }
    }

    const res = await window.electronAPI.readFile(targetPath);
    if (res && res.success) {
      setFilePath(targetPath);
      setFileName(res.fileName);
      setMarkdown(res.content);
      setIsDirty(false);
    } else {
      console.warn(`Could not open linked file: ${relOrAbsPath}`);
    }
  }, []);

  // Handle New File
  const handleNewFile = useCallback(() => {
    setFilePath(null);
    setFileName('Untitled.md');
    setMarkdown('# Untitled Document\n\nWrite your thoughts here...\n');
    setIsDirty(false);
  }, []);

  // Handle Save Settings
  const handleSaveSettings = async (newSettings) => {
    setSettings(newSettings);
    if (window.electronAPI) {
      await window.electronAPI.saveSettings(newSettings);
    }
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    handleSaveSettings({ ...settings, theme: nextTheme });
  };

  // Content change handler
  const handleContentChange = (newText) => {
    setMarkdown(newText);
    setIsDirty(true);
  };

  // Load starter templates
  const handleLoadTemplate = (key) => {
    if (STARTER_TEMPLATES[key]) {
      setFilePath(null);
      setFileName(key === 'architecture' ? 'Architecture.md' : key === 'gfm' ? 'GFM_Tour.md' : 'PlantUML_Flow.md');
      setMarkdown(STARTER_TEMPLATES[key]);
      setIsDirty(true);
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (!settings.autoSave || !filePath || !isDirty) return;

    const timer = setTimeout(() => {
      if (isDirtyRef.current && filePathRef.current) {
        handleSave();
      }
    }, (settings.autoSaveInterval || 30) * 1000);

    return () => clearTimeout(timer);
  }, [markdown, isDirty, filePath, settings.autoSave, settings.autoSaveInterval, handleSave]);

  // Wire Electron menu & keyboard listeners
  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubNew = window.electronAPI.onMenuNewFile(handleNewFile);
    const unsubOpen = window.electronAPI.onMenuOpenFile(handleOpenFile);
    const unsubSave = window.electronAPI.onMenuSaveFile(handleSave);
    const unsubSaveAs = window.electronAPI.onMenuSaveAs(handleSaveAs);
    const unsubToggle = window.electronAPI.onMenuToggleMode(() => {
      setMode((prev) => (prev === 'wysiwyg' ? 'source' : 'wysiwyg'));
    });
    const unsubSettings = window.electronAPI.onMenuOpenSettings(() => setIsSettingsOpen(true));
    const unsubSettingsUpdated = window.electronAPI.onSettingsUpdated((newSets) => {
      setSettings(newSets);
    });

    return () => {
      unsubNew();
      unsubOpen();
      unsubSave();
      unsubSaveAs();
      unsubToggle();
      unsubSettings();
      unsubSettingsUpdated();
    };
  }, [handleNewFile, handleOpenFile, handleSave, handleSaveAs]);

  // Global Keyboard shortcuts (macOS Cmd+S, Cmd+O, Cmd+E, etc.)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAs();
        } else {
          handleSave();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFile();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewFile();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setMode((prev) => (prev === 'wysiwyg' ? 'source' : 'wysiwyg'));
      } else if (isCmdOrCtrl && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleSaveAs, handleOpenFile, handleNewFile]);

  return (
    <div className="app-container">
      {/* macOS Custom Window Titlebar */}
      <header className="mac-titlebar">
        <div className="titlebar-left">
          <button
            type="button"
            className="btn-icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Sidebar Outline"
          >
            {isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>

          <div className="titlebar-title">
            <span>{fileName}</span>
            {isDirty && <div className="dirty-indicator" title="Unsaved changes" />}
            <span className="file-badge">GFM</span>
          </div>
        </div>

        {/* Center Pill Switcher (WYSIWYG ↔ Source) */}
        <div className="titlebar-center">
          <div className="mode-pill-toggle">
            <button
              type="button"
              className={`mode-btn ${mode === 'wysiwyg' ? 'active' : ''}`}
              onClick={() => setMode('wysiwyg')}
              title="WYSIWYG Rich Editor (Typora / Notion style)"
            >
              <Eye size={13} />
              <span>WYSIWYG</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === 'source' ? 'active' : ''}`}
              onClick={() => setMode('source')}
              title="Raw Markdown Source Editor (Cmd+E)"
            >
              <Code2 size={13} />
              <span>Source</span>
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="titlebar-right">
          <button
            type="button"
            className="btn-action"
            onClick={handleNewFile}
            title="New File (Cmd+N)"
          >
            <Plus size={14} />
            <span>New</span>
          </button>
          <button
            type="button"
            className="btn-action"
            onClick={handleOpenFile}
            title="Open File... (Cmd+O)"
          >
            <FolderOpen size={14} />
            <span>Open</span>
          </button>
          <button
            type="button"
            className="btn-action btn-primary"
            onClick={handleSave}
            title="Save Document (Cmd+S)"
          >
            <Save size={14} />
            <span>Save</span>
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setIsSettingsOpen(true)}
            title="Preferences & Image Settings (Cmd+,)"
          >
            <SettingsIcon size={15} />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="app-body">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          markdown={markdown}
          recentFiles={settings.recentFiles}
          onOpenFileByPath={handleOpenFileByPath}
          onLoadTemplate={handleLoadTemplate}
        />

        {/* Main Content Area */}
        <main className="app-content">
          {mode === 'wysiwyg' ? (
            <Editor
              markdown={markdown}
              onChange={handleContentChange}
              currentFilePath={filePath}
              currentBaseDir={currentBaseDir}
              settings={settings}
              onSaveRequest={handleSave}
              onNavigateToFile={handleNavigateToFile}
            />
          ) : (
            <SourceEditor
              markdown={markdown}
              onChange={handleContentChange}
              currentFilePath={filePath}
            />
          )}
        </main>
      </div>

      {/* Status Bar */}
      <StatusBar
        filePath={filePath}
        isDirty={isDirty}
        markdown={markdown}
        mode={mode}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
