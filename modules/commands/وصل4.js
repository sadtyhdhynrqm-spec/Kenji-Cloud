const { createCanvas } = require("canvas")
const fs = require("fs")

const config = {
  name: "وصل4", // Connect Four
  author: 'Hridoy',
  aliases: ["و4"],
  description: "العب وصل 4 ضد لاعب آخر!",
  usage: "[إنشاء/انضم/ضع <عمود>/انهاء]",
  cooldown: 3,
}

const lang = {
  ar_SA: {
    gameAlreadyStarted: "⚠️ | هناك لعبة وصل 4 جارية بالفعل في هذه المحادثة. استخدم `!و4 انهاء` لإيقافها.",
    gameNotStarted: "⚠️ | لا توجد لعبة وصل 4 نشطة حالياً في هذه المحادثة. استخدم `!و4 إنشاء` لبدء واحدة.",
    gameCreated: "🎉 | تم إنشاء لعبة وصل 4! اللاعب الأحمر: %1. استخدم `!و4 انضم` للانضمام كلاعب أصفر.",
    playerJoined: "✅ | اللاعب الأصفر: %1 انضم للعبة! اللاعب الأحمر: %2. الدور الآن على اللاعب الأحمر.",
    waitingForPlayer: "⏳ | في انتظار انضمام اللاعب الأصفر. اللاعب الأحمر: %1. استخدم `!و4 انضم` للانضمام.",
    notYourTurn: "⚠️ | ليس دورك، %1. الدور الآن على %2.",
    invalidColumn: "⚠️ | عمود غير صالح. يرجى تحديد رقم عمود بين 1 و 7.",
    columnFull: "⚠️ | هذا العمود ممتلئ. اختر عمودًا آخر.",
    win: "🎉 | تهانينا، %1! لقد فزت!",
    draw: "🤝 | انتهت اللعبة بالتعادل!",
    gameEnded: "✅ | انتهت لعبة وصل 4.",
    playerRed: "اللاعب الأحمر",
    playerYellow: "اللاعب الأصفر",
    turnMessage: "الدور على %1 (%2).",
    alreadyRedPlayer: "⚠️ | أنت بالفعل اللاعب الأحمر في هذه اللعبة.",
    gameStartedOrFinished: "⚠️ | هذه اللعبة قد بدأت أو انتهت بالفعل.",
    invalidSubcommand: "⚠️ | أمر غير صالح. استخدم `!و4 إنشاء` أو `!و4 انضم` أو `!و4 ضع <عمود>` أو `!و4 انهاء`.",
  },
}

const connect4Games = {}

async function drawConnect4Board(game) {
  const numRows = 6
  const numCols = 7
  const cellSize = 80
  const discRadius = 30
  const padding = 10
  const boardWidth = numCols * cellSize
  const boardHeight = numRows * cellSize
  const canvasWidth = boardWidth + padding * 2
  const canvasHeight = boardHeight + padding * 2 + 60

  const canvas = createCanvas(canvasWidth, canvasHeight)
  const ctx = canvas.getContext("2d")

  // خلفية اللوحة
  ctx.fillStyle = "#282c34"
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // لوحة اللعب
  ctx.fillStyle = "#61afef"
  ctx.fillRect(padding, padding + 40, boardWidth, boardHeight)

  // رسم الأقراص
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const centerX = padding + c * cellSize + cellSize / 2
      const centerY = padding + 40 + r * cellSize + cellSize / 2

      ctx.beginPath()
      ctx.arc(centerX, centerY, discRadius, 0, Math.PI * 2, true)
      ctx.fillStyle = "#282c34"
      ctx.fill()

      const disc = game.board[r][c]
      if (disc === "R") {
        ctx.fillStyle = "#e06c75" // أحمر
        ctx.beginPath()
        ctx.arc(centerX, centerY, discRadius, 0, Math.PI * 2, true)
        ctx.fill()
      } else if (disc === "Y") {
        ctx.fillStyle = "#f9e2af" // أصفر
        ctx.beginPath()
        ctx.arc(centerX, centerY, discRadius, 0, Math.PI * 2, true)
        ctx.fill()
      }
    }
  }

  // تحديد خط الفوز إذا كان موجودًا
  if (game.status === "won" && game.winningLine) {
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 8
    ctx.lineCap = "round"

    ctx.beginPath()
    const startCell = game.winningLine[0]
    const endCell = game.winningLine[game.winningLine.length - 1]

    const startX = padding + startCell.col * cellSize + cellSize / 2
    const startY = padding + 40 + startCell.row * cellSize + cellSize / 2
    const endX = padding + endCell.col * cellSize + cellSize / 2
    const endY = padding + 40 + endCell.row * cellSize + cellSize / 2

    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  }

  // الرسائل النصية
  ctx.font = "bold 30px Arial"
  ctx.textAlign = "center"
  ctx.fillStyle = "#abb2bf"

  let message = ""
  if (game.status === "playing") {
    const currentPlayerName =
      game.currentPlayer === "R"
        ? game.playerRName || lang.ar_SA.playerRed
        : game.playerYName || lang.ar_SA.playerYellow
    message = lang.ar_SA.turnMessage.replace("%1", currentPlayerName).replace("%2", game.currentPlayer)
  } else if (game.status === "won") {
    const winnerName =
      game.winner === "R" ? game.playerRName || lang.ar_SA.playerRed : game.playerYName || lang.ar_SA.playerYellow
    message = lang.ar_SA.win.replace("%1", winnerName)
  } else if (game.status === "draw") {
    message = lang.ar_SA.draw
  } else if (game.status === "waiting") {
    message = lang.ar_SA.waitingForPlayer.replace("%1", game.playerRName || lang.ar_SA.playerRed)
  }

  if (game.status !== "playing") {
    ctx.fillStyle = "rgba(40, 44, 52, 0.8)"
    ctx.fillRect(0, canvasHeight / 2 - 50, canvasWidth, 100)
    ctx.fillStyle = "#FFFFFF"
    ctx.fillText(message, canvasWidth / 2, canvasHeight / 2)
  } else {
    ctx.fillStyle = "#abb2bf"
    ctx.fillText(message, canvasWidth / 2, 30)
  }

  const buffer = canvas.toBuffer("image/png")
  const imagePath = `temp/connect4_${game.threadID}.png`
  fs.writeFileSync(imagePath, buffer)
  return fs.createReadStream(imagePath)
}

