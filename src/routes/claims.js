require("dotenv").config()
const express = require("express")
const jwt = require("jsonwebtoken")
const { getUnclaimedEmissionsForValidatorId } = require("../db/emissions/queries")
const {
  getClaimTicketByTicket,
  getAllClaimTickets,
  getClaimTicketByMainchainTx,
  getClaimTicketsByAddressAndMcTx,
  getAllClaimTicketsByAddress,
  getClaimTicketsByStatus,
  getClaimTicketByMainchainTxAndEthAddr,
  getLastNonce,
  getClaimTicketsByAddressAndStatus,
} = require("../db/claimTickets/queries")
const { insertClaimTicket, updateClaimTicketWithEthTx } = require("../db/claimTickets/update")
const { getBySelfDelegatorAddress } = require("../db/validators/queries")
const { updateEmissionWithClaimTicketId } = require("../db/emissions/update")
const { getTx } = require("../chains/mainchain")
const { validateClaimTx } = require("../tx/claim")
const { generateClaimTicket } = require("../chains/eth")
const {
  DEFAULT_JSON_RESPONSE,
  STATUS_CODES,
  errorCodeLookup,
  isValidClaimStatus,
  claimStatusLookup,
} = require("../common/utils/constants")
const { jwtiseTicket, jwtiseMemo } = require("../crypto/utils")

const { JWT_SHARED_SECRET } = process.env

const router = express.Router()

const processClaimResult = (res) => {
  const results = []

  for (let i = 0; i < res.length; i += 1) {
    const valDataVals = res[i].dataValues
    const ticketJson = JSON.parse(valDataVals.ticket)
    const v = {
      moniker: valDataVals.validator.moniker,
      operator_address: valDataVals.validator.operatorAddress,
      self_delegate_address: valDataVals.validator.selfDelegateAddress,
      claim_ticket: jwtiseTicket(
        ticketJson.signature,
        valDataVals.amount,
        valDataVals.nonce,
        valDataVals.ethAddress,
      ),
      claim_status: valDataVals.claimStatus,
      claim_status_text: claimStatusLookup(valDataVals.claimStatus),
      mainchain_tx: valDataVals.mainchainTx,
      ethereum_tx: valDataVals.ethereumTx,
      created: valDataVals.createdAt,
      amount: valDataVals.amount,
      nonce: valDataVals.nonce,
      eth_address: valDataVals.ethAddress,
    }
    results.push(v)
  }

  return results
}

router.get("/", async (req, res) => {
  const result = { ...DEFAULT_JSON_RESPONSE }

  try {
    result.success = true
    result.status = STATUS_CODES.OK
    delete result.error
    result.result = processClaimResult(await getAllClaimTickets())
  } catch (error) {
    result.status = STATUS_CODES.ERR.DB_QUERY_ERROR
    result.error = `${errorCodeLookup(STATUS_CODES.ERR.DB_QUERY_ERROR)}: ${error.message}`
  }
  res.json(result)
})

router.get("/address/:address", async (req, res) => {
  const { address } = req.params
  const result = { ...DEFAULT_JSON_RESPONSE }

  if (!address) {
    result.error = "missing address"
  } else {
    try {
      result.success = true
      result.status = STATUS_CODES.OK
      delete result.error
      result.result = processClaimResult(await getAllClaimTicketsByAddress(address))
    } catch (error) {
      result.status = STATUS_CODES.ERR.DB_QUERY_ERROR
      result.error = `${errorCodeLookup(STATUS_CODES.ERR.DB_QUERY_ERROR)}: ${error.message}`
    }
  }

  res.json(result)
})

router.get("/status/:claim_status", async (req, res) => {
  const { claim_status } = req.params

  const result = { ...DEFAULT_JSON_RESPONSE }

  if (!isValidClaimStatus(claim_status)) {
    result.error = "missing valid claim status"
  } else {
    try {
      result.success = true
      result.status = STATUS_CODES.OK
      delete result.error
      result.result = await processClaimResult(getClaimTicketsByStatus(claim_status))
    } catch (error) {
      result.status = STATUS_CODES.ERR.DB_QUERY_ERROR
      result.error = `${errorCodeLookup(STATUS_CODES.ERR.DB_QUERY_ERROR)}: ${error.message}`
    }
  }

  res.json(result)
})

