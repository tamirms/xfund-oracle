const { Op, Sequelize } = require("sequelize")
const { ClaimTickets, Emissions, Validators } = require("../database")

const getAllUnclaimedEmissions = async () => {
  return Emissions.findAll({
    attributes: ["validatorId", [Sequelize.fn("SUM", Sequelize.col("amount")), "total"]],
    where: { claimTicketId: { [Op.is]: null } },
    group: ["validator.id", "validatorId"],
    include: [{ model: Validators, attributes: ["moniker", "operatorAddress", "selfDelegateAddress"] }],
  })
}

const getAllClaimedEmissions = async () => {
  return Emissions.findAll({
    attributes: ["validatorId", [Sequelize.fn("SUM", Sequelize.col("amount")), "total"]],
    where: { claimTicketId: { [Op.not]: null } },
    group: ["validator.id", "emissions.validatorId"],
    include: [
      {
        model: Validators,
        attributes: ["moniker", "operatorAddress", "selfDelegateAddress"],
      },
    ],
  })
}

const getUnclaimedEmissionsForValidator = async (address) => {
  return Emissions.findAll({
    attributes: ["validatorId", [Sequelize.fn("SUM", Sequelize.col("amount")), "total"]],
    where: { claimTicketId: { [Op.is]: null } },
    group: ["validator.id", "validatorId"],
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
}

const getClaimedEmissionsForValidator = async (address) => {
  return Emissions.findAll({
    attributes: ["validatorId", "claimTicketId"[(Sequelize.fn("SUM", Sequelize.col("amount")), "total")]],
    where: { claimTicketId: { [Op.not]: null } },
    group: ["validator.id", "validatorId", "claimTicketId"],
    include: [
      {
        model: Validators,
        attributes: ["moniker", "operatorAddress", "selfDelegateAddress"],
        where: {
          [Op.or]: [{ operatorAddress: address }, { selfDelegateAddress: address }],
        },
      },
      {
        model: ClaimTickets,
      },
    ],
  })
}

const getUnclaimedEmissionsForValidatorId = async (validatorId) => {
  return Emissions.findAll({
    attributes: ["validatorId", "amount", "id"],
    where: {
      [Op.and]: [{ validatorId }, { claimTicketId: { [Op.is]: null } }],
    },
  })
}

module.exports = {
  getAllClaimedEmissions,
  getAllUnclaimedEmissions,
  getClaimedEmissionsForValidator,
  getUnclaimedEmissionsForValidator,
  getUnclaimedEmissionsForValidatorId,
}
