// Lab endpoint contract — the ONLY place any lab endpoint notion exists.
// v1 is deliberately URL-free: no endpoint URL exists anywhere in the repo
// until the lab architecture is ratified. The v2 tool will honor this typed
// contract; the T13 island is a shell that never calls anything.
export interface LabEndpoint {
  name: string;
  version: string;
}

export const LAB_ENDPOINT: LabEndpoint = { name: 'lab', version: 'v1-contract-only' };
