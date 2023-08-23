import { useQuery, gql } from "@apollo/client";
import { Line } from "react-chartjs-2";

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
    return `${date.getUTCFullYear()}-${
      date.getUTCMonth() + 1
    }-${date.getUTCDate()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`;
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

const Charts = () => {
  const { loading, error, data } = useQuery(GET_STATS);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;
  console.log(data.globalStats);

  const erc20SupplyValues = getValues(data.globalStats, "erc20Supply");
  const labels = getLabels(data.globalStats);
  console.log("erc20SupplyValues: ", erc20SupplyValues)
  console.log("labels: ", labels)

  if (data) {
    return (
      <>
        <h1>Line Charts</h1>
      </>
    );
  }
  return <></>;
};

export default Charts;
