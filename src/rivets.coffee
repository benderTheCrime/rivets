Rivets =
  STRING_TEMPLATE_REGEXP: /\{{1,2}\s+?([a-z0-9\.]+)\s+?\}{1,2}/gi
  formatters: call: (value, args...) -> value.call @, args...
  iterationAlias: (modelName) -> "%#{modelName}%"
  handler: (instance, event, binding) ->
    @call binding.view.models, event, event.target, binding.view.models
  bind: (el, models = {}, options = {}) ->
    view = new Rivets.View(el, models, options)
    view.bind()
    view