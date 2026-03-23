import { useLibrary } from "@/context/LibraryContext";
import { BookOpen } from "lucide-react";

export default function KioskDigitalTwin() {
  const { books } = useLibrary();

  // The 6 mechanical slots
  const slots = [1, 2, 3, 4, 5, 6];

  const getBookInSlot = (slot: number) => {
    return books.find(b => b.slot_position === slot);
  };

  return (
    <div className="mb-10 p-10 border border-border bg-card rounded-[24px] shadow-sm relative overflow-hidden flex flex-col items-center group">
       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-orange to-transparent opacity-60"></div>
       <h3 className="font-serif text-2xl font-black mb-1 text-ink uppercase tracking-tight">Kiosk Live Storage</h3>
       <p className="font-mono text-[10px] text-muted-foreground tracking-[3px] uppercase mb-12">6-Slot Array Active Track</p>

       <div className="relative w-80 h-80 flex items-center justify-center">
         {/* Center motor representation */}
         <div className="w-16 h-16 rounded-full bg-ink flex items-center justify-center z-10 shadow-xl border-4 border-paper shadow-[0_0_30px_rgba(0,0,0,0.1)]">
            <div className="w-6 h-6 rounded-full bg-accent-orange shadow-[0_0_15px_rgba(235,80,40,0.5)] animate-pulse"></div>
         </div>

         {/* The Circular Slots */}
         {slots.map((slot, index) => {
           const book = getBookInSlot(slot);
           
           // Calculate rotation (360 / 6 = 60 degrees apart)
           const angle = index * 60;
           return (
             <div 
               key={slot}
               className="absolute w-28 h-36 origin-bottom transition-all duration-700 hover:z-20"
               style={{ 
                 transform: `rotate(${angle}deg) translateY(-160px)`,
                 bottom: '50%', 
                 left: '50%',
                 marginLeft: '-3.5rem'
               }}
             >
               {/* Rotate the content back so text is always upright */}
               <div 
                  className={`w-full h-full rounded-2xl border-[1.5px] flex flex-col items-center justify-center p-3 text-center transition-all duration-500 shadow-sm ${book ? 'bg-white border-accent-orange hover:shadow-[0_8px_30px_rgba(235,80,40,0.2)] hover:scale-110 scale-100 z-10' : 'bg-secondary/40 border-dashed border-border scale-[0.85] opacity-50 z-0'}`}
                  style={{ transform: `rotate(${-angle}deg)` }}
               >
                 <span className="font-mono text-[10px] font-bold text-muted-foreground tracking-widest mb-1.5 opacity-80">
                   SLOT {slot}
                 </span>
                 {book ? (
                   <>
                     <BookOpen className="w-6 h-6 text-accent-orange mb-2" />
                     <p className="font-sans text-[11px] font-bold leading-tight line-clamp-3 text-ink mb-2 px-1">{book.title}</p>
                     <span className={`mt-auto font-mono text-[8.5px] uppercase tracking-wider px-2 py-1 rounded-sm ${book.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {book.status}
                     </span>
                   </>
                 ) : (
                   <p className="font-sans text-[11px] text-muted-foreground italic tracking-wide">Empty</p>
                 )}
               </div>
             </div>
           );
         })}
       </div>
    </div>
  );
}
