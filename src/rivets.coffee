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
    'components'
    'adapters'
  ]

  # The public interface (this is the exported module object).
  public:

    # Global components.
    components: {}

    # Global formatters.
    formatters: call: (value, args...) -> value.call @, args...

    # Global sightglass adapters.
    adapters: require './adapter.coffee'

    # Default attribute prefix.
    prefix: 'cb'

    # Default template delimiters.
    templateDelimiters: [ '{', '}' ]

    # Default sightglass root interface.
    rootInterface: '.'

    # Preload data by default.
    preloadData: true

    # Execute functions in bindings. Defaultis false since rivets 0.9. Set to true to be backward compatible with rivets 0.8.
    executeFunctions: true

    # Alias for index in rv-each binder
    iterationAlias : (modelName) ->
      return '%' + modelName + '%'

    # Default event handler.
    handler: (context, ev, binding) ->
      @call binding.view.models.scope, ev, context

    # Binds some data to a template / element. Returns a Rivets.View instance.
    bind: (el, models = {}, options = {}) ->
      view = new Rivets.View(el, models, options)
      view.bind()
      view

Rivets.View = require('./view.coffee') Rivets
Rivets.Binding = require('./binding/binding.coffee') Rivets
Rivets.ComponentBinding = require('./binding/component-binding.coffee') Rivets
Rivets.TextBinding = require('./binding/text-binding.coffee') Rivets

Rivets.public.binders = require('./binder.coffee') Rivets

# TODO remove concept of public
# TODO remove extensions & options
# TODO finish fixing binders
# TODO remove comments, one line iterationAlias
# TODO remove components
# TODO remove component binding

module.exports = Rivets.public;