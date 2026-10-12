import React, { useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Bot,
  Users,
  ArrowLeftRight,
  ShieldAlert,
  CreditCard,
  BookOpen,
  FolderArchive,
  Bell,
  Wrench,
  Activity,
  Layers,
  Sliders,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hitlCount?: number;
  notificationCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4 text-sky-400" />
    },
    {
      id: 'command',
      label: 'AI Command Center',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 'orchestration',
      label: 'Multi-Agent Orchestration',
      icon: <Bot className="w-4 h-4 text-purple-400" />
    },
    {
      id: 'customers',
      label: 'Customers & Accounts',
      icon: <Users className="w-4 h-4 text-cyan-400" />
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <ArrowLeftRight className="w-4 h-4 text-sky-400" />
    },
    {
      id: 'risk',
      label: 'Risk & Fraud',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />
    },
    {
      id: 'loans',
      label: 'Credit & Loans',
      icon: <CreditCard className="w-4 h-4 text-amber-400" />
    },
    {
      id: 'knowledge',
      label: 'Knowledge Base',
      icon: <BookOpen className="w-4 h-4 text-teal-400" />
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <FolderArchive className="w-4 h-4 text-indigo-400" />
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 'tools',
      label: 'API & Tool Registry',
      icon: <Wrench className="w-4 h-4 text-amber-400" />
    },
    {
      id: 'observability',
      label: 'Observability & Audit',
      icon: <Activity className="w-4 h-4 text-sky-400" />
    },
    {
      id: 'architecture',
      label: 'Architecture',
      icon: <Layers className="w-4 h-4 text-purple-400" />
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Sliders className="w-4 h-4 text-slate-400" />
    }
  ];

  return (
    <aside
      className={`transition-all duration-300 flex-shrink-0 border-r border-sky-950/60 bg-navy-900/70 backdrop-blur-md p-2.5 flex flex-col justify-between ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex flex-col gap-1.5">
        {/* Toggle Collapse Button */}
        <div className="flex items-center justify-end px-1 pb-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-navy-950/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 14 Navigation Items */}
        <nav className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-140px)] pr-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40 shadow-xs shadow-sky-500/10'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                  {item.icon}
                </div>
                {!collapsed && (
                  <span className="truncate flex-1 tracking-normal font-medium">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      {!collapsed ? (
        <div className="p-2.5 rounded-lg bg-navy-950/80 border border-slate-800/80 text-[10px] text-slate-400 flex flex-col gap-0.5 mt-2">
          <div className="font-semibold text-slate-300">Wrench Wise AI Banking</div>
          <div className="font-mono text-[9px] text-emerald-400">BCBS 238 &bull; FATF Rec 16 Compliant</div>
        </div>
      ) : (
        <div className="text-center py-2 text-[9px] font-mono text-emerald-400">WW</div>
      )}
    </aside>
  );
};
