const { ClaimTickets } = require("../database")
const { TICKET_CLAIM_STATUS } = require("../../common/utils/constants")

const insertClaimTicket = async (amount, ethAddress, nonce, ticket, mainchainTx, validatorId) => {
  const insertRes = await ClaimTickets.create({
    amount,
    ethAddress,
    nonce,
    ticket,
    mainchainTx,
    validatorId,
    claimStatus: TICKET_CLAIM_STATUS.ISSUED,
  })
  return insertRes.id
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
}
