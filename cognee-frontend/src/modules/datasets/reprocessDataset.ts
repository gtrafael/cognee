import { Dataset } from "../ingestion/useDatasets";
import { CogneeInstance } from "../instances/types";
import cognifyDataset from "./cognifyDataset";
import pollDatasetStatus from "./pollDatasetStatus";
import { toHttpError } from "@/services/http/errors";

interface ReprocessOptions {
  graphModel?: object;
  customPrompt?: string;
  ontologyKey?: string[];
}

export default async function reprocessDataset(
  dataset: Dataset,
  instance: CogneeInstance,
  options?: ReprocessOptions,
) {
  const forgetResponse = await instance.fetch("/v1/forget", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId: dataset.id, memoryOnly: true }),
    timeoutMs: 5 * 60 * 1000,
  });
  if (!forgetResponse.ok) await toHttpError(forgetResponse);

  await cognifyDataset(dataset, instance, options);

  return pollDatasetStatus(dataset.id, instance, {
    intervalMs: 5000,
    timeoutMs: 60 * 60 * 1000,
  });
}
