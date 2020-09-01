require("dotenv").config()
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")

const { database } = require("./db/database")

const port = process.env.ORACLE_SERVER_PORT || 3000

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.use("/", (req, res, next) => {
  next()
})

app.use("/emissions", require("./routes/emissions"))
app.use("/claims", require("./routes/claims"))
app.use("/validators", require("./routes/validators"))

database.sync().then(() => {
  app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })
})
