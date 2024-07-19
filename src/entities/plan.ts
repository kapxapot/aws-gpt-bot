type FreePlan = "free";
type ObsoletePlan = "premium" | "unlimited" | "novice" | "student";
type ActivePlan = "novice-mini" | "student-mini" | "trial" | "creative" | "pro" | "boss";
type PromoPlan = "promo";
type TestPlan = "test-tinygpt3" | "test-tinygptokens";

export type Plan = FreePlan | ObsoletePlan | ActivePlan | PromoPlan | TestPlan;

export const defaultPlan: Plan = "free";
