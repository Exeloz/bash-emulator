import completeCommand from './emulator_autocomplete.js'
import adjustFontSize from './font_size_adjust.js'
import run from './emulator_functions.js'

const ENTER = 13
const UP = 38
const DOWN = 40
const PLUS = 107
const MINUS = 109

function keepScrolledDownForInput () {
  const scrollHeight = document.body.scrollHeight
  window.scrollTo(0, scrollHeight)
}

function attachEventListeners (document, emulator) {
  const body = document.body
  const input = document.getElementById('input')

  addKeyDownEventListener(document, emulator)

  addKeyUpEventListener(document, emulator)

  addWheelEventListener(body, emulator)

  addClickEventListener(body, input)
}

function addKeyDownEventListener (document, emulator) {
  const input = document.getElementById('input')

  input.addEventListener('keydown', function (e) {
    handleMainKeyDown(e, input, emulator)
    handleCtrlKeyDown(e, document.body, emulator)
  })
}

function handleMainKeyDown (e, element, emulator) {
  if (isModifierKey(e)) {
    return
  }
  if (e.which === UP || e.which === DOWN) {
    e.preventDefault()
    completeCommand(e.which, element, emulator)
    keepScrolledDownForInput()
  }
}

function handleCtrlKeyDown (e, element, emulator) {
  if (isModifierKey(e)) {
    return
  }
  if (e.ctrlKey) {
    e.preventDefault()
    if (e.which === PLUS) {
      adjustFontSize(element, 1.1)
    } else if (e.which === MINUS) {
      adjustFontSize(element, 0.9)
    }
  }
}

function addKeyUpEventListener (document, emulator) {
  const input = document.getElementById('input')

  input.addEventListener('keyup', function (e) {
    handleKeyUp(e, input)
  })
}

function handleKeyUp (e, input) {
  if (e.which !== ENTER) {
    return
  }
  run(input.value).then(function () {
    input.value = ''
    document.body.scrollTop = 10e6
  })
}

function addClickEventListener (element, input) {
  element.addEventListener('click', function (e) {
    handleClick(e, input)
  })
}

function handleClick (e, input) {
  // Prevent when user is selecting text
  if (!window.getSelection().isCollapsed) {
    return
  }
  input.focus()
}

function addWheelEventListener (element) {
  element.addEventListener(
    'wheel',
    function (e) {
      handleWheel(e, element)
    },
    { passive: false }
  )
}

function handleWheel (e, element) {
  if (e.ctrlKey) {
    e.preventDefault()
    adjustFontSize(element, 1.0 - e.deltaY / 1000.0)
  }
}

function isModifierKey (e) {
  return e.altKey || e.metaKey || e.shiftKey
}

export default attachEventListeners
