const express = require("express")
const {
  getAllClaimedEmissions,
  getAllUnclaimedEmissions,
  getClaimedEmissionsForValidator,
  getUnclaimedEmissionsForValidator,
} = require("../db/emissions/queries")
const { DEFAULT_JSON_RESPONSE, STATUS_CODES, errorCodeLookup } = require("../common/utils/constants")

const router = express.Router()

const postProcessResults = (res, qType) => {
  const results = []

  for (let i = 0; i < res.length; i += 1) {
    const valDataVals = res[i].dataValues
    const v = {
      moniker: valDataVals.validator.moniker,
      operator_address: valDataVals.validator.operatorAddress,
      self_delegate_address: valDataVals.validator.selfDelegateAddress,
    }
    v[qType] = valDataVals.total
    results.push(v)
  }

  return results
}

router.get("/", async (req, res) => {
  const result = { ...DEFAULT_JSON_RESPONSE }
  result.success = true
  result.status = STATUS_CODES.OK
  res.json(result)
})

router.get("/unclaimed", async (req, res) => {
  const result = { ...DEFAULT_JSON_RESPONSE }

  try {
    result.success = true
    result.status = STATUS_CODES.OK
    delete result.error
    result.result = postProcessResults(await getAllUnclaimedEmissions(), "total_unclaimed")
  } catch (error) {
    result.status = STATUS_CODES.ERR.DB_QUERY_ERROR
    result.error = `${errorCodeLookup(STATUS_CODES.ERR.DB_QUERY_ERROR)}: ${error.message}`
  }
  res.json(result)
})

router.get("/claimed", async (req, res) => {
  const result = { ...DEFAULT_JSON_RESPONSE }

  try {
    result.success = true
    result.status = STATUS_CODES.OK
    delete result.error
    result.result = postProcessResults(await getAllClaimedEmissions(), "total_claimed")
  } catch (error) {
    result.status = STATUS_CODES.ERR.DB_QUERY_ERROR
    result.error = `${errorCodeLookup(STATUS_CODES.ERR.DB_QUERY_ERROR)}: ${error.message}`
  }
  res.json(result)
})

router.get("/unclaimed/address/:address", async (req, res) => {
  const { address } = req.params
  const result = { ...DEFAULT_JSON_RESPONSE }

  if (!address) {
    result.error = "missing address"
  } else {
    try {
      result.success = true
      result.status = STATUS_CODES.OK
      delete result.error
      result.result = postProcessResults(await getUnclaimedEmissionsForValidator(address), "total_unclaimed")
    } catch (error) {
      result.status = STATUS_CODES.ERR.DB_QUERY_ERROR
      result.error = `${errorCodeLookup(STATUS_CODES.ERR.DB_QUERY_ERROR)}: ${error.message}`
    }
  }

  res.json(result)
})

router.get("/claimed/address/:address", async (req, res) => {
  const { address } = req.params
  const result = { ...DEFAULT_JSON_RESPONSE }

  if (!address) {
    result.error = "missing address"
  } else {
    try {
      result.success = true
      result.status = STATUS_CODES.OK
      delete result.error
      result.result = postProcessResults(await getClaimedEmissionsForValidator(address), "total_claimed")
    } catch (error) {
      result.status = STATUS_CODES.ERR.DB_QUERY_ERROR
      result.error = `${errorCodeLookup(STATUS_CODES.ERR.DB_QUERY_ERROR)}: ${error.message}`
    }
  }

  res.json(result)
})

module.exports = router
