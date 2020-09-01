require("dotenv").config()
const { Op } = require("sequelize")
const { Validators } = require("../db/database")
const { updateValidators } = require("../db/validators/update")
const { insertEmission } = require("../db/emissions/update")

const { ENTRY_MULTIPLIER, DEFAULT_FOR_ZERO, NUM_EMISSIONS, VALSET_IGNORE } = process.env

const getMinMax = (data) => {
  let min = null
  let max = null
  Object.keys(data).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const num = Number(data[key])
      if (num > max || !max) max = num
      if (num < min || !min) min = num
    }
  })
  return {
    min,
    max,
  }
}

const normaliseMinMax = (data) => {
  const normalisedData = {}
  const minMax = getMinMax(data)
  Object.keys(data).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const num = Number(data[key])
      const div = minMax.max - minMax.min || 1 // can not be 0
      normalisedData[key] = (num - minMax.min) / div
    }
  })
  return normalisedData
}

const getEntries = (data) => {
  const entries = {}
  Object.keys(data).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const num = Number(data[key])
      let e = num * ENTRY_MULTIPLIER
      if (e < 1) {
        e = DEFAULT_FOR_ZERO
      }
      entries[key] = Math.round(e)
    }
  })
  return entries
}

const assignEntries = (data) => {
  const entries = []
  Object.keys(data).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const num = Number(data[key])
      for (let i = 0; i < num; i += 1) {
        entries.push(key)
      }
    }
  })
  return entries
}

const getRandomEmission = (tickets) => {
  const numTickets = tickets.length - 1
  const emissionNum = Math.round(Math.random() * numTickets)
  return emissionNum
}

const loadData = async () => {
  const vals = {}

  const entrants = await Validators.findAll({
    where: {
      [Op.and]: [{ isInSet: true }, { jailed: false }],
    },
  })

  const ignore = VALSET_IGNORE.split(",")

  for (let i = 0; i < entrants.length; i += 1) {
    const v = entrants[i].dataValues
    if (!ignore.includes(v.operatorAddress)) {
      vals[v.id] = v.tokens
    }
  }
  return vals
}

const generateEmissions = async () => {
  try {
    await updateValidators()
  } catch (err) {
    console.log(err.toString())
    process.exit()
  }

  const entrants = await loadData()
  if (Object.keys(entrants).length > 0) {
    const norm = normaliseMinMax(entrants)
    const entries = getEntries(norm)
    const emissionTickets = assignEntries(entries)
    const dbTasks = []

    for (let i = 1; i <= NUM_EMISSIONS; i += 1) {
      const randNumber = getRandomEmission(emissionTickets)
      const validatorId = emissionTickets[randNumber]
      dbTasks.push(insertEmission(validatorId))
    }
    await Promise.all(dbTasks)
  } else {
    console.log("No validators in DB")
  }
  process.exit()
}

generateEmissions()
