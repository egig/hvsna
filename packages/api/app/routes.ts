import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.ts"),
  route("register", "routes/register.ts"),
  route("me", "routes/me.ts"),
  route("auth/refresh", "routes/auth.refresh.ts"),
  route("auth/logout", "routes/auth.logout.ts"),
] satisfies RouteConfig;
