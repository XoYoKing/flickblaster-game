
gameData = require './gameData'
Layer = require './Layer'
device = require '../core/device'
renderer = require '../core/renderer'
debug = require '../core/debug'
debugHelpers = require '../helpers/debug'
phys = require '../helpers/physics'
Loop = require './Loop'
Viewport = require './Viewport'
Walls = require './Walls'
Lasers = require './Lasers'
CollisionManager = require './CollisionManager'

defaults =
  gravity: [ 0, 0 ]

class World

  constructor: (@wrap, levelId, options = {}) ->
    @ready = false
    @readyCallbacks = []
    options = $.extend true, {}, defaults, options
    @gravity = options.gravity
    @items = []
    @layers = {}
    @stage = ($ renderer.render 'game-stage').appendTo @wrap
    @loop = new Loop

    @initPhysics()
    @loadLevel levelId
    @onReady => @start

  initPhysics: ->
    fps = @loop.getFPS()

    @gravity = new phys.Vector @gravity[0], @gravity[1]
    @b2dWorld = new phys.World @gravity, true
    @collisionManager = new CollisionManager @

    @playPhysics()

  playPhysics: ->
    @b2dInterval = window.setInterval =>
      @b2dWorld.Step 1 / 60, 10, 10
      @b2dWorld.ClearForces()
    , 1000 / 60

  onReady: (callback) ->
    if @ready then callback()
    else @readyCallbacks.push callback

  loadLevel: (levelId, callback) ->
    gameData.loadLevel levelId, (level) =>
      @level = level
      @viewport = new Viewport @stage, @level.size[0], @level.size[1]

      @addLayer 'lasers', 'entity'
      @addLayer 'entities', 'entity'

      @walls = new Walls @
      @lasers = new Lasers @, @getLayerById 'lasers'

      for entity in (@loadLayerData 'entities').items
        @addItem 'entities', entity

      for body in (@loadLayerData 'walls').items
        @walls.add body
      @walls.refresh()

      for laser in (@loadLayerData 'lasers').items
        entity = @addItem 'lasers', laser
        entity.elements = @lasers.add laser
      @lasers.refresh()

      @ready = true

      cb() for cb in @readyCallbacks

  addItem: (layerId, item) ->
    layer = @getLayerById layerId
    item = layer.add item
    @items.push item
    return item

  loadLayerData: (layerId) ->
    if layerId?
      for layer in @level.layers
        if layer.id is layerId then return layer
    return null

  addLayer: (id, type) -> @layers[id] = new Layer @, type, id

  getLayerById: (layerId) ->
    if @layers[layerId] then return @layers[layerId]
    return null

  addBody: (body) -> return @b2dWorld.CreateBody(body.bodyDef).CreateFixture body.fixtureDef

  getItemById: (id) ->
    for item in @items
      if item.id is id then return item
    return null

  getItemsByAttr: (attr, value) ->
    matches = []
    for item in @items
      if item.attributes?
        if (_.has item.attributes, attr) and item.attributes[attr] is value
          matches.push item
    return matches

  start: ->
    @initBehaviours()
    @loop.use => @update()
    if debug.debugPhysics then debugHelpers.initPhysicsDebugger @

  play: ->
    @loop.play()
    @playPhysics()

  stop: ->
    @loop.pause()
    clearInterval @b2dInterval

  initBehaviours: ->
    for item in @items
      item.initBehaviour() if item.itemType is 'entity'

  update: -> layer.update() for layerId, layer of @layers

module.exports = World
