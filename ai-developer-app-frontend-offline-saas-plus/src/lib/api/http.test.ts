import { describe, it, expect } from "vitest";
import { HttpError } from "./http";

describe("HttpError", () => {
  it("creates typed error", () => {
    const e = new HttpError("bad", 400, { title: "bad" }, "rid");
    expect(e.status).toBe(400);
    expect(e.requestId).toBe("rid");
  });
});
