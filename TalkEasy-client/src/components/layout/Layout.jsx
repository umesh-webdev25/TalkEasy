import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AssistantPanel from './AssistantPanel';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  return (
    <div className="flex h-screen w-full bg-app-bg overflow-hidden">
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
