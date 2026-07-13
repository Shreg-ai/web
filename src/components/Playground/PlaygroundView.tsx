"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { getGraphStructureForImport } from "@/app/playground/actions";
import { computeStructuralMetrics } from "@/lib/graph/structural";
import {
  buildCombinedVault,
  createManualNode,
  findShortestPath,
  type ManualLink,
  type NodeOverride,
  type PlaygroundSource,
} from "@/lib/graph/playground";
import { PlaygroundCanvas, type PlaygroundColorMode } from "./PlaygroundCanvas";
import type { ImportableGraph } from "@/app/playground/actions";
import type { NodeMetrics, ParsedNode } from "@/lib/graph/types";

interface EditableState {
  manualNodes: ParsedNode[];
  manualLinks: ManualLink[];
  hiddenNodeIds: Set<string>;
  nodeOverrides: Map<string, NodeOverride>;
}

const EMPTY_EDITABLE: EditableState = {
  manualNodes: [],
  manualLinks: [],
  hiddenNodeIds: new Set(),
  nodeOverrides: new Map(),
};

const MAX_HISTORY = 50;

interface SelectedEdgeKey {
  sourceId: string;
  targetId: string;
}

export function PlaygroundView({ importableGraphs }: { importableGraphs: ImportableGraph[] }) {
  const t = useTranslations("playground");
  const tCommon = useTranslations("common");
  const [sources, setSources] = useState<PlaygroundSource[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Every mutation to nodes/links (add, delete, rename, retype, connect,
  // disconnect, reverse) goes through `mutate`, which snapshots the
  // pre-change state onto `history` first -- Ctrl/Cmd+Z (or the Undo
  // button) pops the most recent snapshot back.
  const [current, setCurrent] = useState<EditableState>(EMPTY_EDITABLE);
  const [history, setHistory] = useState<EditableState[]>([]);

  function mutate(updater: (prev: EditableState) => EditableState) {
    setHistory((h) => [...h.slice(-(MAX_HISTORY - 1)), current]);
    setCurrent((prev) => updater(prev));
  }

  function handleUndo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      setCurrent(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      const isEditingText = active instanceof HTMLElement && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
      if (isEditingText) return;
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [metrics, setMetrics] = useState<NodeMetrics[] | null>(null);
  const [colorMode, setColorMode] = useState<PlaygroundColorMode>("type");

  const [pathStart, setPathStart] = useState<string | null>(null);
  const [pathEnd, setPathEnd] = useState<string | null>(null);
  const [pathResult, setPathResult] = useState<string[] | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);

  const [selectedNode, setSelectedNode] = useState<ParsedNode | null>(null);
  const [selectedEdgeKey, setSelectedEdgeKey] = useState<SelectedEdgeKey | null>(null);

  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newLinkDirected, setNewLinkDirected] = useState(false);

  const combinedVault = useMemo(
    () => buildCombinedVault(sources, current.manualLinks, current.manualNodes, current.hiddenNodeIds, current.nodeOverrides),
    [sources, current]
  );

  const importedIds = useMemo(() => new Set(sources.map((s) => s.graphId)), [sources]);

  const selectedManualLink = useMemo(() => {
    if (!selectedEdgeKey) return null;
    return (
      current.manualLinks.find(
        (l) =>
          (l.sourceId === selectedEdgeKey.sourceId && l.targetId === selectedEdgeKey.targetId) ||
          (l.sourceId === selectedEdgeKey.targetId && l.targetId === selectedEdgeKey.sourceId)
      ) ?? null
    );
  }, [current.manualLinks, selectedEdgeKey]);

  async function handleImport(graphId: string) {
    setImportingId(graphId);
    setError(null);
    const result = await getGraphStructureForImport(graphId);
    setImportingId(null);
    if (result.error || !result.payload || !result.title) {
      setError(result.error ?? t("couldNotImport"));
      return;
    }
    setSources((prev) => [...prev, { graphId, graphTitle: result.title!, vault: result.payload!.vault }]);
    setMetrics(null);
  }

  function handleRemoveSource(graphId: string) {
    setSources((prev) => prev.filter((s) => s.graphId !== graphId));
    mutate((prev) => ({
      ...prev,
      manualLinks: prev.manualLinks.filter((l) => !l.sourceId.startsWith(`${graphId}::`) && !l.targetId.startsWith(`${graphId}::`)),
    }));
    setMetrics(null);
    setPathResult(null);
    setSelectedNode(null);
    setSelectedEdgeKey(null);
  }

  function handleAddNode() {
    const title = newNodeTitle.trim();
    if (!title) return;
    const node = createManualNode(title);
    mutate((prev) => ({ ...prev, manualNodes: [...prev.manualNodes, node] }));
    setNewNodeTitle("");
  }

  function handleDeleteNode(id: string) {
    mutate((prev) => ({
      manualNodes: prev.manualNodes.filter((n) => n.id !== id),
      manualLinks: prev.manualLinks.filter((l) => l.sourceId !== id && l.targetId !== id),
      hiddenNodeIds: new Set(prev.hiddenNodeIds).add(id),
      nodeOverrides: prev.nodeOverrides,
    }));
    setSelectedNode((cur) => (cur?.id === id ? null : cur));
    setSelectedEdgeKey((cur) => (cur && (cur.sourceId === id || cur.targetId === id) ? null : cur));
  }

  function handleRenameNode(id: string, title: string) {
    mutate((prev) => {
      const nextOverrides = new Map(prev.nodeOverrides);
      nextOverrides.set(id, { ...nextOverrides.get(id), title });
      return { ...prev, nodeOverrides: nextOverrides };
    });
    setSelectedNode((cur) => (cur?.id === id ? { ...cur, title } : cur));
  }

  function handleSetNodeType(id: string, type: string) {
    mutate((prev) => {
      const nextOverrides = new Map(prev.nodeOverrides);
      nextOverrides.set(id, { ...nextOverrides.get(id), type });
      return { ...prev, nodeOverrides: nextOverrides };
    });
  }

  function linkKeyMatches(l: ManualLink, source: string, target: string) {
    return (l.sourceId === source && l.targetId === target) || (l.sourceId === target && l.targetId === source);
  }

  function handleConnect(source: string, target: string) {
    mutate((prev) => {
      if (prev.manualLinks.some((l) => linkKeyMatches(l, source, target))) return prev;
      return { ...prev, manualLinks: [...prev.manualLinks, { sourceId: source, targetId: target, directed: newLinkDirected }] };
    });
  }

  function handleDisconnect(source: string, target: string) {
    mutate((prev) => ({ ...prev, manualLinks: prev.manualLinks.filter((l) => !linkKeyMatches(l, source, target)) }));
    setSelectedEdgeKey((cur) => (cur && linkKeyMatches({ ...cur, directed: false }, source, target) ? null : cur));
  }

  function handleSelectEdge(source: string, target: string) {
    setSelectedEdgeKey({ sourceId: source, targetId: target });
  }

  function handleSetEdgeDirected(directed: boolean) {
    if (!selectedEdgeKey) return;
    const { sourceId, targetId } = selectedEdgeKey;
    mutate((prev) => ({
      ...prev,
      manualLinks: prev.manualLinks.map((l) => (linkKeyMatches(l, sourceId, targetId) ? { ...l, directed } : l)),
    }));
  }

  function handleReverseEdge() {
    if (!selectedEdgeKey) return;
    const { sourceId, targetId } = selectedEdgeKey;
    mutate((prev) => ({
      ...prev,
      manualLinks: prev.manualLinks.map((l) => (linkKeyMatches(l, sourceId, targetId) ? { ...l, sourceId: l.targetId, targetId: l.sourceId } : l)),
    }));
    setSelectedEdgeKey({ sourceId: targetId, targetId: sourceId });
  }

  function handleSetEdgeLabel(label: string) {
    if (!selectedEdgeKey) return;
    const { sourceId, targetId } = selectedEdgeKey;
    mutate((prev) => ({
      ...prev,
      manualLinks: prev.manualLinks.map((l) => (linkKeyMatches(l, sourceId, targetId) ? { ...l, label } : l)),
    }));
  }

  function handleRunAnalysis() {
    setMetrics(computeStructuralMetrics(combinedVault));
    setColorMode("cluster");
  }

  function handleFindPath() {
    setPathError(null);
    if (!pathStart || !pathEnd) {
      setPathError(t("noStartEnd"));
      return;
    }
    const path = findShortestPath(combinedVault, pathStart, pathEnd);
    if (!path) {
      setPathResult(null);
      setPathError(t("noPathFound"));
      return;
    }
    setPathResult(path);
  }

  const nodeTitleById = useMemo(() => new Map(combinedVault.nodes.map((n) => [n.id, n.title])), [combinedVault]);
  const modeLabels = { type: t("modeType"), source: t("modeSource"), cluster: t("modeCluster") } as const;
  const canUndo = history.length > 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
      <div className="flex max-h-80 w-full shrink-0 flex-col gap-5 overflow-y-auto border-b border-violet-100 bg-white p-4 md:max-h-none md:w-80 md:border-r md:border-b-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-base font-medium text-violet-950">{t("heading")}</h1>
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              title={t("undoHint")}
              className="shrink-0 rounded-md border border-violet-200 px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("undo")}
            </button>
          </div>
          <p className="mt-1 text-xs text-neutral-500">{t("description")}</p>
        </div>

        <div>
          <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("importGraph")}</h2>
          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
          {importableGraphs.length === 0 ? (
            <p className="text-xs text-neutral-500">{t("noGraphsAvailable")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {importableGraphs.map((g) => {
                const imported = importedIds.has(g.id);
                return (
                  <li key={g.id} className="flex items-center justify-between gap-2 rounded-md border border-violet-100 px-2.5 py-1.5 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900">{g.title}</p>
                      <p className="text-neutral-400">
                        {g.isOwn ? t("you") : `@${g.username}`} · {g.node_count} {tCommon("nodes")}
                      </p>
                    </div>
                    <button
                      onClick={() => (imported ? handleRemoveSource(g.id) : handleImport(g.id))}
                      disabled={importingId === g.id}
                      className={`shrink-0 rounded-md px-2 py-1 font-medium disabled:opacity-50 ${
                        imported ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200" : "bg-violet-600 text-white hover:bg-violet-700"
                      }`}
                    >
                      {importingId === g.id ? "…" : imported ? t("remove") : t("import")}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("addNode")}</h2>
          <div className="flex gap-1.5">
            <input
              value={newNodeTitle}
              onChange={(e) => setNewNodeTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddNode()}
              placeholder={t("newNodeTitlePlaceholder")}
              className="min-w-0 flex-1 rounded-md border border-violet-200 px-2 py-1.5 text-xs"
            />
            <button
              onClick={handleAddNode}
              disabled={!newNodeTitle.trim()}
              className="shrink-0 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("add")}
            </button>
          </div>
          <h2 className="mt-3 mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("newLinkStyle")}</h2>
          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setNewLinkDirected(false)}
              className={`flex-1 rounded-md px-2 py-1.5 font-medium ${
                !newLinkDirected ? "bg-violet-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {t("undirected")}
            </button>
            <button
              onClick={() => setNewLinkDirected(true)}
              className={`flex-1 rounded-md px-2 py-1.5 font-medium ${
                newLinkDirected ? "bg-violet-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {t("directed")}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-neutral-500">{t("newLinkStyleHint")}</p>
        </div>

        {sources.length > 0 && (
          <>
            <div>
              <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("colorNodesBy")}</h2>
              <div className="flex gap-1 text-xs">
                {(["type", "source", "cluster"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setColorMode(mode)}
                    disabled={mode === "cluster" && !metrics}
                    className={`flex-1 rounded-md px-2 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                      colorMode === mode ? "bg-violet-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {modeLabels[mode]}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-neutral-500">
                {colorMode === "type" && t("colorHintType")}
                {colorMode === "source" && t("colorHintSource")}
                {colorMode === "cluster" && (metrics ? t("colorHintClusterReady") : t("colorHintClusterNotReady"))}
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("analysis")}</h2>
              <button
                onClick={handleRunAnalysis}
                className="w-full rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700"
              >
                {t("runAnalysis")}
              </button>
            </div>

            <div>
              <h2 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("findConnection")}</h2>
              <div className="flex flex-col gap-1.5 text-xs">
                <select
                  value={pathStart ?? ""}
                  onChange={(e) => setPathStart(e.target.value || null)}
                  className="rounded-md border border-violet-200 px-2 py-1.5"
                >
                  <option value="">{t("fromNode")}</option>
                  {combinedVault.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
                <select
                  value={pathEnd ?? ""}
                  onChange={(e) => setPathEnd(e.target.value || null)}
                  className="rounded-md border border-violet-200 px-2 py-1.5"
                >
                  <option value="">{t("toNode")}</option>
                  {combinedVault.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleFindPath}
                  className="rounded-md bg-violet-600 px-3 py-1.5 font-medium text-white hover:bg-violet-700"
                >
                  {t("findPath")}
                </button>
                {pathError && <p className="text-red-600">{pathError}</p>}
                {pathResult && (
                  <div className="rounded-md bg-violet-50/60 p-2">
                    <p className="mb-1 font-medium text-violet-800">{t("hops", { count: pathResult.length - 1 })}</p>
                    <p className="text-neutral-700">{pathResult.map((id) => nodeTitleById.get(id) ?? id).join(" → ")}</p>
                    <button onClick={() => setPathResult(null)} className="mt-1 text-neutral-400 hover:text-neutral-700">
                      {t("clear")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {selectedNode && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("node")}</h2>
              <button onClick={() => setSelectedNode(null)} className="text-xs text-neutral-400 hover:text-neutral-700">
                ✕
              </button>
            </div>
            <label className="mb-1 block text-xs text-neutral-500">{t("nodeTitleLabel")}</label>
            <input
              value={selectedNode.title}
              onChange={(e) => handleRenameNode(selectedNode.id, e.target.value)}
              className="mb-2 w-full rounded-md border border-violet-200 px-2 py-1.5 text-sm"
            />
            <label className="mb-1 block text-xs text-neutral-500">{t("nodeTypeLabel")}</label>
            <input
              value={typeof selectedNode.frontmatter.type === "string" ? selectedNode.frontmatter.type : ""}
              onChange={(e) => handleSetNodeType(selectedNode.id, e.target.value)}
              placeholder={t("nodeTypePlaceholder")}
              className="mb-2 w-full rounded-md border border-violet-200 px-2 py-1.5 text-sm"
            />
            {selectedNode.body && (
              <p className="mb-2 text-xs text-neutral-500 whitespace-pre-wrap line-clamp-6">{selectedNode.body}</p>
            )}
            <button
              onClick={() => handleDeleteNode(selectedNode.id)}
              className="w-full rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              {t("deleteNode")}
            </button>
          </div>
        )}

        {selectedManualLink && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{t("edge")}</h2>
              <button onClick={() => setSelectedEdgeKey(null)} className="text-xs text-neutral-400 hover:text-neutral-700">
                ✕
              </button>
            </div>
            <p className="mb-2 text-sm text-neutral-700">
              {nodeTitleById.get(selectedManualLink.sourceId) ?? selectedManualLink.sourceId}
              {selectedManualLink.directed ? " → " : " — "}
              {nodeTitleById.get(selectedManualLink.targetId) ?? selectedManualLink.targetId}
            </p>
            <div className="mb-2 flex gap-1 text-xs">
              <button
                onClick={() => handleSetEdgeDirected(false)}
                className={`flex-1 rounded-md px-2 py-1.5 font-medium ${
                  !selectedManualLink.directed ? "bg-violet-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {t("undirected")}
              </button>
              <button
                onClick={() => handleSetEdgeDirected(true)}
                className={`flex-1 rounded-md px-2 py-1.5 font-medium ${
                  selectedManualLink.directed ? "bg-violet-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {t("directed")}
              </button>
            </div>
            {selectedManualLink.directed && (
              <button
                onClick={handleReverseEdge}
                className="mb-2 w-full rounded-md border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
              >
                {t("reverseDirection")}
              </button>
            )}
            <label className="mb-1 block text-xs text-neutral-500">{t("edgeLabelLabel")}</label>
            <input
              value={selectedManualLink.label ?? ""}
              onChange={(e) => handleSetEdgeLabel(e.target.value)}
              placeholder={t("edgeLabelPlaceholder")}
              className="mb-2 w-full rounded-md border border-violet-200 px-2 py-1.5 text-sm"
            />
            <button
              onClick={() => handleDisconnect(selectedManualLink.sourceId, selectedManualLink.targetId)}
              className="w-full rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              {t("deleteEdge")}
            </button>
          </div>
        )}
      </div>

      <div className="min-h-[300px] flex-1 bg-violet-50/30 md:min-h-0">
        {combinedVault.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-neutral-400">
            {t("emptyField")}
          </div>
        ) : (
          <PlaygroundCanvas
            vault={combinedVault}
            metrics={metrics}
            colorMode={colorMode}
            pathNodeIds={pathResult}
            manualLinks={current.manualLinks}
            onSelectNode={(id) => setSelectedNode(combinedVault.nodes.find((n) => n.id === id) ?? null)}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSelectEdge={handleSelectEdge}
            onDeleteNode={handleDeleteNode}
          />
        )}
      </div>
    </div>
  );
}
