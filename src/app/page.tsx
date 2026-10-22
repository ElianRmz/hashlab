import { Suspense } from "react";
import { connection } from "next/server";
import { DitherBackground } from "@/components/background/DitherBackground";
import { DiagonalBars } from "@/brand";
import { Hero } from "@/sections/hero/Hero";
import { Lab } from "@/sections/lab/Lab";
import { publicKey } from "@/hash/server";
import { userViews } from "./users";

export default function Home() {
  return (
    <>
      <DitherBackground />
      <main className="relative z-10">
        <Hero />
        <div style={{ width: "100%", height: 40 }}>
          <DiagonalBars cell={40} background="#0a0a0b" />
        </div>
        <Suspense fallback={<p className="p-8 font-serif text-paper-dim">Cargando laboratorio…</p>}><LiveLab /></Suspense>
      </main>
    </>
  );
}

async function LiveLab() {
  await connection();
  return <Lab publicKey={publicKey()} initialUsers={userViews()} />;
}
