import React from 'react';
import { ViewState, User } from '../types';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: User;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, user }) => {
  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 h-16 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center cursor-pointer group" onClick={() => setView(ViewState.FEED)}>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-lg blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img src="/logo.png" alt="GuardaFlix" className="relative w-9 h-9 rounded-lg border border-slate-700/50 shadow-lg transform group-hover:scale-105 transition-all" />
          </div>
          <div className="flex flex-col ml-3 leading-tight">
            <span className="text-lg font-black text-white tracking-tighter">
              GUARDÃO<span className="text-blue-500">FLIX</span>
            </span>
            <span className="text-[10px] font-mono text-blue-400/60 uppercase tracking-widest hidden sm:block">Setor de Operações</span>
          </div>
        </div>

        {/* Tactical Search Interface (Hidden on Mobile) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent sm:text-sm transition-all"
              placeholder="Patrulhar Base de Dados..."
            />
          </div>
        </div>

        {/* Command Center Actions */}
        <div className="flex items-center space-x-3">
          <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95 group">
            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse border-2 border-slate-900"></div>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <div
            className="group relative h-10 w-10 p-0.5 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 cursor-pointer hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
            onClick={() => setView(ViewState.PROFILE)}
          >
            <div className="h-full w-full rounded-[10px] overflow-hidden bg-slate-900">
              <img src={user.avatar} alt="Profile" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};