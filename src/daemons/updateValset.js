const { updateValidators } = require("../db/validators/update")

const updateValSet = async () => {
  try {
    await updateValidators()
  } catch (err) {
    console.log(err.toString())
  }

  process.exit()
}

updateValSet()
