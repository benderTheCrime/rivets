
Rivets.TextBinding = class extends Rivets.Binding
  constructor: (@view, @el, @type, @keypath, @options = {}) ->
    @formatters = @options.formatters or []
    @dependencies = []
    @formatterObservers = {}
  binder: routine: (node, value) -> node.data = value ? ''