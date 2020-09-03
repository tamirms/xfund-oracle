const { v4: uuidv4 } = require("uuid")
const { MemoKeys } = require("../database")

const insertMemoKey = async (validatorId) => {
  await MemoKeys.create({
    validatorId,
    memoKey: uuidv4(),
  })
}

const updateMemoKey = async (validatorId) => {
  await MemoKeys.update(
    {
      memoKey: uuidv4(),
    },
    {
      where: {
        validatorId,
      },
    },
  )
}

module.exports = {
  insertMemoKey,
  updateMemoKey,
}
