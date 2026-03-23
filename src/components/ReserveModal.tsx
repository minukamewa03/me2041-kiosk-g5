interface Props {
  bookTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ReserveModal({ bookTitle, onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 bg-[hsl(24_27%_9%/0.5)] z-[200] flex items-center justify-center p-5 backdrop-blur-[4px]">
      <div className="animate-rise bg-paper border border-border rounded-[20px] p-9 max-w-[440px] w-full shadow-[0_20px_60px_hsl(24_27%_9%/0.2)]">
        <h2 className="font-serif text-[22px] font-bold mb-2">Reserve this book?</h2>
        <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">
          Your reservation will be valid for <strong>1 hour</strong>. You must go to the kiosk and scan your ID within this time.
        </p>
        <div className="font-serif text-[17px] font-bold text-ink bg-warm border border-border rounded-[10px] px-4 py-3.5 mb-5">
          {bookTitle}
        </div>
        <div className="bg-warm border border-border rounded-[10px] px-4 py-3.5 mb-5 text-[13px] text-ink2 leading-[1.7] font-mono">
          📍 Location: Kiosk Unit A<br />
          ⏱ Reservation window: 60 minutes<br />
          🪪 Bring your student ID card
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 bg-warm text-ink2 border border-border rounded-[10px] py-3 font-sans text-[13px] cursor-pointer transition-colors hover:bg-border"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-green-accent text-accent-foreground border-none rounded-[10px] py-3 font-sans text-[13px] font-medium cursor-pointer transition-colors hover:bg-[hsl(153_42%_25%)]"
          >
            Confirm Reserve
          </button>
        </div>
      </div>
    </div>
  );
}
