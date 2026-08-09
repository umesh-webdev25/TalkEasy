import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { removeToken } from "../../utils/auth";
import {
  MessageSquare,
  History,
  Star,
  FolderOpen,
  Wrench,
  Plus,
  Search,
  Trash,
  X,
  SquarePen ,
  MoreVertical,
  Share2,
  Pin,
  Pencil,
  Trash2,
  Menu,
  PanelLeft,
  Sparkles,
  ChevronDown,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Palette,
  CircleHelp,
  Check,
  Languages,
  NotebookPen,
  Mail,
  Code2,
  FileSearch,
  FileText,
} from "lucide-react";
import { useChat } from "../../context/ChatContext";
import Button from "../ui/Button";
import Dropdown from "../ui/Dropdown";
import { getUserById } from "../../api/authApi";
import ProfileModal from "./ProfileModal";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const {
    chats,
    activeChatId,
    setActiveChatId,
    createNewChat,
    deleteChat,
    toggleStarChat,
    renameChat, // add this to ChatContext if it doesn't exist yet
    pinChat, // add this to ChatContext if it doesn't exist yet
    loadingChats,
    activeSidebarView,
    setActiveSidebarView,
    files,
    analyzeFile,
    handleUploadFile,
    setSettingsOpen,
  } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [userInitials, setUserInitials] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [renamingChatId, setRenamingChatId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (!stored) return;

        const parsedUser = JSON.parse(stored);
        
        // Instantly show user data from localStorage
        setUser(parsedUser);
        const first = parsedUser.first_name?.[0] ?? "";
        const last = parsedUser.last_name?.[0] ?? "";
        setUserInitials(`${first}${last}`.toUpperCase());

        // Then fetch latest from API in background
        const response = await getUserById(parsedUser.id);
        if (response && response.user) {
          setUser(response.user);
          const resFirst = response.user.first_name?.[0] ?? "";
          const resLast = response.user.last_name?.[0] ?? "";
          setUserInitials(`${resFirst}${resLast}`.toUpperCase());
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchUser();
  }, []);

  // --- Chat row menu handlers ---
  const handleShare = (chatId) => {
    const shareUrl = `${window.location.origin}/chat/${chatId}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        // swap for a toast if you have one wired up
        console.log("Share link copied:", shareUrl);
      })
      .catch((err) => console.error("Failed to copy share link", err));
  };

  const handlePin = (chatId) => {
    if (pinChat) {
      pinChat(chatId);
    } else {
      console.warn("pinChat is not implemented in ChatContext yet");
    }
  };

  const startRename = (chat) => {
    setRenamingChatId(chat.id);
    setRenameValue(chat.title || "");
    setOpenMenuId(null);
  };

  const commitRename = (chatId) => {
    const trimmed = renameValue.trim();
    if (trimmed && renameChat) {
      renameChat(chatId, trimmed);
    }
    setRenamingChatId(null);
    setRenameValue("");
  };

  const handleDelete = (chatId) => {
    deleteChat(chatId);
  };

  const profileItems = [
    {
      render: () => (
        <div className="w-full flex items-center justify-between p-2 hover:bg-surface-solid-hover transition-colors rounded-xl cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold">
              {userInitials || "U"}
            </div>
            <div className="text-left flex flex-col">
              <span className="font-bold text-app-text text-sm truncate max-w-[140px]">
                {user
                  ? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                    "TalkEasy User"
                  : "TalkEasy User"}
              </span>
              <span className="text-[10px] text-app-text-muted truncate max-w-[140px]">
                {user?.email || "user@talkeasy.com"}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    { divider: true },
    { label: "Upgrade plan", icon: Sparkles, onClick: () => {} },
    { label: "Personalization", icon: Palette, onClick: () => {} },
    { label: "Profile", icon: User, onClick: () => setIsProfileOpen(true) },
    { label: "Settings", icon: Settings, onClick: () => setSettingsOpen(true) },
    { divider: true },
    { label: "Help", icon: CircleHelp, onClick: () => {} },
    { label: "Log out", icon: LogOut, danger: true, onClick: handleLogout },
  ];

  const userProfileTrigger = (
    <div 
      className={`flex items-center cursor-pointer group transition-all duration-300 rounded-xl border border-transparent hover:border-glass-border hover:bg-surface-solid-hover hover:shadow-sm ${
        isOpen ? 'w-full p-2 gap-2.5' : 'w-10 h-10 mx-auto justify-center p-0'
      }`}
    >
      <div className={`rounded-full flex flex-shrink-0 items-center justify-center font-bold text-brand-blue dark:text-brand-cyan bg-gradient-to-br from-brand-blue/20 to-transparent border border-brand-blue/30 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all duration-300 ${isOpen ? 'w-9 h-9 text-[13px]' : 'w-9 h-9 text-sm'}`}>
        {userInitials || "U"}
      </div>
      
      {isOpen && (
        <div className="flex-col text-left flex-1 min-w-0 transition-opacity duration-300 flex">
          <span className="text-sm font-extrabold text-app-text truncate block tracking-tight group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors">
            {user
              ? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                "TalkEasy User"
              : "TalkEasy User"}
          </span>
          <span className="text-[10px] font-medium text-app-text-muted truncate block">
            {user?.email || "user@talkeasy.com"}
          </span>
        </div>
      )}

      {isOpen && (
        <div className="flex-shrink-0 text-app-text-muted opacity-40 group-hover:opacity-100 transition-opacity pr-1">
          <MoreVertical size={16} />
        </div>
      )}
    </div>
  );

  const navItems = [
    { id: "chats", label: "Chats", icon: MessageSquare },
    { id: "starred", label: "Starred", icon: Star },
    { id: "image_generator", label: "Generated", icon: Sparkles },
    { id: "tools", label: "Tools", icon: Wrench, badge: "New" },
  ];

  const filteredChats = chats.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.preview.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const starredChats = filteredChats.filter((c) => c.isStarred);

  const handleToolClick = (toolType) => {
    createNewChat(null, toolType);
    if (window.innerWidth < 768) toggleSidebar();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handleUploadFile(file);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 dark:bg-black/60 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-45 flex flex-col glass-panel h-[100dvh] ${isMounted ? "transition-all duration-300" : "transition-none"} overflow-hidden ${
          isOpen
            ? "w-56 translate-x-0 opacity-100 border-r border-glass-border"
            : "w-0 md:w-[68px] -translate-x-full md:translate-x-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto border-none md:border-r md:border-glass-border"
        }`}
      >
        <div className="flex flex-col h-full w-full shrink-0">
          {/* Header */}
          <div className={`p-4 flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
            {isOpen && (
              <div className="flex items-center gap-2 ml-1.5">
                <img
                  src="/talkeasy.svg"
                  alt="TalkEasy Logo"
                  className="w-7 h-7 object-contain dark:invert mb-1"
                />
                <span className="font-extrabold text-[15px] text-app-text tracking-tight">
                  TalkEasy
                </span>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-colors ${isOpen ? 'text-app-text-muted hover:bg-surface-solid-hover' : 'hover:bg-surface-solid-hover bg-transparent'}`}
              title={isOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              {isOpen ? (
                <PanelLeft size={22} />
              ) : (
                <img
                  src="/talkeasy.svg"
                  alt="TalkEasy Logo"
                  className="w-[26px] h-[26px] object-contain dark:invert"
                />
              )}
            </button>
          </div>

          <div className="px-3 mb-3 flex justify-center">
            <Button
              onClick={() => {
                setActiveSidebarView("chats");
                createNewChat();
                if (!isOpen && window.innerWidth >= 768) toggleSidebar();
                if (isOpen && window.innerWidth < 768) toggleSidebar();
              }}
              variant="primary"
              className={`rounded-xl transition-all duration-300 ${isOpen ? 'w-full justify-between py-2.5 px-3.5' : 'w-10 h-10 p-0 flex items-center justify-center rounded-[14px]'}`}
              title={!isOpen ? "New Chat" : ""}
            >
              {isOpen ? (
                <span className="flex items-center gap-2 text-[13px]">
                  <Plus size={16} strokeWidth={2.5} />
                  New Chat
                </span>
              ) : (
                <Plus size={20} strokeWidth={2.5} />
              )}
            </Button>
          </div>

          {isOpen && (
            <div className="px-4 mb-1.5 mt-1.5">
              <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider">
                Main
              </span>
            </div>
          )}
          <nav className="px-2 space-y-0.5 mb-3">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeSidebarView === item.id;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveSidebarView(item.id);
                    if (!isOpen && window.innerWidth >= 768) toggleSidebar();
                  }}
                  title={!isOpen ? item.label : ""}
                  className={`flex items-center rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-300 ${
                    isOpen ? 'w-full px-3 py-2 gap-3' : 'w-10 h-10 mx-auto justify-center mb-1'
                  } ${
                    isActive
                      ? "bg-brand-blue/10 text-brand-blue dark:text-brand-cyan"
                      : "text-app-text-secondary hover:bg-surface-solid-hover"
                  }`}
                >
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? "text-brand-blue dark:text-brand-cyan"
                        : "text-app-text-muted"
                    }
                  />
                  {isOpen && <span className="flex-1 text-left">{item.label}</span>}
                  {isOpen && item.badge && (
                    <span className="bg-brand-blue dark:bg-brand-cyan/20 text-on-brand dark:text-brand-cyan text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {(activeSidebarView === "chats" ||
            activeSidebarView === "history" ||
            activeSidebarView === "starred") && isOpen && (
            <>
              <div className="px-4 pb-2 text-[11px] font-bold text-app-text-muted uppercase tracking-wider flex items-center justify-between">
                <span>
                  {activeSidebarView === "starred"
                    ? "Starred Chats"
                    : activeSidebarView === "history"
                      ? "Chat History"
                      : "Recent Chats"}
                </span>
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-app-text-muted hover:text-app-text transition-colors"
                >
                  <Search size={13} />
                </button>
              </div>

              {showSearch && (
                <div className="px-4 mb-3">
                  <input
                    type="text"
                    placeholder="Filter chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-glass-input-bg border border-glass-border rounded-xl py-2 px-3 text-xs outline-none text-app-text placeholder:text-app-text-muted focus:ring-1 focus:ring-brand-blue/30 transition-all duration-300"
                  />
                </div>
              )}

              <div className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
                {loadingChats ? (
                  <div className="text-center py-6 text-xs text-brand-blue dark:text-brand-cyan font-medium animate-pulse">
                    Loading chats...
                  </div>
                ) : (
                  (activeSidebarView === "starred"
                    ? starredChats
                    : filteredChats
                  ).map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        if (renamingChatId === chat.id) return;
                        setActiveChatId(chat.id);
                        if (window.innerWidth < 768) toggleSidebar();
                      }}
                      className={`relative px-2 py-2 rounded-xl cursor-pointer group transition-all duration-300 border ${
                        chat.id === activeChatId
                          ? "bg-surface-solid border-glass-border shadow-sm"
                          : "hover:bg-surface-solid-hover border-transparent"
                      }`}
                    >
                      {renamingChatId === chat.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => commitRename(chat.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(chat.id);
                            if (e.key === "Escape") {
                              setRenamingChatId(null);
                              setRenameValue("");
                            }
                          }}
                          className="w-[85%] bg-transparent border-b border-brand-blue text-xs text-app-text outline-none pr-6"
                        />
                      ) : (
                        <p className="text-sm text-app-text font-medium truncate pr-6">
                          {chat.title}
                        </p>
                      )}

                      {/* 3-dot trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === chat.id ? null : chat.id,
                          );
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-[36px] h-[36px] flex items-center justify-center rounded-lg text-app-text-muted hover:text-app-text hover:bg-base-200 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {openMenuId === chat.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                            }}
                          />

                          <div
                            className="absolute right-2 top-full mt-1 z-50 w-40 rounded-lg border border-glass-border bg-surface-solid shadow-lg py-1 animate-in fade-in zoom-in-95 duration-150"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                handleShare(chat.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-app-text hover:bg-surface-solid-hover transition-colors"
                            >
                              <Share2 size={15} />
                              Share
                            </button>

                            <button
                              onClick={() => {
                                handlePin(chat.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-app-text hover:bg-surface-solid-hover transition-colors"
                            >
                              <Pin size={15} />
                              {chat.pinned ? "Unpin" : "Pin"}
                            </button>

                            <button
                              onClick={() => startRename(chat)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-app-text hover:bg-surface-solid-hover transition-colors"
                            >
                              <Pencil size={15} />
                              Rename
                            </button>

                            <div className="my-1 border-t border-glass-border" />

                            <button
                              onClick={() => {
                                handleDelete(chat.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}

                {!loadingChats && filteredChats.length === 0 && (
                  <div className="text-center py-6 text-xs text-app-text-muted font-medium">
                    No chats found
                  </div>
                )}
              </div>
            </>
          )}

          {activeSidebarView === "image_generator" && isOpen && (
            <div className="flex-1 flex flex-col px-3 h-full overflow-hidden">
              <div className="px-2 pb-2 text-xs font-bold text-app-text-muted uppercase tracking-wider">
                Image Generator
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 text-brand-blue dark:text-brand-cyan flex items-center justify-center mb-3">
                  <Sparkles size={26} />
                </div>
                <h3 className="text-sm font-bold text-app-text mb-1.5">
                  Create AI Images
                </h3>
                <p className="text-xs text-app-text-secondary mb-6">
                  Describe what you want to see, and TalkEasy will generate it
                  for you.
                </p>
                <Button
                  onClick={() => handleToolClick("image_generator")}
                  className="w-full py-2.5"
                >
                  <span className="font-bold text-xs uppercase tracking-wide">
                    Start Generating
                  </span>
                </Button>
              </div>
            </div>
          )}

          {activeSidebarView === "tools" && isOpen && (
            <div className="flex-1 flex flex-col px-3 h-full overflow-hidden">
              <div className="flex items-center gap-2 px-2 pb-3 mt-1">
                <Sparkles size={16} className="text-app-text" />
                <h3 className="font-bold text-sm text-app-text">AI Tools</h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pb-4">
                {[
                  {
                    id: "translator",
                    name: "Translator",
                    desc: "Translate text accurately",
                    icon: Languages,
                  },
                  {
                    id: "meeting_notes",
                    name: "Meeting Notes",
                    desc: "Summarize meetings",
                    icon: NotebookPen,
                  },
                  {
                    id: "email_writer",
                    name: "Email Writer",
                    desc: "Professional emails",
                    icon: Mail,
                  },
                  {
                    id: "code_assistant",
                    name: "Code Assistant",
                    desc: "Expert software engineer",
                    icon: Code2,
                  },
                  {
                    id: "pdf_analyzer",
                    name: "PDF Analyzer",
                    desc: "Analyze PDF documents",
                    icon: FileSearch,
                  },
                  {
                    id: "document_summarizer",
                    name: "Doc Summarizer",
                    desc: "Summarize documents",
                    icon: FileText,
                  },
                ].map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <div
                      key={tool.id}
                      onClick={() => handleToolClick(tool.id)}
                      className="p-2.5 rounded-xl bg-surface-solid border border-glass-border hover:bg-surface-solid-hover cursor-pointer transition-all duration-300 flex items-start gap-2.5 group"
                    >
                      <div
                        className="w-7 h-7 rounded-lg bg-app-bg border border-glass-border flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                      >
                        <Icon size={14} className="text-app-text" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-app-text mb-0.5">
                          {tool.name}
                        </div>
                        <div className="text-xs font-medium text-app-text-secondary">
                          {tool.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-auto p-2 border-t border-glass-border">
            <Dropdown
              trigger={userProfileTrigger}
              items={profileItems}
              align="top-left"
              className="w-full"
              menuClassName="w-[calc(100%-1rem)] ml-2 mb-2"
            />
          </div>
        </div>
      </aside>

      {isProfileOpen && (
        <ProfileModal user={user} onClose={() => setIsProfileOpen(false)} />
      )}
    </>
  );
};

export default Sidebar;
