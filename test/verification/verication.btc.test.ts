import { ChainType, MCC } from "flare-mcc";
import * as indexerConfig from "../../configs/config-indexer.json";
import { IndexedQueryManagerOptions } from "../../lib/indexed-query-manager/indexed-query-manager-types";
import { getRandomTransaction, getRandomTransactionWithPaymentReference } from "../../lib/indexed-query-manager/indexed-query-manager-utils";
import { IndexedQueryManager } from "../../lib/indexed-query-manager/IndexedQueryManager";
import { createTestAttestationFromRequest } from "../../lib/indexed-query-manager/random-attestation-requests/random-ar";
import { getRandomRequestPayment } from "../../lib/indexed-query-manager/random-attestation-requests/random-ar-00001-payment";
import { getRandomRequestBalanceDecreasingTransaction } from "../../lib/indexed-query-manager/random-attestation-requests/random-ar-00002-balance-decreasing-transaction";
import { getRandomRequestConfirmedBlockHeightExists } from "../../lib/indexed-query-manager/random-attestation-requests/random-ar-00003-confirmed-block-height-exists";
import { getRandomRequestReferencedPaymentNonexistence } from "../../lib/indexed-query-manager/random-attestation-requests/random-ar-00004-referenced-payment-nonexistence";
import { IndexerConfiguration } from "../../lib/indexer/IndexerConfiguration";
import { DotEnvExt } from "../../lib/utils/DotEnvExt";
import { VerificationStatus } from "../../lib/verification/attestation-types/attestation-types";
import { getSourceName, SourceId } from "../../lib/verification/sources/sources";
import { verifyPaymentBTC } from "../../lib/verification/verifiers/BTC/v-00001-payment.btc";
import { verifyBalanceDecreasingTransactionBTC } from "../../lib/verification/verifiers/BTC/v-00002-balance-decreasing-transaction.btc";
import { verifyConfirmedBlockHeightExistsBTC } from "../../lib/verification/verifiers/BTC/v-00003-confirmed-block-height-exists.btc";
import { verifyReferencedPaymentNonexistenceBTC } from "../../lib/verification/verifiers/BTC/v-00004-referenced-payment-nonexistence.btc";

console.log("This test should run while BTC indexer is running")

const SOURCE_ID = SourceId.BTC;
const ROUND_ID = 1;
const MINUTES = 60;
const HISTORY_WINDOW = 5 * MINUTES;
const NUMBER_OF_CONFIRMATIONS = 1;

// Overriding .env variables for this particular test only
console.warn(`Overriding DOTENV=DEV, NODE_ENV=development`);
process.env.DOTENV = "DEV";
process.env.NODE_ENV = "development";
DotEnvExt();

