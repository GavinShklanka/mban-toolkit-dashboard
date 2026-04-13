import { useState } from 'react'
import { NavLink } from 'react-router-dom'

// Primary navigation — student-facing
const primaryNav = [
  { path: '/', label: 'Home', icon: '🏠', short: 'Home' },
  { path: '/courses', label: 'My Courses', icon: '📚', short: 'Courses' },
  { path: '/methods', label: 'Method Library', icon: '🔬', short: 'Methods' },
  { path: '/projects', label: 'Projects & Work', icon: '📁', short: 'Projects' },
  { path: '/ask', label: 'Ask MBAN', icon: '💬', short: 'Ask' },
]

// Secondary navigation — tools
const secondaryNav = [
  { path: '/ladder', label: 'Analytics Ladder', icon: '📊', short: 'Ladder' },
  { path: '/router', label: 'Solution Router', icon: '🗺️', short: 'Router' },
  { path: '/governance', label: 'Governance', icon: '🛡️', short: 'Gov' },
]

// All nav items for mobile bottom bar
const allMobileNav = [...primaryNav, ...secondaryNav]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [adminOpen, setAdminOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-gray-950 border-r border-gray-800 fixed h-full z-10">
        <div className="p-4 border-b border-gray-800">
          <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">MBAN Toolkit</div>
          <div className="text-xs text-gray-500">Saint Mary's University</div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {/* Primary nav */}
          <div className="mb-1">
            {primaryNav.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-purple-900/40 text-purple-300 border-r-2 border-purple-400'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Secondary nav */}
          <div className="mt-4 pt-4 border-t border-gray-800/60">
            <div className="px-4 mb-1.5 text-xs text-gray-600 uppercase tracking-widest font-semibold">Tools</div>
            {secondaryNav.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-purple-900/30 text-purple-300 border-r-2 border-purple-500'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/60'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer: version + admin gear */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">v3.0 · Apr 2026</span>
            <div className="relative">
              <button
                onClick={() => setAdminOpen(v => !v)}
                className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
                title="Admin"
              >
                ⚙️
              </button>
              {adminOpen && (
                <div className="absolute bottom-8 right-0 bg-gray-800 border border-gray-700 rounded-lg py-1 min-w-[140px] shadow-xl z-20">
                  <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wider font-semibold">Admin</div>
                  <NavLink
                    to="/admin/evidence"
                    onClick={() => setAdminOpen(false)}
                    className="block px-3 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    📋 Source Quality
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 z-10">
        <div className="flex overflow-x-auto scrollbar-hide">
          {allMobileNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex-none flex flex-col items-center py-2 px-2.5 min-w-[52px] text-xs transition-colors ${
                  isActive ? 'text-purple-400' : 'text-gray-500'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="mt-0.5 whitespace-nowrap">{item.short}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
