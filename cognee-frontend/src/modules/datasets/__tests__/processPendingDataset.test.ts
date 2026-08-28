import processPendingDataset from "../processPendingDataset";
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

describe("processPendingDataset", () => {
  const mockedCognify = jest.mocked(cognifyDataset);
  const mockedPoll = jest.mocked(pollDatasetStatus);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCognify.mockResolvedValue({});
    mockedPoll.mockResolvedValue("DATASET_PROCESSING_COMPLETED");
  });

  it("cognifies with selected options before polling without forgetting memory", async () => {
    const order: string[] = [];
    const instance = { name: "test", fetch: jest.fn() } as CogneeInstance;
    mockedCognify.mockImplementation(async () => {
      order.push("cognify");
      return {};
    });
    mockedPoll.mockImplementation(async () => {
      order.push("poll");
      return "DATASET_PROCESSING_COMPLETED";
    });

    await expect(processPendingDataset(dataset, instance, options)).resolves.toBe(
      "DATASET_PROCESSING_COMPLETED",
    );

    expect(order).toEqual(["cognify", "poll"]);
    expect(instance.fetch).not.toHaveBeenCalled();
    expect(mockedCognify).toHaveBeenCalledWith(dataset, instance, options);
    expect(mockedPoll).toHaveBeenCalledWith(dataset.id, instance, expect.any(Object));
  });

  it("does not poll when cognify fails", async () => {
    const instance = { name: "test", fetch: jest.fn() } as CogneeInstance;
    mockedCognify.mockRejectedValue(new Error("Cognify denied"));

    await expect(processPendingDataset(dataset, instance, options)).rejects.toThrow(
      "Cognify denied",
    );

    expect(instance.fetch).not.toHaveBeenCalled();
    expect(mockedPoll).not.toHaveBeenCalled();
  });
});
