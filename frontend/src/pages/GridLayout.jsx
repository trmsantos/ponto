import React, { useState, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { notification } from 'antd'; 
import Logo from 'assets/logowhite.svg';
import { AppContext } from './App';
import MainMenu from './MainMenu';
import { Menu as MenuIcon, X, Bell } from 'lucide-react';
// A LINHA ABAIXO FOI ADICIONADA PARA CORRIGIR O ERRO
import { isRH } from './commons'; 

export const LayoutContext = React.createContext({});

export default () => {
    const [api, contextHolder] = notification.useNotification();
    const { auth, handleLogout } = useContext(AppContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const openNotification = (status, placement, message, description) => {
        const config = {
            message: message || `Notificação`,
            description: description,
            placement,
            className: 'font-sans' // Garante fonte correta no antd
        };
        if (status === "error") api.error(config);
        else if (status === "success") api.success(config);
        else api.info(config);
    };

    return (
        <LayoutContext.Provider value={{ openNotification }}>
            {contextHolder}
            
            <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
                
                {/* --- SIDEBAR (DESKTOP) --- */}
                <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-white shadow-2xl z-30 shrink-0">
                    <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900">
                        {/* Ajusta o tamanho do logo aqui se necessário */}
                        <div className="w-32 h-8 flex items-center">
                             <Logo className="w-full h-full text-white" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                         <MainMenu auth={auth} handleLogout={handleLogout} />
                    </div>
                </aside>

                {/* --- MOBILE DRAWER --- */}
                {/* Backdrop */}
                <div 
                    className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onClick={() => setIsSidebarOpen(false)}
                />
                
                {/* Gaveta */}
                <div className={`fixed inset-y-0 left-0 w-72 bg-slate-900 text-white z-50 transform transition-transform duration-300 md:hidden shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                        <div className="w-28 h-6">
                            <Logo className="w-full h-full text-white" />
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto">
                        <MainMenu auth={auth} handleLogout={handleLogout} onToggleDrawer={() => setIsSidebarOpen(false)} />
                    </div>
                </div>

                {/* --- ÁREA PRINCIPAL --- */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
                    
                    {/* Header */}
                    <header className="h-16 bg-white shadow-sm border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 z-20 shrink-0">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setIsSidebarOpen(true)} 
                                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                <MenuIcon size={24} />
                            </button>
                            
                            <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">
                                Portal do Colaborador
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Nome do Utilizador */}
                            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                                <div className="text-right hidden sm:block leading-tight">
                                    <p className="text-sm font-semibold text-slate-900">{auth?.first_name} {auth?.last_name}</p>
                                    <p className="text-xs text-slate-500">
                                        {/* Agora o isRH já está definido */}
                                        {isRH(auth) ? 'Recursos Humanos' : 'Colaborador'}
                                    </p>
                                </div>
                                <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white">
                                    {auth?.first_name?.charAt(0) || 'U'}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Conteúdo das Rotas - EXPANDIDO */}
                    <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 scroll-smooth">
                        <div className="w-full max-w-[1920px] mx-auto min-h-full">
                            <Outlet />
                        </div>
                    </main>

                </div>
            </div>
        </LayoutContext.Provider>
    );
};