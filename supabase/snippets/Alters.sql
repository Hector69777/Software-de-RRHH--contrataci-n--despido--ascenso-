ALTER TABLE empleado ADD COLUMN IF NOT EXISTS puntuacion_general NUMERIC DEFAULT 0;
ALTER TABLE empleado ADD COLUMN IF NOT EXISTS respuestas_evaluacion360 JSONB;
ALTER TABLE empleado ADD COLUMN IF NOT EXISTS salario NUMERIC DEFAULT 0;
ALTER TABLE empleado ADD COLUMN IF NOT EXISTS revisado TEXT DEFAULT 'Pendiente'
    CHECK (revisado IN ('Pendiente', 'Revisado', 'Ascendido', 'Despedido'));
ALTER TABLE empleado ADD COLUMN IF NOT EXISTS fecha_ultima_evaluacion TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Pendiente';
