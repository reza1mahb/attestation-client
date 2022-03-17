//////////////////////////////////////////////////////////////
// This file is auto generated. You may edit it only in the 
// marked section between //-$$$<start> and //-$$$<end>.
// You may also import custom imports needed for the code
// in the custom section, which should be placed immediately 
// in the usual import section (below this comment)
//////////////////////////////////////////////////////////////

import { XrpTransaction } from "flare-mcc";
import { toBN } from "flare-mcc/dist/utils/utils";
import { numberLikeToNumber } from "../../attestation-types/attestation-types-helpers";
import { ARPayment, Attestation, DHPayment, hashPayment, IndexedQueryManager, MCC, parseRequestBytes, TDEF_payment, Verification, VerificationStatus, Web3 } from "./0imports";

const web3 = new Web3();

export async function verifyPaymentXRP(client: MCC.XRP, attestation: Attestation, indexer: IndexedQueryManager, recheck = false) {
   let request = parseRequestBytes(attestation.data.request, TDEF_payment) as ARPayment;
   let roundId = attestation.round.roundId;
   let numberOfConfirmations = attestation.sourceHandler.config.requiredBlocks;

   //-$$$<start> of the custom code section. Do not change this comment. XXX

   let blockNumber = numberLikeToNumber(request.blockNumber);

   let confirmedTransactionResult = await indexer.getConfirmedTransaction({
      txId: request.id,
      numberOfConfirmations,
      blockNumber: numberLikeToNumber(request.blockNumber),
      dataAvailabilityProof: request.dataAvailabilityProof,
      roundId: roundId,
      type: recheck ? 'RECHECK' : 'FIRST_CHECK'
   })

   if (confirmedTransactionResult.status === 'RECHECK') {
      return {
         status: VerificationStatus.RECHECK_LATER
      } as Verification<ARPayment, DHPayment>;
   }

   if (confirmedTransactionResult.status === 'NOT_EXIST') {
      return {
         status: VerificationStatus.NON_EXISTENT_TRANSACTION
      }
   }

   let dbTransaction = confirmedTransactionResult.transaction!;
   const fullTxData = new XrpTransaction(JSON.parse(dbTransaction.response))

   if (recheck) {
      let confirmationBlockIndex = blockNumber + numberOfConfirmations;
      let confirmationBlock = await indexer.queryBlock({
         blockNumber: confirmationBlockIndex,
         roundId
      });
      if (!confirmationBlock) {
         return {
            status: VerificationStatus.NOT_CONFIRMED
         }
      }
      if (confirmationBlock.blockHash != request.dataAvailabilityProof) {
         return {
            status: VerificationStatus.WRONG_DATA_AVAILABILITY_PROOF
         }
      }
   }

   if (fullTxData.data.result.TransactionType != "Payment") {
      return {
         status: VerificationStatus.NOT_PAYMENT
      }
   }

   let status = toBN(fullTxData.successStatus);

   let response = {
      stateConnectorRound: roundId,
      blockNumber: toBN(blockNumber),
      blockTimestamp: toBN(dbTransaction.timestamp),
      transactionHash: dbTransaction.transactionId,
      utxo: toBN(0),
      sourceAddress: fullTxData.sourceAddress[0],
      receivingAddress: fullTxData.receivingAddress[0],
      paymentReference: fullTxData.reference.length === 1 ? fullTxData.reference[0]: "", 
      spentAmount: fullTxData.spentAmount[0].amount,
      receivedAmount: fullTxData.receivedAmount[0].amount,
      oneToOne: true,
      status: status
   } as DHPayment;

   //-$$$<end> of the custom section. Do not change this comment.



   let hash = hashPayment(request, response);

   return {
      hash,
      request,
      response,
      status: VerificationStatus.OK
   } as Verification<ARPayment, DHPayment>;
}   
