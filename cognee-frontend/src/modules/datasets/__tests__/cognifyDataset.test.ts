import cognifyDataset from "../cognifyDataset";

import type { CogneeInstance } from "@/modules/instances/types";

jest.mock("@/modules/configuration/pipelineSettings", () => ({
  getPipelineSettingsFromStorage: () => ({ chunkSize: 1000, chunksPerBatch: 10 }),
}));

it("surfaces the original cognify server error", async () => {
  const instance = {
    name: "test",
    fetch: jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Invalid graph model" }), {
        status: 422,
        statusText: "Unprocessable Entity",
      }),
    ),
  } as CogneeInstance;

  await expect(
    cognifyDataset({ id: "dataset-1", name: "Example", data: [], status: "processing" }, instance),
  ).rejects.toThrow("Invalid graph model");
});
