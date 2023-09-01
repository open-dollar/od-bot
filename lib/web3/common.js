import { Network } from "alchemy-sdk";
import prisma from "../prisma";
import { formatEther, formatUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";
import numeral from "numeral";

export const RAD = BigNumber.from(
  "1000000000000000000000000000000000000000000000"
);
export const RAY = BigNumber.from("1000000000000000000000000000");
export const WAD = BigNumber.from("1000000000000000000");

const SUBMITTED = "SUBMITTED";
const COMPLETE = "COMPLETE";
const FAILED = "FAILED";

const MINIMUM_CONFIRMATIONS = 1;

export const AVAILABLE_NETWORKS = [
  "OPTIMISM",
  "OPTIMISM_GOERLI",
  "ARBITRUM",
  "ARBITRUM_GOERLI",
];

export function getAlchemyNetworkEnum(network) {
  switch (network) {
    case "MAINNET":
      return Network.ETH_MAINNET;
    case "GOERLI":
      return Network.ETH_GOERLI;
    case "SEPOLIA":
      return Network.ETH_SEPOLIA;
    case "OPTIMISM":
      return Network.OPT_MAINNET;
    case "OPTIMISM_GOERLI":
      return Network.OPT_GOERLI;
    case "ARBITRUM":
      return Network.ARB_MAINNET;
    case "ARBITRUM_GOERLI":
      return Network.ARB_GOERLI;
    case "POLYGON":
      return Network.MATIC_MAINNET;
    case "MUMBAI":
      return Network.MATIC_MUMBAI;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

export function getNativeCoinInfo(network) {
  const NATIVE_COIN_ABBREVIATIONS = {
    MAINNET: "ETH",
    POLYGON: "MATIC",
    MUMBAI: "MATIC",
    GNOSIS: "xDAI",
    GOERLI: "ETH",
    OPTIMISM: "ETH",
    OPTIMISM_GOERLI: "ETH",
    ARBITRUM: "ETH",
    ARBITRUM_NOVA: "ETH",
    SEPOLIA: "ETH",
    AVALANCHE: "AVAX",
    AVALANCHE_FUJI: "AVAX",
  };

  const NATIVE_COIN_NAMES = {
    MAINNET: "ETH",
    POLYGON: "MATIC",
    MUMBAI: "Mumbai MATIC",
    GNOSIS: "xDAI",
    GOERLI: "Goerli ETH",
    OPTIMISM: "Optimism ETH",
    OPTIMISM_GOERLI: "Optimism Goerli ETH",
    ARBITRUM: "Arbitrum ETH",
    "ARBITRUM-NOVA": "Arbitrum Nova ETH",
    SEPOLIA: "Sepolia ETH",
    AVALANCHE: "AVAX",
    "AVALANCHE-FUJI": "Fuji AVAX",
  };

  const abbreviation = NATIVE_COIN_ABBREVIATIONS[network] || "UNKNOWN";
  const name = NATIVE_COIN_NAMES[network] || "Unknown Network";

  return {
    symbol: abbreviation,
    name,
  };
}

export function getExplorerBaseUrlFromName(name) {
  if (AVAILABLE_NETWORKS.includes(name)) {
    switch (name) {
      case "MAINNET":
        return "https://etherscan.io/";
      case "POLYGON":
        return "https://polygonscan.com/";
      case "GOERLI":
        return `https://goerli.etherscan.io/`;
      case "SEPOLIA":
        return `https://sepolia.etherscan.io/`;
      case "GNOSIS":
        return `https://blockscout.com/xdai/mainnet/`;
      case "MATIC":
        return `https://polygonscan.com/`;
      case "MUMBAI":
        return `https://mumbai.polygonscan.com/`;
      case "AVALANCHE":
        return `https://avascan.info/`; // not working but on https://avascan.info/blockchain/dfk/
      case "AVALANCHE_FUJI":
        return `https://testnet.snowtrace.io/`;
      case "ARBITRUM":
        return `https://arbiscan.io/`;
      case "OPTIMISM":
        return `https://optimistic.etherscan.io/`;
      case "OPTIMISM_GOERLI":
        return `https://goerli-optimism.etherscan.io/`;
      case "ARBITRUM_GOERLI":
        return `https://goerli.arbiscan.io/`;
      case "MANTLE_WADSLEY":
        return `https://explorer.testnet.mantle.xyz/`;
    }
  } else {
    return `https://${name}.etherscan.io/`;
  }
}

export function getBlockExplorerUrl(name, hash) {
  const baseUrl = getExplorerBaseUrlFromName(name);
  const url = new URL("tx/" + hash, baseUrl);
  return url.toString();
}

const getLogByTopic = ({ logs, topic }) => {
  let logByTopic = null;
  logs.map((log) => {
    if (log.topics.indexOf(topic) >= 0) logByTopic = log;
  });
  return logByTopic;
};

export const readMany = async (methods, conract) => {
  let data;
  await Promise.all(
    methods.map(async (method) => {
      data[method] = await contract[method];
    })
  );
  return data;
};

export const prepareTx = async (tx) => {
  try {
    const dbTx = await prisma.tx.create({
      data: {
        data: JSON.stringify(tx.data),
        network: tx.network,
        method: tx.method,
        contract: tx.data.to,
        contractName: tx.contractName,
        args: tx.args,
        textTitle: tx.textTitle,
        textDescription: tx.textDescription,
      },
    });
    const { id } = dbTx;
    return { id, update: (data) => updateTx({ id }, data), ...tx };
  } catch (e) {
    console.log(e);
    return tx;
  }
};

export const formatNumber = (value, digits = 6, round = false) => {
  if (!value) {
    return "0";
  }

  const n = Number(value);

  if (Number.isInteger(n) || value.length < 5) {
    return n;
  }

  const nOfWholeDigits = value.split(".")[0].length;
  const nOfDigits =
    nOfWholeDigits > digits - 1
      ? "00"
      : Array.from(Array(digits - nOfWholeDigits), (_) => 0).join("");
  let val;
  if (round) {
    val = numeral(n).format(`0.${nOfDigits}`);
  } else {
    val = numeral(n).format(`0.${nOfDigits}`, Math.floor);
  }

  return isNaN(Number(val)) ? value : val;
};

export const formatDataNumber = (
  input,
  decimals = 18,
  formatDecimal = 2,
  currency,
  compact
) => {
  let res = Number.parseFloat(input);

  if (decimals !== 0) res = Number.parseFloat(formatUnits(input, decimals));

  if (res < 0.01)
    return `${currency ? "$" : ""}${formatNumber(
      res.toString(),
      formatDecimal
    )}`;

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: formatDecimal,
    notation: compact ? "compact" : "standard",
    style: currency ? "currency" : "decimal",
    currency: "USD",
  }).format(res);
};

export const transformToAnnualRate = (rate, decimals) => {
  const exponent = 3600 * 24 * 365;
  const base = formatUnits(rate, decimals);
  const result = Number(base) ** exponent - 1;

  return toPercentage(result, 2);
};

export const transformToWadPercentage = (rate, denominator) => {
  if (denominator === "0") return "NaN";

  const result = BigNumber.from(rate)
    .mul(10000)
    .div(BigNumber.from(denominator))
    .toString();

  return toPercentage(Number(result) / 10000, 2);
};

export const transformToEightHourlyRate = (rate, decimals) => {
  const exponent = 3600 * 8;
  const base = formatUnits(rate, decimals);
  const result = Number(base) ** exponent - 1;

  return toPercentage(result, 2);
};
export const multiplyWad = (wad1, wad2) => {
  const result = BigNumber.from(wad1).mul(BigNumber.from(wad2)).div(WAD);

  return result.toString();
};

export const toPercentage = (value, decimals) => {
  return `${formatDataNumber(
    (value * 100).toString(),
    0,
    decimals,
    false,
    false
  )}%`;
};

export const multiplyRates = (rate1, rate2) => {
  const result = BigNumber.from(rate1).mul(BigNumber.from(rate2)).div(RAY);

  return result.toString();
};

export const sumWad = (wad1, wad2) => {
  const result = BigNumber.from(wad1).add(BigNumber.from(wad2));

  return result.toString();
};
