const { Op } = require("sequelize")
const { database, ClaimTickets, Emissions } = require("../database")
const { TICKET_CLAIM_STATUS } = require("../../common/utils/constants")

const insertClaimTicket = async (amount, ethAddress, nonce, mainchainTx, validatorId, emissionIds) => {
  try {
    const result = await database.transaction(async (t) => {
      let insertRes
      const byTxRes = await ClaimTickets.findOne({
        where: {
          mainchainTx,
        },
        transaction: t,
      })

      if (!byTxRes) {
        insertRes = await ClaimTickets.create(
          {
            amount,
            ethAddress,
            nonce,
            mainchainTx,
            validatorId,
            claimStatus: TICKET_CLAIM_STATUS.INITIALISED,
          },
          { transaction: t },
        )
      }

      // todo: also chain emission updates
      return insertRes
    })

    if (result) {
      await Emissions.update(
        {
          claimTicketId: result.id,
        },
        {
          where: {
            id: { [Op.in]: emissionIds },
          },
        },
      )
      return result.id
    }
    return 0
  } catch (error) {
    console.log(error.toString())
    throw error
  }
}

const updateClaimTicketWithTicket = async (claimTicketId, ticket) => {
  await ClaimTickets.update(
    {
      ticket,
      claimStatus: TICKET_CLAIM_STATUS.ISSUED,
    },
    {
      where: {
        id: claimTicketId,
      },
    },
  )
}

const updateClaimTicketWithEthTx = async (claimTicketId, ethTx) => {
  await ClaimTickets.update(
    {
      ethereumTx: ethTx,
      claimStatus: TICKET_CLAIM_STATUS.CLAIMED,
    },
    {
      where: {
        id: claimTicketId,
      },
    },
  )
}

module.exports = {
  insertClaimTicket,
  updateClaimTicketWithEthTx,
  updateClaimTicketWithTicket,
}
