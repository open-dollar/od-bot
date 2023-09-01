import { useQuery, gql } from "@apollo/client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";

export function getExplorerBaseUrlFromName(name) {
  switch (name) {
    case "ARBITRUM":
      return `https://arbiscan.io/`;
    case "OPTIMISM":
      return `https://optimistic.etherscan.io/`;
    case "OPTIMISM_GOERLI":
      return `https://goerli-optimism.etherscan.io/`;
    case "ARBITRUM_GOERLI":
      return `https://goerli.arbiscan.io/`;
  }
}

const GET_TXS = gql`
  query {
    recentTransactions {
      createdAt
      updatedAt
      network
      method
      hash
      contractName
      textTitle
    }
  }
`;

const Transactions = () => {
  const { loading, error, data } = useQuery(GET_TXS);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;
  console.log(data.recentTransactions);

  if (data) {
    const transformedData = data.recentTransactions.map((tx) => [
      tx.method,
      <a
        className="underline font-blue "
        href={`${getExplorerBaseUrlFromName(tx.network)}tx/${tx.hash}`}
      >
        tx
      </a>,
      tx.contractName,
      tx.textTitle,
      new Date(Number(tx.createdAt)).toLocaleString(),
    ]);
    return (
      <>
        <h1>Recent Transactions</h1>
        <Table aria-label="Example static collection table">
          <TableHeader>
            <TableColumn>METHOD</TableColumn>
            <TableColumn>RECEIPT</TableColumn>
            <TableColumn>CONTRACT</TableColumn>
            <TableColumn>DESCRIPTION</TableColumn>
            <TableColumn>DATE</TableColumn>
          </TableHeader>
          <TableBody>
            {transformedData.map((tx, index) => (
              <TableRow key={index}>
                {tx.map((item) => (
                  <TableCell key={index}>{item}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    );
  }
  return <></>;
};

export default Transactions;
