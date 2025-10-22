-- Parte 1: Solo agregar 'admin' al enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'admin';