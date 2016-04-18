Observer = Rivets.Observer = class
  constructor: (@callbacks = []) ->
    @id = '_'
    @counter = 0
    @weakmap = {}

  observe: (obj, keypath, callback) ->
    @obj = obj
    @keypath = keypath
    callbacks = @weakReference(obj).callbacks
    value = null
    keys = keypath.split '.'
    key = keys.pop()
    parentKeypath = keys.join '.'

    @target = parentValue = if parentKeypath then @walkObjectKeypath(obj, parentKeypath) else obj

    value = parentValue[ key ] if parentValue

    if parentValue and typeof parentValue is 'object' and parentValue.hasOwnProperty key
      unless callbacks[ keypath ]?
        callbacks[ keypath ] = []

      Object.defineProperty parentValue, key,
        enumerable: true
        configurable: true
        get: -> value
        set: (newValue) =>
          if value isnt newValue
            value = newValue
            @observe obj, keypath, callback
            cb() for cb in callbacks[ keypath ]

      unless callback in callbacks[ keypath ]
        callbacks[ keypath ].push callback

      @observeMutations parentValue, obj[@id], key

  weakReference: (obj) ->
    unless obj.hasOwnProperty @id
      id = (@counter += 1)
      Object.defineProperty obj, @id, value: id

    @weakmap[ obj[ @id ] ] or= callbacks: @callbacks

  observeMutations: (obj, ref, keypath) ->
    if Array.isArray obj
      map = @weakReference obj

      unless map.pointers?
        map.pointers = {}
        functions = ['push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice']
        @stubFunction obj, fn for fn in functions

      map.pointers[ref] ?= []

      unless keypath in map.pointers[ref]
        map.pointers[ref].push keypath

  stubFunction: (obj, fn) ->
    original = obj[fn]
    map = @weakReference obj
    weakmap = @weakmap

    obj[fn] = ->
      response = original.apply obj, arguments

      for r, k of map.pointers
        callback() for callback in weakmap[r]?.callbacks[k] ? []

      response

  get: () -> @walkObjectKeypath.call @, @obj, @keypath
  set: (value) -> @walkObjectKeypath.call @, @obj, @keypath, value

  walkObjectKeypath: (obj, keypath, value) ->
    keys = keypath.split '.'
    lastKey = keys.slice(-1)[ 0 ]
    val = obj

    if keys.length
      for key in keys
        if key is lastKey
          if value
            val = val[ key ] = value
          else if val[key]?
            val = val[ key ]
          else
            val = null
        else if val[ key ]?
          val = val[ key ]
        else
          val = {}

    val