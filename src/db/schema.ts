import {
  boolean,
  date,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const winTypeEnum = pgEnum("win_type", [
  "points",
  "dominance",
  "coalition",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 32 }).notNull().unique(),
  displayName: varchar("display_name", { length: 64 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const factions = pgTable("factions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  expansion: varchar("expansion", { length: 64 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  // Vagabond é a única facção que pode se repetir numa partida
  allowsDuplicate: boolean("allows_duplicate").notNull().default(false),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  playedAt: date("played_at").notNull(),
  map: varchar("map", { length: 32 }),
  deck: varchar("deck", { length: 32 }),
  notes: text("notes"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const matchPlayers = pgTable(
  "match_players",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    factionId: integer("faction_id")
      .notNull()
      .references(() => factions.id),
    score: integer("score").notNull().default(0),
    isWinner: boolean("is_winner").notNull().default(false),
    winType: winTypeEnum("win_type"),
    turnOrder: integer("turn_order"),
  },
  (table) => [uniqueIndex("match_player_unique").on(table.matchId, table.userId)],
);

// Cache do Elo — sempre recalculado do histórico completo (ver src/lib/elo.ts)
export const ratings = pgTable("ratings", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  elo: doublePrecision("elo").notNull(),
  matchesCounted: integer("matches_counted").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  matchPlayers: many(matchPlayers),
  rating: one(ratings, { fields: [users.id], references: [ratings.userId] }),
}));

export const matchesRelations = relations(matches, ({ many, one }) => ({
  players: many(matchPlayers),
  creator: one(users, { fields: [matches.createdBy], references: [users.id] }),
}));

export const matchPlayersRelations = relations(matchPlayers, ({ one }) => ({
  match: one(matches, { fields: [matchPlayers.matchId], references: [matches.id] }),
  user: one(users, { fields: [matchPlayers.userId], references: [users.id] }),
  faction: one(factions, {
    fields: [matchPlayers.factionId],
    references: [factions.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, { fields: [ratings.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Faction = typeof factions.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type MatchPlayer = typeof matchPlayers.$inferSelect;
export type WinType = (typeof winTypeEnum.enumValues)[number];
