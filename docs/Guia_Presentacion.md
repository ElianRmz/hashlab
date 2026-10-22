# Guía de presentación · HashLab

Seguridad Informática · Unidad II · Evidencia 2 · Grupo IDGS71N

Duración: **15 minutos**. Equipo: Elian Ramirez Grageda, Jorge Sebastian Chavira Lopez, Diego Cervantes Arras y Walter JESÚS GONZÁLEZ ZÚÑIGA.

El reparto de partes es una propuesta. Cámbienlo según quién domine cada tema.

---

## 1. Antes de entrar al salón

1. En la carpeta `hashlab`, abrir una Terminal y correr:
   ```
   npm run build
   npm start
   ```
2. Abrir `http://localhost:3000` en el navegador y dejarlo en pantalla completa.
3. **Reiniciar el servidor justo antes de exponer** (Ctrl + C y `npm start`). Los usuarios y los bloqueos viven en memoria, así que la tabla "Base de datos" empieza vacía.
4. Recargar la página con **Cmd + Opción + R** para no ver una versión vieja guardada.
5. Tener abiertos en el editor, por si preguntan por el código:
   - `src/hash/params.ts` (todos los parámetros: costo 12, 535 000 rondas, 600 000 iteraciones)
   - `src/hash/server/bcrypt.ts`
   - `src/app/users.ts` (inicio de sesión, bloqueo y suelo de 600 ms)
   - `src/app/validation.ts` (reglas de validación)
6. Tener a la mano el PDF `Ev2_Ramirez_Elian_Algoritmos_Hash.pdf` (entregable, fuera del repo).
7. Ensayar una vez completa con cronómetro.

**Si la app falla en vivo:** seguir con las capturas del PDF (sección "Capturas de pantalla") y explicar sobre ellas.

---

## 2. Reparto del tiempo

| Minutos | Parte | Quién (propuesta) |
|---|---|---|
| 0:00 a 1:30 | Presentación y arquitectura | Elian |
| 1:30 a 4:30 | Demo 01 Integridad: SHA-256, SHA-384, SHA-512 | Jorge |
| 4:30 a 7:30 | Demo 02 Firmas: RSA-PSS sobre SHA-2 | Diego |
| 7:30 a 11:30 | Demo 03 Contraseñas: BCRYPT, SHA256CRYPT, PBKDF2 | Walter |
| 11:30 a 13:30 | Seguridad y validación de datos | Elian |
| 13:30 a 15:00 | Pruebas, cierre y preguntas | Todos |

---

## 3. Guion por parte

### 0:00 · Presentación y arquitectura

**Qué decir:**
- "HashLab es una app web que aplica los seis algoritmos de la consigna en sus tres usos: integridad, firmas digitales y contraseñas."
- "Está hecha con Next.js y Node.js. El navegador no calcula ningún hash. Todo se valida y se calcula en el servidor."
- "La criptografía usa el módulo `node:crypto` de Node.js y la librería `bcryptjs`."

**Qué mostrar:** la página de inicio y la figura de arquitectura del PDF (tres capas: cliente, frontera de validación, módulo criptográfico).

### 1:30 · Demo 01 Integridad

**Idea clave:** un hash es una huella. Si cambia un solo carácter, cambia toda la huella.

1. Dejar el texto de ejemplo y **SHA-256**. Pulsar **Calcular hash**. Señalar los 64 caracteres.
2. Pulsar **Guardar como referencia** y luego **Comparar referencia**. Resultado: **Íntegro**.
3. Cambiar un solo carácter del texto (por ejemplo, el punto final por "!"). Comparar. Resultado: **Alterado**, con un hash totalmente distinto.
4. Elegir **SHA-512** y calcular. Mostrar que ahora son 128 caracteres. Mencionar que SHA-384 da 96.
5. Escribir `abc123` como referencia y comparar. El servidor responde que no es un hash válido y dice la longitud esperada. Esto es **validación de datos**.

**Frase para cerrar:** "SHA-2 es rápido. Sirve para revisar archivos, pero por eso mismo no sirve para guardar contraseñas."

### 4:30 · Demo 02 Firmas

**Idea clave:** el hash detecta cambios, pero no dice quién escribió el mensaje. La firma sí.

1. Dejar el mensaje "Autorizo el pago de $12,500.00 a la cuenta 4410." y **SHA-384**. Pulsar **Firmar**.
2. Explicar: "Se hashea el mensaje y ese hash se firma con la **llave privada**, que nunca sale del servidor."
3. Abrir **Ver llave pública PEM** y señalar su huella SHA-256.
4. Pulsar **Verificar firma**. Resultado: **Firma válida**.
5. En el mensaje recibido, cambiar $12,500.00 por **$92,500.00** y verificar. Resultado: **Firma inválida**.
6. Borrar un carácter de la firma y verificar. El servidor responde que la firma debe tener 344 caracteres.

**Frase para cerrar:** "Cualquiera puede verificar con la llave pública, pero solo el dueño de la llave privada puede firmar."

