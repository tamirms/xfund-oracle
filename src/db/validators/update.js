require("dotenv").config()
const { Op } = require("sequelize")
const { getValidators } = require("../../chains/mainchain")
const { Validators } = require("../database")
const { insertMemoKey } = require("../memoKeys/update")

const removeValFromCurrentSet = async (valId) => {
  await Validators.update(
    {
      isInSet: false,
    },
    {
      where: {
        id: valId,
      },
    },
  )
}

const updateValidator = async (valId, val) => {
  await Validators.update(
    {
      moniker: val.moniker,
      status: val.status,
      jailed: val.jailed,
      shares: val.shares,
      tokens: val.tokens,
      isInSet: true,
    },
    {
      where: {
        id: valId,
      },
    },
  )
}

const insertValidator = async (val) => {
  const insRes = await Validators.create({
    moniker: val.moniker,
    operatorAddress: val.operatorAddress,
    selfDelegateAddress: val.selfDelegateAddress,
    consensusPubkey: val.consensusPubkey,
    status: val.status,
    jailed: val.jailed,
    shares: val.shares,
    tokens: val.tokens,
    isInSet: true,
  })

  await insertMemoKey(insRes.id)
}

const updateCurrentValidatorSet = async (currentValidators) => {
  const notCurrentValidators = await Validators.findAll({
    attributes: ["id"],
    where: {
      operatorAddress: { [Op.notIn]: currentValidators },
    },
  })
  const dbTasks = []
  for (let j = 0; j < notCurrentValidators.length; j += 1) {
    dbTasks.push(removeValFromCurrentSet(notCurrentValidators[j].dataValues.id))
  }
  await Promise.all(dbTasks)
}

const processUpdate = async (val) => {
  const dbRes = await Validators.findOne({
    attributes: ["id"],
    where: { operatorAddress: val.operatorAddress },
  })
  if (!dbRes) {
    await insertValidator(val)
  } else {
    await updateValidator(dbRes.id, val)
  }
}

const updateValidators = async () => {
  try {
    const valSet = await getValidators()
    const currentValidators = []
    const dbTasks = []
    for (let i = 0; i < valSet.length; i += 1) {
      const val = valSet[i]
      currentValidators.push(val.operatorAddress)

      dbTasks.push(processUpdate(val))
    }
    await Promise.all(dbTasks)
    await updateCurrentValidatorSet(currentValidators)
  } catch (err) {
    console.log(err)
    throw err
  }
}

module.exports = { updateValidators }
