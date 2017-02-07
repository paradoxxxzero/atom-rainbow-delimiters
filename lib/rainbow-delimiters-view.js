'use babel';

export default class RainbowDelimitersView {

  constructor(serializedState) {
    this.markers = []
  }

  serialize() {}

  destroy() {
    this.markers.map(marker => marker.destroy())
  }

  add(editor, range, type) {
    let marker = editor.markBufferRange(range)
    editor.decorateMarker(
      marker, { type: 'highlight', class: `rainbow-${ type }` })
    this.markers.push(marker)
  }
}
