import Navigation from "@/components/main/Navigation";
import Hero from "@/components/main/Hero";
import LandingGuard from "@/components/main/LandingGuard";

export default function Home() {
  return (
    <LandingGuard>
      <main className="min-h-screen bg-black text-white">
        <Navigation />
        <Hero />
      </main>
    </LandingGuard>
  );
}
