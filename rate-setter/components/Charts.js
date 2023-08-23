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

// convert Date
// convert dollar string to number
// convert % string to number
// create variable for erc20SupplyData, globalDebt,
// function that return labels
// function that return values

const getLabels = (data) => {
  return data.map((stats) => {
    const date = new Date(Number(stats.blockTimestamp) * 1000);

    return `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  });
};

const getValues = (data, key) => {
  return data.map((stats) => {
    let valueStr = stats[key];

    if (valueStr.includes("$")) {
      return Number(valueStr.replace("$", ""));
    } else if (valueStr.includes("%")) {
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
          "#ecf0f1",
          "#f0331a",
          "#f3ba2f",
          "#2a71d0",
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
    "Market Price Data",
    "marketPrice"
  );

  if (data) {
    return (
      <>
        <h1>Line Charts</h1>
        <div style={{ width: "100%" }}>
          <Line data={erc20SupplyData} />
          <Line data={marketPriceData} />
        </div>
      </>
    );
  }
  return <></>;
};

export default Charts;
