module.exports = (Rivets) ->
  class extends Rivets.Binding
    constructor: (@view, @el, @type, @keypath, @options = {}) ->
      @formatters = @options.formatters or []
      @dependencies = []
      @formatterObservers = {}
    binder:
      routine: (node, value) ->
        node.data = value ? ''
    sync: => super