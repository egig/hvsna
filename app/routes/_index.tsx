import { useEffect } from "react";
import { createRoot, type Container } from "react-dom/client";
import type { Route } from "./+types/_index";
import { redirect, useParams } from "react-router";
import App from "../.client/app";
import type { AppConfig } from "../.client/app";
import Framework7 from 'framework7/lite-bundle';
import Framework7React from 'framework7-react';
import { registerSW } from "virtual:pwa-register";


export const loader = async () => {
  return redirect(`/guest`);
}
