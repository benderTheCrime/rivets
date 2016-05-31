Rivets.TextBinding = class extends Rivets.Binding
  binder: routine: (node, value) ->
    node.data = value ? ''