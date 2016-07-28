View = require '../view.coffee'

binders = {}

binders.text = (el, value = '') ->
  el[ if el.textContent then 'textContent' else 'innerText' ] = value

binders.html =
  priority: 4000
  routine: (el, value) ->
    return binders.text el, value if typeof value is 'string'

    if value instanceof HTMLElement
      @nested = new View value, @view.models, @view.callbacks

      @nested.bind()
      el.appendChild value
  unbind: (el) ->
    if @nested and typeof @nested.unbind is 'function'
      @nested.unbind()
      el.removeChild child for child in @nested.els

binders.show = (el, value) -> el.style.display = if value then '' else 'none'
binders.hide = (el, value) -> el.style.display = if value then 'none' else ''
binders.enabled = (el, value) -> el.disabled = !value
binders.disabled = (el, value) -> el.disabled = !!value

binders.value =
  publishes: true
  priority: 3000

  bind: (el) ->
    tagName = el.tagName
    type = el.type

    unless tagName is 'INPUT' and type is 'radio'
      @event = if tagName is 'SELECT' or type is 'checkbox' then 'change' else 'input'
      el.addEventListener @event, @publish

  unbind: (el) ->
    unless el.tagName is 'INPUT' and el.type is 'radio'
      el.removeEventListener @event, @publish

  routine: (el, value = '') ->
    setValue = () -> el.value = value if value?.toString() isnt el.value?.toString()
    tagName = el.tagName
    type = el.type

    if tagName is 'INPUT'
      if type is 'radio'
        el.setAttribute 'value', value
      else if type is 'checkbox'
        el.checked = value
      else setValue()
    else setValue()

binders.if =
  block: true
  priority: 5000

  bind: (el) ->
    unless @marker?
      attr = [ 'cb', @type ].join('-').replace '--', '-'
      declaration = el.getAttribute attr

      @marker = document.createComment " rivets: #{@type} #{declaration} "
      @bound = false

      el.removeAttribute attr
      el.parentNode.insertBefore @marker, el
      el.parentNode.removeChild el

  unbind: -> @nested?.unbind()
  routine: (el, value) ->
    if !!value is not @bound
      if value

        (@nested = new View el, @view.models, @view.callbacks).bind()
        @marker.parentNode.insertBefore el, @marker.nextSibling
        @bound = true
      else
        el.parentNode.removeChild el
        @nested.unbind()
        @bound = false

  update: (models) -> @nested?.update models

binders.unless =
  block: true
  priority: 5000

  bind: (el) -> binders.if.bind.call @, el
  unbind: -> binders.if.unbind.call @
  routine: (el, value) -> binders.if.routine.call @, el, not value
  update: (models) -> binders.if.update.call @, models

binders[ 'on-*' ] =
  function: true
  priority: 1000

  unbind: (el) -> el.removeEventListener @args[0], @handler if @handler
  routine: (el, value) ->
    el.removeEventListener @args[0], @handler if @handler
    el.addEventListener @args[0], @handler = @eventHandler value

binders[ 'each-*' ] =
  block: true
  priority: 4000

  bind: (el) ->
    unless @marker?
      attr = [ 'cb', @type ].join('-').replace '--', '-'
      @marker = document.createComment " rivets: #{@type} "
      @iterated = []

      el.removeAttribute attr
      el.parentNode.insertBefore @marker, el
      el.parentNode.removeChild el
    else view.bind() for view in @iterated


  unbind: (el) -> view.unbind() for view in @iterated if @iterated?
  routine: (el, collection) ->
    modelName = @args[ 0 ]
    collection = collection or []

    while @iterated.length > collection.length
      view = @iterated.pop()
      view.unbind()
      @marker.parentNode.removeChild view.els[ 0 ]

    for model, index in collection
      data = @view.models
      data[ modelName ] = model

      unless @iterated[ index ]
        template = el.cloneNode true
        view = new View template, data, @view.callbacks
        previous = if @iterated[ index - 1 ] then @iterated[ index - 1 ].els[ 0 ] else @marker

        @marker.parentNode.insertBefore template, previous.nextSibling
        @iterated.push view
      else
        view = new View @iterated[ index ].els[ 0 ], data, @view.callbacks

        @iterated[ index ].unbind()
        @iterated[ index ] = view

      view.bind()

      delete data[ modelName ]

    if el.nodeName is 'OPTION'
      for binding in @view.bindings
        if binding.el is @marker.parentNode and binding.type is 'value'
          binding.sync()

binders[ 'class-*' ] = (el, value) ->
  elClass = " #{el.className} "

  if !value is (elClass.indexOf(" #{@args[0]} ") isnt -1)
    el.className = if value
      "#{el.className} #{@args[0]}"
    else
      elClass.replace(" #{@args[0]} ", ' ').trim()

binders[ 'no-class-*' ] = (el, value) -> binders[ 'class-*' ].call @, el, not value
binders[ '*' ] = (el, value) -> el[ if value then 'setAttribute' else 'removeAttribute' ] @type, value

module.exports = binders