function createEmptyBoard() {
  const board = []
  for (let r = 0; r < 6; r++) {
    board.push(new Array(7).fill(null))
  }
  return board
}

function dropDisc(board, col, player) {
  for (let r = 5; r >= 0; r--) {
    if (board[r][col] === null) {
      board[r][col] = player
      return { row: r, col: col }
    }
  }
  return null
}

function checkWin(board, player) {
  const numRows = 6
  const numCols = 7

  // أفقي
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c <= numCols - 4; c++) {
      if (
        board[r][c] === player &&
        board[r][c + 1] === player &&
        board[r][c + 2] === player &&
        board[r][c + 3] === player
      ) {
        return [
          { row: r, col: c },
          { row: r, col: c + 1 },
          { row: r, col: c + 2 },
          { row: r, col: c + 3 },
        ]
      }
    }
  }

  // عمودي
  for (let r = 0; r <= numRows - 4; r++) {
    for (let c = 0; c < numCols; c++) {
      if (
        board[r][c] === player &&
        board[r + 1][c] === player &&
        board[r + 2][c] === player &&
        board[r + 3][c] === player
      ) {
        return [
          { row: r, col: c },
          { row: r + 1, col: c },
          { row: r + 2, col: c },
          { row: r + 3, col: c },
        ]
      }
    }
  }

  // قطري \
  for (let r = 0; r <= numRows - 4; r++) {
    for (let c = 0; c <= numCols - 4; c++) {
      if (
        board[r][c] === player &&
        board[r + 1][c + 1] === player &&
        board[r + 2][c + 2] === player &&
        board[r + 3][c + 3] === player
      ) {
        return [
          { row: r, col: c },
          { row: r + 1, col: c + 1 },
          { row: r + 2, col: c + 2 },
          { row: r + 3, col: c + 3 },
        ]
      }
    }
  }

  // قطري /
  for (let r = 3; r < numRows; r++) {
    for (let c = 0; c <= numCols - 4; c++) {
      if (
        board[r][c] === player &&
        board[r - 1][c + 1] === player &&
        board[r - 2][c + 2] === player &&
        board[r - 3][c + 3] === player
      ) {
        return [
          { row: r, col: c },
          { row: r - 1, col: c + 1 },
          { row: r - 2, col: c + 2 },
          { row: r - 3, col: c + 3 },
        ]
      }
    }
  }

  return null
}

function checkDraw(board) {
  for (let c = 0; c < 7; c++) {
    if (board[0][c] === null) return false
  }
  return true
}

