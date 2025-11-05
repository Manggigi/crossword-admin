import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/login", "routes/login.tsx"),
  route("/admin", "routes/admin.tsx", [
    route("daily/puzzles", "routes/admin.daily.puzzles.tsx"),
    route("puzzles/new", "routes/admin.puzzles.new.tsx"),
    route("puzzles/:id/edit", "routes/admin.puzzles.$id.edit.tsx"),
  ]),
] satisfies RouteConfig;
