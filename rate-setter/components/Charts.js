import { useQuery, gql } from "@apollo/client";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";

const GET_STATS = gql`
  query {
    globalStats {
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

    return `${date.getFullYear()}/${
      date.getMonth() + 1
    }/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
  });
};

const getValues = (data, key) => {
  if (!Array.isArray(data)) {
    console.error("Provided data is not an array");
    return [];
  }
  return data.map((stats) => {
    let valueStr = stats[key];

    if (valueStr?.includes("$")) {
      return Number(valueStr.replace("$", ""));
    } else if (valueStr?.includes("%")) {
      return Number(valueStr.replace("%", ""));
    } else {
      return Number(valueStr);
    }
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
        backgroundColor: [
          "rgba(75,192,192,1)",
          // "#ecf0f1",
          // "#f0331a",
          // "#f3ba2f",
          // "#2a71d0",
        ],
        borderColor: "black",
        borderWidth: 2,
      },
    ],
  };
};

const Charts = () => {
  const { loading, error, data } = useQuery(GET_STATS);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;
  console.log(data.globalStats);

  const erc20SupplyData = getChartData(
    data.globalStats,
    "erc20Supply",
    "erc20Supply"
  );
  const marketPriceData = getChartData(
    data.globalStats,
    "Market Price",
    "marketPrice"
  );

  const globalDebtData = getChartData(
    data.globalStats,
    "Global Debt",
    "globalDebt"
  );

  const globalDebtUtilizationData = getChartData(
    data.globalStats,
    "Global Debt Utilization",
    "globalDebtUtilization"
  );

  const surplusInTreasuryData = getChartData(
    data.globalStats,
    "Surplus In Treasury",
    "surplusInTreasury"
  );

  const redemptionRateAndPriceData = {
    labels: getLabels(data.globalStats),
    datasets: [
      {
        label: "Redemption Rate",
        data: getValues(data.globalStats, "redemptionRate"),
        backgroundColor: [
          "rgba(75,192,192,1)",
          // "#ecf0f1",
          // "#f0331a",
          // "#f3ba2f",
          // "#2a71d0",
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
          // "rgba(75,192,192,1)",
          // "#ecf0f1",
          // "#f0331a",
          // "#f3ba2f",
          "#2a71d0",
        ],
        borderColor: "black",
        borderWidth: 2,
      },
    ],
  };

  if (data) {
    return (
      <div className="w-full space-x-4 p-10">
        <div className="flex w-full">
          <div className="bg-slate-200 w-full rotate-x-[30deg] -rotate-y-[20deg] ">
            <Line data={erc20SupplyData} label="ERC20 Supply" />
          </div>
          <div className="bg-slate-200 w-full rotate-x-[30deg] -translate-y-12 ">
            <Line data={marketPriceData} />
          </div>
          <div className="bg-slate-200 w-full rotate-x-[30deg] rotate-y-[20deg]">
            <Line data={redemptionRateAndPriceData} />
          </div>
        </div>

        <h2>Global Debt</h2>
        <div className="bg-slate-200">
          <Line data={globalDebtData} />
        </div>
        <h2>Global Debt Utilization</h2>
        <div className="bg-slate-200">
          <Line data={globalDebtUtilizationData} />
        </div>
        <h2>Surplus In Treasury</h2>
        <div className="bg-slate-200">
          <Line data={surplusInTreasuryData} />
        </div>
      </div>
    );
  }
  return <></>;
};

export default Charts;
