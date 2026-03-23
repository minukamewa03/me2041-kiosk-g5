import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BookStatus = 'available' | 'borrowed' | 'reserved' | 'kiosk';

export interface Book {
  id: string;
  title: string;
  author: string;
  rfid_tag: string;
  status: BookStatus;
  due_date: string | null;
}

export interface Member {
  id: string;
  uni_id: string;
  name: string;
  rfid_tag: string | null;
  borrowed: string[];
}

interface LibraryContextType {
  currentUser: Member | null;
  books: Book[];
  reserveSeconds: number;
  hasActiveReservation: boolean;
  reservedBookTitle: string;
  login: (uniId: string, password: string) => Promise<string | null>;
  logout: () => void;
  searchBooks: (query: string, type: "title" | "author") => Book[];
  getMyBooks: () => Book[];
  reserveBook: (bookId: string) => Promise<void>;
  startTimer: () => void;
  stopTimer: () => void;
  loading: boolean;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [reserveSeconds, setReserveSeconds] = useState(3600);
  const [hasActiveReservation, setHasActiveReservation] = useState(false);
  const [reservedBookTitle, setReservedBookTitle] = useState("");
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch books on mount + subscribe to realtime changes
  useEffect(() => {
    const fetchBooks = async () => {
      const { data } = await supabase.from("books").select("*");
      if (data) {
        setBooks(data.map(b => ({
          id: b.id,
          title: b.title,
          author: b.author,
          rfid_tag: b.rfid_tag,
          status: b.status as BookStatus,
          due_date: b.due_date,
        })));
      }
    };
    fetchBooks();

    // Realtime: update books when ESP32 processes a scan
    const channel = supabase
      .channel("books-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "books" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as any;
            setBooks(prev =>
              prev.map(b =>
                b.id === updated.id
                  ? { ...b, status: updated.status as BookStatus, due_date: updated.due_date }
                  : b
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const login = useCallback(async (uniId: string, password: string): Promise<string | null> => {
    setLoading(true);
    try {
      const { data: member } = await supabase
        .from("members")
        .select("*")
        .eq("uni_id", uniId)
        .eq("password_hash", password)
        .maybeSingle();

      if (!member) return "Invalid ID or password. Try again.";

      // Fetch borrowed books for this member
      const { data: borrowedData } = await supabase
        .from("borrowed_books")
        .select("book_id")
        .eq("member_id", member.id);

      setCurrentUser({
        id: member.id,
        uni_id: member.uni_id,
        name: member.name,
        rfid_tag: member.rfid_tag ?? null,
        borrowed: borrowedData?.map(b => b.book_id) ?? [],
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setHasActiveReservation(false);
    setReservedBookTitle("");
    if (timerInterval) clearInterval(timerInterval);
    setTimerInterval(null);
  }, [timerInterval]);

  const searchBooks = useCallback((query: string, type: "title" | "author"): Book[] => {
    const q = query.toLowerCase();
    return books.filter(b =>
      type === "title" ? b.title.toLowerCase().includes(q) : b.author.toLowerCase().includes(q)
    );
  }, [books]);

  const getMyBooks = useCallback((): Book[] => {
    if (!currentUser) return [];
    return books.filter(b => currentUser.borrowed.includes(b.id));
  }, [currentUser, books]);

  const reserveBook = useCallback(async (bookId: string) => {
    // Update book status in DB
    await supabase.from("books").update({ status: "reserved" }).eq("id", bookId);

    // Insert reservation
    if (currentUser) {
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      await supabase.from("reservations").insert({
        member_id: currentUser.id,
        book_id: bookId,
        expires_at: expiresAt,
      });
    }

    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status: "reserved" as const } : b));
    const book = books.find(b => b.id === bookId);
    if (book) {
      setReservedBookTitle(book.title);
      setHasActiveReservation(true);
      setReserveSeconds(3600);
    }
  }, [books, currentUser]);

  const startTimer = useCallback(() => {
    if (timerInterval) clearInterval(timerInterval);
    const interval = setInterval(() => {
      setReserveSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setHasActiveReservation(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerInterval(interval);
  }, [timerInterval]);

  const stopTimer = useCallback(() => {
    if (timerInterval) clearInterval(timerInterval);
    setTimerInterval(null);
  }, [timerInterval]);

  return (
    <LibraryContext.Provider value={{
      currentUser, books, reserveSeconds, hasActiveReservation, reservedBookTitle,
      login, logout, searchBooks, getMyBooks, reserveBook, startTimer, stopTimer, loading,
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
