module.exports = binders ->
  binders.checked =
    publishes: true
    priority: 2000

    bind: (el) -> el.addEventListener 'change', @publish
    unbind: (el) -> el.addEventListener 'change', @publish
    routine: (el, value) -> el.checked = !!value

  binders.unchecked =
    publishes: true
    priority: 2000

    bind: (el) -> el.addEventListener 'change', @publish
    unbind: (el) -> el.addEventListener 'change', @publish
    routine: (el, value) -> el.checked = !value

  binders