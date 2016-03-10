module.exports = (Rivets) ->
  class
    constructor: (@els, @models, options = {}) ->
      publicKeys = [
        'prefix'
        'preloadData'
        'handler'
        'executeFunctions'
        'binders'
        'formatters'
        'adapters'
        'rootAdapter'
        'rootInterface'
      ]
      @els = [ @els ] unless (@els instanceof Array)
      @[ key ] = Rivets[ key ] for key in publicKeys

      @build()

    options: => {}
    bindingRegExp: => new RegExp "^#{@prefix}-"
    buildBinding: (binding, node, type, declaration) =>
      options = {}

      pipes = (pipe.trim() for pipe in declaration.match /((?:'[^']*')*(?:(?:[^\|']+(?:'[^']*')*[^\|']*)+|[^\|]+))|^$/g)
      context = (ctx.trim() for ctx in pipes.shift().split '<')
      keypath = context.shift()

      options.formatters = pipes

      if dependencies = context.shift()
        options.dependencies = dependencies.split /\s+/

      @bindings.push new Rivets[binding] @, node, type, keypath, options

    # Parses the DOM tree and builds `Rivets.Binding` instances for every matched
    # binding declaration.
    build: =>
      @bindings = []

      parse = (node) =>
        if node.nodeType is 3
          parser = Rivets.TextTemplateParser

          if (tokens = parser.parse(node.data)).length
            unless tokens.length is 1 and tokens[0].type is parser.types.text
              for token in tokens
                text = document.createTextNode token.value
                node.parentNode.insertBefore text, node

                if token.type is 1
                  @buildBinding 'TextBinding', text, null, token.value
              node.parentNode.removeChild node
        else if node.nodeType is 1
          block = @traverse node

        unless block
          parse childNode for childNode in (n for n in node.childNodes)

        undefined

      parse el for el in @els

      @bindings.sort (a, b) ->
        (b.binder?.priority or 0) - (a.binder?.priority or 0)

      undefined

    traverse: (node) =>
      bindingRegExp = @bindingRegExp()
      block = node.nodeName is 'SCRIPT' or node.nodeName is 'STYLE'

      for attribute in node.attributes
        if bindingRegExp.test attribute.name
          type = attribute.name.replace bindingRegExp, ''

          unless binder = @binders[type]
            for identifier, value of @binders
              if identifier isnt '*' and identifier.indexOf('*') isnt -1
                regexp = new RegExp "^#{identifier.replace(/\*/g, '.+')}$"
                if regexp.test type
                  binder = value

          binder or= @binders['*']

          if binder.block
            block = true
            attributes = [attribute]

      for attribute in attributes or node.attributes
        if bindingRegExp.test attribute.name
          type = attribute.name.replace bindingRegExp, ''
          @buildBinding 'Binding', node, type, attribute.value

      block

    select: (fn) => binding for binding in @bindings when fn binding

    # Binds all of the current bindings for this view.
    bind: =>
      binding.bind() for binding in @bindings
      undefined

    # Unbinds all of the current bindings for this view.
    unbind: =>
      binding.unbind() for binding in @bindings
      undefined

    # Syncs up the view with the model by running the routines on all bindings.
    sync: =>
      binding.sync?() for binding in @bindings
      undefined

    # Publishes the input values from the view back to the model (reverse sync).
    publish: =>
      binding.publish() for binding in @select (b) -> b.binder?.publishes
      undefined

    # Updates the view's models along with any affected bindings.
    update: (models = {}) =>
      @models[key] = model for key, model of models
      binding.update? models for binding in @bindings
      undefined