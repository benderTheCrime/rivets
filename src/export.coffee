Rivets.factory = (sightglass) ->
  Rivets.sightglass = sightglass
  Rivets.public

module.exports = Rivets.factory require('sightglass')