router.get("/address/:address/status/:claim_status", async (req, res) => {
  const { address, claim_status } = req.params

  const result = { ...DEFAULT_JSON_RESPONSE }

  if (!isValidClaimStatus(claim_status) || !address) {
    result.error = "missing address or valid claim status"
  } else {
    try {
      result.success = true
      result.status = STATUS_CODES.OK
      delete result.error
      result.result = processClaimResult(await getClaimTicketsByAddressAndStatus(address, claim_status))
    } catch (error) {
      result.status = STATUS_CODES.ERR.DB_QUERY_ERROR
      result.error = `${errorCodeLookup(STATUS_CODES.ERR.DB_QUERY_ERROR)}: ${error.message}`
    }
  }

  res.json(result)
})

router.get("/address/:address/mctx/:mctx", async (req, res) => {
  const { address, mctx } = req.params

  const result = { ...DEFAULT_JSON_RESPONSE }

  if (!mctx || !address) {
    result.error = "missing address or mainchain tx hash"
  } else {
    try {
      result.success = true
      result.status = STATUS_CODES.OK
      delete result.error
      result.result = processClaimResult(await getClaimTicketsByAddressAndMcTx(address, mctx))
    } catch (error) {
      result.status = STATUS_CODES.ERR.DB_QUERY_ERROR
      result.error = `${errorCodeLookup(STATUS_CODES.ERR.DB_QUERY_ERROR)}: ${error.message}`
    }
  }

  res.json(result)
})

const processMemo = async (payload) => {
  const result = { ...DEFAULT_JSON_RESPONSE }

  let selfDelegatorAddress
  let ethAddress
  try {
    const decodedPayload = jwt.verify(payload, JWT_SHARED_SECRET)
    ethAddress = decodedPayload.eth_address
    selfDelegatorAddress = decodedPayload.self_delegate_address
  } catch (err) {
    result.status = STATUS_CODES.ERR.JWT
    result.error = err.message
    return result
  }

  const dbVal = await getBySelfDelegatorAddress(selfDelegatorAddress)
  if (!dbVal) {
    result.status = STATUS_CODES.ERR.DB_NOT_FOUND
    result.error = `${errorCodeLookup(STATUS_CODES.ERR.DB_NOT_FOUND)}: ${selfDelegatorAddress} not found`
    return result
  }

  const res = {
    memo: jwtiseMemo(ethAddress, selfDelegatorAddress),
  }

  result.success = true
  result.result = res
  result.status = STATUS_CODES.OK
  delete result.error

  return result
}

router.post("/memo", async (req, res) => {
  try {
    const { payload } = req.body
    if (!payload) {
      res.json({ success: false, error: "missing payload", result: {} })
    } else {
      res.json(await processMemo(payload))
    }
  } catch (error) {
    res.json({ success: false, error: error.toString(), result: {} })
  }
})

const ticketSuccessBody = (result, ticket, amount, nonce, ethAddr, generated) => {
  const retRes = { ...result }
  const resultBody = {}
  resultBody.claim_ticket = jwtiseTicket(ticket, amount, nonce, ethAddr)
  resultBody.generated = generated

  retRes.success = true
  retRes.status = STATUS_CODES.OK
  retRes.result = resultBody
  delete retRes.error
  return retRes
}

