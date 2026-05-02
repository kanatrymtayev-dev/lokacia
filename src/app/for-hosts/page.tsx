import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ForHostsContent from "./for-hosts-content";

export const metadata = {
  title: "Для хостов — LOKACIA.KZ",
  description: "Зарабатывайте на вашем пространстве с LOKACIA.KZ",
};

export default function ForHostsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <ForHostsContent />
      <Footer />
    </div>
  );
}
