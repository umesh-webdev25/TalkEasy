import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AssistantPanel from './AssistantPanel';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : false; // Better default for responsiveness, close by default on mobile/tablet
  });

  return (
    <div className="flex h-[100dvh] w-full bg-app-bg overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main content grid */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        
        <div className="flex-1 flex min-h-0 relative">
          {/* Main workspace */}
          <main className="flex-1 flex flex-col min-w-0 relative">
            {children}
          </main>
          
          {/* Right settings/assistant panel */}
          <AssistantPanel />
        </div>
      </div>
    </div>
  );
};

export default Layout;
