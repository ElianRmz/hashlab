"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { brand } from "@/brand";
import { cn } from "@/lib/cn";
import {
  DIGEST_ALGOS,
  PASSWORD_ALGOS,
  type DigestAlgoId,
  type PasswordAlgoId,
} from "@/hash/algorithms";
import {
  demoDigest,
  demoPasswordRecord,
  demoSignature,
  randomSalt,
  recordHash,
  type RecordPart,
} from "@/hash/demo";
import { Digest } from "./Digest";
import { Button, Chips, Field, Panel, TextArea, TextInput, Verdict, type VerdictState } from "./ui";

const digestOptions = Object.values(DIGEST_ALGOS).map((a) => ({ id: a.id, label: a.label, sub: `${a.bits} BITS` }));
const passwordOptions = Object.values(PASSWORD_ALGOS).map((a) => ({ id: a.id, label: a.label, sub: a.param }));

const bytes = (s: string) => new TextEncoder().encode(s).length;

function Meta({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-px bg-paper/10 sm:grid-cols-4">
      {items.map(([k, v]) => (
        <div key={k} className="bg-ink px-3 py-2.5">
          <dt className="font-serif text-xs uppercase text-paper-dim">{k}</dt>
          <dd className="font-mono text-sm text-paper">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function IntegrityPanel() {
  const [algo, setAlgo] = useState<DigestAlgoId>("sha256");
  const [text, setText] = useState("Reporte final de la práctica 3. Versión aprobada por el docente.");
  const [result, setResult] = useState<{ digest: string; input: string; algo: DigestAlgoId } | null>(null);
  const [reference, setReference] = useState("");

  const a = DIGEST_ALGOS[algo];
  const stale = result !== null && (result.input !== text || result.algo !== algo);
  const verdict: VerdictState =
    result && reference
      ? result.digest === reference.trim()
        ? { ok: true, title: "Íntegro", detail: "El hash coincide con la referencia" }
        : { ok: false, title: "Alterado", detail: "El hash no coincide · el contenido cambió" }
      : null;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Entrada">
        <Field index="01" label="Algoritmo">
          <Chips label="Algoritmo" options={digestOptions} value={algo} onChange={setAlgo} />
        </Field>
        <Field index="02" label="Texto a proteger">
          <TextArea value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button tone="solid" onClick={() => setResult({ digest: demoDigest(text, a), input: text, algo })}>
            Calcular hash /
          </Button>
          <Button disabled={!result || stale} onClick={() => result && setReference(result.digest)}>
            Guardar como referencia
          </Button>
        </div>
      </Panel>
      <Panel title="Salida">
        <Digest value={result?.digest ?? null} placeholder="— calcula un hash para verlo aquí" />
        {stale && <p className="font-serif text-sm uppercase text-red">La entrada cambió · vuelve a calcular</p>}
        <Meta
          items={[
            ["Algoritmo", a.label],
            ["Longitud", `${a.bits / 4} hex`],
            ["Bits", String(a.bits)],
            ["Entrada", `${bytes(text)} bytes`],
          ]}
        />
        <Field index="03" label="Hash de referencia">
          <TextInput value={reference} onChange={(e) => setReference(e.target.value)} placeholder="pega el hash registrado" />
        </Field>
        <Verdict state={verdict} />
      </Panel>
    </div>
  );
}

export function SignaturePanel() {
  const [algo, setAlgo] = useState<DigestAlgoId>("sha384");
  const [message, setMessage] = useState("Autorizo el pago de $12,500.00 a la cuenta 4410.");
  const [signed, setSigned] = useState<{ digest: string; signature: string; algo: DigestAlgoId } | null>(null);
  const [received, setReceived] = useState("");
  const [verdict, setVerdict] = useState<VerdictState>(null);

  function sign() {
    const digest = demoDigest(message, DIGEST_ALGOS[algo]);
    setSigned({ digest, signature: demoSignature(digest), algo });
    setReceived(message);
    setVerdict(null);
  }

  function verify() {
    if (!signed) return;
    const ok = demoDigest(received, DIGEST_ALGOS[signed.algo]) === signed.digest;
    setVerdict(
      ok
        ? { ok: true, title: "Firma válida", detail: "Mensaje auténtico y sin cambios" }
        : { ok: false, title: "Firma inválida", detail: "El mensaje no corresponde a la firma" },
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Emisor · llave privada">
        <Field index="01" label="Hash para firmar">
          <Chips label="Algoritmo" options={digestOptions} value={algo} onChange={setAlgo} />
        </Field>
        <Field index="02" label="Mensaje">
          <TextArea value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-center gap-4">
          <Button tone="solid" onClick={sign}>
            Firmar /
          </Button>
          <span className="font-serif text-sm uppercase text-paper-dim">RSA-PSS 2048 · demo</span>
        </div>
        <div className="flex flex-col gap-2 border-t border-paper/10 pt-5">
          <p className="font-serif text-sm uppercase text-paper-dim">Hash del mensaje</p>
          <Digest value={signed?.digest ?? null} placeholder="— firma un mensaje" className="min-h-[2.5em]" />
        </div>
      </Panel>
      <Panel title="Receptor · llave pública">
        <div className="flex flex-col gap-2">
          <p className="font-serif text-sm uppercase text-paper-dim">Firma (base64)</p>
          <Digest value={signed?.signature ?? null} placeholder="— aún no hay firma" className="max-h-[7.5em] overflow-hidden text-[13px] text-paper/80" />
        </div>
        <Field index="03" label="Mensaje recibido">
          <TextArea
            rows={3}
            value={received}
            disabled={!signed}
            onChange={(e) => {
              setReceived(e.target.value);
              setVerdict(null);
            }}
            placeholder="edítalo para simular un ataque"
          />
        </Field>
        <Button disabled={!signed} onClick={verify} className="self-start">
          Verificar firma
        </Button>
        <Verdict state={verdict} />
      </Panel>
    </div>
  );
}

const PART_CLASS: Record<RecordPart["role"], string> = {
  algoritmo: "bg-[#c9c9cc] text-ink",
  costo: "bg-red-deep text-paper",
  sal: "bg-red-muted text-paper",
  hash: "text-paper",
};

function StoredRecord({ parts }: { parts: RecordPart[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p key={parts.map((p) => p.text).join("")} className="break-all font-mono text-[15px] leading-relaxed">
        {parts.map((p, i) => (
          <motion.span
            key={p.role}
            className={cn("px-0.5", PART_CLASS[p.role])}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: brand.motion.dur.base, ease: brand.motion.ease, delay: i * 0.06 }}
          >
            {p.text}
          </motion.span>
        ))}
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 font-serif text-sm uppercase text-paper-dim">
        {parts.map((p) => (
          <li key={p.role} className="flex items-center gap-2">
            <span className={cn("inline-block size-3 border border-paper/30", PART_CLASS[p.role])} />
            {p.role}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PasswordPanel() {
  const [algo, setAlgo] = useState<PasswordAlgoId>("bcrypt");
  const [user, setUser] = useState("elian.ramirez");
  const [password, setPassword] = useState("Cazador2026!");
  const [stored, setStored] = useState<{ user: string; algo: PasswordAlgoId; salt: string; parts: RecordPart[] } | null>(null);
  const [attempt, setAttempt] = useState("");
  const [verdict, setVerdict] = useState<VerdictState>(null);

  function register() {
    const salt = randomSalt(22);
    setStored({ user, algo, salt, parts: demoPasswordRecord(algo, password, salt) });
    setAttempt("");
    setVerdict(null);
  }

  function login() {
    if (!stored) return;
    const ok = recordHash(demoPasswordRecord(stored.algo, attempt, stored.salt)) === recordHash(stored.parts);
    const ms = `${PASSWORD_ALGOS[stored.algo].demoMs} ms · ${PASSWORD_ALGOS[stored.algo].label}`;
    setVerdict(ok ? { ok: true, title: "Acceso concedido", detail: ms } : { ok: false, title: "Contraseña incorrecta", detail: ms });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Registro">
        <Field index="01" label="Algoritmo">
          <Chips label="Algoritmo" options={passwordOptions} value={algo} onChange={setAlgo} />
        </Field>
        <Field index="02" label="Usuario">
          <TextInput value={user} onChange={(e) => setUser(e.target.value)} />
        </Field>
        <Field index="03" label="Contraseña">
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button tone="solid" onClick={register} disabled={!user || !password} className="self-start">
          Registrar /
        </Button>
      </Panel>
      <Panel title="Lo que se guarda en la base de datos">
        {stored ? (
          <>
            <p className="font-mono text-sm text-paper-dim">
              usuario: <span className="text-paper">{stored.user}</span>
            </p>
            <StoredRecord parts={stored.parts} />
          </>
        ) : (
          <p className="font-mono text-[15px] text-paper-dim/60">— registra un usuario para ver su hash</p>
        )}
        <div className="flex flex-col gap-4 border-t border-paper/10 pt-5">
          <Field index="04" label="Iniciar sesión">
            <TextInput type="password" value={attempt} disabled={!stored} onChange={(e) => setAttempt(e.target.value)} placeholder="escribe la contraseña" />
          </Field>
          <Button disabled={!stored || !attempt} onClick={login} className="self-start">
            Verificar
          </Button>
          <Verdict state={verdict} />
        </div>
      </Panel>
    </div>
  );
}
