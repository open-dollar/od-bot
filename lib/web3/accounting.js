import { sendAlert } from "../discord/alert";
import { getExplorerBaseUrlFromName } from "./common";
import { initGeb } from "./geb";
import { botSendTx } from "./wallets/bot";

import { prepareTx } from "./common";

const accountingEngineTx = async (network, methodName, args = null) => {
  let txResponse;

  const geb = await initGeb(network);
  try {
    const txData = await geb.contracts.accountingEngine.populateTransaction[
      methodName
    ](args);

    const tx = await prepareTx({
      data: txData,
      method: methodName,
      contractName: "accountingEngine",
      textTitle: "Accounting job to keep the protocol healthy",
      network,
    });
    txResponse = await botSendTx({
      unsigned: txData,
      network,
    });
    await txResponse.wait();
    await tx.update({ hash: txResponse.hash });
    return txResponse;
  } catch (e) {
    console.log(e);
    return txResponse;
  }
};

export const accounting = async (network) => {
  let popDebtFromQueueResponse;
  // const popDebtFromQueueResponse = await accountingEngineTx(
  //   network,
  //   "popDebtFromQueue"
  // );
  const auctionDebtResponse = await accountingEngineTx(network, "auctionDebt");
  const auctionSurplusResponse = await accountingEngineTx(
    network,
    "auctionSurplus"
  );
  const transferExtraSurplusResponse = await accountingEngineTx(
    network,
    "transferExtraSurplus"
  );

  const fields = [
    {
      name: "popDebtFromQueue",
      value: popDebtFromQueueResponse?.hash
        ? `[receipt](${getExplorerBaseUrlFromName(network)}tx/${
            popDebtFromQueueResponse?.hash
          })`
        : "Failed",
    },
    {
      name: "auctionDebt",
      value: auctionDebtResponse?.hash
        ? `[receipt](${getExplorerBaseUrlFromName(network)}tx/${
            auctionDebtResponse.hash
          })`
        : "Failed",
    },
    {
      name: "auctionSurplus",
      value: auctionSurplusResponse?.hash
        ? `[receipt](${getExplorerBaseUrlFromName(network)}tx/${
            auctionSurplusResponse.hash
          })`
        : "Failed",
    },
    {
      name: "transferExtraSurplus",
      value: transferExtraSurplusResponse?.hash
        ? `[receipt](${getExplorerBaseUrlFromName(network)}tx/${
            transferExtraSurplusResponse.hash
          })`
        : "Failed",
    },
  ];

  await sendAlert({
    embed: {
      color: 1900316,
      title: `⚙️ Accounting 🔃 UPDATED | ${network} `,
      fields,
      footer: { text: new Date().toString() },
    },
    channelName: "action",
  });
};
