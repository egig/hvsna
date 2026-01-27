import { useState, useEffect } from "react";
import {
  Preloader,
  Page,
  Navbar,
  NavRight,
  NavTitle,
  Link,
  NavLeft,
} from "framework7-react";

export default function BaseForm({
    title,
  onSuccess,
  onError,
  onCancel,
  children,
  isSubmitting = false,
}: {
    title: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  children: React.ReactNode;
  isSubmitting?: boolean;
}) {
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);
  const currentlySubmitting = isSubmitting || internalIsSubmitting;

  const handleSubmit = async () => {
    try {
      if (!isSubmitting) {
        setInternalIsSubmitting(true);
      }
      if (onSuccess) {
        await onSuccess();
      }
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (!isSubmitting) {
        setInternalIsSubmitting(false);
      }
    }
  };
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Page pageContent={false}>
      <Navbar>
        <NavLeft>
          <Link onClick={handleCancel}>Back</Link>
        </NavLeft>
        <NavTitle>{title}</NavTitle>
        <NavRight>
          <Link onClick={handleSubmit}>
            {currentlySubmitting ? (
              <>
                <Preloader size={16} /> {"SAVING..."}
              </>
            ) : (
              "SAVE"
            )}
          </Link>
        </NavRight>
      </Navbar>
      {children}
    </Page>
  );
}
