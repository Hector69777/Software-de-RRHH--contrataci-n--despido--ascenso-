-- =====================================================================
-- Funciones de Búsqueda Inteligente para el SIA de Premium Consultores
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================================

-- 1. Búsqueda inteligente en la tabla CANDIDATOS
-- Busca por cédula, nombre, departamento deseado o formación
-- Usa ILIKE para búsqueda case-insensitive con coincidencia parcial
CREATE OR REPLACE FUNCTION buscar_candidatos(termino TEXT)
RETURNS SETOF candidatos
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM candidatos
    WHERE 
        cedula ILIKE '%' || termino || '%'
        OR nombre ILIKE '%' || termino || '%'
        OR departamento_deseado ILIKE '%' || termino || '%'
        OR formacion ILIKE '%' || termino || '%'
        OR telefono ILIKE '%' || termino || '%'
    ORDER BY fecha_registro DESC;
$$;

COMMENT ON FUNCTION buscar_candidatos(TEXT) IS 
'Función RPC para búsqueda inteligente de candidatos. Busca coincidencias parciales (case-insensitive) en: cédula, nombre, departamento deseado, formación y teléfono.';

-- 2. Búsqueda inteligente en la tabla EMPLEADO
-- Busca por cédula (cast a TEXT), nombre, cargo, departamento o estatus
CREATE OR REPLACE FUNCTION buscar_empleados(termino TEXT)
RETURNS SETOF empleado
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM empleado
    WHERE 
        CAST(cedula AS TEXT) ILIKE '%' || termino || '%'
        OR nombre ILIKE '%' || termino || '%'
        OR COALESCE(cargo, '') ILIKE '%' || termino || '%'
        OR COALESCE(departamento, '') ILIKE '%' || termino || '%'
        OR COALESCE(revisado, '') ILIKE '%' || termino || '%'
    ORDER BY fecha_ingreso DESC;
$$;

COMMENT ON FUNCTION buscar_empleados(TEXT) IS 
'Función RPC para búsqueda inteligente de empleados. Busca coincidencias parciales (case-insensitive) en: cédula, nombre, cargo, departamento y estatus de evaluación.';
