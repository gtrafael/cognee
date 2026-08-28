import { Dataset } from "../ingestion/useDatasets";
import { CogneeInstance } from "../instances/types";
import cognifyDataset from "./cognifyDataset";
import pollDatasetStatus from "./pollDatasetStatus";

interface ProcessPendingOptions {
  graphModel?: object;
  customPrompt?: string;
  ontologyKey?: string[];
}

export default async function processPendingDataset(
  dataset: Dataset,
  instance: CogneeInstance,
  options?: ProcessPendingOptions,
) {
  await cognifyDataset(dataset, instance, options);

  return pollDatasetStatus(dataset.id, instance, {
    intervalMs: 5000,
    timeoutMs: 60 * 60 * 1000,
  });
}
