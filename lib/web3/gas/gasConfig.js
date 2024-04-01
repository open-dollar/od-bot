import { parseUnits } from "@ethersproject/units";
import { AVAILABLE_NETWORKS } from "../common";

// NOTE: Gas settings for transactions "maxFeePerGas" and "maxPriorityFeePerGas" will be used in this order:
// 1. API call to explorer / gas station
// 2. Values listed in this file
// 3. Values returned by ethers.js (eg. for polygon the ethers call fails, hence why we must specify values)

const GAS_SETTINGS_BY_NETWORK = {
  // MAINNET:{},
  POLYGON: {
    INITIAL_DROP_AMOUNT: "0.8",
    DEFAULT_DROP_AMOUNT: "0.8",
    MINIMUM_GAS_DROP_THRESHOLD: "0.3",
    MINIMUM_BOT_BALANCE: "3",
    maxFeePerGas: parseUnits("190", "gwei"),
    maxPriorityFeePerGas: parseUnits("40", "gwei"),
  },
  // MUMBAI:{GAS_TRACKER_URL:""},
  // GNOSIS:{},
  // GOERLI:{},
  OPTIMISM: {
    INITIAL_DROP_AMOUNT: "0.0002",
    DEFAULT_DROP_AMOUNT: "0.0002",
    MINIMUM_GAS_DROP_THRESHOLD: "0.0002",
    MINIMUM_BOT_BALANCE: "0.002",
    maxFeePerGas: parseUnits(".1", "gwei"),
    maxPriorityFeePerGas: parseUnits(".1", "gwei"),
  },
  OPTIMISM_GOERLI: {
    INITIAL_DROP_AMOUNT: "0.00035",
    DEFAULT_DROP_AMOUNT: "0.00065",
    MINIMUM_GAS_DROP_THRESHOLD: "0.0003",
    MINIMUM_BOT_BALANCE: "0.003",
  },
  ARBITRUM: {
    INITIAL_DROP_AMOUNT: "0.00035",
    DEFAULT_DROP_AMOUNT: "0.00065",
    MINIMUM_GAS_DROP_THRESHOLD: "0.0003",
    MINIMUM_BOT_BALANCE: "0.003",
  },
  ARBITRUM_GOERLI: {
    INITIAL_DROP_AMOUNT: "0.004",
    DEFAULT_DROP_AMOUNT: "0.008",
    MINIMUM_GAS_DROP_THRESHOLD: "0.002",
    MINIMUM_BOT_BALANCE: "0.02",
  },
  ARBITRUM_SEPOLIA: {
    INITIAL_DROP_AMOUNT: "0.008",
    DEFAULT_DROP_AMOUNT: "0.016",
    MINIMUM_GAS_DROP_THRESHOLD: "0.004",
    MINIMUM_BOT_BALANCE: "0.04",
  },
  // SEPOLIA:{},
  // AVALANCHE:{},
  // AVALANCHE-FUJI:{},
  // MANTLE-WADSLEY:{},
};

export const gasConfigByNetwork = ({ network }) => {
  let config = GAS_SETTINGS_BY_NETWORK[network];
  if (!config) config = GAS_SETTINGS_BY_NETWORK.POLYGON;
  return config;
};

const showMissingGasConfigWarning = () => {
  AVAILABLE_NETWORKS.map((networkName) => {
    if (!Object.keys(GAS_SETTINGS_BY_NETWORK).includes(networkName))
      /* eslint-disable-next-line no-console */
      console.log(
        `WARNING: Gas not configured for ${networkName}. Using default config for POLYGON.`
      );
  });
};

showMissingGasConfigWarning();
