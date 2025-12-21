import React from 'react';
import { FriendRequest } from '../types';

interface FriendRequestCardProps {
    request: FriendRequest;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({ request, onAccept, onReject }) => {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl group hover:border-blue-500/30 transition-all">
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <img src={request.avatar} alt={request.name} className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-lg" />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                </div>
                <div>
                    <h4 className="font-black text-white text-sm uppercase tracking-tight">{request.name}</h4>
                    <p className="text-blue-500/80 font-mono text-[10px] uppercase tracking-wider">{request.handle}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => onAccept(request.id)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                >
                    Aceitar
                </button>
                <button
                    onClick={() => onReject(request.id)}
                    className="bg-slate-700/50 hover:bg-red-600/20 text-slate-400 hover:text-red-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-600/50 hover:border-red-500/30 transition-all active:scale-95"
                >
                    Ignorar
                </button>
            </div>
        </div>
    );
};
