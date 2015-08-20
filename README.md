# leaflet-coverage

A Leaflet plugin for visualizing [coverages](https://en.wikipedia.org/wiki/Coverage_data) with the help of the [JavaScript Coverage API](https://github.com/neothemachine/coverage-jsapi). Currently, it supports the domain types defined within [CoverageJSON](https://github.com/neothemachine/coveragejson).

Note that to *load* a coverage you have to use another library, depending on which formats you want to support. The only currently known coverage loader that can be used is the [covjson-reader](https://github.com/neothemachine/covjson-reader) for the [CoverageJSON](https://github.com/neothemachine/coveragejson) format.


## Example

### Default coverage visualization

```js
var map = L.map('map')
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="http://www.osm.org">OpenStreetMap</a>'
}).addTo(map)


// default renderers for common domain types
var CovLayerFactory = new L.CoverageLayerFactory()

CovLayerFactory(cov, {keys: ['salinity']}).on('loaded', function(e) {
  var covLayer = e.target
  map.fitBounds(covLayer.getBounds())
}).addTo(map)

// TODO the legend mechanism should be flexible and allow for external implementations
// A typical requirement is to have a single legend for multiple coverages and
// synchronize the coverage palettes, e.g. for a collection of profiles, or profile-grid comparison.
// In some cases a legend is not even desirable, e.g. for certain types of trajectories like GPX tracks, where
// the information is typically put along the track, on hovering, or in popups.
```

### Custom visualization

```js
var CovLayerFactory = new L.CoverageLayerFactory({
  renderer: MyGPXTrack
})

// alternatively, with more control for different domain types:
var CovLayerFactory = new L.CoverageLayerFactory({
  renderers: {
    'http://coveragejson.org/def/domains/Trajectory': MyGPXTrack
  }
})


CovLayerFactory(cov, {keys: ['distance', 'elevation', 'heartrate']}).on('loaded', function(e) {
  var covLayer = e.target
  map.fitBounds(covLayer.getBounds())
}).addTo(map)

```

It's the job of the CoverageLayerFactory to choose the right renderer for a
given Coverage object. Currently this happens only based on the domain type.
If more control is needed, then renderers can be easily invoked manually, or
a more sophisticated factory class may be developed. 

A renderer is any class implementing the ILayer interface. The constructor must accept
the Coverage as first argument, and options as second:

```js
// anything implementing ILayer
class GPXTrackCoverage extends L.FeatureGroup {
  constructor(cov, options) {
    this.params = options.parameters
  }
}

class GridCoverage extends L.TileLayer.Canvas {
  constructor(cov, options) {
    this.param = options.parameters[0]
  }
}


### Collections

Sometimes it may be necessary to handle a collection of Coverage objects
as a single entity.

TODO write down use cases when this is really needed (probably for profiles)

```js
var CovCollectionLayerFactory = new L.CoverageCollectionLayerFactory()
var covs = ... // many Profiles
CovCollectionLayerFactory(covs, {keys: ['salinity']}).on('loaded', function(e) {
  var covLayer = e.target
  map.fitBounds(covLayer.getBounds())
}).addTo(map)
```

And similarly for custom renderers:
```js
class ProfileCoverageCollection {
  constructor(covs, options) {
    this.param = options.parameters[0]
  }
}
```
where the first constructor argument is an array of Coverage objects.
