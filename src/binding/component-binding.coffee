module.exports = (Rivets) ->
  class extends Rivets.Binding
    constructor: (@view, @el, @type) ->
      @component = @view.components[@type]
      @static = {}
      @observers = {}
      @upstreamObservers = {}

      bindingRegExp = view.bindingRegExp()

      for attribute in @el.attributes or []
        unless bindingRegExp.test attribute.name
          propertyName = @camelCase attribute.name

          token = Rivets.TypeParser.parse(attribute.value)

          if propertyName in (@component.static ? [])
            @static[propertyName] = attribute.value
          else if token.type is 0
            @static[propertyName] = token.value
          else
            @observers[propertyName] = attribute.value

    sync: ->
    update: ->
    publish: ->
    locals: =>
      result = {}

      for key, value of @static
        result[key] = value

      for key, observer of @observers
        result[key] = observer.value()

      result

    camelCase: (string) ->
      string.replace /-([a-z])/g, (grouped) ->
        grouped[1].toUpperCase()

    bind: =>
      unless @bound
        for key, keypath of @observers
          @observers[key] = @observe @view.models, keypath, ((key) => =>
            @componentView.models[key] = @observers[key].value()
          ).call(@, key)

        @bound = true

      if @componentView?
        @componentView.bind()
      else
        @el.innerHTML = @component.template.call this
        scope = @component.initialize.call @, @el, @locals()
        @el._bound = true

        options = {}

        for option in Rivets.extensions
          options[option] = {}
          options[option][k] = v for k, v of @component[option] if @component[option]
          options[option][k] ?= v for k, v of @view[option]

        for option in Rivets.options
          options[option] = @component[option] ? @view[option]

        @componentView = new Rivets.View(@el, scope, options)
        @componentView.bind()

        for key, observer of @observers
          @upstreamObservers[key] = @observe @componentView.models, key, ((key, observer) => =>
            observer.setValue @componentView.models[key]
          ).call(@, key, observer)
      return

    # Intercept `Rivets.Binding::unbind` to be called on `@componentView`.
    unbind: =>
      for key, observer of @upstreamObservers
        observer.unobserve()

      for key, observer of @observers
        observer.unobserve()

      @componentView?.unbind.call @