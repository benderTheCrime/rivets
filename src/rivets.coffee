Rivets =
  sightglass: require 'sightglass'
  TypeParser: require './parser/type-parser.coffee'
  TextTemplateParser: require './parser/text-template-parser.coffee'

  options: [
    'prefix'
    'templateDelimiters'
    'rootInterface'
    'preloadData'
    'handler',
    'executeFunctions'
  ]

  extensions: [
    'binders'
    'formatters'
    'adapters'
  ]

  public:
    formatters: call: (value, args...) -> value.call @, args...
    adapters: require './adapter.coffee'
    prefix: 'cb'
    templateDelimiters: [ '{', '}' ]
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

Rivets.public.binders = require('./binder.coffee') Rivets

# TODO remove concept of public
# TODO remove extensions & options
# TODO finish fixing binders
# TODO remove comments, one line iterationAlias
# TODO remove components
# TODO remove component binding

module.exports = Rivets.public;