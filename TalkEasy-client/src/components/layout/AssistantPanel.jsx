import React, { useRef } from "react";
import {
  Sparkles,
  Globe,
  Brain,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  Plus,
  FileUp,
  Music,
  Trash2,
} from "lucide-react";

import { useChat } from "../../context/ChatContext";
import { API_BASE } from "../../config/config";
import { getToken } from "../../utils/auth";

const AssistantPanel = () => {
  const {
    assistantMode,
    setAssistantMode,
    webSearch,
    setWebSearch,
    memory,
    setMemory,
    images,
    setImages,
    files,
    handleUploadFile,
    deleteFile,
    openFile,
  } = useChat();

  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      await handleUploadFile(file);
    }
  };

  const assistantModes = [
    {
      name: "Professional",
      desc: "Balanced, professional, and helpful assistant",
    },
    {
      name: "Creative",
      desc: "Brainstorming, drafting, and imaginative responses",
    },
    {
      name: "Concise",
      desc: "Short, direct, and straight-to-the-point answers",
    },
    {
      name: "Technical",
      desc: "Code optimization, system engineering, and logic checks",
    },
  ];

  const getFileColor = (color) => {
    switch (color) {
      case "red":
        return "bg-red-500/10 text-red-500 dark:text-red-400";

      case "green":
        return "bg-green-500/10 text-green-500 dark:text-green-400";

      default:
        return "bg-orange-500/10 text-orange-500 dark:text-orange-400";
    }
  };

  const handlePersonaChange = async (e) => {
    const newMode = e.target.value;
    setAssistantMode(newMode);

    // Call backend API to switch persona
    try {
      // Backend expects lowercase string like "default", "pirate", "developer"
      let apiPersona = "default";
      if (newMode === "Professional") apiPersona = "default";
      if (newMode === "Creative") apiPersona = "pirate"; // Assuming creative is pirate or similar mapped persona
      if (newMode === "Concise") apiPersona = "robot";
      if (newMode === "Technical") apiPersona = "developer";

      const token = getToken();
      await fetch(`${API_BASE}/api/persona/switch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ persona: apiPersona }),
      });
    } catch (err) {
      console.error("Failed to switch persona", err);
    }
  };

  return (
    <aside
      className="
        hidden lg:flex
        w-80
        border-l border-glass-border
        bg-glass-bg
        flex-col
        p-6
        overflow-hidden
        h-full
        min-h-0
      "
    >
      {/* Assistant Settings */}
      <section className="mb-8 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-sm text-app-text">
            Assistant Profile
          </h2>

          <button className="text-xs font-bold text-brand-blue dark:text-brand-cyan hover:underline transition-all">
            Customize
          </button>
        </div>

        <div className="relative group">
          <select
            value={assistantMode}
            onChange={handlePersonaChange}
            className="
              w-full
              bg-surface-solid
              border border-glass-border
              rounded-2xl
              p-4
              pr-10
              shadow-sm
              appearance-none
              outline-none
              font-semibold
              text-xs
              uppercase
              tracking-wider
              text-app-text
              focus:border-brand-blue/30
              cursor-pointer
            "
          >
            {assistantModes.map((mode) => (
              <option key={mode.name} value={mode.name}>
                {mode.name}
              </option>
            ))}
          </select>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-app-text-muted">
            <ChevronDown size={16} />
          </div>
        </div>

        <p className="mt-2.5 px-1 text-[11px] text-app-text-secondary leading-normal font-medium">
          {assistantModes.find((m) => m.name === assistantMode)?.desc}
        </p>
      </section>

      {/* Capability Toggles */}
      <section className="mb-8 shrink-0">
        <h3 className="font-bold text-xs text-app-text-muted uppercase tracking-wider mb-4">
          Capabilities
        </h3>

        <div className="space-y-4">
          {/* Web Search */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-app-text-secondary font-medium text-sm">
              <Globe size={18} className="text-app-text-muted" />
              <span>Web Search</span>
            </div>

            <button
              onClick={() => setWebSearch(!webSearch)}
              className={`w-9 h-5 rounded-full relative flex items-center transition-colors duration-300 border border-glass-border ${
                webSearch
                  ? "bg-brand-blue border-brand-blue"
                  : "bg-surface-solid-hover"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-all duration-300 ${
                  webSearch ? "right-0.8" : "left-0.8"
                }`}
              />
            </button>
          </div>

          {/* Memory */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-app-text-secondary font-medium text-sm">
              <Brain size={18} className="text-app-text-muted" />
              <span>Memory</span>
            </div>

            <button
              onClick={() => setMemory(!memory)}
              className={`w-9 h-5 rounded-full relative flex items-center transition-colors duration-300 border border-glass-border ${
                memory
                  ? "bg-brand-blue border-brand-blue"
                  : "bg-surface-solid-hover"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-all duration-300 ${
                  memory ? "right-0.8" : "left-0.8"
                }`}
              />
            </button>
          </div>

          {/* Images */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-app-text-secondary font-medium text-sm">
              <ImageIcon size={18} className="text-app-text-muted" />
              <span>Image Gen</span>
            </div>

            <button
              onClick={() => setImages(!images)}
              className={`w-9 h-5 rounded-full relative flex items-center transition-colors duration-300 border border-glass-border ${
                images
                  ? "bg-brand-blue border-brand-blue"
                  : "bg-surface-solid-hover"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-all duration-300 ${
                  images ? "right-0.8" : "left-0.8"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Files Section */}
      <section className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="font-extrabold text-sm text-app-text">Recent Files</h2>
        </div>

        {/* Files List */}
        <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-1 pb-2">
          {files.map((file, idx) => (
            <div
              key={idx}
              onClick={() => openFile(file)}
              className="
                group
                flex items-center gap-3.5
                p-3.5
                bg-surface-solid
                border border-glass-border
                rounded-2xl
                shadow-sm
                hover:shadow-md
                hover:border-brand-blue/30
                transition-all duration-300
                cursor-pointer
                relative
              "
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-brand-blue/10 text-brand-blue dark:text-brand-cyan`}
              >
                {file.fileType === 'image' ? (
                  <ImageIcon size={20} />
                ) : file.fileType === 'audio' ? (
                  <Music size={20} />
                ) : (
                  <FileText size={20} />
                )}
              </div>

              <div className="overflow-hidden flex-1 pr-8">
                <p className="text-xs font-bold text-app-text truncate">
                  {file.fileName || file.name}
                </p>

                <p className="text-[10px] text-app-text-secondary font-semibold mt-0.5">
                  {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Just now'} • {file.fileType || 'document'}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFile(file.fileId);
                }}
                className="absolute right-3.5 p-1.5 rounded-lg text-app-text-muted hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                title="Delete File"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Empty State */}
          {files.length === 0 && (
            <div
              className="
                flex flex-col items-center justify-center
                py-8
                text-app-text-muted
                border border-dashed border-glass-border
                rounded-2xl
              "
            >
              <FileUp size={24} className="mb-2 opacity-55" />

              <span className="text-xs font-semibold">No files uploaded</span>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-[10px] font-bold text-brand-blue hover:underline"
              >
                Upload File
              </button>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
};

export default AssistantPanel;
