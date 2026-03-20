"use client";

import { FormEvent, useMemo, useState } from "react";
import { pokemonTypes } from "@/lib/simulator/constants";
import type { PokemonType } from "@/lib/simulator/types";
import { getGameMaster } from "@/lib/simulator/gamemaster";
import { runSimulation } from "@/lib/simulator/engine";

type SimRow = {
  pokemon: { speciesName: string; tags?: string[] };
  selectedFastAttack: { name: string; type: PokemonType };
  dps: number;
  effectiveDps: number;
};

export default function Home() {
  const [defenderType, setDefenderType] = useState<PokemonType>("dark");
  const [entriesLimit, setEntriesLimit] = useState(10);
  const [attackIv, setAttackIv] = useState(15);
  const [excludeUnreleased, setExcludeUnreleased] = useState(true);
  const [includedTags, setIncludedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<SimRow[]>([]);

  const tagOptions = useMemo(
    () => ["tradeable", "shadow", "mega", "legendary", "mythical", "ultrabeast"],
    [],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const gameMaster = await getGameMaster();
      const simulation = runSimulation(gameMaster, {
        defenderType,
        entriesLimit: Math.max(1, Math.min(100, entriesLimit)),
        attackIv: Math.max(0, Math.min(15, attackIv)),
        excludeUnreleased,
        excludedSpecies: ["ditto", "deoxys_attack"],
        includedTags,
      });
      setRows(simulation.selectedCounters);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6 md:p-10">
      <h1 className="text-3xl font-bold">Pokemon GO Grunt Battle Simulator</h1>
      <p className="mt-2 text-sm opacity-80">
        Counter ranking uses logic ported from Ginden&apos;s `grunt-rockets`
        calculator (fast-move DPS, STAB, shadow boost, and type effectiveness).
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-4 rounded-xl border p-4 md:grid-cols-2"
      >
        <label className="grid gap-1">
          <span>Grunt type</span>
          <select
            value={defenderType}
            onChange={(e) => setDefenderType(e.target.value as PokemonType)}
            className="rounded border p-2"
          >
            {pokemonTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span>Top counters to show</span>
          <input
            type="number"
            min={1}
            max={100}
            value={entriesLimit}
            onChange={(e) => setEntriesLimit(Number(e.target.value))}
            className="rounded border p-2"
          />
        </label>

        <label className="grid gap-1">
          <span>Assumed attack IV</span>
          <input
            type="number"
            min={0}
            max={15}
            value={attackIv}
            onChange={(e) => setAttackIv(Number(e.target.value))}
            className="rounded border p-2"
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={excludeUnreleased}
            onChange={(e) => setExcludeUnreleased(e.target.checked)}
          />
          Exclude unreleased
        </label>

        <div className="md:col-span-2">
          <p className="mb-2">Included tags (leave empty for all)</p>
          <div className="flex flex-wrap gap-3">
            {tagOptions.map((tag) => {
              const checked = includedTags.includes(tag);
              return (
                <label key={tag} className="flex items-center gap-2 rounded border px-3 py-1">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setIncludedTags((current) =>
                        e.target.checked
                          ? [...current, tag]
                          : current.filter((value) => value !== tag),
                      )
                    }
                  />
                  {tag}
                </label>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 md:col-span-2"
        >
          {loading ? "Running simulation..." : "Run simulation"}
        </button>
      </form>

      {error && <p className="mt-4 text-red-500">{error}</p>}

      <section className="mt-6">
        <h2 className="text-xl font-semibold">Best counters for {defenderType}</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-black/5">
                <th className="border-b p-2 text-left">Pokemon</th>
                <th className="border-b p-2 text-left">Fast move</th>
                <th className="border-b p-2 text-left">Move type</th>
                <th className="border-b p-2 text-left">Neutral DPS</th>
                <th className="border-b p-2 text-left">Effective DPS</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td className="p-3 opacity-70" colSpan={5}>
                    Run a simulation to see ranked counters.
                  </td>
                </tr>
              )}
              {rows.map((row, idx) => (
                <tr key={`${row.pokemon.speciesName}-${row.selectedFastAttack.name}-${idx}`}>
                  <td className="border-b p-2">{row.pokemon.speciesName}</td>
                  <td className="border-b p-2">{row.selectedFastAttack.name}</td>
                  <td className="border-b p-2">{row.selectedFastAttack.type}</td>
                  <td className="border-b p-2">{row.dps}</td>
                  <td className="border-b p-2 font-semibold">{row.effectiveDps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
