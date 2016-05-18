Rivets =
  STRING_TEMPLATE_REGEXP: /\{{1,2}\s+?([a-z0-9\.]+)\s+?\}{1,2}/gi
  formatters: call: (value, args...) -> value.call @, args...
  handler: (instance, event, binding) ->
    @call(binding.view.models, event, event.target, binding.view.models) if @
  bind: (el, models = {}) ->
    view = new Rivets.View el, models
    view.bind()
    view