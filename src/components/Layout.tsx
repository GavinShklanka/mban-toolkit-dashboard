import React from 'react'
import { NavLink } from 'react-router-dom'

const primaryNav = [
  { path: '/', label: 'Home', icon: '🏠', short: 'Home' },
  { path: '/courses', label: 'My Courses', icon: '📚', short: 'Courses' },
  { path: '/methods', label: 'Method Library', icon: '🔬', short: 'Methods' },
  { path: '/lab', label: 'Model Lab', icon: '⚗️', short: 'Lab' },
  { path: '/projects', label: 'Projects', icon: '📁', short: 'Projects' },
  { path: '/ask', label: 'Ask MBAN', icon: '💬', short: 'Ask' },
]

// Mobile nav uses text labels only — no emoji
const mobileNav = [
  { path: '/', label: 'Home' },
  { path: '/courses', label: 'Courses' },
  { path: '/methods', label: 'Methods' },
  { path: '/lab', label: 'Lab' },
  { path: '/projects', label: 'Projects' },
  { path: '/ask', label: 'Ask' },
]

const secondaryNav = [
  { path: '/ladder', label: 'Ladder', icon: '📊', short: 'Ladder' },
  { path: '/router', label: 'Router', icon: '🗺️', short: 'Router' },
  { path: '/governance', label: 'Governance', icon: '🛡️', short: 'Gov' },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-gray-950 border-r border-gray-800 fixed h-full z-10">
        <div className="p-4 border-b border-gray-800">
          <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">MBAN Toolkit</div>
          <div className="text-xs text-gray-500">Saint Mary's University</div>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
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
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Secondary nav — smaller, subdued */}
          <div className="mt-4 pt-4 border-t border-gray-800/60">
            <div className="px-4 mb-2 text-xs text-gray-600 uppercase tracking-widest font-semibold">Tools</div>
            {secondaryNav.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-xs transition-colors ${
                    isActive
                      ? 'text-purple-300 bg-purple-900/20 border-r-2 border-purple-500'
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

        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-600 mb-1">v3.0 · Apr 2026</div>
          <NavLink
            to="/admin/evidence"
            className={({ isActive }) =>
              `text-xs transition-colors flex items-center gap-1 ${
                isActive ? 'text-gray-400' : 'text-gray-700 hover:text-gray-500'
              }`
            }
          >
            <span>⚙</span>
            <span>Evidence Audit</span>
          </NavLink>
        </div>
      </aside>

      {/* Main content — safe-area-aware bottom padding on mobile */}
      <main
        className="flex-1 md:ml-56 md:pb-0"
        style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {children}
      </main>

      {/* Mobile Bottom Nav — text labels only, safe-area padding */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 z-10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex">
          {mobileNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' } as React.CSSProperties}
              className={({ isActive }) =>
                `flex-1 flex items-center justify-center py-3 px-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-purple-400' : 'text-gray-500'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
