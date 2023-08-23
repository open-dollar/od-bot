import { useQuery, gql } from '@apollo/client';

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
  }`

const Charts = () => {
  const { loading, error, data } = useQuery(GET_STATS);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;
  console.log(data)
  if (data) {

    return <>
      {data.toString()}
    </>
  }
  return <></>;
}

export default Charts
