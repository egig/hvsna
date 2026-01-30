import { useState, useEffect, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Navbar } from "../navigation/components";
import Block from "./block";
import { FormInput } from "./form-input";
import NavActionButton from "./nav-action-button";

interface BaseFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onSubmit: (formData: FormData) => void;
  children: ReactNode;
  title: string;
}

export default function BaseForm({
  onSuccess,
  onError,
  onCancel,
  onSubmit,
  children,
  title,
}: BaseFormProps) {
  const handleSubmit = async (formData: FormData) => {
    try {
      await onSubmit(formData);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err.message : "An error occurred");
      }
    }
  };

  return (
    <form
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
          <NavActionButton type="submit">
            <Check />
          </NavActionButton>
        }
      />
      <Block>{children}</Block>
    </form>
  );
}
