import { useState, useEffect } from "react";
import { useLibrary, Book } from "@/context/LibraryContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MemberData = {
  id: string;
  uni_id: string;
  name: string;
  rfid_tag: string | null;
  is_admin: boolean | null;
  created_at: string | null;
};

export default function AdminDashboard() {
  const { currentUser, books } = useLibrary();
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Student Form State
  const [openStudent, setOpenStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    uni_id: "",
    name: "",
    password_hash: "",
    rfid_tag: "",
  });

  // Book Form State
  const [openBook, setOpenBook] = useState(false);
  const [bookForm, setBookForm] = useState({
    id: "",
    title: "",
    author: "",
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

  const handleRegisterStudent = async () => {
    const rfidRegex = /^[0-9a-fA-F]{12}$/;
    
    if (!studentForm.uni_id || !studentForm.name || !studentForm.password_hash || !studentForm.rfid_tag) {
      toast.error("All fields are required.");
      return;
    }
    
    if (!rfidRegex.test(studentForm.rfid_tag)) {
      toast.error("RFID must be a 12-digit hexadecimal string (e.g. A1B2C3D4E5F6)");
      return;
    }

    try {
      const { error } = await supabase.from("members").insert({
        uni_id: studentForm.uni_id.trim(),
        name: studentForm.name.trim(),
        password_hash: studentForm.password_hash.trim(),
        rfid_tag: studentForm.rfid_tag.trim().toUpperCase(),
        is_admin: false
      });

      if (error) {
        if (error.code === '23505') toast.error("A user with this Uni ID or RFID already exists.");
        else toast.error(`Error configuring member: ${error.message}`);
        return;
      }

      toast.success("Student registered successfully!");
      setOpenStudent(false);
      setStudentForm({ uni_id: "", name: "", password_hash: "", rfid_tag: "" });
      fetchMembers();
    } catch (err) {
      toast.error("An unexpected error occurred.");
    }
  };

  const handleRegisterBook = async () => {
    const rfidRegex = /^[0-9a-fA-F]{12}$/;
    
    if (!bookForm.id || !bookForm.title || !bookForm.author || !bookForm.rfid_tag) {
      toast.error("All fields are required.");
      return;
    }
    
    if (!rfidRegex.test(bookForm.rfid_tag)) {
      toast.error("RFID must be a 12-digit hexadecimal string (e.g. A1B2C3D4E5F6)");
      return;
    }

    try {
      const { error } = await supabase.from("books").insert({
        id: bookForm.id.trim(),
        title: bookForm.title.trim(),
        author: bookForm.author.trim(),
        rfid_tag: bookForm.rfid_tag.trim().toUpperCase(),
        status: "available",
      });

      if (error) {
        if (error.code === '23505') toast.error("A book with this ID or RFID already exists.");
        else toast.error(`Error adding book: ${error.message}`);
        return;
      }

      toast.success("Book registered successfully!");
      setOpenBook(false);
      setBookForm({ id: "", title: "", author: "", rfid_tag: "" });
      // Reload page to re-fetch books inside context seamlessly
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-paper relative z-[1]">
      <header className="bg-ink text-cream px-10 flex items-center justify-between h-16 sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="UOM Logo" className="h-9 w-auto object-contain" />
          <h2 className="font-serif text-lg font-bold tracking-tight hidden sm:block">
            LibraKiosk <span className="text-[10px] text-accent-orange font-mono ml-1">ADMIN</span>
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-cream hover:bg-white/10" onClick={() => window.location.href = '/'}>
            Back to App
          </Button>
        </div>
      </header>

      <div className="max-w-[1000px] mx-auto px-10 py-12">
        <h1 className="font-serif text-3xl font-black text-ink tracking-tight mb-2">Management Portal</h1>
        <p className="text-sm text-muted-foreground font-light mb-8">
          Provision RFID tags and oversee the system.
        </p>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6 bg-secondary/30">
            <TabsTrigger value="users" className="uppercase font-mono text-[11px] tracking-wider px-6">Students</TabsTrigger>
            <TabsTrigger value="books" className="uppercase font-mono text-[11px] tracking-wider px-6">Library Catalog</TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl font-bold">Registered Users</h3>
              <Dialog open={openStudent} onOpenChange={setOpenStudent}>
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
                      <Input id="uni_id" value={studentForm.uni_id} onChange={e => setStudentForm({ ...studentForm, uni_id: e.target.value })} placeholder="e.g. 240320V" />
                    </div>
                    <div className="gap-2 flex flex-col">
                      <Label htmlFor="name" className="text-xs font-mono uppercase text-muted-foreground">Full Name</Label>
                      <Input id="name" value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} placeholder="Kamal Perera" />
                    </div>
                    <div className="gap-2 flex flex-col">
                      <Label htmlFor="rfid" className="text-xs font-mono uppercase text-muted-foreground">12-Digit Hex RFID</Label>
                      <Input id="rfid" value={studentForm.rfid_tag} onChange={e => setStudentForm({ ...studentForm, rfid_tag: e.target.value })} placeholder="A1B2C3D4E5F6" maxLength={12} />
                    </div>
                    <div className="gap-2 flex flex-col">
                      <Label htmlFor="pass" className="text-xs font-mono uppercase text-muted-foreground">Assigned Password</Label>
                      <Input id="pass" value={studentForm.password_hash} onChange={e => setStudentForm({ ...studentForm, password_hash: e.target.value })} placeholder="temp_password_123" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleRegisterStudent} className="w-full bg-ink text-white hover:bg-ink/90">Create Account</Button>
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
          </TabsContent>

          {/* BOOKS TAB */}
          <TabsContent value="books" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl font-bold">Library Books</h3>
              <Dialog open={openBook} onOpenChange={setOpenBook}>
                <DialogTrigger asChild>
                  <Button className="bg-ink hover:bg-ink2 text-cream tracking-wide">
                    + Register Book
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-xl border-b pb-4">Configure New Book</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="gap-2 flex flex-col">
                      <Label htmlFor="b_id" className="text-xs font-mono uppercase text-muted-foreground">Book ID / ISBN</Label>
                      <Input id="b_id" value={bookForm.id} onChange={e => setBookForm({ ...bookForm, id: e.target.value })} placeholder="e.g. bk-001" />
                    </div>
                    <div className="gap-2 flex flex-col">
                      <Label htmlFor="b_title" className="text-xs font-mono uppercase text-muted-foreground">Title</Label>
                      <Input id="b_title" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} placeholder="Clean Code" />
                    </div>
                    <div className="gap-2 flex flex-col">
                      <Label htmlFor="b_author" className="text-xs font-mono uppercase text-muted-foreground">Author</Label>
                      <Input id="b_author" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} placeholder="Robert C. Martin" />
                    </div>
                    <div className="gap-2 flex flex-col">
                      <Label htmlFor="b_rfid" className="text-xs font-mono uppercase text-muted-foreground">12-Digit Hex RFID</Label>
                      <Input id="b_rfid" value={bookForm.rfid_tag} onChange={e => setBookForm({ ...bookForm, rfid_tag: e.target.value })} placeholder="A1B2C3D4E5F6" maxLength={12} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleRegisterBook} className="w-full bg-accent-orange text-white hover:bg-[#c95028]">Save Book</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card border border-border rounded-[14px] overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-secondary/40">
                  <TableRow>
                    <TableHead className="font-serif font-bold text-foreground w-[120px]">Book ID</TableHead>
                    <TableHead className="font-serif font-bold text-foreground">Title & Author</TableHead>
                    <TableHead className="font-serif font-bold text-foreground font-mono text-xs">RFID TAG</TableHead>
                    <TableHead className="font-serif font-bold text-foreground text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No books found in catalog.</TableCell></TableRow>
                  ) : (
                    books.map((b) => (
                      <TableRow key={b.id} className="hover:bg-secondary/20">
                        <TableCell className="font-mono text-xs font-medium text-ink">{b.id}</TableCell>
                        <TableCell>
                          <div className="text-sm font-semibold text-foreground">{b.title}</div>
                          <div className="text-xs text-muted-foreground">{b.author}</div>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">{b.rfid_tag}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-full font-medium tracking-[0.5px] ${b.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'}`}>
                            {b.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