async function onStart({ api, event, args }) {
  const { threadID, senderID, messageID } = event

  const getUserName = async (id) => {
    return global.data?.users?.get(id)?.name || id
  }

  switch (args[0]) {
    case "إنشاء":
      if (connect4Games[threadID]) {
        return api.sendMessage(lang.ar_SA.gameAlreadyStarted, threadID, messageID)
      }

      const playerRId = senderID
      const playerRName = await getUserName(playerRId)

      connect4Games[threadID] = {
        threadID,
        board: createEmptyBoard(),
        playerR: playerRId,
        playerRName: playerRName,
        playerY: null,
        playerYName: null,
        currentPlayer: "R",
        status: "waiting",
        winningLine: null,
      }

      const initialImageStream = await drawConnect4Board(connect4Games[threadID])
      api.sendMessage(
        {
          body: lang.ar_SA.gameCreated.replace("%1", playerRName),
          attachment: initialImageStream,
        },
        threadID,
        () => fs.unlinkSync(`temp/connect4_${threadID}.png`),
      )
      break

    case "انضم":
      const gameToJoin = connect4Games[threadID]
      if (!gameToJoin) return api.sendMessage(lang.ar_SA.gameNotStarted, threadID, messageID)
      if (gameToJoin.status !== "waiting") return api.sendMessage(lang.ar_SA.gameStartedOrFinished, threadID, messageID)
      if (gameToJoin.playerR === senderID) return api.sendMessage(lang.ar_SA.alreadyRedPlayer, threadID, messageID)

      gameToJoin.playerY = senderID
      gameToJoin.playerYName = await getUserName(senderID)
      gameToJoin.status = "playing"

      const joinedImageStream = await drawConnect4Board(gameToJoin)
      api.sendMessage(
        {
          body: lang.ar_SA.playerJoined.replace("%1", gameToJoin.playerYName).replace("%2", gameToJoin.playerRName),
          attachment: joinedImageStream,
        },
        threadID,
        () => fs.unlinkSync(`temp/connect4_${threadID}.png`),
      )
      break

    case "ضع":
      const gameToPlay = connect4Games[threadID]
      if (!gameToPlay || gameToPlay.status !== "playing") return api.sendMessage(lang.ar_SA.gameNotStarted, threadID, messageID)
      if (gameToPlay.playerY === null) return api.sendMessage(lang.ar_SA.waitingForPlayer.replace("%1", gameToPlay.playerRName), threadID, messageID)

      const playerSymbol = senderID === gameToPlay.playerR ? "R" : senderID === gameToPlay.playerY ? "Y" : null
      if (!playerSymbol) return api.sendMessage("⚠️ | أنت لست لاعباً في هذه اللعبة.", threadID, messageID)
      if (playerSymbol !== gameToPlay.currentPlayer) {
        const currentPlayerName =
          gameToPlay.currentPlayer === "R"
            ? gameToPlay.playerRName || lang.ar_SA.playerRed
            : gameToPlay.playerYName || lang.ar_SA.playerYellow
        return api.sendMessage(lang.ar_SA.notYourTurn.replace("%1", await getUserName(senderID)).replace("%2", currentPlayerName), threadID, messageID)
      }

      const column = Number.parseInt(args[1]) - 1
      if (isNaN(column) || column < 0 || column > 6) return api.sendMessage(lang.ar_SA.invalidColumn, threadID, messageID)

      const discPosition = dropDisc(gameToPlay.board, column, playerSymbol)
      if (discPosition === null) return api.sendMessage(lang.ar_SA.columnFull, threadID, messageID)

      const winningLine = checkWin(gameToPlay.board, playerSymbol)
      if (winningLine) {
        gameToPlay.status = "won"
        gameToPlay.winner = playerSymbol
        gameToPlay.winningLine = winningLine
        const finalImageStream = await drawConnect4Board(gameToPlay)
        api.sendMessage(
          {
            body: lang.ar_SA.win.replace("%1", playerSymbol === "R" ? gameToPlay.playerRName : gameToPlay.playerYName),
            attachment: finalImageStream,
          },
          threadID,
          () => fs.unlinkSync(`temp/connect4_${threadID}.png`),
        )
        delete connect4Games[threadID]
      } else if (checkDraw(gameToPlay.board)) {
        gameToPlay.status = "draw"
        const finalImageStream = await drawConnect4Board(gameToPlay)
        api.sendMessage(
          {
            body: lang.ar_SA.draw,
            attachment: finalImageStream,
          },
          threadID,
          () => fs.unlinkSync(`temp/connect4_${threadID}.png`),
        )
        delete connect4Games[threadID]
      } else {
        gameToPlay.currentPlayer = playerSymbol === "R" ? "Y" : "R"
        const imageStream = await drawConnect4Board(gameToPlay)
        api.sendMessage(
          {
            body: lang.ar_SA.turnMessage
              .replace("%1", gameToPlay.currentPlayer === "R" ? gameToPlay.playerRName : gameToPlay.playerYName)
              .replace("%2", gameToPlay.currentPlayer),
            attachment: imageStream,
          },
          threadID,
          () => fs.unlinkSync(`temp/connect4_${threadID}.png`),
        )
      }
      break

    case "انهاء":
      if (!connect4Games[threadID]) return api.sendMessage(lang.ar_SA.gameNotStarted, threadID, messageID)
      delete connect4Games[threadID]
      api.sendMessage(lang.ar_SA.gameEnded, threadID, messageID)
      break

    default:
      api.sendMessage(lang.ar_SA.invalidSubcommand, threadID, messageID)
      break
  }
}

module.exports = {
  config,
  onStart,
    }
