import React, { useState } from 'react';
import { supabase } from '../services/supabase';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // New name state
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: name || email.split('@')[0], // Use provided name or default
                            handle: `@${(name || email.split('@')[0]).toLowerCase().replace(/\s+/g, '_')}`, // Generate handle from name
                        },
                    },
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fef2f2] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-red-50">
                <div className="bg-red-600 p-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">GuardaFlix</h1>
                    <p className="text-red-100">Rede Social do Guardão</p>
                </div>

                <div className="p-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                        {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'}
                    </h2>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all"
                                    placeholder="Seu nome"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-70 flex items-center justify-center"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                isSignUp ? 'Cadastrar' : 'Entrar'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-2 text-red-600 font-bold hover:underline"
                        >
                            {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
