import type { AdapterResult, SearchInput } from "../types.js";

export interface FlightAdapter {
  name: string;
  enabledByDefault: boolean;
  search(input: SearchInput): Promise<AdapterResult>;
}
