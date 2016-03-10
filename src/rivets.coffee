# The Rivets namespace.
Rivets =
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
    # Global binders.
    binders: {}

    # Global components.
    components: {}

    # Global formatters.
    formatters: {}

    # Global sightglass adapters.
    adapters: {}

    # Default attribute prefix.
    prefix: 'cb'

    # Default template delimiters.
    templateDelimiters: [ '{', '}' ]

    # Default sightglass root interface.
    rootInterface: '.'

    # Preload data by default.
    preloadData: true,

    # Execute functions in bindings. Defaultis false since rivets 0.9. Set to true to be backward compatible with rivets 0.8.
    executeFunctions: true,

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