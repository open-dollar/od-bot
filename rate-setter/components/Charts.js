import { useQuery, gql } from '@apollo/client';
import { client } from "../lib/apollo-client";

// import graphql2chartjs from "graphql2chartjs";
// import { Bar, Line } from "react-chartjs-2";
// import { Bar } from "chart.js"


const GET_STATS = gql`
  query {
    Stats: stats {
      data_x: createAt
      data_y: price
    }
  }`

const Charts = () => {
  const { loading, error, data } = useQuery(GET_STATS);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;
  if (data) {
    return <>
      {data.toString()}
    </>
    // const g2c = new graphql2chartjs()
    // g2c.add(data, 'line');
    // return (<Bar data={g2c.data} />);
  }
  return <></>;
}

export default Charts
