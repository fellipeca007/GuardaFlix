import React, { useState } from 'react';
import { supabase } from '../services/supabase';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
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
                            name: name || email.split('@')[0],
                            handle: `@${(name || email.split('@')[0]).toLowerCase().replace(/\s+/g, '_')}`,
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
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10">
                <div className="p-8 text-center border-b border-slate-700/50">
                    <img src="/logo.png" alt="Guarda de Barueri" className="w-24 h-24 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">GuardaFlix</h1>
                    <p className="text-blue-300 font-medium">Rede Social Oficial</p>
                </div>

                <div className="p-8">
                    <h2 className="text-xl font-semibold text-slate-200 mb-6 text-center">
                        {isSignUp ? 'Junte-se à Corporação' : 'Acesso ao Sistema'}
                    </h2>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-4 text-sm border border-red-500/20 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {isSignUp && (
                            <div className="group">
                                <label className="block text-xs font-medium text-blue-300/80 mb-1 uppercase tracking-wider">Nome de Guerra</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                                    placeholder="Ex: Sd. Silva"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-blue-300/80 mb-1 uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                                placeholder="identificacao@guarda.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-blue-300/80 mb-1 uppercase tracking-wider">Senha</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3.5 rounded-xl font-bold hover:from-blue-500 hover:to-blue-700 transition-all shadow-lg shadow-blue-900/30 disabled:opacity-70 flex items-center justify-center mt-6"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                isSignUp ? 'Criar Acesso' : 'Entrar no Sistema'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-700/50 text-center text-sm text-slate-400">
                        {isSignUp ? 'Já possui credenciais?' : 'Novo na corporação?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-2 text-blue-400 font-bold hover:text-blue-300 transition-colors"
                        >
                            {isSignUp ? 'Acessar Conta' : 'Solicitar Acesso'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
