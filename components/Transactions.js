import { useQuery, gql } from "@apollo/client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell, Spacer,
} from "@nextui-org/react";

export function getExplorerBaseUrlFromName(name) {
  switch (name) {
    case "ARBITRUM":
      return `https://arbiscan.io/`;
    case "OPTIMISM":
      return `https://optimistic.etherscan.io/`;
    case "OPTIMISM_GOERLI":
      return `https://goerli-optimism.etherscan.io/`;
    case "ARBITRUM_SEPOLIA":
      return `https://sepolia.arbiscan.io/`;
  }
}

const GET_TXS = gql`
  query GetRecentTransactions($network: String) {
    recentTransactions(network: $network) {
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

const Transactions = ({ network }) => {
  const { loading, error, data } = useQuery(GET_TXS, {
    variables: { network },
    skip: !network,
  });
  if (loading) {
    return <p>Loading...</p>;
  }
  if (error) {
    return <p>Error : {error.message}</p>;
  }

  if (data) {
    let transformedData;

    const isMobile = window.innerWidth < 768;

    transformedData = data.recentTransactions.map((tx) => [
      tx.method,
      <a key={tx.hash}
        className="underline font-blue "
        href={`${getExplorerBaseUrlFromName(tx.network)}tx/${tx.hash}`}
      >
        tx
      </a>,
      tx.contractName,
      tx.textTitle,
      new Date(Number(tx.createdAt)).toLocaleString(),
    ]);

    // Show only 5 recent transactions on mobile
    if (isMobile) {
      transformedData = transformedData.slice(0, 5);
    }

    return (
      <>
        <h1 className="text-[#475662] text-lg">Recent Transactions</h1>
        <Spacer y={4} />
        <Table className="max-w-7xl" aria-label="Example static collection table">
          <TableHeader>
            <TableColumn>METHOD</TableColumn>
            <TableColumn>RECEIPT</TableColumn>
            <TableColumn>CONTRACT</TableColumn>
            <TableColumn>DESCRIPTION</TableColumn>
            <TableColumn>DATE</TableColumn>
          </TableHeader>
          <TableBody>
            {transformedData.map((tx, rowIndex) => (
              <TableRow key={rowIndex}>
                {tx.map((item, cellIndex) => (
                    <TableCell key={`row-${rowIndex}-cell-${cellIndex}`}>{item}</TableCell>
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
