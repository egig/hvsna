import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.ts"),
  route("register", "routes/register.ts"),
  route("me", "routes/me.ts"),
  route("auth/refresh", "routes/auth.refresh.ts"),
  route("auth/logout", "routes/auth.logout.ts"),
  route("sync/push", "routes/sync.push.ts"),
  route("sync/pull", "routes/sync.pull.ts"),
  route("geocode/reverse", "routes/geocode.reverse.ts"),
  route("geocode/search", "routes/geocode.search.ts"),
  route("subscription", "routes/subscription.ts"),
  route("subscription/checkout", "routes/subscription.checkout.ts"),
  route("webhooks/lemonsqueezy", "routes/webhooks.lemonsqueezy.ts"),
] satisfies RouteConfig;
