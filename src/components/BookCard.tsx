import type { Book } from "@/context/LibraryContext";
import { useLibrary } from "@/context/LibraryContext";

const EMOJIS = ['📘', '📗', '📙', '📕', '📓'];

const statusConfig = {
  available: { spine: "bg-green-light border-l-green-accent", tag: "bg-green-light text-green-accent", label: "Available" },
  kiosk: { spine: "bg-kiosk-blue-light border-l-kiosk-blue", tag: "bg-kiosk-blue-light text-kiosk-blue", label: "In Kiosk" },
  reserved: { spine: "bg-reserved-purple-light border-l-reserved-purple", tag: "bg-reserved-purple-light text-reserved-purple", label: "Reserved" },
  borrowed: { spine: "bg-borrowed-orange-light border-l-borrowed-orange", tag: "bg-borrowed-orange-light text-borrowed-orange", label: "Borrowed" },
};

interface Props {
  book: Book;
  onReserve: (bookId: string) => void;
}

export default function BookCard({ book, onReserve }: Props) {
  const { currentUser } = useLibrary();
  const isMine = currentUser?.borrowed?.includes(book.id);
  const config = statusConfig[book.status];
  const canReserve = (book.status === "available" || book.status === "kiosk") && !isMine;
  const emoji = EMOJIS[book.id.charCodeAt(1) % 5];

  return (
    <div className="animate-rise-fast bg-paper border border-border rounded-[14px] px-6 py-5 flex items-center gap-5 transition-all hover:shadow-[0_4px_20px_hsl(var(--shadow-color)/0.08)] hover:border-accent-orange-light">
      <div className={`w-12 h-16 rounded-[4px_8px_8px_4px] flex items-center justify-center text-[22px] shrink-0 border-l-4 ${config.spine}`}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-serif text-[17px] font-bold text-ink tracking-tight mb-1 truncate">{book.title}</div>
        <div className="text-xs text-muted-foreground mb-2.5">{book.author}</div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`font-mono text-[10px] px-2.5 py-0.5 rounded-full font-medium tracking-[0.5px] ${config.tag}`}>
            {config.label}
          </span>
          {book.due_date && <span className="text-[10px] text-muted-foreground font-mono">Due {book.due_date}</span>}
        </div>
      </div>
      <div className="shrink-0">
        {isMine ? (
          <button disabled className="bg-border text-muted-foreground rounded-lg px-5 py-2.5 text-xs font-medium cursor-not-allowed font-sans">
            Your Book
          </button>
        ) : canReserve ? (
          <button
            onClick={() => onReserve(book.id)}
            className="bg-ink text-cream rounded-lg px-5 py-2.5 text-xs font-medium cursor-pointer transition-all font-sans whitespace-nowrap hover:bg-accent-orange"
          >
            Reserve
          </button>
        ) : (
          <button disabled className="bg-border text-muted-foreground rounded-lg px-5 py-2.5 text-xs font-medium cursor-not-allowed font-sans">
            {book.status === "reserved" ? "Reserved" : "Unavailable"}
          </button>
        )}
      </div>
    </div>
  );
}
