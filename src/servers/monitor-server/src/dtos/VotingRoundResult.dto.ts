// import { DHType } from "../../verification/generated/attestation-hash-types";
// import { ARType } from "../../verification/generated/attestation-request-types";

export interface VotingRoundResult {
  roundId: number;
  hash: string;
  // TODO: try if it works with ARType and DHType
  requestBytes: string;
  request: any;
  response: any;
  merkleProof: string[];
}