### 7:30 · Demo 03 Contraseñas

**Idea clave:** nunca se guarda la contraseña, solo su hash con **sal** y **costo**.

1. Con **BCRYPT**, registrar `elian.ramirez`. La contraseña se ve en pantalla para que el grupo la lea. Se puede ocultar con el botón **Ocultar**.
2. Mostrar el registro en colores: algoritmo `$2b$`, costo `12`, sal y hash.
3. Registrar otro usuario con **SHA256CRYPT** y otro con **PBKDF2**, con la **misma contraseña**. Señalar que los hashes son distintos por la sal aleatoria.
   - Ojo: el campo de contraseña se borra después de cada registro. Hay que volver a escribirla.
4. Bajar a **Base de datos** y pulsar **Actualizar lista**. "Esto es todo lo que guarda el servidor. No hay contraseñas."
5. Iniciar sesión con la contraseña correcta. Resultado: **Acceso concedido**, con el algoritmo y el tiempo.
6. Iniciar sesión con una contraseña incorrecta, y luego con un usuario que no existe. El mensaje es el mismo: "Usuario o contraseña incorrectos". Así no se puede adivinar qué usuarios existen.
7. Fallar 5 veces seguidas. Resultado: bloqueo de **30 segundos** con cuenta regresiva.

**Comparar los tres:**

| Algoritmo | Costo en la app | Dato para decir |
|---|---|---|
| BCRYPT | costo 12 = 4 096 repeticiones | solo usa los primeros 72 bytes; la app rechaza contraseñas más largas |
| SHA256CRYPT | 535 000 rondas | el esquema `$5$` de Unix; su registro coincide con `openssl passwd -5` |
| PBKDF2 | 600 000 iteraciones | lo que recomienda OWASP para HMAC-SHA256 |

### 11:30 · Seguridad y validación

**Qué decir (elegir 4 o 5):**
- **Sal aleatoria:** dos contraseñas iguales dan registros distintos.
- **Costo alto:** si roban la base de datos, probar contraseñas es muy lento.
- **Comparación en tiempo constante:** el tiempo de respuesta no revela cuántos caracteres coinciden.
- **Mensaje genérico y tiempo mínimo de 600 ms en los fallos:** no se puede saber si un usuario existe ni qué algoritmo usa.
- **Bloqueo tras 5 fallos:** frena la fuerza bruta.
- **Validación en el servidor:** cada campo tiene su regla y su mensaje en español.

**Qué mostrar:** con BCRYPT, registrar una contraseña de 40 letras "ñ". El servidor la rechaza porque mide 80 bytes y bcrypt solo acepta 72.

### 13:30 · Pruebas y cierre

**Qué decir:**
- "Tenemos 64 pruebas automáticas y todas pasan."
- "Los resultados coinciden con los valores oficiales del NIST, con `shasum` y con `openssl`."
- **Cierre:** "Cada algoritmo va donde corresponde. SHA-2 para integridad y firmas, porque es rápido. BCRYPT, SHA256CRYPT y PBKDF2 para contraseñas, porque son lentos a propósito y usan sal."

---

## 4. Preguntas probables

| Pregunta | Respuesta corta |
|---|---|
| ¿Por qué no guardar contraseñas con SHA-256? | Es rápido. Un atacante con la base de datos puede probar millones de contraseñas por segundo. Los esquemas de contraseña agregan sal y costo. |
| ¿Qué es la sal? | Un valor aleatorio por usuario que se mezcla con la contraseña. Evita tablas precalculadas y que contraseñas iguales den el mismo hash. |
| ¿Cuál de los tres es mejor? | Los tres son aceptables con buenos parámetros. OWASP recomienda hoy Argon2id, pero la consigna pedía estos tres. |
| ¿Por qué la tabla "Base de datos" muestra todos los usuarios? | Es a propósito, para la demostración. En un sistema real no se mostraría. Al registrar un nombre repetido también dice "ya está registrado". |
| ¿Dónde está la llave privada? | Solo en la memoria del servidor. Se genera al arrancar y nunca se envía al navegador. |
| ¿Qué pasa si reinician el servidor? | Se borran los usuarios y se genera otra llave. Una firma vieja ya no verifica. |
| ¿Qué le falta para usarse en producción? | Base de datos persistente, sesiones, HTTPS y un límite de intentos por dirección IP. |
| ¿Por qué bcrypt rechaza contraseñas largas? | bcrypt ignora todo lo que pase de 72 bytes. Preferimos rechazarla a recortarla en silencio. |

---

## 5. Checklist del día

- [ ] Servidor reiniciado justo antes de exponer
- [ ] Página recargada con Cmd + Opción + R
- [ ] Pantalla completa y zoom legible desde el fondo del salón
- [ ] Archivos de código abiertos en el editor
- [ ] PDF a la mano como respaldo
- [ ] Cada quien sabe su parte y su minuto de inicio
- [ ] Repositorio por si lo piden: https://github.com/ElianRmz/hashlab
