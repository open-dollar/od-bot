import { Geb, utils } from "@usekeyp/od-sdk";

import { botSendTx } from "./wallets/bot";
import { Web3Providers } from "./provider";
import { sendAlert } from "../discord/alert";
import { getExplorerBaseUrlFromName, prepareTx, readManyVars } from "./common";
import { getStats } from "./analytics";

import { initGeb } from "./geb";

export const getOracles = async (network) => {
  // const stats = await getStats(network);
  // const { tokenAnalyticsData } = stats;
  // let oraclesToUpdate = [];
  // Object.entries(tokenAnalyticsData).map(async ([key, value]) => {
  //   const { delayedOracle } = value;
  //   if (delayedOracle) oraclesToUpdate.push(delayedOracle);
  // });
  const geb = initGeb(network);
  const collateralList = await geb.contracts.oracleRelayer.collateralList();
  console.log(collateralList);
  await Promise.all(
    collateralList.map(async (collateral) => {
      // This may be helpful
      // const _cParams = await geb.contracts.oracleRelayer._cParams(collateral);
      // console.log(_cParams);

      const txData =
        await geb.contracts.oracleRelayer.populateTransaction.updateCollateralPrice(
          collateral
        );
      const tx = await prepareTx({
        data: txData,
        method: "updateCollateralPrice",
        network,
      });

      const txResponse = await botSendTx({ unsigned: txData, network });
      await tx.update({ hash: txResponse.hash });

      await sendAlert({
        embed: {
          color: 1900316,
          title: `📈 DelayedOracle 🔃 UPDATED | ${network}`,
          description: `${getExplorerBaseUrlFromName(network)}tx/${
            txResponse.hash
          }`,
          footer: { text: new Date().toString() },
        },
        channelName: "action",
      });
    })
  );
  return;

  // Call oracleRelayer.redemptionPrice() to update it
};
