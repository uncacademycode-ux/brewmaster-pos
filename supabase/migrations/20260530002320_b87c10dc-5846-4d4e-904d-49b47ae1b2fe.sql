
-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_all" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Menu items
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX menu_items_category_id_idx ON public.menu_items(category_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO anon, authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_items_all" ON public.menu_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Preparing','Completed')),
  total numeric(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_created_at_idx ON public.orders(created_at DESC);
CREATE INDEX orders_status_idx ON public.orders(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_all" ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  quantity int NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO anon, authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_all" ON public.order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Seed categories
INSERT INTO public.categories (name, sort_order) VALUES
  ('Hot', 1), ('Cold', 2), ('Pastries', 3);

-- Seed menu items
WITH cats AS (SELECT id, name FROM public.categories)
INSERT INTO public.menu_items (name, category_id, price, image_url)
SELECT v.name, c.id, v.price, v.image_url
FROM (VALUES
  ('Espresso', 'Hot', 3.00, 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400'),
  ('Cappuccino', 'Hot', 4.50, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400'),
  ('Latte', 'Hot', 4.75, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400'),
  ('Mocha', 'Hot', 5.00, 'https://images.unsplash.com/photo-1578374173703-cfe48ae27e84?w=400'),
  ('Americano', 'Hot', 3.50, 'https://images.unsplash.com/photo-1521302200778-33500795e128?w=400'),
  ('Iced Coffee', 'Cold', 4.00, 'https://images.unsplash.com/photo-1517959105821-eaf2591984ca?w=400'),
  ('Cold Brew', 'Cold', 4.75, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'),
  ('Iced Latte', 'Cold', 5.00, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400'),
  ('Frappé', 'Cold', 5.50, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400'),
  ('Croissant', 'Pastries', 3.25, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400'),
  ('Blueberry Muffin', 'Pastries', 3.00, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400'),
  ('Cinnamon Roll', 'Pastries', 3.75, 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400')
) AS v(name, cat_name, price, image_url)
JOIN cats c ON c.name = v.cat_name;
