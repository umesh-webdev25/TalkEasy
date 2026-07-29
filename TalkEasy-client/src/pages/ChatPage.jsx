import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { useVoiceStream } from "../hooks/useVoiceStream";
import {
  Send,
  Mic,
  AudioLines,
  Plus,
  Globe,
  Volume2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
  ShieldAlert,
  Sparkles,
  Sliders,
  VolumeX,
  Eye,
  ArrowUpRight,
  Image,
  FileText,
  Monitor,
  Palette,
  BarChart2,
  PenLine,
  Code,
  BookOpen,
  Map,
  ArrowRight,
} from "lucide-react";
import Button from "../components/ui/Button";
import TypingIndicator from "../components/ui/TypingIndicator";
import VoiceOrb from "../components/ui/VoiceOrb";
import VoiceVisualizer from "../components/ui/VoiceVisualizer";
import Modal from "../components/ui/Modal";
import Card from "../components/ui/Card";
import PdfPreviewCard from "../components/ui/PdfPreviewCard";

const getMediaUrl = (url) => {
  if (!url) return "";
  if (
    url.startsWith("http") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const baseUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3002";
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

const ChatPage = () => {
  const {
    activeChat,
    activeChatId,
    createNewChat,
    sendMessage,
    typing,
    voiceMode,
    setVoiceMode,
    settingsOpen,
    setSettingsOpen,
    assistantMode,
    setAssistantMode,
    webSearch,
    setWebSearch,
    memory,
    setMemory,
    setImages,
    handleUploadFile,
    files,
    setFiles,
  } = useChat();

  const [inputValue, setInputValue] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);

  const {
    isStreaming,
    isPlaying,
    transcript,
    aiResponse,
    startStreaming,
    stopStreaming,
    error: voiceError,
  } = useVoiceStream();

  // Settings states inside modal
  const [voiceType, setVoiceType] = useState("Alloy");
  const [modelType, setModelType] = useState("Gemini 1.5 Pro");
  const [temperature, setTemperature] = useState(0.7);

  const prevChatIdRef = useRef(activeChat?.id);

  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    if (!activeChat) return;

    const chatChanged = prevChatIdRef.current !== activeChat.id;
    prevChatIdRef.current = activeChat.id;

    if (chatChanged) {
      // Instant scroll on chat switch or page refresh
      scrollToBottom(false);
    } else {
      // Smooth scroll only on new messages or typing
      scrollToBottom(true);
    }
  }, [activeChat?.messages, activeChat?.id, typing]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() && stagedFiles.length === 0) return;

    let textToSend = inputValue;

    // Add staged files to global files state optimistically
    if (stagedFiles.length > 0) {
      setFiles((prev) => {
        const newFiles = stagedFiles.map((f) => ({
          fileId: f.fileId,
          fileName: f.fileName,
          fileType: f.fileType,
          fileUrl: f.fileUrl || f.previewUrl || "",
          uploadedAt: new Date().toISOString(),
        }));
        // filter out any duplicates just in case
        const existingIds = new Set(prev.map((p) => p.fileId));
        const filteredNewFiles = newFiles.filter(
          (f) => !existingIds.has(f.fileId),
        );
        return [...prev, ...filteredNewFiles];
      });
    }

    stagedFiles.forEach((f) => {
      textToSend = `[FILE:${f.fileId}]\n` + textToSend;
    });

    if (activeChatId) {
      sendMessage(textToSend.trim());
    } else {
      createNewChat(textToSend.trim());
    }
    setInputValue("");
    setStagedFiles([]);
  };

  const handleCopy = (text, messageId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text, messageId) => {
    if (speakingId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const handleMicClick = () => {
    setVoiceMode(true);
    startStreaming();
  };

  const handleSuggestionClick = (suggestionText) => {
    sendMessage(suggestionText);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const tempId = `temp-${Date.now()}`;
      setStagedFiles((prev) => [
        ...prev,
        {
          fileId: tempId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type.startsWith("image/") ? "image" : "document",
          previewUrl: URL.createObjectURL(file),
          file: file,
          isUploading: true,
        },
      ]);
      setShowAttachMenu(false);

      const response = await handleUploadFile(file, activeChat?.id);
      if (response && response.success) {
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.fileId === tempId
              ? {
                  ...f,
                  fileId: response.fileId,
                  fileName: response.fileName || f.fileName,
                  fileType: response.fileType || f.fileType,
                  fileUrl: response.fileUrl || "",
                  isUploading: false,
                }
              : f,
          ),
        );
      } else {
        console.error("File upload failed:", response);
        setStagedFiles((prev) => prev.filter((f) => f.fileId !== tempId));
      }
    }

    // Clear inputs so the same file can be selected again
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const removeStagedFile = (fileId) => {
    setStagedFiles((prev) => prev.filter((f) => f.fileId !== fileId));
  };

  const aiTools = [
    {
      icon: Monitor,
      label: "Generate Code",
      description: "Build applications and components with AI",
      prompt: "Generate Code ",
    },
    {
      icon: FileText,
      label: "Summarize PDF",
      description: "Summarize documents and ask questions",
      prompt: "Summarize PDF ",
    },
    {
      icon: Palette,
      label: "Create Images",
      description: "Generate illustrations and creative artwork",
      prompt: "Create Images ",
    },
    {
      icon: BarChart2,
      label: "Analyze Data",
      description: "Explore insights from Excel and CSV files",
      prompt: "Analyze Data ",
    },
    {
      icon: PenLine,
      label: "Write Email",
      description: "Create clear and professional email drafts",
      prompt: "Write Email ",
    },
    {
      icon: Globe,
      label: "Translate Text",
      description: "Translate content across 100+ languages",
      prompt: "Translate Text ",
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent relative mt-0">
      {/* Messages Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 scrollbar-hide">
        {activeChat?.messages && activeChat.messages.length > 0 ? (
          activeChat.messages.map((message) => {
            const isUser = message.sender === "user";

            return (
              <div
                key={message.id}
                className={`flex items-start gap-3.5 ${isUser ? "justify-end" : ""}`}
              >
                {/* AI Avatar */}
                {!isUser && (
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-transparent overflow-hidden">
                    <img
                      src="/robot.png"
                      alt="AI"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div
                  className={`flex flex-col gap-2 max-w-[85%] sm:max-w-xl md:max-w-2xl ${isUser ? "items-end" : ""}`}
                >
                  {/* Chat bubble */}
                  <div
                    className={`px-5 py-4 rounded-2xl text-sm leading-relaxed border shadow-sm transition-all duration-300 break-words ${
                      isUser
                        ? "bg-brand-blue/10 border-brand-blue/20 text-app-text rounded-tr-none"
                        : "bg-surface-solid border-glass-border text-app-text rounded-tl-none"
                    }`}
                  >
                    {(() => {
                      // Extract file attachments
                      let displayText = message.text || "";
                      const fileMatches = displayText.match(
                        /\[FILE:([a-zA-Z0-9-]+)\]/g,
                      );
                      const attachedFiles = [];

                      if (fileMatches && files) {
                        fileMatches.forEach((match) => {
                          const id = match
                            .replace("[FILE:", "")
                            .replace("]", "");
                          const fileObj = files.find((f) => f.fileId === id);
                          if (fileObj) attachedFiles.push(fileObj);
                          displayText = displayText.replace(match, "").trim();
                        });
                      }

                      return (
                        <>
                          {attachedFiles.length > 0 && (
                            <div className="flex flex-col gap-2 mb-3">
                              {attachedFiles.map((file, idx) =>
                                file.fileType === "image" ? (
                                  <div
                                    key={idx}
                                    className="rounded-xl overflow-hidden border border-glass-border max-w-sm"
                                  >
                                    <img
                                      src={getMediaUrl(file.fileUrl)}
                                      alt={file.fileName}
                                      className="w-full h-auto object-contain bg-black/20"
                                    />
                                  </div>
                                ) : (
                                  <PdfPreviewCard
                                    key={idx}
                                    file={{
                                      ...file,
                                      fileUrl: getMediaUrl(file.fileUrl),
                                      fileName: file.fileName,
                                      fileSize: file.fileSize || file.size,
                                    }}
                                    className="my-1"
                                  />
                                ),
                              )}
                            </div>
                          )}
                          {displayText && (
                            <p className="whitespace-pre-line">{displayText}</p>
                          )}
                        </>
                      );
                    })()}

                    <div
                      className={`flex items-center gap-1.5 mt-3 pt-3 border-t border-glass-border text-[10px] text-app-text-muted font-medium ${isUser ? "justify-end" : "justify-between"}`}
                    >
                      <span>{message.time}</span>

                      {!isUser && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCopy(message.text, message.id)}
                            className="hover:text-app-text transition-colors"
                            title="Copy message"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suggestion Chips (only on last AI message) */}
                  {!isUser &&
                    message.suggestions &&
                    message.id ===
                      activeChat.messages[activeChat.messages.length - 1].id &&
                    !typing && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-4 py-2 border border-glass-border bg-surface-solid hover:bg-brand-blue/5 text-brand-blue dark:text-brand-cyan text-xs font-bold rounded-full transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            );
          })
        ) : (
          /* Empty Chat State */
          <div className="h-full flex flex-col items-center p-6 select-none max-w-5xl mx-auto w-full">
            {/* Hero */}
            <div className="flex flex-col items-center text-center mt-4 mb-10">
              <div className="w-40 h-40 relative mb-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-brand-blue/20 rounded-full blur-2xl animate-pulse-slow"></div>
                <div className="absolute inset-4 bg-brand-blue/10 rounded-full blur-xl"></div>

                <div className="absolute inset-0 rounded-full bg-brand-blue/10 animate-spin-slow"></div>

                <img
                  src="/robot.png"
                  alt="Robot"
                  className="w-full h-full object-contain relative z-10 animate-float drop-shadow-[0_10px_25px_rgba(59,130,246,0.35)]"
                />
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-app-text mb-3 tracking-tight animate-fade-in-up">
                Welcome to{" "}
                <span className="text-brand-blue dark:text-brand-cyan">
                  TalkEasy AI
                </span>
              </h2>

              <p className="text-sm md:text-base text-app-text-secondary max-w-lg leading-relaxed font-medium animate-fade-in-up [animation-delay:150ms]">
                Your intelligent workspace for coding, writing, research, and
                more. What shall we build today?
              </p>
            </div>

            {/* Quick Actions */}
           <div className="
  w-full
  max-w-[360px]
  sm:max-w-[640px]
  md:max-w-[768px]
  lg:max-w-[1024px]
  xl:max-w-[1280px]
  2xl:max-w-[1440px]
  mx-auto
  px-4
">
              {/* Section heading */}
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-glass-border bg-surface-solid shadow-sm">
                    <Sparkles
                      size={18}
                      strokeWidth={2}
                      className="text-app-text"
                    />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-app-text">
                      AI Tools
                    </h3>
                    <p className="mt-0.5 text-xs text-app-text-secondary">
                      Choose a tool to start your next task
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex rounded-full border border-glass-border bg-surface-solid px-3 py-1 text-[11px] font-semibold text-app-text-secondary">
                  {aiTools.length} tools
                </span>
              </div>

              {/* Tools grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {aiTools.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => setInputValue(action.prompt)}
                      className="
            group relative flex min-h-[150px] w-full
            flex-col items-start overflow-hidden rounded-2xl
            border border-glass-border bg-surface-solid p-5
            text-left shadow-sm
            transition-all duration-300 ease-out
            hover:-translate-y-1
            hover:border-app-text/20
            hover:bg-surface-solid-hover
            hover:shadow-lg
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-app-text/30
            focus-visible:ring-offset-2
            active:translate-y-0
          "
                    >
                      {/* Decorative background */}
                      <div
                        aria-hidden="true"
                        className="
              absolute -right-8 -top-8 h-24 w-24
              rounded-full bg-app-text/[0.03]
              transition-transform duration-500
              group-hover:scale-150
            "
                      />

                      {/* Icon */}
                      <div
                        className="
              relative z-10 mb-4 flex h-11 w-11
              items-center justify-center rounded-xl
              border border-glass-border bg-app-bg
              shadow-sm transition-all duration-300
              group-hover:scale-105
              group-hover:shadow-md
            "
                      >
                        <Icon
                          size={21}
                          strokeWidth={1.8}
                          className="text-app-text"
                        />
                      </div>

                      {/* Content */}
                      <div className="relative z-10 flex flex-1 flex-col">
                        <span className="mb-1.5 text-sm font-bold text-app-text">
                          {action.label}
                        </span>

                        <span className="max-w-[240px] text-xs font-medium leading-5 text-app-text-secondary">
                          {action.description}
                        </span>
                      </div>

                      {/* Hover action */}
                      <div
                        className="
              relative z-10 mt-4 flex w-full items-center
              justify-between border-t border-glass-border/70
              pt-3
            "
                      >
                        <span className="text-[11px] font-semibold text-app-text-secondary transition-colors group-hover:text-app-text">
                          Start now
                        </span>

                        <ArrowUpRight
                          size={15}
                          className="
                text-app-text-secondary
                transition-all duration-300
                group-hover:-translate-y-0.5
                group-hover:translate-x-0.5
                group-hover:text-app-text
              "
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-brand-blue flex-shrink-0 flex items-center justify-center text-on-brand active-glow">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 md:p-6 bg-transparent shrink-0">
        <div className="max-w-4xl mx-auto relative">
          {/* Staged Files Preview */}
          {stagedFiles.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3 p-3 bg-surface-solid border border-glass-border rounded-xl">
              {stagedFiles.map((file) =>
                file.fileType !== "image" ? (
                  <PdfPreviewCard
                    key={file.fileId}
                    file={file}
                    onRemove={removeStagedFile}
                  />
                ) : (
                  <div
                    key={file.fileId}
                    className="relative group rounded-lg overflow-hidden border border-glass-border bg-glass-bg flex items-center shadow-sm"
                  >
                    <div className="w-16 h-16 relative">
                      <img
                        src={file.previewUrl}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStagedFile(file.fileId)}
                      className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 shadow-md transition-colors z-10 cursor-pointer"
                      title="Remove file"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ),
              )}
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="w-full flex items-center bg-surface-solid rounded-full border border-glass-border shadow-md px-2 py-2"
          >
            <div className="flex items-center gap-1.5 pl-2 relative">
              <button
                type="button"
                className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-on-brand bg-brand-blue shrink-0 shadow-md hover:scale-105 transition-transform"
              >
                <Sparkles size={18} />
              </button>

              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text hover:bg-surface-solid-hover transition-colors cursor-pointer"
              >
                <Plus size={22} />
              </button>

              {showAttachMenu && (
                <div className="absolute bottom-full mb-3 -left-2 bg-surface-solid border border-glass-border rounded-2xl shadow-lg flex items-center gap-1.5 p-2 z-50 animate-in fade-in zoom-in duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      imageInputRef.current?.click();
                      setShowAttachMenu(false);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-surface-solid-hover text-app-text transition-colors group cursor-pointer min-w-[70px]"
                  >
                    <Image
                      size={24}
                      className="mb-2 text-app-text-muted group-hover:text-app-text transition-colors"
                    />
                    <span className="text-[10px] font-bold">Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      docInputRef.current?.click();
                      setShowAttachMenu(false);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-surface-solid-hover text-app-text transition-colors group cursor-pointer min-w-[70px]"
                  >
                    <FileText
                      size={24}
                      className="mb-2 text-app-text-muted group-hover:text-app-text transition-colors"
                    />
                    <span className="text-[10px] font-bold">Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputValue("Generate Image ");
                      setShowAttachMenu(false);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-surface-solid-hover text-app-text transition-colors group cursor-pointer min-w-[70px]"
                  >
                    <Palette
                      size={24}
                      className="mb-2 text-app-text-muted group-hover:text-app-text transition-colors"
                    />
                    <span className="text-[10px] font-bold text-center leading-tight">Generate<br/>Image</span>
                  </button>
                </div>
              )}

              {/* Hidden File Inputs */}
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
              />
              <input
                type="file"
                ref={docInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
              />
            </div>

            {/* Input field */}
            <input
              type="text"
              placeholder="Message TalkEasy..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-app-text text-sm md:text-base placeholder:text-app-text-muted px-4 py-3 focus:ring-0"
            />

            {/* Right actions */}
            <div className="flex items-center pr-1.5">
              {inputValue.trim() || stagedFiles.length > 0 ? (
                <button
                  type="submit"
                  className="w-[44px] h-[44px] rounded-full bg-brand-blue text-on-brand hover:opacity-95 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer shrink-0 shadow-md"
                >
                  <Send size={18} className="-ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleMicClick}
                  className="w-[44px] h-[44px] rounded-full bg-brand-blue text-on-brand hover:opacity-95 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer shrink-0 shadow-md"
                >
                  <AudioLines size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </form>

          <p className="mt-4 text-xs text-app-text-secondary font-medium text-center pb-2">
            TalkEasy can make mistakes. Consider checking important information.
          </p>
        </div>
      </footer>

      {/* IM-MER-SIVE Voice Mode Overlay */}
      {voiceMode && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 dark:bg-[#07090e] p-6">
          {/* Close Voice Overlay */}
          <button
            onClick={() => {
              stopStreaming();
              setVoiceMode(false);
            }}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
            title="Exit Voice Mode"
          >
            <X size={20} />
          </button>

          {/* Model info badge */}
          <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 select-none uppercase tracking-wider">
            <Sparkles size={12} className="text-brand-cyan" />
            <span>Voice Workstation: {modelType}</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full">
            {/* Orb component */}
            <VoiceOrb
              isListening={isStreaming || isPlaying}
              onClick={() => {
                if (isStreaming) {
                  stopStreaming();
                } else {
                  startStreaming();
                }
              }}
            />

            {/* Visualizer showing waves */}
            <div className="w-full mt-10">
              <VoiceVisualizer isPlaying={isStreaming || isPlaying} />
            </div>

            <div className="mt-8 text-center space-y-4">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest leading-relaxed">
                {isStreaming
                  ? "Say something, we're listening..."
                  : isPlaying
                    ? "AI is speaking..."
                    : "Tap the orb to restart microphone capture."}
              </p>

              {transcript && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl mt-4">
                  <p className="text-white font-medium italic">
                    "{transcript}"
                  </p>
                </div>
              )}

              {aiResponse && (
                <div className="p-4 bg-brand-blue/10 border border-brand-blue/30 rounded-xl mt-2 text-left">
                  <p className="text-brand-cyan font-medium text-sm whitespace-pre-line">
                    {aiResponse}
                  </p>
                </div>
              )}

              {voiceError && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl mt-2">
                  <p className="text-red-400 font-bold text-xs">{voiceError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Settings Modal */}
      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Settings & Workspace Preferences"
      >
        <div className="space-y-6 pb-2">
          {/* Section 1: AI Engine */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-app-text-muted uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-brand-blue" />
              Intelligence Engine
            </h3>

            <div className="grid grid-cols-2 gap-3.5">
              {[
                "Gemini 1.5 Pro",
                "Gemini 1.5 Flash",
                "Lumina Nexus v2",
                "Claude 3.5 Sonnet",
              ].map((model) => (
                <button
                  key={model}
                  onClick={() => setModelType(model)}
                  className={`p-3.5 rounded-xl border text-xs font-bold text-left transition-all duration-300 ${
                    modelType === model
                      ? "border-brand-blue bg-brand-blue/5 text-brand-blue dark:text-brand-cyan"
                      : "border-glass-border bg-glass-input-bg hover:bg-surface-solid-hover text-app-text"
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Synthetic Voice */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-app-text-muted uppercase tracking-widest flex items-center gap-2">
              <Sliders size={14} className="text-brand-blue" />
              Synthetic Voice Preset
            </h3>

            <div className="grid grid-cols-4 gap-2.5">
              {["Alloy", "Echo", "Fable", "Onyx", "Nova", "Shimmer"].map(
                (voice) => (
                  <button
                    key={voice}
                    onClick={() => setVoiceType(voice)}
                    className={`py-2 px-3 rounded-lg border text-[11px] font-bold text-center transition-all ${
                      voiceType === voice
                        ? "border-brand-blue bg-brand-blue/5 text-brand-blue dark:text-brand-cyan"
                        : "border-glass-border bg-glass-input-bg hover:bg-surface-solid-hover text-app-text-secondary"
                    }`}
                  >
                    {voice}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Section 3: Parameters */}
          <div className="space-y-4 pt-2 border-t border-glass-border">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-app-text">
                  Temperature
                </span>
                <p className="text-[10px] text-app-text-secondary leading-normal">
                  Controls response creativity vs precision
                </p>
              </div>
              <span className="text-xs font-bold text-brand-blue dark:text-brand-cyan">
                {temperature}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-brand-blue cursor-pointer"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-glass-border">
            <Button variant="secondary" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setSettingsOpen(false)}>
              Save Preferences
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatPage;
