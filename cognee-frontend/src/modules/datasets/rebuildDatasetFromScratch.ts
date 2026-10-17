import { toHttpError } from "@/services/http/errors";
import type { Dataset } from "../ingestion/useDatasets";
import type { CogneeInstance } from "../instances/types";
import cognifyDataset from "./cognifyDataset";

interface RebuildOptions {
  graphModel?: object;
  customPrompt?: string;
  ontologyKey?: string[];
  llmModel?: string;
  chunkSize?: number;
  chunksPerBatch?: number;
}

/**
 * Clear only derived memory for a dataset, preserving raw documents, then
 * start cognify again. This is deliberately different from an incremental
 * retry: memoryOnly resets pipeline status so every preserved document is
 * eligible for processing again.
 */
export default async function rebuildDatasetFromScratch(
  dataset: Dataset,
  instance: CogneeInstance,
  options?: RebuildOptions,
) {
  const forgetResponse = await instance.fetch("/v1/forget", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId: dataset.id, memoryOnly: true }),
    timeoutMs: 5 * 60 * 1000,
  });
  if (!forgetResponse.ok) await toHttpError(forgetResponse);

  return cognifyDataset(dataset, instance, options);
}
