"use client";

import { useState } from "react";
import { generateProfile, saveProfile } from "@/app/g/[id]/actions";
import type { Scenario } from "@/lib/graph/types";

interface GraphAnalysisPanelProps {
  graphId: string;
  initialDescription: string | null;
  initialScenarios: Scenario[];
}

function emptyScenario(): Scenario {
  return { question: "", whyRelevant: "", relevantNodeIds: [] };
}

export function GraphAnalysisPanel({ graphId, initialDescription, initialScenarios }: GraphAnalysisPanelProps) {
  const [description, setDescription] = useState(initialDescription ?? "");
  const [scenarios, setScenarios] = useState<Scenario[]>(initialScenarios.length > 0 ? initialScenarios : []);
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const result = await generateProfile(graphId);
    setGenerating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDescription(result.description ?? "");
    setScenarios(result.scenarios ?? []);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const cleaned = scenarios.filter((s) => s.question.trim().length > 0);
    const result = await saveProfile(graphId, description, cleaned);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setScenarios(cleaned);
    setEditing(false);
  }

  function updateScenario(index: number, field: "question" | "whyRelevant", value: string) {
    setScenarios((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function removeScenario(index: number) {
    setScenarios((prev) => prev.filter((_, i) => i !== index));
  }

  const hasProfile = description.trim().length > 0 || scenarios.length > 0;

  return (
    <div className="border-t border-violet-100 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-violet-950">AI analysis</h2>
        {!editing && (
          <div className="flex gap-3 text-sm">
            <button onClick={handleGenerate} disabled={generating} className="text-violet-600 hover:underline disabled:opacity-50">
              {generating ? "Generating…" : hasProfile ? "Regenerate with AI" : "Generate with AI"}
            </button>
            <button onClick={() => setEditing(true)} className="text-neutral-600 hover:text-neutral-900">
              {hasProfile ? "Edit" : "Write manually"}
            </button>
          </div>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {!editing && !hasProfile && (
        <p className="text-sm text-neutral-500">
          No description or test questions yet. Generate them with AI, or write your own.
        </p>
      )}

      {!editing && hasProfile && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-700">{description}</p>
          {scenarios.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">Test questions</h3>
              <ul className="flex flex-col gap-2">
                {scenarios.map((s, i) => (
                  <li key={i} className="rounded-md bg-violet-50/60 p-3 text-sm">
                    <p className="text-neutral-900">{s.question}</p>
                    {s.whyRelevant && <p className="mt-1 text-xs text-neutral-500">{s.whyRelevant}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {editing && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium tracking-wide text-neutral-400 uppercase">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this knowledge graph useful for? What kinds of questions does it help answer?"
              className="w-full rounded-md border border-violet-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none px-3 py-2 text-sm"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium tracking-wide text-neutral-400 uppercase">Test questions</label>
              <button
                onClick={() => setScenarios((prev) => [...prev, emptyScenario()])}
                className="text-sm text-violet-600 hover:underline"
              >
                + Add question
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {scenarios.map((s, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-md border border-violet-100 p-3">
                  <div className="flex items-start gap-2">
                    <input
                      value={s.question}
                      onChange={(e) => updateScenario(i, "question", e.target.value)}
                      placeholder="Question a real user might ask"
                      className="flex-1 rounded-md border border-violet-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none px-3 py-2 text-sm"
                    />
                    <button onClick={() => removeScenario(i)} className="px-1 text-sm text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>
                  <input
                    value={s.whyRelevant}
                    onChange={(e) => updateScenario(i, "whyRelevant", e.target.value)}
                    placeholder="Why does this graph give an edge answering it? (optional)"
                    className="rounded-md border border-violet-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 focus:outline-none px-3 py-2 text-sm"
                  />
                </div>
              ))}
              {scenarios.length === 0 && <p className="text-sm text-neutral-500">No questions yet — add one above.</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setDescription(initialDescription ?? "");
                setScenarios(initialScenarios);
                setError(null);
              }}
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
