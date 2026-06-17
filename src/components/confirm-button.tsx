"use client";

import { ReactNode, useId, useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

type ConfirmButtonProps = Omit<ButtonProps, "onClick"> & {
  cancelLabel?: string;
  children: ReactNode;
  confirmDescription: string;
  confirmLabel?: string;
  confirmTitle?: string;
  onConfirm: () => void;
};

export function ConfirmButton({
  cancelLabel = "Cancelar",
  children,
  confirmDescription,
  confirmLabel = "Eliminar",
  confirmTitle = "Confirmar eliminacion",
  disabled,
  onConfirm,
  ...buttonProps
}: ConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <Button {...buttonProps} disabled={disabled} type="button" onClick={() => setIsOpen(true)}>
        {children}
      </Button>

      {isOpen ? (
        <div
          aria-describedby={descriptionId}
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
          role="alertdialog"
        >
          <div className="w-full max-w-md rounded-lg border bg-card p-5 shadow-2xl">
            <h3 className="text-lg font-semibold tracking-normal" id={titleId}>
              {confirmTitle}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground" id={descriptionId}>
              {confirmDescription}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setIsOpen(false);
                  onConfirm();
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
