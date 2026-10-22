import { DitherBackground } from "@/components/background/DitherBackground";
import { DiagonalBars } from "@/brand";
import { Hero } from "@/sections/hero/Hero";
import { Lab } from "@/sections/lab/Lab";

export default function Home() {
  return (
    <>
      <DitherBackground />
      <main className="relative z-10">
        <Hero />
        <div style={{ width: "100%", height: 40 }}>
          <DiagonalBars cell={40} background="#0a0a0b" />
        </div>
        <Lab />
      </main>
    </>
  );
}
