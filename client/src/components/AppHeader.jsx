import React from 'react';

function AppHeader() {
  return (
    <header className="flex-shrink-0 bg-slate-900/70 backdrop-blur-md border-b border-slate-700 z-10">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-100">
            Интерфейс работы системы фитостелажа
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-300 hidden sm:block">
            John Doe
          </span>
          <div className="relative group">
            <button className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-slate-600 group-focus-within:ring-indigo-500 transition">
              <img
                src="/Images/johnDoe2.jpeg"
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </button>
            {/* Dropdown Menu */}
            <div
              className="absolute top-full right-0 mt-2 w-52 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-1
                opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible 
                transition-all duration-200"
            >
              <a
                href="#profile"
                className="flex justify-between items-center px-3 py-2 text-sm text-slate-300 rounded-md hover:bg-indigo-600 hover:text-white transition-colors"
              >
                Profile
                <span className="ml-auto px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full">
                  New
                </span>
              </a>
              <a
                href="#settings"
                className="block px-3 py-2 text-sm text-slate-300 rounded-md hover:bg-indigo-600 hover:text-white transition-colors"
              >
                Settings
              </a>
              <div className="h-px bg-slate-700 my-1"></div>
              <a
                href="#logout"
                className="block px-3 py-2 text-sm text-slate-300 rounded-md hover:bg-indigo-600 hover:text-white transition-colors"
              >
                Logout
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;