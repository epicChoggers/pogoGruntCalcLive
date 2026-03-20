import type { GameMaster, GameMasterMove, GameMasterPokemon } from "./types";

const GAMEMASTER_URL =
  "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.json";

let cached: GameMaster | null = null;

type RawPokemon = {
  speciesId: string;
  speciesName: string;
  baseStats: GameMasterPokemon["baseStats"];
  types: GameMasterPokemon["types"];
  tags?: string[];
  fastMoves?: string[];
  released: boolean;
};

type RawMove = {
  moveId: string;
  name: string;
  type: GameMasterMove["type"];
  power: number;
  energyGain: number;
  cooldown: number;
};

type RawGameMaster = {
  pokemonTags?: string[];
  pokemon?: RawPokemon[];
  moves?: RawMove[];
};

export async function getGameMaster(): Promise<GameMaster> {
  if (cached) return cached;

  const response = await fetch(GAMEMASTER_URL);
  if (!response.ok) {
    throw new Error(`Unable to fetch Game Master: ${response.status}`);
  }

  const raw = (await response.json()) as RawGameMaster;
  const pokemon = (raw.pokemon ?? []).map((p): GameMasterPokemon => ({
    speciesId: p.speciesId,
    speciesName: p.speciesName,
    baseStats: p.baseStats,
    types: p.types,
    tags: p.tags,
    fastMoves: p.fastMoves ?? [],
    released: Boolean(p.released),
  }));

  const moves = (raw.moves ?? []).map((m): GameMasterMove => ({
    moveId: m.moveId,
    name: m.name,
    type: m.type,
    power: m.power,
    energyGain: m.energyGain,
    cooldown: m.cooldown,
  }));

  cached = {
    pokemonTags: raw.pokemonTags ?? [],
    pokemon,
    moves,
  };

  return cached;
}
