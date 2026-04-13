import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Cockpit', icon: '🏠', short: 'Home' },
  { path: '/ladder', label: 'Ladder', icon: '📊', short: 'Ladder' },
  { path: '/courses', label: 'Courses', icon: '📚', short: 'Courses' },
  { path: '/methods', label: 'Methods', icon: '🔬', short: 'Methods' },
  { path: '/ask', label: 'Ask MBAN', icon: '💬', short: 'Ask' },
  { path: '/router', label: 'Router', icon: '🗺️', short: 'Router' },
  { path: '/refresh', label: 'Refresh', icon: '💡', short: 'Refresh' },
  { path: '/governance', label: 'Governance', icon: '🛡️', short: 'Gov' },
  { path: '/evidence', label: 'Evidence', icon: '📋', short: 'Audit' },
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
        <nav className="flex-1 py-4">
          {navItems.map(item => (
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
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-600">v2.0 · Apr 2026</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 z-10">
        <div className="flex">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                  isActive ? 'text-purple-400' : 'text-gray-500'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="mt-0.5">{item.short}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
