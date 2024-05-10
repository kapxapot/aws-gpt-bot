type FreePlan = "free";
type ObsoletePlan = "premium" | "unlimited";
type ActivePlan = "novice" | "student" | "trial" | "creative" | "pro" | "boss";
type InvitePlan = "invite2024";
type TestPlan = "test-tinygpt3" | "test-tinygptokens";

export type Plan = FreePlan | ObsoletePlan | ActivePlan | InvitePlan | TestPlan;

export const defaultPlan: Plan = "free";
