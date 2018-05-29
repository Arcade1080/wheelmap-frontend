// @flow

import { Dots } from 'react-activity';
import styled from 'styled-components';
import debounce from 'lodash/debounce';
import * as React from 'react';
import type { RouterHistory } from 'react-router-dom';
import { t } from 'c-3po';

import { isOnSmallViewport } from '../../lib/ViewportSize';

import Toolbar from '../Toolbar';
import CloseLink from '../CloseLink';
import SearchIcon from './SearchIcon';
import CategoryMenu from './CategoryMenu';
import SearchResults from './SearchResults';
import Categories from '../../lib/Categories';
import SearchInputField from './SearchInputField';
import searchPlaces from '../../lib/searchPlaces';
import type { SearchResultCollection } from '../../lib/searchPlaces';
import AccessibilityFilterMenu from './AccessibilityFilterMenu';
import type { PlaceFilter } from './AccessibilityFilterMenu';


export type Props = PlaceFilter & {
  history: RouterHistory,
  hidden: boolean,
  inert: boolean,
  category: ?string,
  searchQuery: ?string,
  lat: ?number,
  lon: ?number,
  onSelectCoordinate: ((coords: { lat: number, lon: number, zoom: number }) => void),
  onChangeSearchQuery: ((newSearchQuery: string) => void),
  onFilterChanged: ((filter: PlaceFilter) => void),
  onClose: ?(() => void),
  onResetCategory: ?(() => void),
  onToggle: ((isSearchToolbarExpanded: boolean) => void),
};


type State = {
  searchResults: ?SearchResultCollection,
  searchFieldIsFocused: boolean,
  isCategoryFocused: boolean,
  isLoading: boolean;
  filterIsVisible: boolean,
};


const StyledToolbar = styled(Toolbar)`
  transition: opacity 0.3s ease-out, transform 0.15s ease-out, width: 0.15s ease-out, height: 0.15s ease-out;
  display: flex;
  flex-direction: column;
  padding: 0;
  border-top: none;
  border-radius: 3px;

  .search-results {
    padding: 0 10px 5px 10px;
  }

  > header {
    position: sticky;
    top: 0;
    background: white;
    z-index: 1;
    border-bottom: 1px rgba(0, 0, 0, 0.1) solid;
  }

  .search-icon {
    position: absolute;
    /* center vertically */
    top: 50%;
    transform: translate(0, -50%);
    left: 1em;
    pointer-events: none;
    width: 1em;
    height: 1em;
    opacity: 0.5;
  }

  .close-link {
    position: absolute;
    right: 0px;
    top: 50%;
    transform: translate(0, -50%);
    background-color: transparent;
    display: flex;
    flex-direction: row-reverse;
    &.has-open-category {
      left: 8px;
    }
  }

  @media (max-width: 512px), (max-height: 512px) {
    &.toolbar-iphone-x {
      input, input:focus {
        background-color: white;
      }
    }

    position: fixed;
    top: 0;
    width: 100%;
    max-height: 100%;
    right: 0;
    left: 0;
    margin: 0;
    padding-right: max(constant(safe-area-inset-right), 15px);
    padding-left: max(constant(safe-area-inset-left), 15px);
    padding-right: max(env(safe-area-inset-right), 15px);
    padding-left: max(env(safe-area-inset-left), 15px);
    margin-top: constant(safe-area-inset-top);
    margin-top: env(safe-area-inset-top);
    transform: translate3d(0, 0, 0) !important;
    z-index: 1000000000;
    border-radius: 0;

    &.is-category-selected {
      top: 60px;
      left: 10px;
      width: calc(100% - 70px);
      max-height: 100%;
      max-width: 320px;
      margin: 0;
    }

    > header, .search-results, .category-menu {
      padding: 0
    }

    .search-results .link-button {
      margin: 0;
    }

    @media (max-height: 400px) {
      .category-button {
        flex-basis: 16.666666% !important;
      }
    }
  }

  .search-results {
    overflow-x: hidden;
    overflow-y: auto;
  }

  .rai-activity-indicator {
    display: flex !important;
    justify-content: center;
    height: 4em;
    align-items: center;
  }
`;


export default class SearchToolbar extends React.Component<Props, State> {
  props: Props;

  state = {
    searchFieldIsFocused: false,
    searchResults: null,
    isCategoryFocused: false,
    isLoading: false,
    filterIsVisible: false,
  };

  toolbar: ?React.Element<typeof Toolbar>;
  input: ?HTMLInputElement;
  searchInputField: ?HTMLInputElement;


  handleSearchInputChange = debounce(() => {
    if (!(this.input instanceof HTMLInputElement)) return;
    const query = this.input.value;
    this.sendSearchRequest(query);
  },
  500,
  { leading: false, trailing: true, maxWait: 1000 },
  );


  componentDidMount() {
    if (this.props.searchQuery) {
      this.sendSearchRequest(this.props.searchQuery);
    }

    if (!this.props.hidden) {
      this.focus();
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const searchFieldShouldBecomeFocused = !prevState.searchFieldIsFocused && this.state.searchFieldIsFocused;
    if (searchFieldShouldBecomeFocused) {
      this.focus();
    }
    if (!prevProps.category && this.props.category) {
      this.props.onToggle(false);
    }
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps.category !== this.props.category) {
      const hasCategory = Boolean(newProps.category);
      if (hasCategory) {
        if (isOnSmallViewport()) {
          this.setState({ filterIsVisible: false, searchFieldIsFocused: false });
          if (this.input) this.input.blur();
        }
        this.ensureFullVisibility();
      } else {
        this.setState({ filterIsVisible: false });
      }
    }
  }


