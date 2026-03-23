import { useLibrary, LibraryProvider } from "@/context/LibraryContext";
import LoginPage from "@/components/LoginPage";
import MainApp from "@/components/MainApp";

function AppContent() {
  const { currentUser } = useLibrary();
  return currentUser ? <MainApp /> : <LoginPage />;
}

export default function Index() {
  return (
    <LibraryProvider>
      <AppContent />
    </LibraryProvider>
  );
}
