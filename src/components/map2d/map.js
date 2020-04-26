import React from 'react';
import DeckGL from '@deck.gl/react';
import { MapboxLayer } from '@deck.gl/mapbox';
import { StaticMap } from 'react-map-gl';
import { pushContextState, popContextState } from '@luma.gl/gltools';
import { getNaipUrl } from '../util';
import { NAIPLayer, MODISLayer } from '../mapbox-layers';
import { LandsatTileLayer } from '../deck-layers';

// You'll get obscure errors without including the Mapbox GL CSS
import '../../css/mapbox-gl.css';

const mapStyle = require('./style.json');

const initialViewState = {
  longitude: -112.1861,
  latitude: 36.1284,
  zoom: 12.1,
  pitch: 0,
  bearing: 0,
};

export default class Map extends React.Component {
  state = {
    gl: null,
    viewState: initialViewState,
    naipTileUrl: getNaipUrl(),
    
    // Show NAIP imagery at zoom >= 12
    useNaip: false
  };

  // DeckGL and mapbox will both draw into this WebGL context
  _onWebGLInitialized = gl => {
    this.setState({ gl });
  };

  _onMapLoad = () => {
    const map = this._map;
    const deck = this._deck;

    // This id has to match the id of the Deck layer
    map.addLayer(
      new MapboxLayer({ id: 'landsat-tile-layer', deck }),
      'waterway_other'
    );
  };

  onViewStateChange = ({viewState}) => {
    this.setState({viewState})
  }

  render() {
    const { gl, naipTileUrl, viewState, useNaip } = this.state;
    const layers = [
      new LandsatTileLayer({
        id: 'landsat-tile-layer',
        gl,
        visible: viewState.zoom >= 7 && (viewState.zoom <= 12 || !useNaip),
      }),
    ];

    return (
      <DeckGL
        ref={ref => {
          // save a reference to the Deck instance
          this._deck = ref && ref.deck;
        }}
        layers={layers}
        initialViewState={initialViewState}
        onBeforeRender={() => pushContextState(gl)}
        onAfterRender={() => popContextState(gl)}
        onViewStateChange={this.onViewStateChange}
        controller
        onWebGLInitialized={this._onWebGLInitialized}
      >
        {gl && (
          <StaticMap
            ref={ref => {
              // save a reference to the mapboxgl.Map instance
              this._map = ref && ref.getMap();
            }}
            gl={gl}
            onLoad={this._onMapLoad}
            mapStyle={mapStyle}
            mapOptions={{ hash: true }}
          >
            <MODISLayer
              dateStr="2018-06-01"
              visible={true}
              beforeId="waterway_other"
            />
            <NAIPLayer
              tileUrl={naipTileUrl}
              visible={useNaip}
              beforeId="waterway_other"
            />
          </StaticMap>
        )}
      </DeckGL>
    );
  }
}
