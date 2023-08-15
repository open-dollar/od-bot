import { useQuery, gql } from '@apollo/client';
import client from "../lib/apollo-client";

import graphql2chartjs from "graphql2chartjs";
import { Bar, Line } from "react-chartjs-2";

const Charts = ({ stats }) => {
  const { loading, error, data } = useQuery(GET_STATS);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;
  if (data) {
    const g2c = new graphql2chartjs()
    g2c.add(data, 'line');
    return (<Bar data={g2c.data} />);
  }
  return null;
}

export default Charts

const GET_STATS = gql`
  query {
    Stats: stats {
      data_x: createAt
      data_y: price
    }
  }`

export async function getServerSideProps() {
  const { data } = await client.query({
    query: gql`
        query Stats {
          stats {
            data_x: createAt
            data_y: price
          }
        }
      `,
  });

  return {
    props: {
      countries: data.countries.slice(0, 4),
    },
  };
}