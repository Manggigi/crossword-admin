import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/login", "routes/login.tsx"),
  route("/admin", "routes/admin.tsx", [
    route("daily/puzzles", "routes/admin.daily.puzzles.tsx"),
  ]),
] satisfies RouteConfig;
