"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
};

export function PendingSubmitButton({ idleLabel, pendingLabel }: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending} aria-busy={pending}>
      {pending && <LoaderCircle size={18} aria-hidden="true" style={{ animation: "stageSpin .8s linear infinite" }} />}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
