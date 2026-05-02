import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getListings } from "@/lib/api";
import HomeClient from "./home-client";

export const revalidate = 60;

export default async function Home() {
  const listings = await getListings();
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <HomeClient listings={listings} />
      <Footer />
    </div>
  );
}
