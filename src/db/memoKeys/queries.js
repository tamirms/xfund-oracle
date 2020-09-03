const { MemoKeys } = require("../database")

const getMemoKey = async (validatorId) => {
  return MemoKeys.findOne({
    where: { validatorId },
  })
}

module.exports = { getMemoKey }
