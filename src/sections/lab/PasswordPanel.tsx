"use client";

import { useEffect, useState } from "react";
import { listUsersAction, loginAction, registerAction } from "@/app/actions";
import type { ActionResult, LoginResult, RegistrationResult, UserView } from "@/app/action-types";
import { PASSWORD_ALGOS, type PasswordAlgoId } from "@/hash/algorithms";
import { Button, Chips, Field, Panel, TextInput, Verdict, type VerdictState } from "./ui";
import { fieldError, milliseconds, StoredRecord, TaskError, useServerTask } from "./shared";

const options = Object.values(PASSWORD_ALGOS).map((a) => ({ id: a.id, label: a.label, sub: a.param }));

export function PasswordPanel({ initialUsers }: { initialUsers: ActionResult<UserView[]> }) {
  const [algo, setAlgo] = useState<PasswordAlgoId>("bcrypt");
  const [username, setUsername] = useState("elian.ramirez");
  const [password, setPassword] = useState("Cazador2026!");
  const [stored, setStored] = useState<RegistrationResult | null>(null);
  const [users, setUsers] = useState(initialUsers.ok ? initialUsers.data : []);
  const [loginUsername, setLoginUsername] = useState("");
  const [attempt, setAttempt] = useState("");
  const [login, setLogin] = useState<{ username: string; result: LoginResult } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const registration = useServerTask<RegistrationResult>();
  const authentication = useServerTask<LoginResult>();
  const listing = useServerTask<UserView[]>();
  const lockedUntil = login?.result.lockedUntil ?? 0;
  const remaining = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  const result = login?.username.toLowerCase() === loginUsername.toLowerCase() ? login.result : null;
  const pending = registration.pending || authentication.pending;

  useEffect(() => {
    if (!lockedUntil) return;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= lockedUntil) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const verdict: VerdictState = result ? {
    ok: result.kind === "verified" && result.ok,
    title: remaining > 0 ? "Cuenta bloqueada" : result.kind === "locked" ? "Bloqueo terminado" : result.message,
    detail: [
      remaining > 0 ? `Intenta en ${remaining} s` : result.kind === "locked" ? "Puedes volver a intentar" : "",
      result.kind === "verified" ? milliseconds(result.ms) : "",
      PASSWORD_ALGOS[result.algo].label,
    ].filter(Boolean).join(" · "),
  } : null;

  function register() {
    const form = new FormData();
    form.set("algo", algo);
    form.set("username", username);
    form.set("password", password);
    registration.run(() => registerAction(form), (data) => {
      setStored(data);
      setUsers(data.users);
      setPassword("");
      setLoginUsername(data.username);
      setAttempt("");
      setLogin(null);
      authentication.setError(null);
    });
  }

  function verifyLogin() {
    const form = new FormData();
    form.set("username", loginUsername);
    form.set("password", attempt);
    setLogin(null);
    authentication.run(() => loginAction(form), (data) => {
      setNow(Date.now());
      setLogin({ username: loginUsername, result: data });
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Registro">
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-5">
          <Field index="01" label="Algoritmo" error={fieldError(registration.error, "algo")}>
            <Chips label="Algoritmo de contraseña" className="grid-cols-1 min-[480px]:grid-cols-3" options={options} value={algo} onChange={setAlgo} />
          </Field>
          <Field index="02" label="Usuario" htmlFor="register-username" error={fieldError(registration.error, "username")}>
            <TextInput id="register-username" autoComplete="off" aria-describedby="register-username-error" value={username} onChange={(event) => setUsername(event.target.value)} />
          </Field>
          <Field index="03" label="Contraseña" htmlFor="register-password" error={fieldError(registration.error, "password")}>
            <TextInput id="register-password" type="password" autoComplete="new-password" aria-describedby="register-password-error" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Button tone="solid" disabled={pending} onClick={register} className="self-start">{registration.pending ? "Calculando…" : "Registrar /"}</Button>
        </fieldset>
        <TaskError error={registration.error} />
        {stored && <div className="flex min-w-0 flex-col gap-3 border-t border-paper/10 pt-5">
          <p className="break-all font-serif text-sm uppercase text-paper-dim">Registro de {stored.username} · {milliseconds(stored.hash.ms)}</p>
          <StoredRecord key={stored.hash.record} parts={stored.hash.parts} />
        </div>}
      </Panel>
      <Panel title="Iniciar sesión">
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-5">
          <Field index="04" label="Usuario" htmlFor="login-username" error={fieldError(authentication.error, "username")}>
            <TextInput id="login-username" autoComplete="off" aria-describedby="login-username-error" value={loginUsername} onChange={(event) => {
              setLoginUsername(event.target.value);
              setLogin(null);
            }} />
          </Field>
          <Field index="05" label="Contraseña" htmlFor="login-password" error={fieldError(authentication.error, "password")}>
            <TextInput id="login-password" type="password" autoComplete="off" aria-describedby="login-password-error" value={attempt} onChange={(event) => {
              setAttempt(event.target.value);
              setLogin(null);
            }} placeholder="escribe la contraseña" />
          </Field>
          <Button disabled={pending} onClick={verifyLogin} className="self-start">{authentication.pending ? "Verificando…" : "Verificar acceso"}</Button>
        </fieldset>
        <TaskError error={authentication.error} />
        <Verdict state={verdict} />
      </Panel>
      <Panel title="Base de datos" className="lg:col-span-2">
        <p className="font-serif text-sm text-paper-dim">Usuarios en memoria del servidor · {users.length} registros</p>
        <Button disabled={listing.pending || pending} className="self-start" onClick={() => listing.run(listUsersAction, setUsers)}>
          {listing.pending ? "Calculando…" : "Actualizar lista"}
        </Button>
        <TaskError error={listing.error ?? (initialUsers.ok ? null : initialUsers)} />
        {users.length ? <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] table-fixed text-left">
            <caption className="sr-only">Usuarios, algoritmos, registros hash y fecha de creación</caption>
            <thead className="border-b border-paper/15 font-serif text-sm uppercase text-paper-dim"><tr>
              <th className="w-[18%] p-3 font-normal">Usuario</th><th className="w-[17%] p-3 font-normal">Algoritmo</th>
              <th className="w-[45%] p-3 font-normal">Registro</th><th className="w-[20%] p-3 font-normal">Creado</th>
            </tr></thead>
            <tbody>{users.map((user) => <tr key={user.username} className="border-b border-paper/10 align-top">
              <td className="break-all p-3 font-mono text-sm">{user.username}</td>
              <td className="p-3 font-serif text-sm">{PASSWORD_ALGOS[user.algo].label}</td>
              <td className="p-3"><StoredRecord parts={user.parts} legend={false} /></td>
              <td className="p-3 font-mono text-xs"><time dateTime={new Date(user.createdAt).toISOString()}>{new Date(user.createdAt).toLocaleString("es-MX", { timeZone: "America/Chihuahua" })}</time></td>
            </tr>)}</tbody>
          </table>
        </div> : <p className="font-mono text-sm text-paper-dim">Registra un usuario para ver su hash aquí.</p>}
      </Panel>
    </div>
  );
}
