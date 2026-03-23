-- Allow deleting borrowed_books (needed for return flow via service role, but also for RLS completeness)
CREATE POLICY "Borrowed books deletable" ON public.borrowed_books FOR DELETE USING (true);

-- Allow inserting borrowed_books (needed for future borrow flow)
CREATE POLICY "Borrowed books insertable" ON public.borrowed_books FOR INSERT WITH CHECK (true);

-- Enable realtime for books and borrowed_books
ALTER PUBLICATION supabase_realtime ADD TABLE public.books;
ALTER PUBLICATION supabase_realtime ADD TABLE public.borrowed_books;