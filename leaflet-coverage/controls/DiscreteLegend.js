import L from 'leaflet'
import {$} from 'minified'
import d3 from 'd3'
import 'd3-legend'

import {inject} from './utils.js'
import * as i18n from '../util/i18n.js'

// TODO the default template should be moved outside this module so that it can be easily skipped
const DEFAULT_TEMPLATE_ID = 'template-coverage-parameter-discrete-legend'
const DEFAULT_TEMPLATE = `
<template id="${DEFAULT_TEMPLATE_ID}">
  <div class="info legend">
    <div style="margin-bottom:3px">
      <strong class="legend-title"></strong>
    </div>
    <div>
      <svg class="legend-palette"></svg>
    </div>
  </div>
</template>
`
const DEFAULT_TEMPLATE_CSS = `
.legend {
  text-align: left;
  line-height: 18px;
  color: #555;
}
`

/**
 * Displays a discrete palette legend for the parameter displayed by the given
 * Coverage layer. Supports category parameters only at the moment.
 * 
 * @example
 * new DiscreteLegend(covLayer).addTo(map)
 * 
 * @example <caption>Fake layer</caption>
 * var legend = new DiscreteLegend({parameter: {..}, palette: {...}}).addTo(map)
 * 
 * // either recreate the legend or update the fake layer in place:
 * legend.covLayer = {..}
 * legend.updateLegend()
 */
export default class DiscreteLegend extends L.Control {
  
  constructor (covLayer, options) {
    super(options.position ? {position: options.position} : {})
    this.covLayer = covLayer
    this.id = options.id || DEFAULT_TEMPLATE_ID
    this.language = options.language || i18n.DEFAULT_LANGUAGE
    this.d3LegendFn = options.d3LegendFn
    
    if (!options.id && document.getElementById(DEFAULT_TEMPLATE_ID) === null) {
      inject(DEFAULT_TEMPLATE, DEFAULT_TEMPLATE_CSS)
    }   

    if (covLayer.on) {
      // arrow function is broken here with traceur, this is a workaround
      // see https://github.com/google/traceur-compiler/issues/1987
      let self = this
      this._remove = function () {
        self.removeFrom(self._map)
      }
      covLayer.on('remove', this._remove)
    }
  }
  
  updateLegend () {
    let el = this._el
    
    let palette = this.covLayer.palette
    let param = this.covLayer.parameter
        
    let css = []
    for (let i=0; i < palette.steps; i++) {
      css.push(`rgb(${palette.red[i]}, ${palette.green[i]}, ${palette.blue[i]})`)
    }
    
    let categories = param.categories.map(c => i18n.getLanguageString(c.label, this.language))
    
    let ordinal = d3.scale.ordinal()
      .domain(categories)
      .range(css);

    let svgEl = $('.legend-palette', el)[0]
    svgEl.innerHTML = ''
    let svg = d3.select(svgEl)

    svg.append('g')
      .attr('class', 'legendOrdinal')
      .attr('transform', 'translate(20,20)')

    let legendOrdinal = d3.legend.color()
    if (this.d3LegendFn) {
      this.d3LegendFn(legendOrdinal)
    }
    legendOrdinal.scale(ordinal)
    svg.select('.legendOrdinal').call(legendOrdinal)
  }
  
  onRemove (map) {
    if (this.covLayer.off) {
      this.covLayer.off('remove', this._remove)
      this.covLayer.off('paletteChange', () => this.updateLegend())
    }
  }
  
  onAdd (map) {
    this._map = map
    
    if (this.covLayer.on) {
      this.covLayer.on('paletteChange', () => this.updateLegend())
    }
    
    let param = this.covLayer.parameter
    // if requested language doesn't exist, use the returned one for all other labels
    this.language = i18n.getLanguageTag(param.observedProperty.label, this.language) 
    let title = i18n.getLanguageString(param.observedProperty.label, this.language)
    
    let el = document.importNode($('#' + this.id)[0].content, true).children[0]
    this._el = el
    $('.legend-title', el).fill(title)
    this.updateLegend()
    
    return el
  }
  
}