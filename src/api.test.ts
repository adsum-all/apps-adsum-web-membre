import { describe, expect, it } from "vitest";

import { apiBaseUrl } from "./api.js";

describe("api client", () => {
  it("targets the deployed API by default", () => {
    expect(apiBaseUrl()).toMatch(/^https?:\/\//);
  });
});
