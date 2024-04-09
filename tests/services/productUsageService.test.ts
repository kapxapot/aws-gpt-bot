import { now } from "../../src/entities/at";
import { ModelCode } from "../../src/entities/model";
import { ProductUsage } from "../../src/entities/modelUsage";
import { settings } from "../../src/lib/constants";
import { buildProductModelUsage, incProductUsage } from "../../src/services/productUsageService";

describe("incProductUsage", () => {
  const pointsDataSet = [
    { points: settings.defaultUsagePoints },
    { points: settings.defaultUsagePoints * 2 }
  ];

  it.each(pointsDataSet)(
    "correctly increases empty usage ($points points)",
    ({ points }) => {
      const usage: ProductUsage = incProductUsage({}, "gptokens", points);
      const modelUsage = usage["gptokens"];
  
      expect(modelUsage).not.toBeNull();
  
      if (modelUsage) {
        expect(modelUsage.count).toBe(points);
        expect(modelUsage.intervalUsages["day"]?.count).toBe(points);
        expect(modelUsage.intervalUsages["week"]?.count).toBe(points);
        expect(modelUsage.intervalUsages["month"]?.count).toBe(points);
      }
    }
  );

  it.each(pointsDataSet)(
    "correctly increases not empty usage ($points points)",
    ({ points }) => {
      const modelCode: ModelCode = "gptokens";
      const basePoints = 10;
      const then = now();

      const usage: ProductUsage = incProductUsage(
        {
          [modelCode]: buildProductModelUsage(then, basePoints)
        },
        modelCode,
        points,
        then
      );

      const modelUsage = usage[modelCode];
  
      expect(modelUsage).not.toBeNull();
  
      if (modelUsage) {
        const totalPoints = basePoints + points;

        expect(modelUsage.count).toBe(totalPoints);
        expect(modelUsage.intervalUsages["day"]?.count).toBe(totalPoints);
        expect(modelUsage.intervalUsages["week"]?.count).toBe(totalPoints);
        expect(modelUsage.intervalUsages["month"]?.count).toBe(totalPoints);
      }
    }
  );
});
