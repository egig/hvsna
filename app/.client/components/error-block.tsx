import { Button, Icon } from "framework7-react";

interface ErrorBlockProps {
  error: string;
  onRetry: () => void;
  retryText?: string;
}

export default function ErrorBlock({ error, onRetry, retryText = "Retry" }: ErrorBlockProps) {
  return (
    <div className="text-center">
      <div style={{ color: 'red' }}>{error}</div>
      <Button fill onClick={onRetry}>
        <Icon ios="f7:arrow_clockwise" md="material:refresh" />
        {retryText}
      </Button>
    </div>
  );
}
