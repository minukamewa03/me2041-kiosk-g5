import { useState, useEffect } from "react";
import { useLibrary } from "@/context/LibraryContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MemberData = {
  id: string;
  uni_id: string;
  name: string;
  rfid_tag: string | null;
  is_admin: boolean | null;
  created_at: string | null;
};

export default function AdminDashboard() {
  const { currentUser } = useLibrary();
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    uni_id: "",
    name: "",
    password_hash: "",
    rfid_tag: "",
  });

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to fetch members");
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser?.is_admin) {
      fetchMembers();
    }
  }, [currentUser]);

  if (!currentUser) return <Navigate to="/" replace />;
  if (!currentUser.is_admin) return <Navigate to="/" replace />;

  const handleRegister = async () => {
    // Validate formatting: 12 digit hex
    const rfidRegex = /^[0-9a-fA-F]{12}$/;
    
    if (!formData.uni_id || !formData.name || !formData.password_hash || !formData.rfid_tag) {
      toast.error("All fields are required.");
      return;
    }
    
    if (!rfidRegex.test(formData.rfid_tag)) {
      toast.error("RFID must be a 12-digit hexadecimal string (e.g. A1B2C3D4E5F6)");
      return;
    }

    try {
      const { error } = await supabase.from("members").insert({
        uni_id: formData.uni_id.trim(),
        name: formData.name.trim(),
        password_hash: formData.password_hash.trim(),
        rfid_tag: formData.rfid_tag.trim().toUpperCase(),
        is_admin: false
      });

      if (error) {
        if (error.code === '23505') {
           toast.error("A user with this Uni ID or RFID already exists.");
        } else {
           toast.error(`Error configuring member: ${error.message}`);
        }
        return;
      }

      toast.success("Student registered successfully!");
      setOpen(false);
      setFormData({ uni_id: "", name: "", password_hash: "", rfid_tag: "" });
      fetchMembers();
    } catch (err) {
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-paper relative z-[1]">
      <header className="bg-ink text-cream px-10 flex items-center justify-between h-16 sticky top-0 z-[100]">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📚</span>
          <h2 className="font-serif text-lg font-bold tracking-tight">LibraKiosk <span className="text-[10px] text-accent-orange font-mono ml-1">ADMIN</span></h2>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-cream hover:bg-white/10" onClick={() => window.location.href = '/'}>
            Back to App
          </Button>
        </div>
      </header>

      <div className="max-w-[1000px] mx-auto px-10 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-serif text-3xl font-black text-ink tracking-tight mb-2">User Management</h1>
            <p className="text-sm text-muted-foreground font-light">
              Provision tags and oversee registered students.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent-orange hover:bg-[#c95028] text-white tracking-wide">
                + Register Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl border-b pb-4">Register New Student</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="uni_id" className="text-xs font-mono uppercase text-muted-foreground">University ID</Label>
                  <Input id="uni_id" value={formData.uni_id} onChange={e => setFormData({ ...formData, uni_id: e.target.value })} placeholder="e.g. 240320V" />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="name" className="text-xs font-mono uppercase text-muted-foreground">Full Name</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Kamal Perera" />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="rfid" className="text-xs font-mono uppercase text-muted-foreground">12-Digit Hex RFID</Label>
                  <Input id="rfid" value={formData.rfid_tag} onChange={e => setFormData({ ...formData, rfid_tag: e.target.value })} placeholder="A1B2C3D4E5F6" maxLength={12} />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="pass" className="text-xs font-mono uppercase text-muted-foreground">Assigned Password</Label>
                  <Input id="pass" value={formData.password_hash} onChange={e => setFormData({ ...formData, password_hash: e.target.value })} placeholder="temp_password_123" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleRegister} className="w-full bg-ink text-white hover:bg-ink/90">Create Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card border border-border rounded-[14px] overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow>
                <TableHead className="font-serif font-bold text-foreground w-[120px]">Uni ID</TableHead>
                <TableHead className="font-serif font-bold text-foreground">Name</TableHead>
                <TableHead className="font-serif font-bold text-foreground font-mono text-xs">RFID TAG</TableHead>
                <TableHead className="font-serif font-bold text-foreground text-right">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Loading members...</TableCell></TableRow>
              ) : members.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No students found.</TableCell></TableRow>
              ) : (
                members.map((m) => (
                  <TableRow key={m.id} className="hover:bg-secondary/20">
                    <TableCell className="font-mono text-xs font-medium text-ink">{m.uni_id}</TableCell>
                    <TableCell className="text-sm text-foreground">{m.name}</TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{m.rfid_tag || "UNASSIGNED"}</TableCell>
                    <TableCell className="text-right">
                      <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${m.is_admin ? "bg-accent-orange/15 text-accent-orange" : "bg-secondary text-muted-foreground"}`}>
                        {m.is_admin ? "Admin" : "Student"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
