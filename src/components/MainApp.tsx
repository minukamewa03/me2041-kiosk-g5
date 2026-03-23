import { useState } from "react";
import { useLibrary } from "@/context/LibraryContext";
import BookCard from "@/components/BookCard";
import ReserveModal from "@/components/ReserveModal";
import ReserveBanner from "@/components/ReserveBanner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";

export default function MainApp() {
  const {
    currentUser, books, logout, searchBooks, getMyBooks,
    reserveBook, startTimer, reserveSeconds, hasActiveReservation, reservedBookTitle,
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"title" | "author">("title");
  const [searchResults, setSearchResults] = useState<typeof books | null>(null);
  const [modalBookId, setModalBookId] = useState<string | null>(null);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchResults(searchBooks(searchQuery.trim(), searchType));
  };

  const handleReserve = (bookId: string) => setModalBookId(bookId);

  const confirmReserve = async () => {
    if (!modalBookId) return;
    await reserveBook(modalBookId);
    startTimer();
    setModalBookId(null);
    setSearchQuery("");
    setSearchResults(null);
    toast.success("✓ Reservation confirmed! You have 1 hour.");
  };

  const modalBook = modalBookId ? books.find(b => b.id === modalBookId) : null;
  const myBooks = getMyBooks();

  return (
    <div className="min-h-screen bg-paper relative z-[1]">
      {/* Header */}
      <header className="bg-ink text-cream px-10 flex items-center justify-between h-16 sticky top-0 z-[100]">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📚</span>
          <h2 className="font-serif text-lg font-bold tracking-tight">
            LibraKiosk <span className="text-[10px] text-[hsl(37_33%_92%/0.4)] font-mono ml-1">UOM</span>
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-[hsl(0_0%_100%/0.08)] border border-[hsl(0_0%_100%/0.12)] rounded-lg px-3.5 py-1.5 text-xs font-mono text-cream">
            Logged in as <span className="text-accent-orange-light">{currentUser?.uni_id}</span>
          </div>
          <button
            onClick={logout}
            className="bg-transparent border border-[hsl(0_0%_100%/0.2)] text-[hsl(37_33%_92%/0.6)] font-sans text-xs px-3.5 py-1.5 rounded-lg cursor-pointer transition-all hover:border-[hsl(0_0%_100%/0.4)] hover:text-cream"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Hero Search */}
      <div className="bg-cream border-b border-border py-12 px-10 text-center">
        <h1 className="font-serif text-[42px] font-black text-ink tracking-tight mb-2">
          Find your next <em className="italic text-accent-orange">read.</em>
        </h1>
        <p className="text-sm text-muted-foreground font-light mb-7">
          Search from our collection — reserve online, pick up at the kiosk.
        </p>
        <div className="flex max-w-[580px] mx-auto bg-paper border-[1.5px] border-border rounded-[14px] overflow-hidden shadow-[0_4px_20px_hsl(var(--shadow-color)/0.08)] transition-colors focus-within:border-accent-orange">
          <select
            value={searchType}
            onChange={e => setSearchType(e.target.value as "title" | "author")}
            className="bg-warm border-none border-r-[1.5px] border-r-border px-4 font-sans text-[13px] text-ink2 outline-none cursor-pointer min-w-[100px]"
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
          </select>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search books..."
            className="flex-1 border-none bg-transparent px-5 py-4 font-sans text-sm text-ink outline-none placeholder:text-border"
          />
          <button
            onClick={handleSearch}
            className="bg-accent-orange border-none text-primary-foreground px-6 font-sans text-[13px] font-medium cursor-pointer transition-colors tracking-[0.3px] hover:bg-[hsl(15_67%_40%)]"
          >
            Search
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-10 py-9">
        {hasActiveReservation && (
          <ReserveBanner bookTitle={reservedBookTitle} seconds={reserveSeconds} />
        )}

        {searchResults !== null ? (
          <div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-[2px] uppercase mb-4">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
            </div>
            <div className="flex flex-col gap-3">
              {searchResults.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="text-5xl mb-3 opacity-30">🔍</div>
                  <p className="text-sm font-light">No books found.</p>
                </div>
              ) : (
                searchResults.map(b => <BookCard key={b.id} book={b} onReserve={handleReserve} />)
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-[2px] uppercase mb-4">
              My Borrowed Books
            </div>
            <div className="flex flex-col gap-3">
              {myBooks.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="text-5xl mb-3 opacity-30">📚</div>
                  <p className="text-sm font-light">You have no borrowed books right now.</p>
                </div>
              ) : (
                myBooks.map(b => <BookCard key={b.id} book={b} onReserve={handleReserve} />)
              )}
            </div>
          </div>
        )}

        {/* All Books Table */}
        <div className="mt-10">
          <div className="font-mono text-[10px] text-muted-foreground tracking-[2px] uppercase mb-4">
            Full Library Catalog
          </div>
          <div className="bg-card border border-border rounded-[14px] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="font-serif font-bold text-foreground">#</TableHead>
                  <TableHead className="font-serif font-bold text-foreground">Title</TableHead>
                  <TableHead className="font-serif font-bold text-foreground">Author</TableHead>
                  <TableHead className="font-serif font-bold text-foreground text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book, i) => {
                  const statusColors: Record<string, string> = {
                    available: "text-accent bg-accent/10",
                    kiosk: "text-blue-600 bg-blue-50",
                    reserved: "text-purple-600 bg-purple-50",
                    borrowed: "text-primary bg-primary/10",
                  };
                  return (
                    <TableRow key={book.id} className="hover:bg-secondary/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-serif font-semibold text-foreground">{book.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{book.author}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono text-[10px] px-2.5 py-1 rounded-full font-medium tracking-[0.5px] ${statusColors[book.status] ?? ""}`}>
                          {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalBook && (
        <ReserveModal
          bookTitle={`${modalBook.title} — ${modalBook.author}`}
          onCancel={() => setModalBookId(null)}
          onConfirm={confirmReserve}
        />
      )}
    </div>
  );
}
