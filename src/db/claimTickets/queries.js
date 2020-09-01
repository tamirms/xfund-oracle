const { Op } = require("sequelize")
const { ClaimTickets, Validators } = require("../database")

const getClaimTicketByTicket = async (ticket) => {
  const result = await ClaimTickets.findOne({
    attributes: [
      "ethAddress",
      "amount",
      "nonce",
      "ticket",
      "claimStatus",
      "mainchainTx",
      "ethereumTx",
      "createdAt",
    ],
    where: { ticket },
  })
  return result
}

const getLastNonce = async (ethAddress) => {
  const result = ClaimTickets.max("nonce", { where: { ethAddress } })
  return result
}

const getClaimTicketByMainchainTxAndEthAddr = async (mainchainTx, ethAddress) => {
  const result = await ClaimTickets.findOne({
    attributes: [
      "id",
      "ethAddress",
      "amount",
      "nonce",
      "ticket",
      "claimStatus",
      "mainchainTx",
      "ethereumTx",
      "createdAt",
    ],
    where: {
      [Op.and]: [{ ethAddress }, { mainchainTx }],
    },
  })
  return result
}

const getClaimTicketByMainchainTx = async (mainchainTx) => {
  const result = await ClaimTickets.findOne({
    attributes: [
      "ethAddress",
      "amount",
      "nonce",
      "ticket",
      "claimStatus",
      "mainchainTx",
      "ethereumTx",
      "createdAt",
    ],
    where: {
      mainchainTx,
    },
  })
  return result
}

const getClaimTicketByEthAddressAndNonce = async (ethAddress, nonce) => {
  const result = await ClaimTickets.findOne({
    attributes: [
      "ethAddress",
      "amount",
      "nonce",
      "ticket",
      "claimStatus",
      "mainchainTx",
      "ethereumTx",
      "createdAt",
    ],
    where: {
      [Op.and]: [{ ethAddress }, { nonce }],
    },
  })
  return result
}

const getAllClaimTickets = async () => {
  const ticketsRes = await ClaimTickets.findAll({
    attributes: [
      "ethAddress",
      "amount",
      "nonce",
      "ticket",
      "claimStatus",
      "mainchainTx",
      "ethereumTx",
      "createdAt",
    ],
    include: [{ model: Validators, attributes: ["moniker", "operatorAddress", "selfDelegateAddress"] }],
  })
  return ticketsRes
}

const getAllClaimTicketsByAddress = async (address) => {
  const ticketsRes = await ClaimTickets.findAll({
    attributes: [
      "ethAddress",
      "amount",
      "nonce",
      "ticket",
      "claimStatus",
      "mainchainTx",
      "ethereumTx",
      "createdAt",
    ],
    include: [
      {
        model: Validators,
        attributes: ["moniker", "operatorAddress", "selfDelegateAddress"],
        where: {
          [Op.or]: [{ operatorAddress: address }, { selfDelegateAddress: address }],
        },
      },
    ],
  })
  return ticketsRes
}

const getClaimTicketsByAddressAndStatus = async (address, claimStatus) => {
  const ticketsRes = await ClaimTickets.findAll({
    attributes: [
      "ethAddress",
      "amount",
      "nonce",
      "ticket",
      "claimStatus",
      "mainchainTx",
      "ethereumTx",
      "createdAt",
    ],
    where: {
      claimStatus,
    },
    include: [
      {
        model: Validators,
        attributes: ["moniker", "operatorAddress", "selfDelegateAddress"],
        where: {
          [Op.or]: [{ operatorAddress: address }, { selfDelegateAddress: address }],
        },
      },
    ],
  })
  return ticketsRes
}

const getClaimTicketsByAddressAndMcTx = async (address, mctx) => {
  const ticketsRes = await ClaimTickets.findAll({
    attributes: [
      "ethAddress",
      "amount",
      "nonce",
      "ticket",
      "claimStatus",
      "mainchainTx",
      "ethereumTx",
      "createdAt",
    ],
    where: {
      mainchainTx: mctx,
    },
    include: [
      {
        model: Validators,
        attributes: ["moniker", "operatorAddress", "selfDelegateAddress"],
        where: {
          [Op.or]: [{ operatorAddress: address }, { selfDelegateAddress: address }],
        },
      },
    ],
  })
  return ticketsRes
}

const getClaimTicketsByStatus = async (claimStatus) => {
  const ticketsRes = await ClaimTickets.findAll({
    attributes: [
      "ethAddress",
      "amount",
      "nonce",
      "ticket",
      "claimStatus",
      "mainchainTx",
      "ethereumTx",
      "createdAt",
    ],
    where: {
      claimStatus,
    },
    include: [
      {
        model: Validators,
        attributes: ["moniker", "operatorAddress", "selfDelegateAddress"],
      },
    ],
  })
  return ticketsRes
}

module.exports = {
  getClaimTicketByTicket,
  getClaimTicketByEthAddressAndNonce,
  getAllClaimTickets,
  getAllClaimTicketsByAddress,
  getClaimTicketByMainchainTxAndEthAddr,
  getLastNonce,
  getClaimTicketsByAddressAndStatus,
  getClaimTicketsByStatus,
  getClaimTicketByMainchainTx,
  getClaimTicketsByAddressAndMcTx,
}
