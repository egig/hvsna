import { useState, useEffect, type ReactNode } from "react";
import { HvCheck } from "@/modules/icons";
import Block from "../ui/block";
import { FormInput } from "../ui/form-input";
import NavActionButton from "../ui/nav-action-button";
import { Navbar } from "../navigation";

interface BaseFormProps<T = void> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onSubmit: (formData: FormData) => Promise<T>;
  children: ReactNode;
  title: string;
  isSubmitting?: boolean;
}

export default function BaseForm<T = void>({
  onSuccess,
  onError,
  onCancel,
  onSubmit,
  children,
  title,
  isSubmitting = false,
}: BaseFormProps<T>) {
  const handleSubmit = async (formData: FormData) => {
    try {
      const result = await onSubmit(formData);
      if (onSuccess && result !== undefined) {
        onSuccess(result);
      }
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err.message : "An error occurred");
      }
    }
  };

  return (
    <form
      className="h-[100%]"
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        await handleSubmit(formData);
      }}
    >
      <Navbar
        title={title}
        showBackButton={true}
        customBackAction={onCancel}
        rightAction={
          <NavActionButton type="submit" disabled={isSubmitting}>
            <HvCheck />
          </NavActionButton>
        }
      />
      <div className="p-6 max-h-[450px] overflow-y-auto">{children}</div>
    </form>
  );
}
