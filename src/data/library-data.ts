export type BookStatus = 'available' | 'borrowed' | 'reserved' | 'kiosk';

export interface Book {
  id: string;
  title: string;
  author: string;
  rfidTag: string;
  status: BookStatus;
  due: string | null;
}

export interface KioskSlot {
  slotId: number;
  slotNumber: number;
  bookId: string | null;
  isAvailable: boolean;
}

export interface Member {
  id: string;
  password: string;
  name: string;
  borrowed: string[];
}

export const MEMBERS: Record<string, Member> = {
  "240320V": { id: "240320V", password: "1234", name: "Sanithi", borrowed: ["B003"] },
  "220150A": { id: "220150A", password: "abcd", name: "Amal", borrowed: ["B001"] },
};

export const BOOKS: Book[] = [
  { id: "B001", title: "Introduction to Mechatronics", author: "David Alciatore", rfidTag: "RFID001", status: "borrowed", due: "2026-03-20" },
  { id: "B002", title: "Engineering Thermodynamics", author: "P.K. Nag", rfidTag: "RFID002", status: "kiosk", due: null },
  { id: "B003", title: "Signals & Systems", author: "Oppenheim", rfidTag: "RFID003", status: "borrowed", due: "2026-03-18" },
  { id: "B004", title: "Numerical Methods for Engineers", author: "Chapra & Canale", rfidTag: "RFID004", status: "available", due: null },
  { id: "B005", title: "AutoCAD 2024 Essentials", author: "Scott Onstott", rfidTag: "RFID005", status: "available", due: null },
  { id: "B006", title: "Control Systems Engineering", author: "Norman Nise", rfidTag: "RFID006", status: "kiosk", due: null },
  { id: "B007", title: "Probability & Statistics for Engineers", author: "Walpole", rfidTag: "RFID007", status: "reserved", due: null },
  { id: "B008", title: "Engineering Mechanics: Dynamics", author: "Meriam & Kraige", rfidTag: "RFID008", status: "available", due: null },
  { id: "B009", title: "Materials Science & Engineering", author: "Callister", rfidTag: "RFID009", status: "borrowed", due: "2026-03-25" },
  { id: "B010", title: "Fluid Mechanics", author: "Frank White", rfidTag: "RFID010", status: "available", due: null },
];

export const KIOSK_SLOTS: KioskSlot[] = Array.from({ length: 6 }, (_, i) => ({
  slotId: i + 1,
  slotNumber: i + 1,
  bookId: null,
  isAvailable: false,
}));
