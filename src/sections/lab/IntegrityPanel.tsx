"use client";

import { useState } from "react";
import { digestAction } from "@/app/actions";
import type { IntegrityResult } from "@/app/action-types";
import { parseFile } from "@/app/validation";
import { DIGEST_ALGOS, type DigestAlgoId } from "@/hash/algorithms";
import { Digest } from "./Digest";
import { Button, Chips, Field, Panel, TextArea, TextInput, Verdict, type VerdictState } from "./ui";
import { fieldError, Meta, milliseconds, TaskError, useServerTask } from "./shared";

const options = Object.values(DIGEST_ALGOS).map((a) => ({ id: a.id, label: a.label, sub: `${a.bits} BITS` }));
type Input = { mode: "text"; text: string } | { mode: "file"; file: File | null };
type Outcome = { input: Input; reference: string | null; result: IntegrityResult };

function sameInput(a: Input, b: Input): boolean {
  if (a.mode === "text") return b.mode === "text" && a.text === b.text;
  return b.mode === "file" && a.file?.name === b.file?.name && a.file?.size === b.file?.size && a.file?.lastModified === b.file?.lastModified;
}

export function IntegrityPanel() {
  const [algo, setAlgo] = useState<DigestAlgoId>("sha256");
  const [input, setInput] = useState<Input>({ mode: "text", text: "Reporte final de la práctica 3. Versión aprobada por el docente." });
  const [reference, setReference] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [comparing, setComparing] = useState(false);
  const task = useServerTask<IntegrityResult>();
  const current = outcome !== null && outcome.result.hash.algo === algo && sameInput(outcome.input, input);
  const matches = current && outcome.reference === reference ? outcome.result.matches : null;
  const verdict: VerdictState = matches === null ? null : {
    ok: matches,
    title: matches ? "Íntegro" : "Alterado",
    detail: matches ? "El hash del contenido coincide con la referencia" : "El hash no coincide · el contenido cambió",
  };

  function submit(compare: boolean) {
    const form = new FormData();
    form.set("algo", algo);
    form.set("mode", input.mode);
    if (input.mode === "text") {
      form.set("text", input.text);
    } else {
      const file = parseFile(input.file);
      if (!file.ok) return task.setError(file);
      form.set("file", file.data);
    }
    if (compare) form.set("reference", reference);
    const sent = { input, reference: compare ? reference : null };
    setComparing(compare);
    task.run(() => digestAction(form), (result) => setOutcome({ ...sent, result }));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
        event.preventDefault();
        if (!task.pending) {
          setInput({ mode: "file", file: event.dataTransfer.files[0] ?? null });
          task.setError(null);
        }
      }}>
        <Panel title="Entrada">
          <fieldset disabled={task.pending} className="flex min-w-0 flex-col gap-5">
            <Field index="01" label="Algoritmo" error={fieldError(task.error, "algo")}>
              <Chips label="Algoritmo de integridad" options={options} value={algo} onChange={(value) => { setAlgo(value); task.setError(null); }} />
            </Field>
            <Field index="02" label="Tipo de entrada" error={fieldError(task.error, "mode")}>
              <Chips label="Tipo de entrada" options={[{ id: "text", label: "Texto" }, { id: "file", label: "Archivo" }]}
                value={input.mode} onChange={(mode) => {
                  setInput(mode === "text" ? { mode, text: "" } : { mode, file: null });
                  task.setError(null);
                }} />
            </Field>
            {input.mode === "text" ? <Field index="03" label="Texto a proteger" htmlFor="integrity-text" error={fieldError(task.error, "text")}>
              <TextArea id="integrity-text" aria-describedby="integrity-text-error" value={input.text} onChange={(event) => setInput({ mode: "text", text: event.target.value })} />
            </Field> : <Field index="03" label="Archivo a proteger" htmlFor="integrity-file" error={fieldError(task.error, "file")}>
              <TextInput id="integrity-file" type="file" aria-describedby="integrity-file-error" onChange={(event) => setInput({ mode: "file", file: event.target.files?.[0] ?? null })} />
              <p className="break-all font-serif text-sm text-paper-dim">{input.file ? `${input.file.name} · ${input.file.size.toLocaleString("es-MX")} bytes` : "Elige o arrastra un archivo aquí · 1 byte a 5 MB"}</p>
            </Field>}
            <div className="flex flex-wrap gap-3">
              <Button tone="solid" disabled={task.pending} onClick={() => submit(false)}>{task.pending && !comparing ? "Calculando…" : "Calcular hash /"}</Button>
              <Button disabled={!current || task.pending} onClick={() => outcome && setReference(outcome.result.hash.hex)}>Guardar como referencia</Button>
            </div>
          </fieldset>
        </Panel>
      </div>
      <Panel title="Salida">
        <Digest value={outcome?.result.hash.hex ?? null} placeholder="— calcula un hash para verlo aquí" />
        {outcome && !current && <p role="status" className="font-serif text-sm uppercase text-red">La entrada o el algoritmo cambió · vuelve a calcular</p>}
        {outcome && <Meta items={[
          ["Algoritmo", DIGEST_ALGOS[outcome.result.hash.algo].label], ["Longitud", `${outcome.result.hash.hex.length} hex`],
          ["Bits", String(DIGEST_ALGOS[outcome.result.hash.algo].bits)], ["Entrada", `${outcome.result.hash.inputBytes.toLocaleString("es-MX")} bytes`],
          ["Tiempo", milliseconds(outcome.result.hash.ms)],
        ]} />}
        <Field index="04" label="Hash de referencia" htmlFor="reference" error={fieldError(task.error, "reference")}>
          <TextInput id="reference" aria-describedby="reference-error" value={reference} disabled={task.pending} onChange={(event) => {
            setReference(event.target.value);
            task.setError(null);
          }} placeholder="pega el hash registrado" />
        </Field>
        <Button className="self-start" disabled={task.pending} onClick={() => submit(true)}>{task.pending && comparing ? "Verificando…" : "Comparar referencia"}</Button>
        <TaskError error={task.error} />
        <Verdict state={verdict} />
      </Panel>
    </div>
  );
}