  ensureFullVisibility() {
    if (this.toolbar instanceof Toolbar) {
      this.toolbar.ensureFullVisibility();
    }
  }

  sendSearchRequest(query: string): void {
    if (!query || query.length < 3) {
      this.setState({ searchResults: null, isLoading: false });
      return;
    }

    this.setState({ isLoading: true });

    searchPlaces(query, this.props).then((featureCollection) => {
      this.setState({ searchResults: featureCollection, isLoading: false });
    });
  }


  clearSearch() {
    this.setState({ filterIsVisible: false, searchResults: null });
    if (this.input instanceof HTMLInputElement) {
      this.input.value = '';
      this.input.blur();
    }
  }

  focus() {
    if (!this.searchInputField) return;
    this.searchInputField.focus();
  }

  blur() {
    if (!this.searchInputField) return;
    this.searchInputField.blur();
  }

  resetSearch() {
    this.setState({ searchResults: null, searchFieldIsFocused: true, isCategoryFocused: false }, () => {
      if (this.input instanceof HTMLInputElement) {
        this.input.value = '';
      }
      if (this.props.onResetCategory) this.props.onResetCategory();
    });
  }


  renderFilterToolbar() {
    return <div className="filter-selector">
      <AccessibilityFilterMenu
        accessibilityFilter={this.props.accessibilityFilter}
        toiletFilter={this.props.toiletFilter}
        onCloseClicked={() => this.setState({ isFilterToolbarVisible: false })}
        onFilterChanged={this.props.onFilterChanged}
      />
    </div>;
  }


  render() {
    const { searchQuery } = this.props;

    const {
      isLoading,
      searchResults,
      searchFieldIsFocused,
      isCategoryFocused,
    } = this.state;

    const isSearchFieldFocusedAndEmpty = searchFieldIsFocused && !searchQuery

    const categoryNotSelected = !Boolean(this.props.category);

    const filterIsVisible = isSearchFieldFocusedAndEmpty || (categoryNotSelected && isCategoryFocused);

    let contentBelowSearchField = null;

    if (isLoading) {
      contentBelowSearchField =
        <div>
          <span className="sr-only" aria-live="assertive">
            Searching
          </span>
          <Dots size={20} />
        </div>;
    } else if (searchResults) {
      contentBelowSearchField =
        <div aria-live="assertive">
          <SearchResults
            searchResults={searchResults}
            onSelectCoordinate={this.props.onSelectCoordinate}
            hidden={this.props.hidden}
            history={this.props.history}
            onSelect={() => this.clearSearch()}
          />
        </div>;
    } else if (filterIsVisible) {
      contentBelowSearchField = (<CategoryMenu
        hidden={this.props.hidden}
        history={this.props.history}
        onFocus={() => this.setState({ isCategoryFocused: true })}
        onBlur={() => { setTimeout(() => this.setState({ isCategoryFocused: false })) }}
      />);
    }

    const placeholder = this.props.category ? Categories.translatedWheelmapRootCategoryName(this.props.category) : '';

    const className = [
      'search-toolbar',
      this.props.category && 'is-category-selected',
      searchFieldIsFocused && 'search-field-is-focused',
    ].filter(Boolean).join(' ');

    return (
      <StyledToolbar
        className={className}
        hidden={this.props.hidden}
        inert={this.props.inert}
        minimalHeight={75}
        innerRef={(toolbar) => { this.toolbar = toolbar; }}
        isSwipeable={false}
        enableTransitions={false}
        role="search"
      >
        <header>
          <SearchIcon />

          <SearchInputField
            innerRef={searchInputField => this.searchInputField = searchInputField}
            searchQuery={this.props.category ? '' : this.props.searchQuery}
            placeholder={placeholder}
            hidden={this.props.hidden}
            onClick={() => {
              if (this.props.category) {
                this.resetSearch();
              }
              this.setState({ searchFieldIsFocused: true });
              window.scrollTo(0, 0);
              this.setState({ filterIsVisible: true }, () => {
                if (this.props.onToggle) this.props.onToggle(true);
              });
            }}
            onFocus={(event) => {
              this.input = event.target;
              this.setState({ searchFieldIsFocused: true });
              window.scrollTo(0, 0);
              this.setState({ filterIsVisible: true });
            }}
            onBlur={() => {
              this.ensureFullVisibility();
              setTimeout(() => {
                this.setState({ searchFieldIsFocused: false });
                this.ensureFullVisibility();
              }, 300);
            }}
            onChange={(event) => {
              this.input = event.target;
              this.props.onChangeSearchQuery(this.input.value);
              this.handleSearchInputChange(event);
            }}
            ariaRole="searchbox"
          />

          {(this.props.searchQuery || this.props.category || searchFieldIsFocused) ? <CloseLink
            history={this.props.history}
            className='close-link'
            ariaLabel={t`Clear Search`}
            onClick={() => {
              this.resetSearch();
              if (this.props.onClose) this.props.onClose();
              if (this.props.onToggle) this.props.onToggle(false);
            }}
            innerRef={closeLink => this.closeLink = closeLink}
          /> : null}
        </header>

        { contentBelowSearchField }
      </StyledToolbar>
    );
  }
}
