
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

defaults =
  gravity: [ 0, 0 ]

class World

  constructor: (@wrap, levelId, options = {}) ->
    @ready = false
    @readyCallbacks = []
    options = $.extend true, {}, defaults, options
    @gravity = options.gravity
    @layers = {}
    @stage = ($ renderer.render 'game-stage').appendTo @wrap
    @loop = new Loop

    @initPhysics()
    @loadLevel levelId
    @onReady => @start

  initPhysics: ->
    @gravity = new phys.Vector @gravity[0], @gravity[1]
    @b2dWorld = new phys.World @gravity, true
    
    window.setInterval =>
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

      layer = @addLayer 'entities', 'entity'
      for entity in (@loadLayerData 'entities').items
        layer.add entity

      @walls = new Walls @

      for body in (@loadLayerData 'walls').items
        @walls.add body
      @walls.refresh()

      @ready = true
      cb() for cb in @readyCallbacks

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
    for layerId, layer of @layers
      for item in layer.items
        if item.id is id then return item
    return null

  start: ->
    @loop.use => @update()
    if debug.debugPhysics then debugHelpers.initPhysicsDebugger @

  update: -> layer.update() for layerId, layer of @layers

module.exports = World
