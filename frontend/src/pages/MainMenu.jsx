import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from './App';
import Logo from 'assets/logowhite.svg';
import { ROOT_URL } from '../config';

export default function Sidebar() {
  const { auth, handleLogout } = useContext(AppContext);
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-blue-900 text-white min-h-screen flex flex-col p-4">
      <img src={Logo} alt="Logo" className="w-10 h-12 mb-2 mx-auto" />
      <div className="mb-8 flex items-center">
        <span className="font-bold text-xl">Gestão RH</span>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <span className="text-gray-300 px-2 text-sm uppercase">Área Pessoal</span>
          </li>
          <li>
            <Link to="/app/rh/registospessoal" className="flex items-center px-2 py-2 rounded hover:bg-blue-700">
              Registo de Picagens
            </Link>
          </li>
          <li>
            <Link to="/app/rh/planpessoal" className="flex items-center px-2 py-2 rounded hover:bg-blue-700">
              Plano de Horários
            </Link>
          </li>
          <li>
            <Link to="/app/rh/depart" className="flex items-center px-2 py-2 rounded hover:bg-blue-700">
              Gestão de Departamento
            </Link>
          </li>
          {auth?.isRH &&
            (<>
              <li className="mt-4">
                <span className="text-gray-300 px-2 text-sm uppercase">Recursos Humanos</span>
              </li>
              <li>
                <a href={window.location.assign(ROOT_URL)} className="flex items-center px-2 py-2 rounded hover:bg-blue-700">
                  Aplicação de Registo de Ponto
                </a>
              </li>
              <li>
                <Link to="/app/rh/registos" className="flex items-center px-2 py-2 rounded hover:bg-blue-700">
                  Registo de Picagens
                </Link>
              </li>
              <li>
                <Link to="/app/rh/registosv3" className="flex items-center px-2 py-2 rounded hover:bg-blue-700">
                  Registo de Picagens V3
                </Link>
              </li>
              <li>
                <Link to="/app/rh/plan" className="flex items-center px-2 py-2 rounded hover:bg-blue-700">
                  Plano de Horários
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
      <div className="mt-auto">
        <button
          onClick={async () => {
            if (window.confirm('Terminar Sessão?')) handleLogout();
          }}
          className="flex items-center w-full px-2 py-2 rounded bg-blue-700 hover:bg-red-700 transition"
        >

          Terminar Sessão {auth?.first_name && <span className="ml-2 font-semibold">{auth.first_name}</span>}
        </button>
      </div>
    </aside>
  );
}