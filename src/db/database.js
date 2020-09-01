require("dotenv").config()
const Sequelize = require("sequelize")

const { DB_NAME, DB_USER, DB_PASS } = process.env

const database = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: "localhost",
  dialect: "postgres",
  operatorsAliases: Sequelize.Op,
})

const Validators = database.define(
  "validators",
  {
    moniker: { type: Sequelize.STRING, allowNull: false },
    operatorAddress: { type: Sequelize.STRING, allowNull: false },
    selfDelegateAddress: { type: Sequelize.STRING, allowNull: true },
    consensusPubkey: { type: Sequelize.STRING, allowNull: false },
    status: { type: Sequelize.INTEGER, allowNull: false },
    jailed: { type: Sequelize.BOOLEAN, allowNull: false },
    shares: { type: Sequelize.DOUBLE, allowNull: false },
    tokens: { type: Sequelize.BIGINT, allowNull: false },
    isInSet: { type: Sequelize.BOOLEAN, allowNull: false },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ["operatorAddress"],
      },
      {
        unique: false,
        fields: ["selfDelegateAddress"],
      },
      {
        unique: false,
        fields: ["isInSet"],
      },
    ],
  },
)

const Emissions = database.define(
  "emissions",
  {
    amount: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 1 },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ["validatorId"],
      },
      {
        unique: false,
        fields: ["claimTicketId"],
      },
      {
        unique: false,
        fields: ["validatorId", "claimTicketId"],
      },
    ],
  },
)

const ClaimTickets = database.define(
  "claimTickets",
  {
    amount: { type: Sequelize.INTEGER, allowNull: false },
    ticket: { type: Sequelize.TEXT, allowNull: false },
    ethAddress: { type: Sequelize.STRING, allowNull: false },
    nonce: { type: Sequelize.INTEGER, allowNull: false },
    claimStatus: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
    mainchainTx: { type: Sequelize.STRING, allowNull: false },
    ethereumTx: { type: Sequelize.STRING, allowNull: true },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ["validatorId"],
      },
      {
        unique: false,
        fields: ["claimStatus"],
      },
      {
        unique: false,
        fields: ["mainchainTx"],
      },
      {
        unique: false,
        fields: ["ethAddress"],
      },
      {
        unique: false,
        fields: ["ethAddress", "nonce"],
      },
      {
        unique: true,
        fields: ["ethereumTx"],
      },
      {
        unique: true,
        fields: ["ticket"],
      },
    ],
  },
)

Validators.hasMany(Emissions)
Emissions.belongsTo(Validators)

Validators.hasMany(ClaimTickets)
ClaimTickets.belongsTo(Validators)

ClaimTickets.hasMany(Emissions)
Emissions.belongsTo(ClaimTickets)

module.exports = {
  ClaimTickets,
  Emissions,
  Validators,
  database,
}
