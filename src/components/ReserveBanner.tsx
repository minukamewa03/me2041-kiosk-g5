interface Props {
  bookTitle: string;
  seconds: number;
}

export default function ReserveBanner({ bookTitle, seconds }: Props) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  const pct = (seconds / 3600) * 100;

  return (
    <div className="animate-rise-fast bg-green-light border border-[hsl(150_30%_72%)] rounded-[14px] px-6 py-5 mb-6">
      <h3 className="font-serif text-base text-green-accent font-bold mb-1.5">✓ Reservation confirmed!</h3>
      <p className="text-[13px] text-[hsl(153_30%_33%)] mb-3">
        "{bookTitle}" is reserved for you. Head to the kiosk and scan your ID.
      </p>
      <div className="bg-[hsl(153_42%_30%/0.15)] rounded h-1.5 overflow-hidden">
        <div
          className="h-full bg-green-accent rounded transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="font-mono text-[11px] text-green-accent mt-1.5">{m}:{s} remaining</div>
    </div>
  );
}
