import * as React from 'react';
import styled from 'styled-components';
import { t } from 'ttag';
import colors from '../../lib/colors';
import {
  SearchResultCollection,
  SearchResultFeature,
} from '../../lib/model/searchPlaces';
import { getFeatureId, WheelmapFeature } from '../../lib/types/Feature';
import SearchResult from './SearchResult';

type Props = {
  searchResults: SearchResultCollection;
  className?: string;
  hidden: boolean | null;
  refFirst: (result: SearchResult | null) => void | null;
};

const onSearchResultClick = (
  feature: SearchResultFeature,
  wheelmapFeature: WheelmapFeature | null,
) => {
  const params = this.getCurrentParams() as any;
  let routeName = 'map';

  if (wheelmapFeature) {
    let id = getFeatureId(wheelmapFeature);
    if (id) {
      params.id = id;
      delete params.eid;
      routeName = 'placeDetail';
    }
  }

  if (routeName === 'map') {
    delete params.id;
    delete params.eid;
  }

  if (feature.properties.extent) {
    const extent = feature.properties.extent;
    this.setState({ lat: null, lon: null, extent });
  } else {
    const [lon, lat] = feature.geometry.coordinates;
    this.setState({ lat, lon, extent: null });
  }

  this.props.routerHistory.push(routeName, params);
};

function SearchResults(props: Props) {
  const id = (result: any) =>
    result && result.properties && result.properties.osm_id;
  const { wheelmapFeatures, features } = props.searchResults;

  const failedLoading = !!props.searchResults.error;
  const hasNoResults = !failedLoading && features.length === 0;

  // translator: Text in search results when nothing was found
  const noResultsFoundCaption = t`No results found`;

  // translator: Text in search results when an error occurred
  const searchErrorCaption = t`No results available. Please try again later!`;

  const renderedFeatureIds = [];

  return (
    <ul
      className={`search-results ${props.className || ''}`}
      aria-label={t`Search results`}
    >
      {failedLoading && <li className="error-result">{searchErrorCaption}</li>}
      {hasNoResults && <li className="no-result">{noResultsFoundCaption}</li>}
      {features.map((feature, index) => {
        const featureId = id(feature);

        if (renderedFeatureIds.indexOf(featureId) > -1) {
          return null;
        }

        renderedFeatureIds.push(featureId);

        return (
          <SearchResult
            feature={feature}
            wheelmapFeature={wheelmapFeatures && wheelmapFeatures[index]}
            key={featureId}
            onClick={onSearchResultClick}
            hidden={!!props.hidden}
            ref={ref => {
              if (props.refFirst && index === 0) props.refFirst(ref);
            }}
          />
        );
      })}
    </ul>
  );
}

const StyledSearchResults = styled(SearchResults)`
  list-style-type: none;
  margin: 0;

  li {
    padding: 0;
  }

  li > button {
    text-align: left;
    overflow: hidden;
    color: rgba(0, 0, 0, 0.8) !important;
    display: block;
    width: 100%;
    box-sizing: content-box;

    &:hover {
      color: rgba(0, 0, 0, 0.8) !important;
    }

    address {
      font-size: 16px !important;
      color: rgba(0, 0, 0, 0.6);
    }
  }

  li.no-result {
    text-align: center;
    font-size: 16px;
    overflow: hidden;
    padding: 20px;
  }

  li.error-result {
    text-align: center;
    font-size: 16px;
    overflow: hidden;
    padding: 20px;
    font-weight: 400;
    background-color: ${colors.negativeBackgroundColorTransparent};
  }

  .osm-category-place-borough,
  .osm-category-place-suburb,
  .osm-category-place-village,
  .osm-category-place-hamlet,
  .osm-category-place-town,
  .osm-category-place-city,
  .osm-category-place-county,
  .osm-category-place-state,
  .osm-category-place-country,
  .osm-category-boundary-administrative {
    h1 {
      font-weight: 600;
    }
  }
`;

export default StyledSearchResults;
