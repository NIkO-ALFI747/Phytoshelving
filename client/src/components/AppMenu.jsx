import React from 'react';

function AppMenu() {
  // Helper for SVG icons
  const Icon = ({ path, active = false }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-6 w-6 ${active ? 'fill-current' : ''}`}
      fill={active ? 'currentColor' : 'none'}
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d={path}
      />
    </svg>
  );

  return (
    <nav className="flex-shrink-0 bg-slate-800 border-r border-slate-700">
      <div className="flex flex-col items-center h-full p-3 space-y-4">
        <a
          href="/"
          title="Home"
          className="flex items-center justify-center h-12 w-12 rounded-lg text-slate-400 hover:bg-indigo-500 hover:text-white transition-colors duration-200"
        >
          <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </a>
        <a
          href="#details"
          title="Details"
          className="flex items-center justify-center h-12 w-12 rounded-lg text-slate-400 hover:bg-indigo-500 hover:text-white transition-colors duration-200"
        >
          <Icon path="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </a>
        <a
          href="#stats"
          title="Stats"
          className="flex items-center justify-center h-12 w-12 rounded-lg text-slate-400 hover:bg-indigo-500 hover:text-white transition-colors duration-200"
        >
          <Icon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </a>
        {/* Active link style */}
        <a
          href="/search"
          title="Filter"
          className="flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 512 512" fill="currentColor">
            <path d="M3.9 54.9C10.5 40.9 24.5 32 40 32H472c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9V448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6V320.9L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z" />
          </svg>
        </a>
      </div>
    </nav>
  );
}

export default AppMenu;