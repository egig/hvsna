import { Preloader } from "framework7-react";

interface LoadingBlockProps {
  message?: string;
}

export default function LoadingBlock({ message = "Loading..." }: LoadingBlockProps) {
  return (
    <div className="text-center">
      <Preloader />
      <div>{message}</div>
    </div>
  );
}
