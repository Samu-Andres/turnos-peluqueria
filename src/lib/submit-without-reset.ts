import { startTransition, type FormEvent } from "react";

/**
 * Handler de onSubmit que manda el form a una action sin que React lo
 * vacíe. Con <form action={...}> React 19 resetea todos los campos al
 * terminar, aunque la action haya devuelto un error: el usuario perdía lo
 * que había escrito (y los checkboxes controlados quedaban desfasados).
 * Los forms que sí quieren limpiarse después de un alta exitosa lo hacen
 * a mano con formRef.current.reset().
 */
export function submitWithoutReset(handler: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(
      event.currentTarget,
      (event.nativeEvent as SubmitEvent).submitter
    );
    startTransition(() => handler(formData));
  };
}
