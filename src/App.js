// @flow

import pick from 'lodash/pick';
import styled from 'styled-components';
import includes from 'lodash/includes';
import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Map from './components/Map/Map';
import NodeToolbar from './components/NodeToolbar/NodeToolbar';
import SearchToolbar from './components/SearchToolbar/SearchToolbar';

import colors from './lib/colors';
import type { Feature } from './lib/Feature';
import { isWheelmapFeatureId, yesNoLimitedUnknownArray, yesNoUnknownArray } from './lib/Feature';
import { wheelmapLightweightFeatureCache } from './lib/cache/WheelmapLightweightFeatureCache';
import { accessibilityCloudFeatureCache } from './lib/cache/AccessibilityCloudFeatureCache';
import { getQueryParams, setQueryParams } from './lib/queryParams';
import { wheelmapFeatureCache } from './lib/cache/WheelmapFeatureCache';

import 'leaflet/dist/leaflet.css';
import './App.css';

type Props = {
  className: string
};


type State = {
  feature?: Feature,
  fetching: boolean,
  toilet: ?string,
  status: ?string,
  lat: ?string,
  lon: ?string,
  zoom: ?string,
};


class FeatureLoader extends Component<void, Props, State> {
  state: State = {
    fetching: false,
    toilet: null,
    status: null,
    lat: null,
    lon: null,
    zoom: null,
  };

  map: ?any;

  onHashUpdateBound: (() => void);


  constructor(props: Props) {
    super(props);
    this.onHashUpdateBound = this.onHashUpdate.bind(this);
  }


  componentDidMount() {
    this.fetchFeature(this.props);
    window.addEventListener('hashchange', this.onHashUpdateBound);
  }


  componentWillReceiveProps(newProps: Props): void {
    this.fetchFeature(newProps);
  }


  componentWillUnmount() {
    window.removeEventListener('hashchange', this.onHashUpdateBound);
  }


  onHashUpdate() {
    const map = this.map;
    if (!map) return;
    const params = pick(getQueryParams(), 'lat', 'lon', 'zoom', 'toilet', 'status');
    this.setState(params);
  }


  accessibilityFilter() {
    const allowedStatuses = yesNoLimitedUnknownArray;
    if (!this.state.status) return [].concat(allowedStatuses);
    return this.state.status
      .split(/\./)
      .filter(s => includes(allowedStatuses, s));
  }


  toiletFilter() {
    const allowedStatuses = yesNoUnknownArray;
    if (!this.state.toilet) return [].concat(allowedStatuses);
    return this.state.toilet
      .split(/\./)
      .filter(s => includes(allowedStatuses, s));
  }


  featureId(props: Props = this.props): ?string {
    const location = props.location;
    const match = location.pathname.match(/(?:\/beta)?\/(-?\w+)\/([-\w\d]+)/i);
    if (match) {
      if (match[1] === 'nodes') return match[2];
    }
    return null;
  }


  category(props: Props = this.props): ?string {
    const location = props.location;
    const match = location.pathname.match(/(?:\/beta)?\/(-?\w+)\/([-_\w\d]+)/i);
    if (match) {
      if (match[1] === 'categories') return match[2];
    }
    return null;
  }


  fetchFeature(props: Props): void {
    const id = this.featureId(props);
    if (!id) {
      this.setState({ feature: null });
      return;
    }
    this.setState({ fetching: true });
    const isWheelmap = isWheelmapFeatureId(id);
    if (isWheelmap) {
      this.setState({ feature: wheelmapLightweightFeatureCache.getCachedFeature(id) });
    }
    const cache = isWheelmap ? wheelmapFeatureCache : accessibilityCloudFeatureCache;
    cache.getFeature(id).then((feature) => {
      if (!feature) return;
      const currentlyShownId = this.featureId(this.props);
      const idProperties = [feature._id, feature.id, feature.properties.id, feature.properties._id];
      const fetchedId = String(idProperties.filter(Boolean)[0]);
      // shown feature might have changed in the mean time. `fetch` requests cannot be aborted so
      // we ignore the response here instead.
      if (fetchedId !== currentlyShownId) return;
      this.setState({ feature, fetching: false });
    });
  }


  render() {
    const featureId = this.featureId();
    const category = this.category();
    const isNodeRoute = Boolean(featureId);
    const { lat, lon, zoom } = this.state;
    console.log('Category:', category);
    console.log('Positioning:', lat, lon, zoom);
    console.log('Accessibility filter:', this.accessibilityFilter());
    console.log('Toilet filter:', this.toiletFilter());
    return (<div className={`app-container ${this.props.className}`}>
      <Map
        ref={(map) => { this.map = map; }}
        history={this.props.history}
        onZoomEnd={setQueryParams}
        onMoveEnd={setQueryParams}
        lat={lat ? parseFloat(lat) : null}
        lon={lon ? parseFloat(lon) : null}
        zoom={zoom ? parseFloat(zoom) : null}
        category={category}
        featureId={featureId}
        feature={this.state.feature}
        accessibilityFilter={this.accessibilityFilter()}
        toiletFilter={this.toiletFilter()}
      />
      <SearchToolbar hidden={isNodeRoute} category={category} />;
      {isNodeRoute ? <NodeToolbar feature={this.state.feature} featureId={featureId} /> : null}
    </div>);
  }
}

const StyledFeatureLoader = styled(FeatureLoader)`
  a {
    color: ${colors.linkColor};
    text-decoration: none;
  }
`;

function App() {
  return (<Router>
    <Route path="/" component={StyledFeatureLoader} />
  </Router>);
}


export default App;
