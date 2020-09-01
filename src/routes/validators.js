const express = require("express")
const { Validators } = require("../db/database")
const { DEFAULT_JSON_RESPONSE, STATUS_CODES, errorCodeLookup } = require("../common/utils/constants")

const router = express.Router()

router.get("/info", async (req, res) => {
  const result = { ...DEFAULT_JSON_RESPONSE }

  const valData = []

  try {
    result.success = true
    result.status = STATUS_CODES.OK
    delete result.error
    const dbRes = await Validators.findAll()
    for (let i = 0; i < dbRes.length; i += 1) {
      const valDataVals = dbRes[i].dataValues
      const v = {
        moniker: valDataVals.moniker,
        operator_address: valDataVals.operatorAddress,
        self_delegate_address: valDataVals.selfDelegateAddress,
      }
      valData.push(v)
    }

    result.result = valData
  } catch (error) {
    result.status = STATUS_CODES.ERR.DB_QUERY_ERROR
    result.error = `${errorCodeLookup(STATUS_CODES.ERR.DB_QUERY_ERROR)}: ${error.message}`
  }
  res.json(result)
})

module.exports = router
