
###
## Behaviours Index module

Routing map, assigns all behaviours to standardised keys so they match the behaviour specified
in Entities 'behaviour' attribute - usually through the editor

Read Entity to see how this module is used
###

base = require './BaseBehaviour'
player = require './PlayerBehaviour'
target = require './TargetBehaviour'
laser = require './LaserBehaviour'
button = require './ButtonBehaviour'
teleport = require './TeleportBehaviour'
sensor = require './SensorBehaviour'
turbo = require './TurboBehaviour'
cannon = require './CannonBehaviour'
bullet = require './BulletBehaviour'
rubberBall = require './RubberBallBehaviour'

module.exports = {
  base
  player
  target
  laser
  button
  teleport
  sensor
  turbo
  cannon
  bullet
  rubberBall
}
