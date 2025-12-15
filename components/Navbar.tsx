import React from 'react';
import { ViewState, User } from '../types';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: User;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, user }) => {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-red-100 shadow-sm h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center cursor-pointer" onClick={() => setView(ViewState.FEED)}>
          <img src="/logo.png" alt="GuardaFlix" className="w-10 h-10 rounded-lg shadow-lg transform hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold text-red-600 hidden sm:block tracking-tight ml-2">
            Guardaflix
          </span>
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-red-100 rounded-full leading-5 bg-red-50 placeholder-red-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent sm:text-sm transition-all duration-200"
              placeholder="Pesquisar no Guardaflix..."
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <div
            className="h-10 w-10 rounded-full bg-red-100 overflow-hidden cursor-pointer border-2 border-red-500 hover:ring-2 hover:ring-red-300 transition-all"
            onClick={() => setView(ViewState.PROFILE)}
          >
            <img src={user.avatar} alt="Profile" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </nav>
  );
};