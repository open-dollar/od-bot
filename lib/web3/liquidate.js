import { initGeb, setupBotProxy } from "./geb";

import { sendAlert } from "../discord/alert";
import { botSendTx } from "./wallets/bot";
import { prepareTx } from "./common";

export const liquidateVault = async (network, vaultId) => {
  await setupBotProxy(network);

  const geb = initGeb(network);
  const { safeHandler, collateralType } =
    await geb.contracts.safeManager.safeData(vaultId);
  console.log({ safeHandler, collateralType });
  const txData =
    await geb.contracts.liquidationEngine.populateTransaction.liquidateSAFE(
      collateralType,
      safeHandler
    );

  const tx = await prepareTx({
    data: txData,
    method: "liquidateSAFE",
    contractName: "liquidationEngine",
    textTitle: "Liquidates an undercollateralized Vault",
    network,
  });
  const txResponse = await botSendTx({ unsigned: txData, network });
  await tx.update({ hash: txResponse.hash });
  await txResponse.wait();
  const fields = [
    {
      name: `Vault: ${vaultId}`,
      value: `Liquidated [receipt](${getExplorerBaseUrlFromName(
        network
      )}tx/${setPriceAndValidityHash})`,
    },
  ];
  await sendAlert({
    embed: {
      color: 1900316,
      title: `💧  Liquidate | ${network}`,
      footer: { text: new Date().toString() },
      fields: fields.slice(0, 24), // 25 item limit
    },
    channelName: "action",
  });
};
