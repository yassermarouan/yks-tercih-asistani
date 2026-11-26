import React from "react";
import {
  Compass,
  BookOpen,
  MapPin,
  TrendingUp,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  BookmarkCheck,
  Scale,
  X,
  Sun,
  Moon,
} from "lucide-react";

export type NavTab = "advisor" | "explorer" | "map" | "trends" | "mentor";

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "advisor", label: "Tercih Danışmanı", icon: Compass },
  { id: "explorer", label: "Program Rehberi", icon: BookOpen },
  { id: "map", label: "Şehir Haritası", icon: MapPin },
  { id: "trends", label: "Bölüm Trendleri", icon: TrendingUp },
  { id: "mentor", label: "AI Danışman", icon: MessageSquare },
];

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  shortlistCount: number;
  onOpenAuditModal: () => void;
  onOpenCompareModal: () => void;
  studentSummary?: string | null;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  shortlistCount,
  onOpenAuditModal,
  onOpenCompareModal,
  studentSummary,
  theme,
  onToggleTheme,
}) => {
  const handleNavClick = (id: NavTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  const renderSidebarBody = (isCollapsed: boolean) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#DFE4D5] to-[#D7DDD0] dark:bg-none dark:bg-[#111114] border-r border-[#D0D5C6] dark:border-zinc-800/80 select-none transition-colors duration-200">
      {/* Brand Header */}
      <div
        className={`h-14 flex items-center border-b border-[#D0D5C6] dark:border-zinc-800/80 shrink-0 ${
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => handleNavClick("advisor")}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#C6F432] dark:bg-emerald-500/15 text-[#171A12] dark:text-emerald-400 border border-[#B5DE2A] dark:border-emerald-500/25 flex items-center justify-center shrink-0 shadow-xs dark:shadow-none">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-[#171A12] dark:text-zinc-100 tracking-tight block truncate">
                YKS Asistanı
              </span>
            </div>
          </button>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 hover:bg-[#E5EDC8] dark:hover:bg-zinc-800/60 transition cursor-pointer"
          title={isCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 hover:bg-[#E5EDC8] dark:hover:bg-zinc-800/60 transition cursor-pointer"
          aria-label="Menüyü kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#6B7065] dark:text-zinc-500">
            Menü
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 rounded-xl text-sm transition cursor-pointer ${
                isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"
              } ${
                isActive
                  ? "bg-[#C6F432] dark:bg-emerald-500/12 text-[#171A12] dark:text-emerald-400 font-semibold dark:font-medium border border-[#B3DF25] dark:border-emerald-500/20 shadow-xs dark:shadow-none"
                  : "text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800/50 border border-transparent"
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 ${
                  isActive
                    ? "text-[#171A12] dark:text-emerald-400"
                    : "text-[#6B7065] dark:text-zinc-400"
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer: Student Summary, Shortlist & Theme Toggle */}
      <div className="p-2.5 border-t border-[#D0D5C6] dark:border-zinc-800/80 space-y-2 shrink-0">
        {!isCollapsed && studentSummary && (
          <div className="px-3 py-2 rounded-xl bg-[#E5EDC8] dark:bg-zinc-900/70 border border-[#CBD6A8] dark:border-zinc-800/70 text-xs">
            <span className="text-[11px] text-[#6B7065] dark:text-zinc-500 block">Aktif Profil</span>
            <span className="font-mono font-semibold text-[#526B19] dark:text-zinc-200">
              {studentSummary}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            onOpenAuditModal();
            onCloseMobile();
          }}
          title={isCollapsed ? `Tercih Listem (${shortlistCount}/24)` : undefined}
          className={`w-full flex items-center rounded-xl text-xs font-medium transition cursor-pointer border ${
            isCollapsed ? "justify-center p-2.5 relative" : "justify-between px-3 py-2.5"
          } ${
            shortlistCount > 0
              ? "bg-[#F0F1E9] dark:bg-zinc-900 border-[#D0D5C6] dark:border-zinc-700/80 text-[#171A12] dark:text-zinc-100 hover:border-[#526B19]/50 dark:hover:border-emerald-500/40 shadow-xs dark:shadow-none"
              : "bg-[#E8EBE0]/70 dark:bg-zinc-900/40 border-[#D0D5C6] dark:border-zinc-800/60 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-200"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <BookmarkCheck
              className={`w-4 h-4 shrink-0 ${
                shortlistCount > 0
                  ? "text-[#526B19] dark:text-emerald-400"
                  : "text-[#6B7065] dark:text-zinc-500"
              }`}
            />
            {!isCollapsed && <span>Tercih Listem</span>}
          </span>

          {!isCollapsed ? (
            <span
              className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                shortlistCount > 0
                  ? "bg-[#E5EDC8] dark:bg-emerald-500/15 text-[#526B19] dark:text-emerald-400 font-semibold"
                  : "bg-[#D0D5C6]/70 dark:bg-zinc-800 text-[#6B7065] dark:text-zinc-400"
              }`}
            >
              {shortlistCount}/24
            </span>
          ) : (
            shortlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C6F432] dark:bg-emerald-500 text-[#171A12] dark:text-black text-[10px] font-bold flex items-center justify-center">
                {shortlistCount}
              </span>
            )
          )}
        </button>

        {!isCollapsed && shortlistCount > 1 && (
          <button
            type="button"
            onClick={() => {
              onOpenCompareModal();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#171A12] dark:text-zinc-300 bg-[#F0F1E9] dark:bg-zinc-900/50 hover:bg-[#E5EDC8] dark:hover:bg-zinc-800 border border-[#D0D5C6] dark:border-zinc-800/80 transition cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5 text-[#526B19] dark:text-zinc-400" />
            <span>Programları Karşılaştır</span>
          </button>
        )}

        {/* Theme Switcher Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç"}
          className={`w-full flex items-center rounded-xl text-xs font-medium text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 hover:bg-[#E5EDC8]/70 dark:hover:bg-zinc-800/50 transition cursor-pointer border border-transparent ${
            isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
          }`}
        >
          <span className="flex items-center gap-2.5">
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-[#526B19] shrink-0" />
            )}
            {!isCollapsed && (
              <span>{theme === "dark" ? "Açık Tema" : "Koyu Tema"}</span>
            )}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden lg:block shrink-0 sticky top-0 h-screen transition-all duration-200 ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {renderSidebarBody(collapsed)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#171A12]/40 dark:bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative w-64 max-w-[80vw] h-full z-10">
            {renderSidebarBody(false)}
          </aside>
        </div>
      )}
    </>
  );
};
