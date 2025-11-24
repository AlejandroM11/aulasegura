import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero principal */}
      <section className="flex flex-col-reverse md:flex-row items-center justify-between gap-10 py-10">
        
        {/* Texto */}
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            Bienvenido a <span className="text-blue-600 dark:text-blue-400">Aula Segura</span>
          </h1>

          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
            Plataforma avanzada de exámenes con control antifraude, monitoreo en tiempo real 
            y herramientas para docentes y estudiantes.
          </p>

          {/* 🎯 NUEVO: Acceso rápido destacado */}
          <div className="mt-8 space-y-3">
            <Link 
              to="/invitado" 
              className="block w-full md:w-auto text-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition shadow-xl transform hover:scale-105"
            >
              <span className="text-2xl mr-2">🎯</span>
              Acceso Rápido (sin cuenta)
            </Link>
            
            <div className="flex gap-3">
              <Link to="/login" className="btn btn-outline text-lg px-6 py-3 flex-1 text-center">
                Ingresar
              </Link>
              <Link to="/register" className="btn btn-outline text-lg px-6 py-3 flex-1 text-center">
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>

        {/* Imagen ilustrativa */}
        <div className="flex-1 flex justify-center">
          <img
            className="w-72 md:w-96 drop-shadow-lg dark:opacity-90 transition-all duration-300 hover:scale-105"
            src="https://cdn.pixabay.com/photo/2023/03/23/04/17/bookkeeper-adelaide-7871094_1280.jpg"
            alt="Examen seguro"
          />
        </div>
      </section>

      {/* Sección de características */}
      <section className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-semibold mb-2 text-blue-600 dark:text-blue-400">Control Antifraude</h3>
          <p>Detección de pérdida de foco, bloqueo automático y modo pantalla completa durante el examen.</p>
        </div>

        <div className="card hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-semibold mb-2 text-blue-600 dark:text-blue-400">Panel para Docentes</h3>
          <p>Monitorea a tus estudiantes en tiempo real, revisa por qué fueron bloqueados y desbloquéalos al instante.</p>
        </div>

        <div className="card hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-semibold mb-2 text-blue-600 dark:text-blue-400">Exámenes Inteligentes</h3>
          <p>Creación, edición y calificación automática de cuestionarios con sincronización inmediata.</p>
        </div>
      </section>

      {/* Footer ligero */}
      <footer className="mt-16 text-center text-gray-500 dark:text-gray-400 text-sm">
        © {new Date().getFullYear()} Aula Segura — Universidad de Ibagué
      </footer>
    </div>
  );
}