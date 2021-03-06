
renderer =  require '../../core/renderer'
device = require '../../core/device'

Entity = require '../items/Entity'

templates =
  layer: 'partials/game-layer'

###
## Layer class

A layer contains and handles groups of Entities
It also provides the items a separate DOM element to render within, so than the order of display of
all items is manageable

It also takes care of their updating
###

class Layer

  constructor: (@world, @itemsType, @id) ->
    @viewport = @world.viewport
    @element = $ renderer.render templates.layer
    @element.appendTo @viewport.el
    @items = []

  # Creates and adds an Entity with the given options
  add: (options) =>
    # So far layers only support entities. Other types of item types
    if @itemsType is 'entity'
      item = new Entity options, @
    else return

    # Initialise item behaviour if World has already started
    item.initBehaviour() if @world.started

    @items.push item
    return item

  # Update all children
  update: =>
    for item in @items
      item.update() if not item.removed

module.exports = Layer
