import { v4 } from "uuid";

export const uuid = () => v4();

export const flattenUuid = (uuid: string) => uuid.replaceAll("-", "");
