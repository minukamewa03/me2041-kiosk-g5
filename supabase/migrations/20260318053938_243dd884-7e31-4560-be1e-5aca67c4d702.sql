
-- Members table for university login
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uni_id TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Books table
CREATE TYPE public.book_status AS ENUM ('available', 'borrowed', 'reserved', 'kiosk');

CREATE TABLE public.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  rfid_tag TEXT UNIQUE NOT NULL,
  status book_status NOT NULL DEFAULT 'available',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Borrowed books junction
CREATE TABLE public.borrowed_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  book_id TEXT REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  borrowed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, book_id)
);

-- Reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  book_id TEXT REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  reserved_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrowed_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Books are publicly readable
CREATE POLICY "Books are publicly readable" ON public.books FOR SELECT USING (true);
CREATE POLICY "Members readable for login" ON public.members FOR SELECT USING (true);
CREATE POLICY "Borrowed books readable" ON public.borrowed_books FOR SELECT USING (true);
CREATE POLICY "Reservations readable" ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Reservations insertable" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Books updatable" ON public.books FOR UPDATE USING (true);
