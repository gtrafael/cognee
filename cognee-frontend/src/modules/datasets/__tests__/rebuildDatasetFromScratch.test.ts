import rebuildDatasetFromScratch from "../rebuildDatasetFromScratch";
import cognifyDataset from "../cognifyDataset";

import type { CogneeInstance } from "@/modules/instances/types";

jest.mock("../cognifyDataset");

const dataset = { id: "dataset-1", name: "Example", data: [], status: "processing" };
const options = {
  graphModel: { title: "CustomGraph" },
  customPrompt: "Extract supported facts.",
  ontologyKey: ["ontology-key"],
};

function response(status = 200, body = ""): Response {
  return new Response(body, { status, statusText: status === 200 ? "OK" : "Bad Request" });
}

describe("rebuildDatasetFromScratch", () => {
  const mockedCognify = jest.mocked(cognifyDataset);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCognify.mockResolvedValue({});
  });

  it("clears derived memory before starting cognify with the selected options", async () => {
    const order: string[] = [];
    const instance = {
      name: "test",
      instanceId: "test",
      fetch: jest.fn().mockImplementation(async () => {
        order.push("forget");
        return response();
      }),
    } as CogneeInstance;
    mockedCognify.mockImplementation(async () => {
      order.push("cognify");
      return {};
    });

    await expect(rebuildDatasetFromScratch(dataset, instance, options)).resolves.toEqual({});

    expect(order).toEqual(["forget", "cognify"]);
    expect(instance.fetch).toHaveBeenCalledWith("/v1/forget", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ datasetId: dataset.id, memoryOnly: true }),
    }));
    expect(mockedCognify).toHaveBeenCalledWith(dataset, instance, options);
  });

  it("preserves the forget error and does not start cognify", async () => {
    const instance = {
      name: "test",
      instanceId: "test",
      fetch: jest.fn().mockResolvedValue(
        response(403, JSON.stringify({ detail: "Memory reset denied" })),
      ),
    } as CogneeInstance;

    await expect(rebuildDatasetFromScratch(dataset, instance, options)).rejects.toThrow(
      "Memory reset denied",
    );
    expect(mockedCognify).not.toHaveBeenCalled();
  });
});
