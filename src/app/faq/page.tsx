import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import FaqContent from "./faq-content";

export const metadata = {
  title: "FAQ — LOKACIA.KZ",
  description: "Часто задаваемые вопросы о маркетплейсе аренды локаций LOKACIA.KZ.",
};

export default function FaqPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <FaqContent />
      </main>
      <Footer />
    </div>
  );
}
