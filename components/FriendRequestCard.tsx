import React from 'react';
import { FriendRequest } from '../types';

interface FriendRequestCardProps {
    request: FriendRequest;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({ request, onAccept, onReject }) => {
    return (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl mb-3 shadow-sm">
            <div className="flex items-center space-x-3">
                <img src={request.avatar} alt={request.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{request.name}</h4>
                    <p className="text-blue-500 text-xs">{request.handle}</p>
                </div>
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => onAccept(request.id)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                    Aceitar
                </button>
                <button
                    onClick={() => onReject(request.id)}
                    className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                    Recusar
                </button>
            </div>
        </div>
    );
};
