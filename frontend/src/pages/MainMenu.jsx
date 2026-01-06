import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { isRH } from "./commons"; 
import { 
    LogOut, 
    User, 
    Users, 
    ChevronDown, 
    ChevronRight, 
    Clock, 
    Calendar,
    Briefcase,
    LayoutDashboard
} from 'lucide-react';

import { ROOT_URL, API_URL } from "config";

const MENU_ID = "rponto-menu-01";

// Componente para item de link simples
const MenuItem = ({ onClick, children, icon: Icon }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors rounded-lg mb-1 text-left group"
    >
        {Icon && <Icon size={18} className="text-slate-400 group-hover:text-blue-400 transition-colors" />}
        <span>{children}</span>
    </button>
);

// Componente para secção colapsável (Accordion)
const MenuSection = ({ title, isOpen, onToggle, children, icon: Icon }) => {
    return (
        <div className="mb-2">
            <button 
                onClick={onToggle}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${isOpen ? 'bg-slate-800/50 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon size={20} className={isOpen ? "text-blue-400" : "text-slate-400"} />}
                    <span>{title}</span>
                </div>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
            >
                <div className="pl-4 border-l-2 border-slate-700 ml-6 space-y-1 mt-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Modal de Logout Customizado (Tailwind)
const LogoutModal = ({ isOpen, onClose, onConfirm, auth }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <LogOut className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Terminar Sessão?</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        {auth?.first_name} {auth?.last_name}, tens a certeza que desejas sair?
                    </p>
                </div>
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors border border-gray-200"
                    >
                        Não
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                        Sim
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ({ dark = false, onToggleDrawer, handleLogout, auth }) => {
    const navigate = useNavigate();
    
    // Gestão do estado do menu
    const getInitialState = () => {
        try {
            const stored = localStorage.getItem(MENU_ID);
            return stored ? JSON.parse(stored) : { areaPessoal: true, rh: true };
        } catch {
            return { areaPessoal: true, rh: true };
        }
    };

    const [openSections, setOpenSections] = useState(getInitialState());
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const toggleSection = (key) => {
        const newState = { ...openSections, [key]: !openSections[key] };
        setOpenSections(newState);
        localStorage.setItem(MENU_ID, JSON.stringify(newState));
    };

    const handleNavigation = (path, stateProps = {}) => {
        navigate(path, { state: { ...stateProps, tstamp: Date.now() }, replace: true });
        if (onToggleDrawer) onToggleDrawer(); 
    };

    return (
        <>
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                    
                    {/* Secção Área Pessoal */}
                    <MenuSection 
                        title="Área Pessoal" 
                        icon={User}
                        isOpen={openSections.areaPessoal} 
                        onToggle={() => toggleSection('areaPessoal')}
                    >
                        <MenuItem 
                            onClick={() => handleNavigation('/app/rh/registospessoal', { num: auth.num })}
                            icon={Clock}
                        >
                            Registo de Picagens
                        </MenuItem>
                        <MenuItem 
                            onClick={() => handleNavigation('/app/rh/planpessoal', { num: auth.num })}
                            icon={Calendar}
                        >
                            Plano de Horários
                        </MenuItem>
                        <MenuItem 
                            onClick={() => handleNavigation('/app/rh/depart', { num: auth.num })}
                            icon={Briefcase}
                        >
                            Gestão de Departamento
                        </MenuItem>
                    </MenuSection>

                    {/* Secção RH (Condicional) */}
                    {isRH(auth) && (
                        <MenuSection 
                            title="Recursos Humanos" 
                            icon={Users}
                            isOpen={openSections.rh} 
                            onToggle={() => toggleSection('rh')}
                        >
                            {/* CORREÇÃO AQUI: ROOT_URL passado como variável, sem aspas */}
                            <MenuItem onClick={() => window.location.assign(ROOT_URL)} icon={LayoutDashboard}>
                                Aplicação Antiga
                            </MenuItem>
                            <MenuItem onClick={() => handleNavigation('/app/rh/registos', { num: null })} icon={Clock}>
                                Registo de Picagens
                            </MenuItem>
                            <MenuItem onClick={() => handleNavigation('/app/rh/registosv3', { num: null })} icon={Clock}>
                                Registo de Picagens V3
                            </MenuItem>
                            <MenuItem onClick={() => handleNavigation('/app/rh/plan', { num: null })} icon={Calendar}>
                                Plano de Horários
                            </MenuItem>
                        </MenuSection>
                    )}
                </div>

                {/* Footer do Menu */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 mt-auto">
                    <button 
                        onClick={() => setShowLogoutModal(true)}
                        className="flex items-center justify-center gap-3 text-red-400 hover:text-white hover:bg-red-600/80 w-full px-4 py-3 rounded-lg transition-all duration-200 group"
                    >
                        <LogOut size={20} className="group-hover:text-white" />
                        <span className="font-medium">Terminar Sessão</span>
                    </button>
                </div>
            </div>

            <LogoutModal 
                isOpen={showLogoutModal} 
                onClose={() => setShowLogoutModal(false)} 
                onConfirm={handleLogout}
                auth={auth}
            />
        </>
    );
};