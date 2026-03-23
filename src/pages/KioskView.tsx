import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ScanLine, Tag, CheckCircle2, RotateCw, UserCheck, AlertTriangle } from "lucide-react";

type UiState = "IDLE" | "MEMBER_VERIFIED" | "ON_HOLD" | "ASK_ACTION" | "SUCCESS";

export default function KioskView() {
  const [uiState, setUiState] = useState<UiState>("IDLE");
  const [activeMember, setActiveMember] = useState<any>(null);
  const [scannedBook, setScannedBook] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorPayload, setErrorPayload] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Use refs to access current state inside the realtime callback
  const uiStateRef = useRef(uiState);
  const activeMemberRef = useRef(activeMember);
  const latestTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    uiStateRef.current = uiState;
    activeMemberRef.current = activeMember;
  }, [uiState, activeMember]);

  useEffect(() => {
    // Subscribe to new rows in kiosk_scans
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "kiosk_scans" },
        async (payload) => {
          console.log("New scan detected:", payload);
          const rfidVal = payload.new.rfid_tag;
          if (rfidVal) {
            handleNewScan(rfidVal);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to kiosk_scans realtime updates');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNewScan = async (rfidTag: string) => {
    setIsScanning(true);
    setErrorPayload(null);

    // 1. Check if it's a Member
    const { data: memberRecord } = await supabase
      .from("members")
      .select("*")
      .eq("rfid_tag", rfidTag)
      .maybeSingle();

    if (memberRecord) {
      setActiveMember(memberRecord);
      setUiState("MEMBER_VERIFIED");
      setScannedBook(null);
      setIsScanning(false);
      
      // Auto-reset member if no book scanned within 30s
      if (latestTimeoutRef.current) clearTimeout(latestTimeoutRef.current);
      latestTimeoutRef.current = setTimeout(() => {
        if (uiStateRef.current === "MEMBER_VERIFIED") {
           setActiveMember(null);
           setUiState("IDLE");
        }
      }, 30000);
      return;
    }

    // 2. Check if it's a Book
    const { data: bookRecord } = await supabase
      .from("books")
      .select("*")
      .eq("rfid_tag", rfidTag)
      .maybeSingle();

    if (bookRecord) {
      setScannedBook(bookRecord);
      
      // Hardware Process A asks for Member ID first
      if (!activeMemberRef.current) {
        setErrorPayload("Please scan your Student ID Card first.");
        setIsScanning(false);
        setTimeout(() => setErrorPayload(null), 3000);
        return;
      }

      // Check current reservations
      const { data: reservation } = await supabase
        .from("reservations")
        .select("*")
        .eq("book_id", bookRecord.id)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (reservation && reservation.member_id !== activeMemberRef.current.id) {
        setUiState("ON_HOLD");
      } else {
        setUiState("ASK_ACTION");
      }
      setIsScanning(false);
      return;
    }

    // 3. Unknown RFID
    setErrorPayload(`Unrecognized RFID Tag: ${rfidTag}`);
    setTimeout(() => {
      setIsScanning(false);
      setErrorPayload(null);
    }, 4000);
  };

  const handleAction = async (action: "renew" | "return") => {
    if (!activeMember || !scannedBook) return;
    
    // Frontend-driven execution to showcase UI interaction
    if (action === "renew") {
       const newDue = new Date();
       newDue.setDate(newDue.getDate() + 14);
       await supabase.from("books").update({ due_date: newDue.toISOString() }).eq("id", scannedBook.id);
       setSuccessMessage("Successfully Renewed! Opening locker. Please take your book back.");
    } else {
       await supabase.from("borrowed_books").delete().eq("book_id", scannedBook.id).eq("member_id", activeMember.id);
       await supabase.from("books").update({ status: "available" }).eq("id", scannedBook.id);
       setSuccessMessage("Successfully Returned! Rotating motor to store your book.");
    }
    
    setUiState("SUCCESS");

    // Reset after success
    if (latestTimeoutRef.current) clearTimeout(latestTimeoutRef.current);
    latestTimeoutRef.current = setTimeout(() => {
      setUiState("IDLE");
      setActiveMember(null);
      setScannedBook(null);
      setSuccessMessage("");
    }, 6000);
  };

  const renderContent = () => {
    switch (uiState) {
      case "MEMBER_VERIFIED":
        return (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-10 w-full shadow-2xl animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden group border-b-4 border-b-blue-400">
             <div className="flex flex-col items-center justify-center text-center">
                <div className="bg-blue-500/20 p-5 rounded-full mb-6 relative">
                  <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-ping opacity-20"></div>
                  <UserCheck className="w-16 h-16 text-blue-300" />
                </div>
                <h2 className="font-serif text-3xl font-black text-white mb-2">Identity Verified</h2>
                <h3 className="text-xl text-blue-200/90 font-mono mb-6">{activeMember?.name}</h3>
                <div className="bg-black/20 px-6 py-4 rounded-xl border border-white/5 max-w-sm">
                   <p className="text-cream/80 text-sm font-light">
                     Locker Door is Open.<br/>Please place your book inside the Kiosk array.
                   </p>
                </div>
             </div>
          </div>
        );
      case "ON_HOLD":
        return (
          <div className="bg-red-950/40 backdrop-blur-xl border border-red-500/30 rounded-[32px] p-10 w-full shadow-[0_0_50px_rgba(239,68,68,0.1)] animate-in slide-in-from-bottom-8 duration-500 relative overflow-hidden">
             <div className="flex flex-col items-center justify-center text-center">
                <div className="bg-red-500/20 p-5 rounded-full mb-6">
                  <AlertTriangle className="w-16 h-16 text-red-500" />
                </div>
                <h2 className="font-serif text-4xl font-black text-white mb-4 uppercase tracking-widest text-red-100">ON HOLD</h2>
                <h3 className="text-xl text-red-200/90 font-mono mb-2">{scannedBook?.title}</h3>
                <p className="text-red-400/80 text-sm mb-8 font-light max-w-sm mx-auto">
                    This book is currently reserved by another student. It will be kept in the kiosk array.
                </p>
                <button 
                  onClick={() => setUiState("IDLE")}
                  className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-full hover:bg-white/10 transition-colors font-mono text-sm uppercase tracking-widest">
                  Finish
                </button>
             </div>
          </div>
        );
      case "ASK_ACTION":
        return (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-10 w-full shadow-2xl animate-in fade-in zoom-in-95 duration-500">
             <div className="flex flex-col items-center text-center mb-8">
                <div className="bg-white/10 p-4 rounded-full mb-4">
                  <BookOpen className="w-10 h-10 text-cream" />
                </div>
                <h2 className="font-serif text-3xl font-black text-white mb-2">{scannedBook?.title}</h2>
                <p className="text-cream/60 font-mono text-sm tracking-widest">AWAITING YOUR DECISION</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleAction("return")}
                  className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-100 rounded-2xl p-6 flex flex-col items-center justify-center transition-all group active:scale-95">
                  <CheckCircle2 className="w-10 h-10 mb-3 text-green-500 group-hover:scale-110 transition-transform" />
                  <span className="font-sans font-bold text-lg uppercase tracking-wider">Return</span>
                  <span className="text-green-300/60 text-xs mt-2 text-center">Store book inside kiosk</span>
                </button>
                <button 
                  onClick={() => handleAction("renew")}
                  className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-100 rounded-2xl p-6 flex flex-col items-center justify-center transition-all group active:scale-95">
                  <RotateCw className="w-10 h-10 mb-3 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="font-sans font-bold text-lg uppercase tracking-wider">Renew</span>
                  <span className="text-blue-300/60 text-xs mt-2 text-center">+14 days • Door opens</span>
                </button>
             </div>
          </div>
        );
      case "SUCCESS":
        return (
          <div className="bg-green-950/30 backdrop-blur-xl border border-green-500/30 rounded-[32px] p-10 w-full shadow-[0_0_50px_rgba(34,197,94,0.1)] animate-in fade-in duration-500 relative overflow-hidden text-center">
             <div className="flex justify-center mb-6">
                <div className="bg-green-500 text-white rounded-full p-4 relative">
                   <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50"></div>
                   <CheckCircle2 className="w-16 h-16 relative z-10" />
                </div>
             </div>
             <h2 className="font-serif text-3xl font-black text-white mb-4">Complete!</h2>
             <p className="text-green-200/90 font-light text-lg">{successMessage}</p>
          </div>
        );
      default: // IDLE
        return (
          <div className="border-2 border-dashed border-white/20 rounded-[32px] p-16 w-full text-center flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm">
             <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 relative overflow-hidden shadow-inner">
                <div className="absolute top-0 left-0 w-full h-1/3 bg-accent-orange/40 animate-pulse delay-700"></div>
                <ScanLine className="w-8 h-8 text-white/50" />
             </div>
             <p className="text-cream text-xl font-mono tracking-widest uppercase mb-4">Awaiting Signal</p>
             <p className="text-white/40 text-sm max-w-[250px] font-light">
               Scan your Student ID at the hardware scanner to begin.
             </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center p-10 overflow-hidden relative">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-accent-orange rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="z-10 text-center mb-12">
         <div className="inline-flex items-center justify-center p-4 bg-white/5 rounded-full mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <ScanLine className={`w-12 h-12 ${isScanning ? 'text-accent-orange animate-bounce' : 'text-primary/70'}`} />
         </div>
         <h1 className="font-serif text-5xl md:text-6xl font-black text-cream tracking-tight mb-4 drop-shadow-md">
           Libra<span className="text-accent-orange italic">Kiosk</span>
         </h1>
      </div>

      <div className="z-10 w-full max-w-2xl flex flex-col items-center justify-center space-y-4">
        {errorPayload && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-full px-6 py-3 w-max backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
               <p className="text-red-300/90 font-mono text-sm font-bold flex items-center gap-2">
                 <XCircle className="w-4 h-4"/> {errorPayload}
               </p>
            </div>
        )}
        
        <div className="w-full transition-all duration-500">
           {renderContent()}
        </div>
      </div>
      
      {/* Dev Helper - allows clicking without hardware */}
      <div className="absolute bottom-4 left-4 z-50 text-[10px] text-white/20 font-mono">
         Process DB Listener Active
      </div>
    </div>
  );
}
