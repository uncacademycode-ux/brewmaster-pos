
CREATE TABLE public.tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  seats integer NOT NULL DEFAULT 2,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tables TO anon, authenticated;
GRANT ALL ON public.tables TO service_role;

ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY tables_all ON public.tables FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_id uuid REFERENCES public.tables(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id);
