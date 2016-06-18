Rivets.Binding = class
  constructor: (@view, @el, @type, @keypath, @formatters) ->
    @callbacks = @view.callbacks or {}
    @setBinder()

  setBinder: =>
    unless @binder = @view.binders[ @type ]
      for identifier, value of @view.binders
        if identifier isnt '*' and identifier.indexOf('*') isnt -1
          regexp = new RegExp "^#{identifier.replace(/\*/g, '.+')}$"
          if regexp.test @type
            @binder = value
            @args = new RegExp("^#{identifier.replace(/\*/g, '(.+)')}$").exec @type
            @args.shift()

    @binder or= @view.binders[ '*' ]
    @binder = { routine: @binder } if @binder instanceof Function

  observe: (obj, keypath, callback) =>
    observer = new Observer @callbacks
    observer.observe arguments...
    observer

  templatedValue: (value) =>
    if value and typeof value is 'string' and @observer
      for declaration in value.match(Rivets.STRING_TEMPLATE_REGEXP) ? []
        [ keypath, formatters ] = Rivets.View.parseDeclaration declaration.replace /[\{\}]/g, ''
        value = value.replace declaration, Rivets.Binding.formattedValue(@observer.walkObjectKeypath(@observer.obj, keypath) or '', formatters)

        @observer.observe @observer.obj, keypath, @sync

    Rivets.Binding.formattedValue value, @formatters

  eventHandler: (fn) => (ev) => Rivets.handler.call fn, @, ev, @
  set: (value) => @binder.routine?.call @, @el, @templatedValue value
  sync: => @set if @observer then @observer.get()
  publish: =>
    if @observer
      value = @getValue @el

      for formatter in @formatters.slice(0).reverse()
        args = formatter.split /\s+/
        id = args.shift()

      @observer.set value

  bind: =>
    token = Rivets.TypeParser.parse @keypath

    if token.type is 0
      @value = token.value
    else
      @observer = @observe @view.models, @keypath, @sync

    @binder.bind?.call @, @el
    @sync()

  unbind: =>
    @binder.unbind?.call @, @el
    delete @observer

  update: (models = {}) => @binder.update?.call @, models or @sync()

  getValue: (el) =>
    if @binder and @binder.getValue?
      @binder.getValue.call @, el
    else
      @getInputValue el

  getInputValue: (el) -> if el.type is 'checkbox' then el.checked else el.value

  @formattedValue: (value, formatters) =>
    for formatter, fi in formatters
      args = formatter.match /[^\s']+|'([^']|'[^\s])*'|"([^"]|"[^\s])*"/g
      id = args.shift()
      formatter = Rivets.formatters[ id ]
      value = formatter value or '' if formatter instanceof Function

    value