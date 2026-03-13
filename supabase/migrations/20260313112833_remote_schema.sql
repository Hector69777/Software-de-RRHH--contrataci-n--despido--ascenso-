


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."candidatos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cedula" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "telefono" "text",
    "cv_url" "text",
    "departamento_deseado" "text" DEFAULT 'Finanzas'::"text",
    "años_experiencia" smallint DEFAULT 0,
    "formacion" "text",
    "respuestas_evaluacion" "jsonb",
    "fecha_registro" timestamp with time zone DEFAULT "now"(),
    "estado" "text" DEFAULT 'Pendiente'::"text",
    CONSTRAINT "candidatos_estado_check" CHECK (("estado" = ANY (ARRAY['Pendiente'::"text", 'Evaluado'::"text", 'Contratado'::"text"]))),
    CONSTRAINT "candidatos_formacion_check" CHECK (("formacion" = ANY (ARRAY['Secundaria'::"text", 'Técnico'::"text", 'Universitaria'::"text", 'PostGrado'::"text", 'Doctorado'::"text"])))
);


ALTER TABLE "public"."candidatos" OWNER TO "postgres";


COMMENT ON TABLE "public"."candidatos" IS 'Tabla para el módulo de reclutamiento de Premium Consultores';



COMMENT ON COLUMN "public"."candidatos"."estado" IS 'Rastrea el progreso del prospecto: Pendiente (recibido), Evaluado (examen listo), Contratado (pasó a tabla empleado).';



CREATE OR REPLACE FUNCTION "public"."buscar_candidatos"("termino" "text") RETURNS SETOF "public"."candidatos"
    LANGUAGE "sql" STABLE
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


ALTER FUNCTION "public"."buscar_candidatos"("termino" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."empleado" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cedula" numeric NOT NULL,
    "nombre" "text" NOT NULL,
    "cargo" "text",
    "contratado" boolean DEFAULT false,
    "tlf" numeric,
    "fecha_ingreso" timestamp with time zone DEFAULT "now"(),
    "departamento" "text",
    "revisado" "text" DEFAULT 'Pendiente'::"text",
    "respuestas_evaluacion360" "jsonb",
    "puntuacion_general" numeric DEFAULT 0,
    "salario" numeric DEFAULT 0,
    "fecha_ultima_evaluacion" timestamp with time zone,
    CONSTRAINT "empleado_revisado_check" CHECK (("revisado" = ANY (ARRAY['Pendiente'::"text", 'Revisado'::"text", 'Ascendido'::"text", 'Despedido'::"text"])))
);


ALTER TABLE "public"."empleado" OWNER TO "postgres";


COMMENT ON TABLE "public"."empleado" IS 'Tabla de empleados para el sistema SIA de Premium Consultores';



COMMENT ON COLUMN "public"."empleado"."revisado" IS 'Estado de la evaluación del empleado para la toma de decisiones del SIA. Valores: Pendiente (sin evaluar/promovido), Revisado (score medio 65-84% o alerta de actitud), Ascendido (score ≥85%), Despedido (score <65%).';



COMMENT ON COLUMN "public"."empleado"."respuestas_evaluacion360" IS 'Almacena los resultados procesados de las pruebas 360 del empleado en formato JSON.';



COMMENT ON COLUMN "public"."empleado"."puntuacion_general" IS 'Promedio dinámico de todas las evaluaciones 360 realizadas.';



CREATE OR REPLACE FUNCTION "public"."buscar_empleados"("termino" "text") RETURNS SETOF "public"."empleado"
    LANGUAGE "sql" STABLE
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


ALTER FUNCTION "public"."buscar_empleados"("termino" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."competencias" (
    "id" bigint NOT NULL,
    "nombre" "text" NOT NULL,
    "descripcion" "text"
);


ALTER TABLE "public"."competencias" OWNER TO "postgres";


COMMENT ON TABLE "public"."competencias" IS 'Tabla de competencias para el sistema SIA de Premium Consultores';



ALTER TABLE "public"."competencias" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."competencias_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."evaluacion360" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "evaluado_id" "uuid",
    "competencia_id" bigint,
    "puntaje" smallint,
    "tipo_evaluador" "text",
    "comentario" "text",
    CONSTRAINT "evaluacion360_puntaje_check" CHECK ((("puntaje" >= 1) AND ("puntaje" <= 5)))
);


ALTER TABLE "public"."evaluacion360" OWNER TO "postgres";


COMMENT ON TABLE "public"."evaluacion360" IS 'Tabla de evaluación 360 para el sistema SIA de Premium Consultores';



CREATE TABLE IF NOT EXISTS "public"."perfil_meta" (
    "id" bigint NOT NULL,
    "cargo_obj" "text" NOT NULL,
    "competencia_id" bigint,
    "puntaje_ideal" numeric NOT NULL
);


ALTER TABLE "public"."perfil_meta" OWNER TO "postgres";


COMMENT ON TABLE "public"."perfil_meta" IS 'Tabla de perfil meta para el sistema SIA de Premium Consultores';



ALTER TABLE "public"."perfil_meta" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."perfil_meta_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."candidatos"
    ADD CONSTRAINT "candidatos_cedula_key" UNIQUE ("cedula");



ALTER TABLE ONLY "public"."candidatos"
    ADD CONSTRAINT "candidatos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."competencias"
    ADD CONSTRAINT "competencias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."empleado"
    ADD CONSTRAINT "empleado_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluacion360"
    ADD CONSTRAINT "evaluacion360_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perfil_meta"
    ADD CONSTRAINT "perfil_meta_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluacion360"
    ADD CONSTRAINT "evaluacion360_competencia_id_fkey" FOREIGN KEY ("competencia_id") REFERENCES "public"."competencias"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluacion360"
    ADD CONSTRAINT "evaluacion360_evaluado_id_fkey" FOREIGN KEY ("evaluado_id") REFERENCES "public"."empleado"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."perfil_meta"
    ADD CONSTRAINT "perfil_meta_competencia_id_fkey" FOREIGN KEY ("competencia_id") REFERENCES "public"."competencias"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON TABLE "public"."candidatos" TO "anon";
GRANT ALL ON TABLE "public"."candidatos" TO "authenticated";
GRANT ALL ON TABLE "public"."candidatos" TO "service_role";



GRANT ALL ON FUNCTION "public"."buscar_candidatos"("termino" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."buscar_candidatos"("termino" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."buscar_candidatos"("termino" "text") TO "service_role";



GRANT ALL ON TABLE "public"."empleado" TO "anon";
GRANT ALL ON TABLE "public"."empleado" TO "authenticated";
GRANT ALL ON TABLE "public"."empleado" TO "service_role";



GRANT ALL ON FUNCTION "public"."buscar_empleados"("termino" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."buscar_empleados"("termino" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."buscar_empleados"("termino" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."competencias" TO "anon";
GRANT ALL ON TABLE "public"."competencias" TO "authenticated";
GRANT ALL ON TABLE "public"."competencias" TO "service_role";



GRANT ALL ON SEQUENCE "public"."competencias_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."competencias_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."competencias_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."evaluacion360" TO "anon";
GRANT ALL ON TABLE "public"."evaluacion360" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluacion360" TO "service_role";



GRANT ALL ON TABLE "public"."perfil_meta" TO "anon";
GRANT ALL ON TABLE "public"."perfil_meta" TO "authenticated";
GRANT ALL ON TABLE "public"."perfil_meta" TO "service_role";



GRANT ALL ON SEQUENCE "public"."perfil_meta_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."perfil_meta_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."perfil_meta_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


  create policy "Permitir subidas publicas en cvs"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'cvs'::text));



