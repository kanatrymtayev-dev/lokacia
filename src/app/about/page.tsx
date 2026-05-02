import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import AboutContent from "./about-content";

export const metadata = {
  title: "О нас — LOKACIA.KZ",
  description: "LOKACIA — маркетплейс аренды локаций для съёмок, мероприятий и встреч в Казахстане.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <AboutContent />
      </main>
      <Footer />
    </div>
  );
}
