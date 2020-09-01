const { Emissions } = require("../database")

const insertEmission = async (validatorId) => {
  await Emissions.create({
    validatorId,
  })
}

const updateEmissionWithClaimTicketId = async (emissionId, claimTicketId) => {
  await Emissions.update(
    {
      claimTicketId,
    },
    {
      where: {
        id: emissionId,
      },
    },
  )
}

module.exports = {
  insertEmission,
  updateEmissionWithClaimTicketId,
}
