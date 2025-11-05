import { Hono } from "hono";
import groups from "./groups";
import puzzles from "./puzzles";
import players from "./players";
import sessions from "./sessions";
import sessionHints from "./sessionHints";
import shares from "./shares";
import hints from "./hints";

const v1 = new Hono<{ Bindings: Env }>();

v1.route("/groups", groups);
v1.route("/puzzles", puzzles);
v1.route("/players", players);
v1.route("/game_sessions", sessions);
v1.route("/game_sessions", sessionHints); // nested inside sessions path
v1.route("/puzzles", shares); // nested shares under puzzles
v1.route("/puzzles", hints); // nested hints under puzzles

export default v1;


