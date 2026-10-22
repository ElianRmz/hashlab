"use client";

import { useState } from "react";
import { digestAction, referenceAction } from "@/app/actions";
import { FILE_ERROR, FILE_LIMIT } from "@/app/validation";
import { DIGEST_ALGOS, type DigestAlgoId } from "@/hash/algorithms";
import type { DigestResult } from "@/hash/contract";
import { Digest } from "./Digest";
import { Button, Chips, Field, Panel, TextArea, TextInput, Verdict, type VerdictState } from "./ui";
import { fieldError, Meta, milliseconds, TaskError, useServerTask } from "./shared";

const options = Object.values(DIGEST_ALGOS).map((a) => ({ id: a.id, label: a.label, sub: `${a.bits} BITS` }));
type Input = { mode: "text"; text: string } | { mode: "file"; file: File | null };
type Computed = { hash: DigestResult; input: Input };
type Comparison = { reference: string; matches: boolean | null };

export function IntegrityPanel() {
  const [algo, setAlgo] = useState<DigestAlgoId>("sha256");
  const [input, setInput] = useState<Input>({ mode: "text", text: "Reporte final de la práctica 3. Versión aprobada por el docente." });
  const [result, setResult] = useState<Computed | null>(null);
  const [reference, setReference] = useState("");
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const compute = useServerTask<DigestResult>();
  const compare = useServerTask<Comparison>();
  const stale = result !== null && (result.input !== input || result.hash.algo !== algo);
  const pending = compute.pending || compare.pending;
  const compared = comparison?.reference === reference.trim().toLowerCase() && !stale;
  const verdict: VerdictState = compared && comparison?.matches !== null && comparison ? {
    ok: comparison.matches,
    title: comparison.matches ? "Íntegro" : "Alterado",
    detail: comparison.matches ? "El hash coincide con la referencia" : "El hash no coincide · el contenido cambió",
  } : null;

  function calculate() {
    setComparison(null);
    if (input.mode === "file" && (!input.file || input.file.size < 1 || input.file.size > FILE_LIMIT)) {
      compute.setError({ ok: false, error: FILE_ERROR, field: "file" });
      return;
    }
    const form = new FormData();
    form.set("algo", algo);
    form.set("mode", input.mode);
    if (input.mode === "text") form.set("text", input.text);
    else if (input.file) form.set("file", input.file);
    compute.run(() => digestAction(form), (hash) => setResult({ hash, input }));
  }

  function compareReference() {
    setComparison(null);
    const form = new FormData();
    form.set("algo", algo);
    form.set("reference", reference);
    if (result && !stale) form.set("hex", result.hash.hex);
    compare.run(() => referenceAction(form), (data) => {
      setReference(data.reference);
      setComparison(data);
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
        event.preventDefault();
        if (!pending) {
          setInput({ mode: "file", file: event.dataTransfer.files[0] ?? null });
          compute.setError(null);
        }
      }}>
        <Panel title="Entrada">
          <fieldset disabled={pending} className="flex min-w-0 flex-col gap-5">
            <Field index="01" label="Algoritmo" error={fieldError(compute.error, "algo")}>
              <Chips label="Algoritmo de integridad" options={options} value={algo} onChange={(value) => { setAlgo(value); compute.setError(null); compare.setError(null); setComparison(null); }} />
            </Field>
            <Field index="02" label="Tipo de entrada" error={fieldError(compute.error, "mode")}>
              <Chips label="Tipo de entrada" options={[{ id: "text", label: "Texto" }, { id: "file", label: "Archivo" }]}
                value={input.mode} onChange={(mode) => {
                  setInput(mode === "text" ? { mode, text: "" } : { mode, file: null });
                  compute.setError(null);
                }} />
            </Field>
            {input.mode === "text" ? <Field index="03" label="Texto a proteger" htmlFor="integrity-text" error={fieldError(compute.error, "text")}>
              <TextArea id="integrity-text" aria-describedby="integrity-text-error" value={input.text} onChange={(event) => setInput({ mode: "text", text: event.target.value })} />
            </Field> : <Field index="03" label="Archivo a proteger" htmlFor="integrity-file" error={fieldError(compute.error, "file")}>
              <TextInput id="integrity-file" type="file" aria-describedby="integrity-file-error" onChange={(event) => setInput({ mode: "file", file: event.target.files?.[0] ?? null })} />
              <p className="break-all font-serif text-sm text-paper-dim">{input.file ? `${input.file.name} · ${input.file.size.toLocaleString("es-MX")} bytes` : "Elige o arrastra un archivo aquí · 1 byte a 5 MB"}</p>
            </Field>}
            <div className="flex flex-wrap gap-3">
              <Button tone="solid" disabled={pending} onClick={calculate}>{compute.pending ? "Calculando…" : "Calcular hash /"}</Button>
              <Button disabled={!result || stale || pending} onClick={() => {
                if (result) {
                  setReference(result.hash.hex);
                  setComparison({ reference: result.hash.hex, matches: true });
                  compare.setError(null);
                }
              }}>Guardar como referencia</Button>
            </div>
          </fieldset>
          <TaskError error={compute.error} />
        </Panel>
      </div>
      <Panel title="Salida">
        <Digest value={result?.hash.hex ?? null} placeholder="— calcula un hash para verlo aquí" />
        {stale && <p role="status" className="font-serif text-sm uppercase text-red">La entrada o el algoritmo cambió · vuelve a calcular</p>}
        {result && <Meta items={[
          ["Algoritmo", DIGEST_ALGOS[result.hash.algo].label], ["Longitud", `${result.hash.hex.length} hex`],
          ["Bits", String(DIGEST_ALGOS[result.hash.algo].bits)], ["Entrada", `${result.hash.inputBytes.toLocaleString("es-MX")} bytes`],
          ["Tiempo", milliseconds(result.hash.ms)],
        ]} />}
        <Field index="04" label="Hash de referencia" htmlFor="reference" error={fieldError(compare.error, "reference")}>
          <TextInput id="reference" aria-describedby="reference-error" value={reference} disabled={pending} onChange={(event) => {
            setReference(event.target.value);
            compare.setError(null);
            setComparison(null);
          }} placeholder="pega el hash registrado" />
        </Field>
        <Button className="self-start" disabled={pending} onClick={compareReference}>{compare.pending ? "Verificando…" : "Comparar referencia"}</Button>
        <TaskError error={compare.error} />
        <Verdict state={verdict} />
      </Panel>
    </div>
  );
}
