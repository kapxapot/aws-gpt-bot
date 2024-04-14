type FreePlan = "free";
type ObsoletePlan = "premium" | "unlimited";
type ActivePlan = "novice" | "student" | "trial" | "creative" | "pro" | "boss";
type TestPlan = "test-tinygpt3" | "test-tinygptokens";

export type Plan = FreePlan | ObsoletePlan | ActivePlan | TestPlan;

export const defaultPlan: Plan = "free";
