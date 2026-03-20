import {
  damageReduction,
  pokemonTypes,
  shadowBonus,
  stab,
  superEffectiveDamage,
} from "./constants";
import { getTypeTraits } from "./type-chart";
import type {
  GameMaster,
  GameMasterPokemon,
  PokemonMoveVariant,
  PokemonType,
  RawPokemonType,
} from "./types";

export type SimulationOptions = {
  defenderType: PokemonType;
  entriesLimit: number;
  attackIv: number;
  excludeUnreleased: boolean;
  excludedSpecies: string[];
  includedTags: string[];
};

export type SimulationResult = {
  selectedCounters: PokemonMoveVariant[];
  bestByDefenderType: Record<PokemonType, PokemonMoveVariant[]>;
};

function calculateTypePairDamageModifier(
  attackType: PokemonType,
  defenderTypes: [PokemonType] | [PokemonType, RawPokemonType],
): number {
  let modifier = 1;
  for (const defenderType of defenderTypes) {
    if (defenderType === "none") continue;
    const traits = getTypeTraits(defenderType);
    if (traits.immunities.includes(attackType)) {
      modifier *= damageReduction * damageReduction;
    } else if (traits.weaknesses.includes(attackType)) {
      modifier *= superEffectiveDamage;
    } else if (traits.resistances.includes(attackType)) {
      modifier *= damageReduction;
    }
  }

  return modifier;
}

function getFilteredPokemon(
  pokemon: GameMasterPokemon[],
  options: Pick<
    SimulationOptions,
    "excludeUnreleased" | "excludedSpecies" | "includedTags"
  >,
) {
  const excludedSpecies = new Set(options.excludedSpecies);
  const includedTags = new Set(options.includedTags);

  return pokemon
    .filter((p) => (options.excludeUnreleased ? p.released : true))
    .filter((p) => !excludedSpecies.has(p.speciesId))
    .filter((p) => {
      if (includedTags.size === 0) return true;
      const tags = p.tags ?? [];
      const isTradeable = !tags.includes("mega") && !tags.includes("shadow");

      return [...includedTags].some((includedTag) => {
        if (includedTag === "tradeable") {
          return isTradeable;
        }
        return tags.includes(includedTag);
      });
    });
}

function getPokemonMoveVariants({
  pokemon,
  moves,
  attackIv,
}: {
  pokemon: GameMasterPokemon[];
  moves: GameMaster["moves"];
  attackIv: number;
}): Omit<PokemonMoveVariant, "effectiveDps">[] {
  const movesMap = Object.fromEntries(
    moves.filter((move) => move.energyGain).map((move) => [move.moveId, move]),
  );

  return pokemon.flatMap((poke) =>
    poke.fastMoves
      .map((moveId) => movesMap[moveId])
      .filter((move) => Boolean(move))
      .map((selectedFastAttack) => {
        const moveDps = selectedFastAttack.power / (selectedFastAttack.cooldown / 500);
        let dps = moveDps;

        if ((poke.tags ?? []).includes("shadow")) {
          dps *= shadowBonus;
        }
        if (poke.types.includes(selectedFastAttack.type)) {
          dps *= stab;
        }
        dps *= poke.baseStats.atk + attackIv;

        return {
          pokemon: poke,
          selectedFastAttack,
          dps: Math.round(dps),
        };
      }),
  );
}

function sortVariants(variants: PokemonMoveVariant[]) {
  return variants.sort((a, b) => {
    if (b.effectiveDps !== a.effectiveDps) return b.effectiveDps - a.effectiveDps;
    if (a.selectedFastAttack.cooldown !== b.selectedFastAttack.cooldown) {
      return a.selectedFastAttack.cooldown - b.selectedFastAttack.cooldown;
    }
    return a.pokemon.speciesName.localeCompare(b.pokemon.speciesName);
  });
}

export function runSimulation(
  gameMaster: GameMaster,
  options: SimulationOptions,
): SimulationResult {
  const filteredPokemon = getFilteredPokemon(gameMaster.pokemon, options);
  const moveVariants = getPokemonMoveVariants({
    pokemon: filteredPokemon,
    moves: gameMaster.moves,
    attackIv: options.attackIv,
  });

  const bestByDefenderType = Object.fromEntries(
    pokemonTypes.map((defendingType) => {
      const variants = moveVariants.map((variant) => {
        const damageModifier = calculateTypePairDamageModifier(variant.selectedFastAttack.type, [
          defendingType,
        ]);
        return {
          ...variant,
          effectiveDps: Math.round(variant.dps * damageModifier),
        };
      });

      return [defendingType, sortVariants(variants)];
    }),
  ) as Record<PokemonType, PokemonMoveVariant[]>;

  return {
    selectedCounters: bestByDefenderType[options.defenderType].slice(0, options.entriesLimit),
    bestByDefenderType,
  };
}
