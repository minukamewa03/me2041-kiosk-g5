import { useLibrary } from "@/context/LibraryContext";
import LoginPage from "@/components/LoginPage";
import MainApp from "@/components/MainApp";

export default function Index() {
  const { currentUser } = useLibrary();
  return currentUser ? <MainApp /> : <LoginPage />;
}
