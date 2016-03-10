module.exports = (Rivets) ->
  class
    constructor: (@view, @el, @type, @keypath, @options = {}) ->
      @formatters = @options.formatters or []
      @dependencies = []
      @formatterObservers = {}
      @model = undefined
      @setBinder()

    # Sets the binder to use when binding and syncing.
    setBinder: =>
      unless @binder = @view.binders[@type]
        for identifier, value of @view.binders
          if identifier isnt '*' and identifier.indexOf('*') isnt -1
            regexp = new RegExp "^#{identifier.replace(/\*/g, '.+')}$"
            if regexp.test @type
              @binder = value
              @args = new RegExp("^#{identifier.replace(/\*/g, '(.+)')}$").exec @type
              @args.shift()

      @binder or= @view.binders['*']
      @binder = {routine: @binder} if @binder instanceof Function

    observe: (obj, keypath, callback) =>
      Rivets.sightglass obj, keypath, callback,
        root: @view.rootInterface
        adapters: @view.adapters

    parseTarget: =>
      token = Rivets.TypeParser.parse @keypath

      if token.type is 0
        @value = token.value
      else
        @observer = @observe @view.models, @keypath, @sync
        @model = @observer.target

    # Applies all the current formatters to the supplied value and returns the
    # formatted value.
    formattedValue: (value) =>
      for formatter, fi in @formatters
        args = formatter.match /[^\s']+|'([^']|'[^\s])*'|"([^"]|"[^\s])*"/g
        id = args.shift()
        formatter = @view.formatters[id]

        args = (Rivets.TypeParser.parse(arg) for arg in args)
        processedArgs = []

        for arg, ai in args
          processedArgs.push if arg.type is 0
            arg.value
          else
            @formatterObservers[fi] or= {}

            unless observer = @formatterObservers[fi][ai]
              observer = @observe @view.models, arg.value, @sync
              @formatterObservers[fi][ai] = observer

            observer.value()

        if formatter?.read instanceof Function
          value = formatter.read.call @model, value, processedArgs...
        else if formatter instanceof Function
          value = formatter.call @model, value, processedArgs...

      value

    # Returns an event handler for the binding around the supplied function.
    eventHandler: (fn) =>
      handler = (binding = @).view.handler
      (ev) -> handler.call fn, @, ev, binding

    # Sets the value for the binding. This Basically just runs the binding routine
    # with the suplied value formatted.
    set: (value) =>
      # Since 0.9 : doesn't execute function unless backward compatibility is active
      value = if (value instanceof Function and !@binder.function and Rivets.executeFunctions)
        @formattedValue value.call @model
      else
        @formattedValue value

      @binder.routine?.call @, @el, value

    # Syncs up the view binding with the model.
    sync: =>
      @set if @observer
        if @model isnt @observer.target
          observer.unobserve() for observer in @dependencies
          @dependencies = []

          if (@model = @observer.target)? and @options.dependencies?.length
            for dependency in @options.dependencies
              observer = @observe @model, dependency, @sync
              @dependencies.push observer

        @observer.value()
      else
        @value

    # Publishes the value currently set on the input element back to the model.
    publish: =>
      if @observer
        value = @getValue @el

        for formatter in @formatters.slice(0).reverse()
          args = formatter.split /\s+/
          id = args.shift()

          if @view.formatters[id]?.publish
            value = @view.formatters[id].publish value, args...

        @observer.setValue value

    # Subscribes to the model for changes at the specified keypath. Bi-directional
    # routines will also listen for changes on the element to propagate them back
    # to the model.
    bind: =>
      @parseTarget()
      @binder.bind?.call @, @el

      if @model? and @options.dependencies?.length
        for dependency in @options.dependencies
          observer = @observe @model, dependency, @sync
          @dependencies.push observer

      @sync() if @view.preloadData

    # Unsubscribes from the model and the element.
    unbind: =>
      @binder.unbind?.call @, @el
      @observer?.unobserve()

      observer.unobserve() for observer in @dependencies
      @dependencies = []

      for fi, args of @formatterObservers
        observer.unobserve() for ai, observer of args

      @formatterObservers = {}

    # Updates the binding's model from what is currently set on the view. Unbinds
    # the old model first and then re-binds with the new model.
    update: (models = {}) =>
      @model = @observer?.target
      @binder.update?.call @, models

    # Returns elements value
    getValue: (el) =>
      if @binder and @binder.getValue?
        @binder.getValue.call @, el
      else
        @getInputValue el

    getInputValue: (el) ->
      if el.type is 'checkbox' then el.checked
      else if el.type is 'select-multiple' then o.value for o in el when o.selected
      else el.value