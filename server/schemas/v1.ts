import { z } from "zod";

export const Group = z.object({ id: z.number(), name: z.string(), slug: z.string() });
export const Collection = z.object({ id: z.number(), groupId: z.number().nullable(), name: z.string(), slug: z.string() });

export const PuzzleCompact = z.object({
  id: z.number(),
  title: z.string(),
  date: z.string(),
  status: z.string(),
  icon_url: z.string().nullable().optional(),
});

export const PuzzleExpanded = PuzzleCompact.extend({
  description: z.string().nullable().optional(),
  difficulty: z.string().nullable().optional(),
});

export const GameSession = z.object({
  id: z.number(),
  puzzle_id: z.number(),
  player_id: z.number().nullable(),
  status: z.string(),
  data: z.record(z.any()).nullable().optional(),
});

export const SessionHint = z.object({ id: z.number(), game_session_id: z.number(), payload: z.record(z.any()) });
export const Hint = z.object({ id: z.number().optional(), content: z.string(), difficulty: z.string().nullable().optional() });
export const Share = z.object({ id: z.number(), puzzle_id: z.number(), player_id: z.number().nullable(), channel: z.string() });

export type GroupT = z.infer<typeof Group>;
export type CollectionT = z.infer<typeof Collection>;
export type PuzzleCompactT = z.infer<typeof PuzzleCompact>;
export type PuzzleExpandedT = z.infer<typeof PuzzleExpanded>;
export type GameSessionT = z.infer<typeof GameSession>;
export type SessionHintT = z.infer<typeof SessionHint>;
export type HintT = z.infer<typeof Hint>;
export type ShareT = z.infer<typeof Share>;


