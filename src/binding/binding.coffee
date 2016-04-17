Rivets.Binding = class
  constructor: (@view, @el, @type, @keypath) ->
    @formatters = []
    @formatterObservers = {}
    @model = undefined
    @callbacks = @view.callbacks or []
    @setBinder()

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
    observer = new Observer @callbacks
    observer.observe arguments...
    observer

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

  eventHandler: (fn) => (ev) => Rivets.handler.call fn, @, ev, @

  set: (value) => @binder.routine?.call @, @el, @formattedValue value

  sync: =>
    @set if @observer
      @observer.get()
    else
      @value

  publish: =>
    if @observer
      value = @getValue @el

      for formatter in @formatters.slice(0).reverse()
        args = formatter.split /\s+/
        id = args.shift()

        if @view.formatters[id]?.publish
          value = @view.formatters[id].publish value, args...

      @observer.set value

  bind: =>
    token = Rivets.TypeParser.parse @keypath

    if token.type is 0
      @value = token.value
    else
      @observer = @observe @view.models, @keypath, @sync
      @model = @observer.target

    @binder.bind?.call @, @el
    @sync()

  unbind: =>
    @binder.unbind?.call @, @el
    @formatterObservers = {}
    delete @observer

  update: (models = {}) =>
    @model = @observer?.target
    @binder.update?.call @, models

  getValue: (el) =>
    if @binder and @binder.getValue?
      @binder.getValue.call @, el
    else
      @getInputValue el

  getInputValue: (el) -> if el.type is 'checkbox' then el.checked else el.value