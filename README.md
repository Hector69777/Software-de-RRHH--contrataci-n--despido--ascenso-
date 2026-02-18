# SIA-Premium: Sistema de Gestión de RRHH

Sistema integral para la administración de recursos humanos, enfocado en contratación, evaluación y gestión de personal.

## Descripción del Proyecto
Este software permite gestionar el ciclo de vida de los empleados, desde su contratación hasta su posible desvinculación o ascenso, utilizando algoritmos de brechas para la toma de decisiones objetivas.

## Estructura del Proyecto

### HTML (Vistas)
- `index.html`: Dashboard principal para administradores.
- `evaluacion.html`: Formulario para realizar evaluaciones de desempeño (360 o directas).
- `resultados.html`: Visualización de resultados y gráficos de radar para la toma de decisiones.

### Backend & Lógica
- `sql/schema.sql`: Definición de la base de datos (Supabase).
- `js/api-gestion.js`: Capa de abstracción para operaciones CRUD.
- `js/logic.js`: Algoritmos de cálculo de brechas y lógica de recomendación (Contratar/Despedir/Ascender).
- `js/supabase.js`: Cliente de conexión a la base de datos.
- `js/config.js`: Configuración y variables de entorno.

### Estilos
- `css/style.css`: Estilos base utilizando Tailwind CSS.

## Tecnologías
- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript (Vanilla).
- **Backend**: Supabase (PostgreSQL).
