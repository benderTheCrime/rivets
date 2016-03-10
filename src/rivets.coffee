Rivets =
  sightglass: require 'sightglass'
  TypeParser: require './parser/type-parser.coffee'
  TextTemplateParser: require './parser/text-template-parser.coffee'
  formatters: call: (value, args...) -> value.call @, args...
  adapters: require './adapter.coffee'
  prefix: 'cb'
  rootInterface: '.'
  preloadData: true
  executeFunctions: true
  iterationAlias : (modelName) -> "%#{modelName}%"
  handler: (context, ev, binding) -> @call binding.view.models.scope, ev, context
  bind: (el, models = {}, options = {}) ->
    view = new Rivets.View(el, models, options)
    view.bind()
    view

Rivets.View = require('./view.coffee') Rivets
Rivets.Binding = require('./binding/binding.coffee') Rivets
Rivets.TextBinding = require('./binding/text-binding.coffee') Rivets
Rivets.binders = require('./binder.coffee') Rivets

module.exports = Rivets;