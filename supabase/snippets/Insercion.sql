-- 1. Agregar las 5 columnas faltantes a empleado
ALTER TABLE empleado ADD COLUMN IF NOT EXISTS revisado TEXT DEFAULT 'Pendiente';
ALTER TABLE empleado ADD COLUMN IF NOT EXISTS respuestas_evaluacion360 JSONB;
ALTER TABLE empleado ADD COLUMN IF NOT EXISTS puntuacion_general NUMERIC DEFAULT 0;
ALTER TABLE empleado ADD COLUMN IF NOT EXISTS salario NUMERIC DEFAULT 0;
ALTER TABLE empleado ADD COLUMN IF NOT EXISTS fecha_ultima_evaluacion TIMESTAMPTZ DEFAULT NULL;

-- 2. Agregar el CHECK constraint para revisado
ALTER TABLE empleado ADD CONSTRAINT empleado_revisado_check 
    CHECK (revisado IN ('Pendiente', 'Revisado', 'Ascendido', 'Despedido'));

-- 3. Agregar columna estado a candidatos (si no la tiene)
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Pendiente';
