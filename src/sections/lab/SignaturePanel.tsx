"use client";

import { useState } from "react";
import { signAction, verifySignatureAction } from "@/app/actions";
import { DIGEST_ALGOS, type DigestAlgoId } from "@/hash/algorithms";
import type { PublicKeyInfo, SignResult, VerifyResult } from "@/hash/contract";
import { Digest } from "./Digest";
import { Button, Chips, Field, Panel, TextArea, Verdict, type VerdictState } from "./ui";
import { fieldError, Meta, milliseconds, TaskError, useServerTask } from "./shared";

const options = Object.values(DIGEST_ALGOS).map((a) => ({ id: a.id, label: a.label, sub: `${a.bits} BITS` }));

export function SignaturePanel({ publicKey }: { publicKey: PublicKeyInfo }) {
  const [algo, setAlgo] = useState<DigestAlgoId>("sha384");
  const [message, setMessage] = useState("Autorizo el pago de $12,500.00 a la cuenta 4410.");
  const [signed, setSigned] = useState<SignResult | null>(null);
  const [received, setReceived] = useState("");
  const [signature, setSignature] = useState("");
  const [verdict, setVerdict] = useState<VerdictState>(null);
  const signing = useServerTask<SignResult>();
  const verifying = useServerTask<VerifyResult>();
  const pending = signing.pending || verifying.pending;
  const key = signed?.publicKey ?? publicKey;

  function sign() {
    setVerdict(null);
    const form = new FormData();
    form.set("algo", algo);
    form.set("message", message);
    signing.run(() => signAction(form), (data) => {
      setSigned(data);
      setReceived(message);
      setSignature(data.signatureB64);
      verifying.setError(null);
    });
  }

  function verify() {
    setVerdict(null);
    const form = new FormData();
    form.set("algo", signed?.algo ?? algo);
    form.set("message", received);
    form.set("signature", signature);
    verifying.run(() => verifySignatureAction(form), (data) => setVerdict({
      ok: data.valid, title: data.valid ? "Firma válida" : "Firma inválida",
      detail: `${data.valid ? "Mensaje auténtico y sin cambios" : "El mensaje no corresponde a la firma"} · ${milliseconds(data.ms)}`,
    }));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Emisor · llave privada">
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-5">
          <Field index="01" label="Hash para firmar" error={fieldError(signing.error, "algo")}>
            <Chips label="Algoritmo para firmar" options={options} value={algo} onChange={setAlgo} />
          </Field>
          <Field index="02" label="Mensaje" htmlFor="sign-message" error={fieldError(signing.error, "message")}>
            {(describedBy) => <TextArea id="sign-message" aria-describedby={describedBy} value={message} onChange={(event) => setMessage(event.target.value)} />}
          </Field>
          <Button tone="solid" disabled={pending} onClick={sign} className="self-start">{signing.pending ? "Firmando…" : "Firmar /"}</Button>
        </fieldset>
        <TaskError error={signing.error} />
        <div className="flex flex-col gap-2 border-t border-paper/10 pt-5">
          <p className="font-serif text-sm uppercase text-paper-dim">Hash del mensaje firmado</p>
          <Digest value={signed?.digestHex ?? null} placeholder="— firma un mensaje" className="min-h-[2.5em]" />
          {signed && <Meta columns={2} items={[["Algoritmo", DIGEST_ALGOS[signed.algo].label], ["Tiempo", milliseconds(signed.ms)]]} />}
        </div>
        <div className="flex min-w-0 flex-col gap-3 border-t border-paper/10 pt-5">
          <p className="font-serif text-sm uppercase text-paper-dim">Llave pública del servidor · {key.scheme} · {key.modulusBits} bits</p>
          <p className="font-serif text-sm text-paper-dim">Huella SHA-256</p>
          <p className="break-all font-mono text-sm">{key.fingerprintSha256}</p>
          <details>
            <summary className="cursor-pointer font-serif text-sm uppercase text-red">Ver llave pública PEM</summary>
            <pre className="mt-3 whitespace-pre-wrap break-all font-mono text-xs text-paper-dim">{key.publicKeyPem}</pre>
          </details>
        </div>
      </Panel>
      <Panel title="Receptor · llave pública">
        <Field index="03" label="Mensaje recibido" htmlFor="received-message" error={fieldError(verifying.error, "message")}>
          {(describedBy) => <TextArea id="received-message" aria-describedby={describedBy} value={received} disabled={pending} onChange={(event) => {
            setReceived(event.target.value);
            setVerdict(null);
          }} placeholder="edítalo para simular un ataque" />}
        </Field>
        <Field index="04" label="Firma recibida (base64)" htmlFor="received-signature" error={fieldError(verifying.error, "signature")}>
          {(describedBy) => <TextArea id="received-signature" aria-describedby={describedBy} rows={6} value={signature} disabled={pending} onChange={(event) => {
            setSignature(event.target.value);
            setVerdict(null);
          }} placeholder="pega o edita la firma" className="break-all text-sm" />}
        </Field>
        <p className="font-serif text-sm uppercase text-paper-dim">Verificar con {DIGEST_ALGOS[signed?.algo ?? algo].label}</p>
        <Button disabled={pending} onClick={verify} className="self-start">{verifying.pending ? "Verificando…" : "Verificar firma"}</Button>
        <TaskError error={verifying.error} />
        <Verdict state={verdict} />
      </Panel>
    </div>
  );
}
