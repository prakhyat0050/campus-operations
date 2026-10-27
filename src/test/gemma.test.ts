import { describe, expect, it } from "vitest";
import { parseGemmaSuggestion, parseSustainabilityPlan } from "@/lib/campus/gemma";

describe("Gemma report suggestions", () => {
  it("parses a valid JSON suggestion wrapped in a code fence", () => {
    expect(
      parseGemmaSuggestion(
        '```json\n{"title":"Leaking sink","description":"Water is pooling below the sink.","category":"Plumbing","priority":"High","rationale":"Visible water pooling needs prompt review."}\n```',
      ),
    ).toEqual({
      title: "Leaking sink",
      description: "Water is pooling below the sink.",
      category: "Plumbing",
      priority: "High",
      rationale: "Visible water pooling needs prompt review.",
    });
  });

  describe("Gemma sustainability action plans", () => {
    it("parses evidence-based actions and bounds model-supplied values", () => {
      expect(
        parseSustainabilityPlan(
          '```json\n{"summary":"Start with checks supported by the readings.","actions":[{"title":"Inspect overnight lab load","action":"Review after-hours equipment schedules with facilities.","evidence":"MT-1041 reports lab energy above its sample baseline.","effort":"Low","verification":"Compare a week of after-hours readings after the review."}]}\n```',
        ),
      ).toEqual({
        summary: "Start with checks supported by the readings.",
        actions: [
          {
            title: "Inspect overnight lab load",
            action: "Review after-hours equipment schedules with facilities.",
            evidence: "MT-1041 reports lab energy above its sample baseline.",
            effort: "Low",
            verification: "Compare a week of after-hours readings after the review.",
          },
        ],
      });
    });

    it("rejects unsupported effort labels and empty action plans", () => {
      expect(() => parseSustainabilityPlan("not JSON")).toThrow("unreadable action plan");
      expect(() =>
        parseSustainabilityPlan(
          '{"summary":"Plan","actions":[{"title":"Action","action":"Check a reading.","evidence":"Reading 1","effort":"Guaranteed","verification":"Measure again."}]}',
        ),
      ).toThrow("invalid action");
      expect(() => parseSustainabilityPlan('{"summary":"No actions","actions":[]}')).toThrow(
        "invalid number",
      );
    });
  });

  it("rejects invalid categories and malformed model output", () => {
    expect(() => parseGemmaSuggestion("not JSON")).toThrow("unreadable suggestion");
    expect(() =>
      parseGemmaSuggestion(
        '{"title":"Issue","description":"A campus issue.","category":"Medical","priority":"High","rationale":"Review needed."}',
      ),
    ).toThrow("incomplete suggestion");
  });
});
