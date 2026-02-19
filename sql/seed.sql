-- 1. Insertar Competencias (Basadas en el PDF del caso)
INSERT INTO competencias (nombre, descripcion) VALUES
('Producción', 'Capacidad para ejecutar el trabajo canalizando recursos y logrando resultados financieros.'),
('Iniciativa', 'Capacidad para proponer ideas útiles y eliminar obstáculos para metas institucionales.'),
('Comunicación', 'Exactitud y claridad en la presentación verbal/escrita y tendencia a compartir información.'),
('Relaciones Interpersonales', 'Capacidad para establecer clima de cooperación y trabajo en equipo.'),
('Manejo del Cambio', 'Flexibilidad y receptividad para ser un impulsor de mejoras en la organización.');

-- 2. Insertar al Empleado (Juan Carlos Sánchez)
-- Se añade un valor placeholder para 'cedula' ya que es NOT NULL en el esquema
INSERT INTO empleado (cedula, nombre, cargo, contratado, departamento) 
VALUES (12345678, 'Juan Carlos Sánchez', 'Consultor Senior', TRUE, 'Finanzas');

-- 3. Definir Perfil Meta (Director General)
-- Nota: Usamos una subconsulta para obtener los IDs de las competencias recién creadas y asignar puntaje ideal de 5
INSERT INTO perfil_meta (cargo_obj, competencia_id, puntaje_ideal)
SELECT 'Director General', id, 5 FROM competencias;

-- 4. Registro de Prueba: Evaluación 360 (Simulando el conflicto del caso)
-- Vamos a insertar una evaluación donde un "Colega" califica bajo a Sánchez en Comunicación
DO $$
DECLARE
    sanchez_id UUID;
    comp_comunicacion_id INT8;
BEGIN
    SELECT id INTO sanchez_id FROM empleado WHERE nombre = 'Juan Carlos Sánchez' LIMIT 1;
    SELECT id INTO comp_comunicacion_id FROM competencias WHERE nombre = 'Comunicación' LIMIT 1;

    INSERT INTO evaluacion360 (evaluado_id, competencia_id, puntaje, tipo_evaluador, comentario)
    VALUES (sanchez_id, comp_comunicacion_id, 2, 'Colega (Ricardo Pérez)', 'Es muy agresivo en el trato y poco comunicativo con el equipo.');
END $$;
