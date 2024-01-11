const constants = require('../api.constants')
const { ROTATE_NEXT, ROTATE_WINNER, WIN_ALL_CARDS, WIN_N_ROUNDS, WIN_N_POINTS, MIN_BLACK_CARDS, MIN_WHITE_CARDS } =
  constants

// code from here: https://javascript.info/task/shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    let t = array[i];
    array[i] = array[j];
    array[j] = t;
  }
}

function createID() {
  return Math.random()
    .toString(36)
    .toUpperCase()
    .replace(/[^A-Z]+/g, '')
    .slice(0, 4);
}

class Round {
  constructor() {
    this.host = null
    this.winner = null
    this.blackCard = null
    this.whiteCards = []
  }

  addWhiteCard(card, playerId) {
    this.whiteCards.push({ card, player: playerId, hidden: false })
  }

  revealWhiteCards(player) {
    for (const card of this.whiteCards) {
      if (card.player === player) {
        card.hidden = false
      }
    }
  }

  removePlayedCards (player) {
    this.whiteCards = this.whiteCards.filter(c => c.player !== this.host && c.player !== player)
  }

  finish (winner) {
    this.winner = winner
    this.whiteCards = this.whiteCards.filter(c => c.player === winner)
  }
}

class Game {
  static fromJSON({ usedCards, round, ...data}) {
    const game = new Game({})
    Object.assign(game, {
      usedCards: new Set(usedCards),
      round: Object.assign(new Round(), round),
      ...data,
    })
    return game
  }

  toJSON() {
    return {
      ...this,
      usedCards: [...this.usedCards],
    }
  }

  constructor({ deck, rotation, winCondition, maxPoints, maxRounds, isPublic }) {
    const id = createID()
    const data = {
      id,
      deck,
      rotation,
      winCondition,
      players: [],
      started: false,
      finished: false,
      cardsPerHand: 5,
      usedCards: new Set(),
      maxPoints,
      maxRounds,
      isPublic,
      finishedRounds: [],
      round: new Round()
    }
    Object.assign(this, data)
    return this
  }

  addPlayer(player) {
    const playerHasJoined = this.players.some(p => p.id === player.id)
    if (!playerHasJoined) {
      this.players.push({
        id: player.id,
        name: player.name,
        cards: [],
        points: 0
      })
      if (this.started) {
        this.drawWhiteCards(player.id)
      }
    }
    return this
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId)

    if (this.players.length && this.round.host === playerId) {
      this.round.host = this.players[0].id
    }

    this.round.removePlayedCards(playerId)

    return this
  }

  start() {
    shuffle(this.deck.blackCards)
    shuffle(this.deck.whiteCards)
    this.started = true
    this.startRound()

    return this
  }

  startRound() {
    this.round = new Round()
    this.checkWinCondition()
    this.selectNewHost()
    this.drawBlackCard()
    for (const player of this.players) {
      this.drawWhiteCards(player.id)
    }
  }

  finishRound(winnerPlayerId) {
    const player = this.players.find(p => p.id === winnerPlayerId)
    player.points++
    this.round.finish(winnerPlayerId)
    this.finishedRounds.push(this.round)
    this.startRound()
    return this
  }

  getLastFinishedRound () {
    return this.finishedRounds[this.finishedRounds.length - 1]
  }

  selectNewHost() {
    const lastRound = this.getLastFinishedRound()
    if (!lastRound) {
      this.round.host = this.players[0].id
      return
    }

    if (this.rotation === ROTATE_WINNER) {
      this.round.host = lastRound.winner
    }
    if (this.rotation === ROTATE_NEXT) {
      for (const player of this.players) {
        if (player.id === lastRound.host) {
          let nextIndex = this.players.indexOf(player) + 1
          if (nextIndex >= this.players.length) {
            nextIndex = 0
          }
          const nextPlayer = this.players[nextIndex]
          this.round.host = nextPlayer.id
          return
        }
      }
    }
  }

  checkWinCondition() {
    if (this.winCondition === WIN_ALL_CARDS) {
      if (this.deck.blackCards.every(c => this.isBlackCardUsed(c))) {
        this.gameOver()
      }
    }
    if (this.winCondition === WIN_N_ROUNDS) {
      if (this.finishedRounds.length >= this.maxRounds) {
        this.gameOver()
      }
    }
    if (this.winCondition === WIN_N_POINTS) {
      const higherPoints = Math.max(...this.players.map(p => p.points))
      if (higherPoints >= this.maxPoints) {
        this.gameOver()
      }
    }
  }

  gameOver() {
    this.finished = true
    return this
  }

  isBlackCardUsed(card) {
    return this.usedCards.has(JSON.stringify(card))
  }

  useBlackCard(card) {
    this.usedCards.add(JSON.stringify(card))
  }

  drawBlackCard() {
    const card = this.deck.blackCards.find(c => !this.isBlackCardUsed(c))
    this.useBlackCard(card)
    this.round.blackCard = card
    return this
  }

  drawWhiteCards(playerId) {
    const player = this.players.find(p => p.id === playerId)
    const numCardsMissing = this.cardsPerHand - player.cards.length
    let newCards = this.deck.whiteCards.filter(c => !this.usedCards.has(c)).slice(0, numCardsMissing)
    if (newCards.length < numCardsMissing) {
      console.log('> Recovering white cards')
      this.recoverUsedWhiteCards()
      newCards = this.deck.whiteCards.filter(c => !this.usedCards.has(c)).slice(0, numCardsMissing)
    }
    for (const card of newCards) {
      player.cards.push(card)
      this.usedCards.add(card)
    }
    return this
  }

  recoverUsedWhiteCards() {
    const whiteCardsInUse = this.round.whiteCards.map(c => c.card)
    for (const card of this.deck.whiteCards) {
      if (whiteCardsInUse.indexOf(card) === -1 && this.usedCards.has(card)) {
        this.usedCards.delete(card)
      }
    }
    shuffle(this.deck.whiteCards)
  }

  playWhiteCards(cards, playerId) {
    const playerHasPlayed = this.round.whiteCards.some(c => c.playerId === playerId)
    if (!playerHasPlayed) {
      const pick = this.round.blackCard.pick || 1
      for (const card of cards.slice(0, pick)) {
        this.round.addWhiteCard(card, playerId)
      }
      const player = this.players.find(p => p.id === playerId)
      player.cards = player.cards.filter(c => cards.indexOf(c) === -1)
      this.drawWhiteCards(playerId)
    }
    return this
  }

  discardWhiteCard (cards, playerId) {
    const player = this.players.find(p => p.id === playerId)
    player.cards = player.cards.filter(c => cards.indexOf(c) === -1)
    this.drawWhiteCards(playerId)
    return this
  }

  revealCard(playerId) {
    this.round.revealWhiteCards(playerId)
    return this
  }
}

module.exports = Game
