"use client";

import { useSyncExternalStore } from "react";

// No hay nada a lo que suscribirse: solo usamos useSyncExternalStore para
// leer window.location.origin de forma segura con SSR (en el server no
// existe window, así que ahí devolvemos null y quien llama muestra una
// ruta relativa hasta que el cliente hidrata con el origin real).
function subscribeNoop() {
  return () => {};
}

function getOrigin() {
  return window.location.origin;
}

function getServerOrigin() {
  return null;
}

export function useOrigin(): string | null {
  return useSyncExternalStore(subscribeNoop, getOrigin, getServerOrigin);
}
