
BaseView = require '../core/BaseView'
getByRole = (require '../helpers/dom').getByRole
device = require '../core/device'
debug = require '../core/debug'
views = require '../core/views'

EndGameModal = require '../ui/modals/EndGameModal'
PauseModal = require '../ui/modals/PauseModal'

World = require '../game/World'
GameControls = require '../game/controls/GameControls'
userData = require '../game/utils/userData'
phys = require '../game/utils/physics'
achievements = require '../game/utils/achievements'

TutorialModal = require '../ui/modals/TutorialModal'

# Cache jQuery-wrapped window object
win = $ window

# Milliseconds duration of intro animation (showing player and target if not visible already)
introDuration = if debug.skipAnimations then 0 else 2400

###
## Game View class

Loads a level's data, wraps, initialises and runs game logic
###

class GameView extends BaseView
  templateName: 'game'
  classNames:   'view-game'
  fixHeight:    true

  constructor: (@levelName) ->
    super

    @shots = null         # Available shots count
    @targetsCount = null  # Number of targets still active
    @stars = 3            # Count of stars left
    @finished = false     # Game was finished

  getElements: ->
    super

    @elements.pause = getByRole 'pause', @elements.main         # Pause button
    @elements.reset = getByRole 'reset', @elements.main         # Reset button
    @elements.shots = getByRole 'shots-counter', @elements.main # Shots display

  bind: ->
    super

    # Go full-screen
    window.scrollTo 0, 0

    # Instanciate the World (Containing the core of the game logic)
    @world = new World @elements.main, @levelName

    @elements.reset.on (device.getEvent 'mousedown'), (e) =>
      @restart()

    # Bind pause button
    @elements.pause.on (device.getEvent 'mousedown'), (e) =>
      context = title: 'Pause'
      options = game: @, levelName: @levelName
      new PauseModal @elements.main, context, options
      e.preventDefault()

    (_ @world).on 'shoot', => @setShots @shots - 1
    (_ @world).on 'pot', =>
      @setTargetsCount @targetsCount - 1

    # Disable scrolling
    ($ document).on "touchmove", @onTouchMove

  onTouchMove: (e) ->
    window.scrollTo 0, 0
    e.preventDefault()

  resize: ->
    super

    if @world?
      @world.viewport.resize()

  # Re-initialise this view with same level to restart the game
  restart: ->
    views.open 'game', null, null, false, @levelName

  # Called when all level data has been loaded
  transitionComplete: ->
    super

    @world.onReady => @startGame()

  startGame: ->
    @world.play()

    # Show tutorial if level has one
    tutorial = @world.level.data.tutorial
    if tutorial
      new TutorialModal @elements.main, tutorial

    # Fetch base game entities
    @player = @world.getItemById 'player'
    @targets = @world.getItemsByAttr 'type', 'target'

    # Bind player death
    (_ @player).on 'die', => @finish false

    # Initialise game stats
    @setShots @world.level.data.shots
    @setTargetsCount @targets.length

    @showIntro => @enableControls()

  setTargetsCount: (amt) ->
    @targetsCount = amt

    # End the game if all targets were hit
    if amt is 0
      @finish true

  finish: (win = false) ->
    @player.behaviour.win()

    if not @finished
      @finished = true

      # Render and show end of game modal
      modalTitle = if win then "Level #{@levelName} Complete!" else "Ouch!"
      context = win: win, title: modalTitle
      options = stars: @stars, game: @, levelName: @levelName

      if win
        userData.saveLevelScore @levelName, @stars
        @checkWinningAchievements()

      new EndGameModal @elements.main, context, options

  # Check conditions to unlock achievements related to levels completion
  checkWinningAchievements: ->
    progress = userData.getLevelsProgress()
    allCompleted = true
    allStars = true

    achievements.unlock 'novice'
    
    if @shots > 0
        achievements.unlock 'hacker'

    for level in progress
      if not level.completed
        allCompleted = false
        allStars = false
      else if level.stars < 3
        allStars = false

    if allCompleted
      localStorage.gameCompleted = true
      achievements.unlock 'champion'

    if allStars
      achievements.unlock 'master'

  setShots: (amt) ->
    @shots = amt

    # Update shots display and stars count
    if amt < -2 then @setStars 0
    else if amt < -1 then @setStars 1
    else if amt < 0 then @setStars 2

    @elements.shots.text amt

  setStars: (amt) ->
    # Add custom class to shots display depending on current stars scoring
    if @stars isnt amt
      @elements.shots.removeClass "stars-#{@stars}"
      @stars = amt
      @elements.shots.addClass "stars-#{@stars}"

  # Initialise game controls
  enableControls: ->
    @world.loop.use => @update()
    @controls = new GameControls @
    @controls.on()

  # Show intro animation if target and players don't fit in viewport
  showIntro: (callback) ->
    @viewportFits = @world.viewport.fits()
    if not @viewportFits
      @world.viewport.followEntity @targets[0], introDuration / 2, =>
        @world.viewport.followEntity @player, introDuration / 2, =>
          callback()
    else callback()

  unbind: ->
    # Unbind events
    @elements.pause.off device.getEvent 'click'
    @elements.reset.off device.getEvent 'click'
    ($ document).off "touchmove", @onTouchMove

  close: ->
    super

    # Unbind game controls and stop gameloop
    @controls.off() if @controls?
    @world.stop() if @world?

  # Center viewport on player
  update: ->
    if not @viewportFits
      @world.viewport.followEntity @player

module.exports = GameView