const processTicket = async (payload) => {
  const result = { ...DEFAULT_JSON_RESPONSE }

  let txHash
  let nonce
  try {
    const decodedPayload = jwt.verify(payload, JWT_SHARED_SECRET)
    txHash = decodedPayload.tx_hash
    nonce = decodedPayload.nonce
  } catch (err) {
    result.status = STATUS_CODES.ERR.JWT
    result.error = err.message
    return result
  }

  if (isNaN(nonce) || nonce === 0) {
    result.status = STATUS_CODES.ERR.CLAIM_TICKET
    result.error = `${errorCodeLookup(STATUS_CODES.ERR.CLAIM_TICKET)}: nonce ${nonce} is not a valid number`
    return result
  }

  const parsedNonce = parseInt(nonce, 10)

  const ticketExists = await getClaimTicketByMainchainTx(txHash)

  if (ticketExists) {
    const ticketJson = JSON.parse(ticketExists.ticket)
    return ticketSuccessBody(
      result,
      ticketJson.signature,
      ticketExists.amount,
      ticketExists.nonce,
      ticketExists.ethAddress,
      false,
    )
  }

  const tx = await getTx(txHash)
  const txRes = await validateClaimTx(tx)

  // check Tx validation passed
  if (txRes.status !== STATUS_CODES.OK) {
    result.status = txRes.status
    result.error = `${errorCodeLookup(txRes.status)}: ${txRes.errorMsg}`
    return result
  }

  const emissionIds = []
  let totalClaim = 0
  const { ethAddr } = txRes
  const { validatorId } = txRes

  const lastNonce = await getLastNonce(ethAddr)
  if (lastNonce) {
    if (parsedNonce !== lastNonce + 1) {
      result.status = STATUS_CODES.ERR.NONCE
      result.error = `${errorCodeLookup(STATUS_CODES.ERR.NONCE)}: expected nonce ${
        lastNonce + 1
      }, got ${parsedNonce} - nonce must be exactly 1 greater than last nonce ${lastNonce}`
      return result
    }
  }

  const unclaimedEmissions = await getUnclaimedEmissionsForValidatorId(validatorId)

  // double check have emissions to claim
  if (unclaimedEmissions.length === 0) {
    result.status = STATUS_CODES.ERR.EMISSION
    result.error = `${errorCodeLookup(STATUS_CODES.ERR.EMISSION)}: currently no emissions to claim`
    return result
  }

  for (let i = 0; i < unclaimedEmissions.length; i += 1) {
    emissionIds.push(unclaimedEmissions[i].dataValues.id)
    totalClaim += 1
  }

  const ticketData = await generateClaimTicket(ethAddr, totalClaim, parsedNonce)
  const claimTicket = ticketData.ticket.signature

  // check a claim ticket hasn't already been generated for this combination
  const ticketRes = await getClaimTicketByTicket(claimTicket)

  if (ticketRes) {
    result.status = STATUS_CODES.ERR.CLAIM_TICKET
    result.error = `${errorCodeLookup(
      STATUS_CODES.ERR.CLAIM_TICKET,
    )}: ticket already generated for address, amount and nonce`
    return result
  }

  const ticketInsId = await insertClaimTicket(
    totalClaim,
    ethAddr,
    parsedNonce,
    JSON.stringify(ticketData.ticket),
    txHash,
    validatorId,
  )

  const dbTasks = []

  for (let j = 0; j < emissionIds.length; j += 1) {
    const emissionIdId = emissionIds[j]
    dbTasks.push(updateEmissionWithClaimTicketId(emissionIdId, ticketInsId))
  }

  await Promise.all(dbTasks)

  return ticketSuccessBody(result, claimTicket, totalClaim, parsedNonce, ethAddr, true)
}

router.post("/ticket", async (req, res) => {
  try {
    const { payload } = req.body
    if (!payload) {
      res.json({ success: false, error: "missing payload", result: {} })
    } else {
      res.json(await processTicket(payload))
    }
  } catch (error) {
    res.json({ success: false, error: error.toString(), result: {} })
  }
})

const processEthTx = async (payload) => {
  const result = { ...DEFAULT_JSON_RESPONSE }

  let mainchainTx
  let ethAddress
  let ethTx
  try {
    const decodedPayload = jwt.verify(payload, JWT_SHARED_SECRET)
    mainchainTx = decodedPayload.mainchain_tx
    ethAddress = decodedPayload.eth_address
    ethTx = decodedPayload.eth_tx

    const claimTicket = await getClaimTicketByMainchainTxAndEthAddr(mainchainTx, ethAddress)

    if (!claimTicket) {
      result.status = STATUS_CODES.ERR.DB_NOT_FOUND
      result.error = `Mainchain Tx ${mainchainTx} and Eth address ${ethAddress} not found`
      return result
    }

    await updateClaimTicketWithEthTx(claimTicket.id, ethTx)

    result.status = STATUS_CODES.OK
    result.success = true
    return result
  } catch (err) {
    result.status = STATUS_CODES.ERR.JWT
    result.error = err.message
    return result
  }
}

router.post("/ethtx", async (req, res) => {
  try {
    const { payload } = req.body
    if (!payload) {
      res.json({ success: false, error: "missing payload", result: {} })
    } else {
      res.json(await processEthTx(payload))
    }
  } catch (error) {
    res.json({ success: false, error: error.toString(), result: {} })
  }
})

module.exports = router
