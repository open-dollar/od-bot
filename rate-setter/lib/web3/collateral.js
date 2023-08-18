// TODO: cleanup if unused
// bytes32 _cType, OracleRelayerCollateralParams memory _collateralParams
export const initializeCollateralType = async ({ network, collateral }) => {

}

// TODO: cleanup if unused
export const getCollateralStats = async (network) => {
    const stats = await OracleRelayerCParams(network)
    // stats.map((collateral) => {
    //     collateral.
    // })
    // TODO: get more info about each collateral
    // calculate safePrice
    // calculate liquidationPrice
    console.log(stats)
    return stats
}

// TODO: cleanup if unused
// Returns safetyCRatio, liquidationCRatio, and IDelayedOracle for each collateral
export const OracleRelayerCParams = async (network) => {
    const geb = initGeb(network)
    const { oracleRelayer } = geb.contracts
    const collateralList = await geb.contracts.collateralList()
    let stats
    await Promise.all(collateralList.map(async (cType) => {
        stats[cType] = await oracleRelayer.cParams[cType]
    }))
    return stats
}