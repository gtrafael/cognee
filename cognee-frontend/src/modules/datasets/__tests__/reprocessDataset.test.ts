import reprocessDataset from "../reprocessDataset";
import cognifyDataset from "../cognifyDataset";
import pollDatasetStatus from "../pollDatasetStatus";

import type { CogneeInstance } from "@/modules/instances/types";

jest.mock("../cognifyDataset");
jest.mock("../pollDatasetStatus");

const dataset = { id: "dataset-1", name: "Example", data: [], status: "processing" };
const options = {
  graphModel: { name: "CustomGraph" },
  customPrompt: "Extract only supported facts.",
  ontologyKey: ["ontology-key"],
};

function response(status = 200, body = ""): Response {
  return new Response(body, { status, statusText: status === 200 ? "OK" : "Bad Request" });
}

describe("reprocessDataset", () => {
  const mockedCognify = jest.mocked(cognifyDataset);
  const mockedPoll = jest.mocked(pollDatasetStatus);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCognify.mockResolvedValue({});
    mockedPoll.mockResolvedValue("DATASET_PROCESSING_COMPLETED");
  });

  it("forgets derived memory before cognifying with selected options and polling", async () => {
    const order: string[] = [];
    const instance = {
      name: "test",
      fetch: jest.fn().mockImplementation(async () => {
        order.push("forget");
        return response();
      }),
    } as CogneeInstance;
    mockedCognify.mockImplementation(async () => {
      order.push("cognify");
      return {};
    });
    mockedPoll.mockImplementation(async () => {
      order.push("poll");
      return "DATASET_PROCESSING_COMPLETED";
    });

    await expect(reprocessDataset(dataset, instance, options)).resolves.toBe(
      "DATASET_PROCESSING_COMPLETED",
    );

    expect(order).toEqual(["forget", "cognify", "poll"]);
    expect(instance.fetch).toHaveBeenCalledWith("/v1/forget", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ datasetId: dataset.id, memoryOnly: true }),
    }));
    expect(mockedCognify).toHaveBeenCalledWith(dataset, instance, options);
    expect(mockedPoll).toHaveBeenCalledWith(dataset.id, instance, expect.any(Object));
  });

  it("surfaces the forget server error without cognifying or polling", async () => {
    const instance = {
      name: "test",
      fetch: jest.fn().mockResolvedValue(response(400, JSON.stringify({ detail: "Forget denied" }))),
    } as CogneeInstance;

    await expect(reprocessDataset(dataset, instance, options)).rejects.toThrow("Forget denied");
    expect(mockedCognify).not.toHaveBeenCalled();
    expect(mockedPoll).not.toHaveBeenCalled();
  });

  it("surfaces a cognify failure without polling", async () => {
    const instance = {
      name: "test",
      fetch: jest.fn().mockResolvedValue(response()),
    } as CogneeInstance;
    mockedCognify.mockRejectedValue(new Error("Cognify denied"));

    await expect(reprocessDataset(dataset, instance, options)).rejects.toThrow("Cognify denied");
    expect(mockedPoll).not.toHaveBeenCalled();
  });
});