describe("BTC verifiers", () => {
   let indexedQueryManager: IndexedQueryManager;
   let client: MCC.BTC;
   let indexerConfiguration: IndexerConfiguration;
   let chainName: string;
   let startTime = 0;


   before(async () => {
      indexerConfiguration = indexerConfig as IndexerConfiguration
      chainName = getSourceName(SOURCE_ID);
      let chainConfiguration = indexerConfig.chains.find(chain => chain.name === chainName);
      client = MCC.Client(SOURCE_ID, {
         ...chainConfiguration.mccCreate,
         rateLimitOptions: chainConfiguration.rateLimitOptions
      }) as MCC.BTC;
      //  startTime = Math.floor(Date.now()/1000) - HISTORY_WINDOW;

      const options: IndexedQueryManagerOptions = {
         chainType: SOURCE_ID as any as ChainType,
         // todo: return epochStartTime - query window length, add query window length into DAC
         windowStartTime: (epochId: number) => { return startTime; }
      } as IndexedQueryManagerOptions;
      indexedQueryManager = new IndexedQueryManager(options);
      await indexedQueryManager.dbService.waitForDBConnection();
   });

   it("Should verify legit Payment", async () => {
      let randomTransaction = await getRandomTransactionWithPaymentReference(indexedQueryManager);
      if(!randomTransaction) {
         return;
      }

      let request = await getRandomRequestPayment(
         indexedQueryManager,
         SOURCE_ID,
         ROUND_ID,
         NUMBER_OF_CONFIRMATIONS, 
         randomTransaction,
         "CORRECT"
      );

      // console.log(request);
      // console.log(randomTransaction.isNativePayment)
      let attestation = createTestAttestationFromRequest(request, ROUND_ID, NUMBER_OF_CONFIRMATIONS);

      let res = await verifyPaymentBTC(client, attestation, indexedQueryManager);
      // console.log(res); 
      assert(res.status === VerificationStatus.OK, `Wrong status: ${res.status}`);
      // console.log(res); 
      // console.log(res.response.spentAmount.toString(), res.response.receivedAmount.toString())

   });

   it("Should verify legit BalanceDecreasingTransaction", async () => {
      let randomTransaction = await getRandomTransaction(indexedQueryManager);
      if(!randomTransaction) {
         return;
      }

      let request = await getRandomRequestBalanceDecreasingTransaction(
         indexedQueryManager,
         SOURCE_ID,
         ROUND_ID,
         NUMBER_OF_CONFIRMATIONS, 
         randomTransaction,
         "CORRECT"
      );

      // console.log(request);
      // console.log(randomTransaction.isNativePayment)
      let attestation = createTestAttestationFromRequest(request, ROUND_ID, NUMBER_OF_CONFIRMATIONS);

      let res = await verifyBalanceDecreasingTransactionBTC(client, attestation, indexedQueryManager);
      // console.log(res); 

      assert(res.status === VerificationStatus.OK, `Wrong status: ${res.status}`);
      // console.log(res.response.spentAmount.toString(), res.response.receivedAmount.toString())

   });

   it("Should verify legit ConfirmedBlockHeightExists", async () => {
      let lastBlockNumber = await indexedQueryManager.getLastConfirmedBlockNumber();

      let block = await indexedQueryManager.queryBlock({
         blockNumber: lastBlockNumber - 2,
         roundId: ROUND_ID,
         confirmed: true
      })

      let request = await getRandomRequestConfirmedBlockHeightExists(
         indexedQueryManager,
         SOURCE_ID,
         ROUND_ID,
         NUMBER_OF_CONFIRMATIONS, 
         block,
         "CORRECT"
      );

      console.log(request);
      // console.log(randomTransaction.isNativePayment)
      let attestation = createTestAttestationFromRequest(request, ROUND_ID, NUMBER_OF_CONFIRMATIONS);

      let res = await verifyConfirmedBlockHeightExistsBTC(client, attestation, indexedQueryManager);
      // console.log(res); 
      assert(res.status === VerificationStatus.OK, `Wrong status: ${res.status}`);
      
      // console.log(res.response.spentAmount.toString(), res.response.receivedAmount.toString())

   });

   it("Should verify legit ReferencedPaymentNonexistence", async () => {
      let randomTransaction = await getRandomTransactionWithPaymentReference(indexedQueryManager);
      if(!randomTransaction) {
         return;
      }

      let request = await getRandomRequestReferencedPaymentNonexistence(
         indexedQueryManager,
         SOURCE_ID,
         ROUND_ID,
         NUMBER_OF_CONFIRMATIONS, 
         randomTransaction,
         "CORRECT"
      );

      // console.log(request);
      // console.log(randomTransaction.isNativePayment)
      let attestation = createTestAttestationFromRequest(request, ROUND_ID, NUMBER_OF_CONFIRMATIONS);

      let res = await verifyReferencedPaymentNonexistenceBTC(client, attestation, indexedQueryManager);
      assert(res.status === VerificationStatus.OK, `Wrong status: ${res.status}`);
      // console.log(res); 
      // console.log(res.response.spentAmount.toString(), res.response.receivedAmount.toString())

   });

   // it("Example of tecUNFUNDED_PAYMENT transaction", async () => {
   //    let txid = "D0AB7DB06EC0D8D0E71A162C8C81ABB6A5C67398BB115F2544D0BA80DA69A96E";
   //    console.log(txid.length)
   //    let endBlock = await indexedQueryManager.getLastConfirmedBlockNumber();
   //    let txs = await indexedQueryManager.queryTransactions({
   //       transactionId: txid,
   //       roundId: ROUND_ID,
   //       endBlock
   //    });
   //    let tx = txs[0];
   //    console.log(tx)
   //    console.log(JSON.stringify(JSON.parse(tx.response), null, 3));    
   // });
   

});


// Long payment reference: 0x67390C4BE3210DE207747058499FAFA3E9219E7B7F14E7AE07E033A01E2FC8F