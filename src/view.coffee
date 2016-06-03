Rivets.View = class
  constructor: (@els, @models, @callbacks = {}) ->
    @els = [ @els ] unless @els instanceof Array
    @binders = Rivets.binders
    @build()

  bindingRegExp: => new RegExp "^cb-"
  buildBinding: (binding, node, type, declaration) =>
    formatters = (pipe.trim() for pipe in declaration.match /((?:'[^']*')*(?:(?:[^\|']+(?:'[^']*')*[^\|']*)+|[^\|]+))|^$/g)
    context = (ctx.trim() for ctx in formatters.shift().split '<')
    keypath = context.shift()

    @bindings.push new Rivets[ binding ] @, node, type, keypath, formatters

  build: =>
    @bindings = []

    parse = (node) =>
      unless (if node.nodeType is 1 then @traverse(node) else null)
        parse childNode for childNode in (n for n in node.childNodes)

    parse el for el in @els

    @bindings.sort (a, b) -> (b.binder?.priority or 0) - (a.binder?.priority or 0)

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

        binder or= @binders[ '*' ]

        if binder.block
          block = true
          attributes = [attribute]

    for attribute in attributes or node.attributes
      if bindingRegExp.test attribute.name
        type = attribute.name.replace bindingRegExp, ''
        @buildBinding 'Binding', node, type, attribute.value

    block

  select: (fn) => binding for binding in @bindings when fn binding
  bind: => binding.bind() for binding in @bindings
  unbind: => binding.unbind() for binding in @bindings
  publish: => binding.publish() for binding in @select (b) -> b.binder?.publishes
  update: (models = {}) =>
    @models[ key ] = model for key, model of models
    binding.update? models for binding in @bindings