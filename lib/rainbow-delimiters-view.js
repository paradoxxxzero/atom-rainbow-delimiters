'use babel'

export default class RainbowDelimitersView {

  constructor() {
    this.markers = []
  }

  serialize() {}

  destroy() {
    this.markers.map(marker => marker.destroy())
  }

  add(editor, range, type, char = 'none') {
    const marker = editor.markBufferRange(range)
    const item = document.createElement('div')
    item.classList.add('rainbow')
    item.classList.add(`rainbow-${ type }`)
    item.innerHTML = char
    editor.decorateMarker(
        marker, {
        type: 'overlay',
        class: 'rainbow-marker',
        item,
        avoidOverflow: false
      })
    this.markers.push(marker)
  }
}
