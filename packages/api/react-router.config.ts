import type { Config } from "@react-router/dev/config";

// No Vercel preset yet: @vercel/react-router (as of 1.3.3) only supports
// React Router v7 as a peer dep. Vercel's framework auto-detection deploys
// this zero-config in the meantime; revisit once the preset supports v8.
export default {} satisfies Config;
