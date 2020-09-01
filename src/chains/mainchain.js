const fetch = require("node-fetch")
const { getDelegatorAddress } = require("../crypto/utils")

const { MAINCHAIN_REST_URL } = process.env

const checkStatus = (res) => {
  if (res.ok && res.status === 200) {
    return res
  }
  throw Error(res.statusText)
}

const getValidators = async () => {
  const url = new URL(`${MAINCHAIN_REST_URL}/staking/validators?limit=100`)
  const valset = []

  try {
    const response = checkStatus(await fetch(url))
    const lcdValset = await response.json()

    for (let i = 0; i < lcdValset.result.length; i += 1) {
      const valData = {}
      const val = lcdValset.result[i]
      valData.moniker = val.description.moniker
      valData.operatorAddress = val.operator_address
      valData.consensusPubkey = val.consensus_pubkey
      valData.selfDelegateAddress = getDelegatorAddress(val.operator_address)
      valData.jailed = val.jailed
      valData.status = val.status
      valData.shares = val.delegator_shares
      valData.tokens = val.tokens

      valset.push(valData)
    }
  } catch (err) {
    console.log(err.toString())
    throw err
  }

  return valset
}

const getTx = async (txHash) => {
  const url = new URL(`${MAINCHAIN_REST_URL}/txs/${txHash}`)
  try {
    const response = checkStatus(await fetch(url))
    const txData = await response.json()
    return txData
  } catch (err) {
    console.log(err.toString())
    throw err
  }
}

module.exports = { getTx, getValidators }
