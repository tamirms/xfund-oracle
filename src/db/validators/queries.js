const { Validators } = require("../database")

const getBySelfDelegatorAddress = async (selfDelAddr) => {
  const result = await Validators.findOne({
    where: { selfDelegateAddress: selfDelAddr },
  })
  return result
}

module.exports = { getBySelfDelegatorAddress }
