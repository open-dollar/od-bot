import { useQuery, gql } from "@apollo/client";
import { Line } from "react-chartjs-2";
// This linter marks this import as unused but it is needed
import Chart from "chart.js/auto";
import {Spacer} from "@nextui-org/react";

const GET_STATS = gql`
  query GetGlobalStats($network: String) {
    globalStats(network: $network) {
      createdAt
      updatedAt
      network
      blockTimestamp
      erc20Supply
      globalDebt
      globalDebtCeiling
      globalDebtUtilization
      surplusInTreasury
      marketPrice
      redemptionRate
      redemptionPrice
      annualRate
      eightRate
      pRate
      iRate
      lastUpdateTime
    }
  }
`;

const getLabels = (data) => {
  if (!Array.isArray(data)) {
    console.error("Provided data is not an array");
    return [];
  }
  return data?.map((stats) => {
    const date = new Date(Number(stats.blockTimestamp) * 1000);

    return `${
      date.getMonth() + 1
    }/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
  });
};

const options = {
    scales: {
        x: {
            ticks: {
                font: {
                    size: 14,
                },
            },
        },
        y: {
            ticks: {
                font: {
                    size: 14,
                },
            },
        },
    },
}

const getValues = (data, key) => {
  if (!Array.isArray(data)) {
    console.error("Provided data is not an array");
    return [];
  }
  return data.map((stats) => {
    let valueStr = stats[key];
    return parseInt(valueStr?.replace(/[^0-9]/g, ""));
  });
};

const getChartData = (data, labelName, key) => {
  const labels = getLabels(data);
  const values = getValues(data, key);
  return {
    labels: labels,
    datasets: [
      {
        label: labelName,
        data: values,
        backgroundColor: "#1a74ec",
        borderColor: "black",
        borderWidth: 2,
      },
    ],
  };
};

const Charts = ({ network }) => {
  const { loading, error, data } = useQuery(GET_STATS, {
    variables: { network },
    skip: !network,
  });
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;
  if (!data?.globalStats) return <p>No data</p>;

  const erc20SupplyData = getChartData(
    data.globalStats,
    "ERC20 Supply",
    "erc20Supply"
  );

    erc20SupplyData.datasets.forEach(dataset => {
        dataset.pointRadius = 5;
    });

  const marketPriceData = getChartData(
    data.globalStats,
    "Market Price ($)",
    "marketPrice"
  );

    marketPriceData.datasets.forEach(dataset => {
        dataset.pointRadius = 5;
    });

  const globalDebtData = getChartData(
    data.globalStats,
    "Global Debt ($)",
    "globalDebt"
  );

    globalDebtData.datasets.forEach(dataset => {
        dataset.pointRadius = 5;
    });

  const globalDebtUtilizationData = getChartData(
    data.globalStats,
    "Global Debt Utilization (%)",
    "globalDebtUtilization"
  );

    globalDebtUtilizationData.datasets.forEach(dataset => {
        dataset.pointRadius = 5;
    });

  const surplusInTreasuryData = getChartData(
    data.globalStats,
    "Surplus In Treasury ($)",
    "surplusInTreasury"
  );

    surplusInTreasuryData.datasets.forEach(dataset => {
        dataset.pointRadius = 5;
    });

  const redemptionRateAndPriceData = {
    labels: getLabels(data.globalStats),
    datasets: [
      {
        label: "Redemption Rate",
        data: getValues(data.globalStats, "redemptionRate"),
        backgroundColor: [
          "#1a74ec",
        ],
        borderColor: "black",
        borderWidth: 2,
      },
      {
        label: "Redemption Price",
        data: getValues(data.globalStats, "redemptionPrice").map(
          (item) => item
        ),
        backgroundColor: [
          "#f2f8fd",
        ],
        borderColor: "black",
        borderWidth: 2,
      },
    ],
  };

    redemptionRateAndPriceData.datasets.forEach(dataset => {
        dataset.pointRadius = 5;
    });

  if (data) {
    return (
      <div className="flex flex-col max-w-7xl text-start">
        <h2 className="text-[#475662] text-lg">OD Total Supply</h2>
        <Spacer y={4} />
        <div className="bg-[#f2f8fd]">
          <Line data={erc20SupplyData} options={options} label="ERC20 Supply" />
        </div>
        <Spacer y={4} />
        <h2 className="text-[#475662] text-lg">OD Market Price</h2>
        <Spacer y={4} />
        <div className="bg-[#f2f8fd]">
          <Line data={marketPriceData} options={options}  />
        </div>
        <Spacer y={4} />
        <h2 className="text-[#475662] text-lg">OD Redemption Rate</h2>
        <Spacer y={4} />
        <div className="bg-[#f2f8fd]">
          <Line data={redemptionRateAndPriceData} options={options}  />
        </div>
        <Spacer y={4} />
        <h2 className="text-[#475662] text-lg">Global Debt</h2>
        <Spacer y={4} />
        <div className="bg-[#f2f8fd]">
          <Line data={globalDebtData} options={options}  />
        </div>
        <Spacer y={4} />
        <h2 className="text-[#475662] text-lg">Global Debt Utilization</h2>
        <Spacer y={4} />
        <div className="bg-[#f2f8fd]">
          <Line data={globalDebtUtilizationData} options={options}  />
        </div>
        <Spacer y={4} />
        <h2 className="text-[#475662] text-lg">Surplus In Treasury</h2>
        <Spacer y={4} />
        <div className="bg-[#f2f8fd]">
          <Line data={surplusInTreasuryData} options={options} />
        </div>
      </div>
    );
  }
  return <></>;
};

export default Charts;
