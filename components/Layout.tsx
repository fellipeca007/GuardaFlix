import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ViewState, User } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    currentView: ViewState;
    setView: (view: ViewState) => void;
    user: User;
    onCreatePost: () => void; // New prop
}

// Dark Mode Layout
export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, user, onCreatePost }) => {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20 lg:pb-0">
            {/* Mobile Top Bar (Navbar simplified) */}
            <div className="lg:hidden">
                <Navbar currentView={currentView} setView={setView} user={user} />
            </div>

            <div className="flex max-w-7xl mx-auto">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-64 xl:w-72 fixed h-screen border-r border-slate-800 bg-slate-900 z-20">
                    <div className="p-6">
                        <div className="flex items-center cursor-pointer mb-8 gap-3" onClick={() => setView(ViewState.FEED)}>
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                            <div className="text-xl font-bold text-white tracking-wide">
                                Guardão<span className="text-blue-500">Flix</span>
                            </div>
                        </div>
                        <Sidebar currentView={currentView} setView={setView} />
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 w-full lg:ml-64 xl:ml-72 min-h-screen">
                    <div className="max-w-4xl mx-auto pt-4 lg:pt-8 px-4">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <MobileNav currentView={currentView} setView={setView} onCreatePost={onCreatePost} />
        </div>
    );
};
