// @flow

import { t } from 'c-3po';
import * as React from 'react';
import isEqual from 'lodash/isEqual';
import styled from 'styled-components';
import CloseIcon from '../icons/actions/Close';
import type { RouterHistory } from 'react-router-dom';
import Toolbar from '../Toolbar';
import colors from '../../lib/colors';
import AccessibilityFilterButton from './AccessibilityFilterButton';
import type { PlaceFilter } from './AccessibilityFilterModel';
import type { YesNoLimitedUnknown } from '../../lib/Feature';


type Props = PlaceFilter & {
  history: RouterHistory,
  className: string,
  hidden: boolean,
  onCloseClicked: (() => void),
  onBlur: (() => void),
  onFilterChanged: ((filter: PlaceFilter) => void),
  category: string,
  accessibilities: YesNoLimitedUnknown[],
};

type DefaultProps = {};

type State = {
  toiletCheckboxFocused: boolean,
};


const PositionedCloseButton = styled.button`
  position: absolute;
  top: 0px;
  right: 0px;
  padding: 5px;
  padding: 10px;
  border: none;
  background-color: rgba(0, 0, 0, 0);
  cursor: pointer;
`;


const CloseButton = ({onClick, onKeyDown, closeButtonRef, ...restProps}) =>
  <PositionedCloseButton innerRef={closeButtonRef} onClick={onClick} onKeyDown={onKeyDown} aria-label={t`Close Dialog`}>
    <CloseIcon {...restProps} />
  </PositionedCloseButton>;


const availableFilters = {
  // all: {
  //   // translator: Button caption in the filter toolbar. Answer to the question 'which places you want to see', plural
  //   caption: t`All`,
  //   accessibilityFilter: ['yes', 'limited', 'no', 'unknown'],
  //   toiletFilter: [],
  // },
  atLeastPartial: {
    // translator: Button caption in the filter toolbar. Answer to the question 'which places you want to see'
    caption: t`At least partially wheelchair accessible`,
    accessibilityFilter: ['yes', 'limited'],
    toiletFilter: [],
  },
  atLeastPartialWithWC: {
    // translator: Button caption in the filter toolbar. Answer to the question 'which places you want to see'
    caption: t`At least partially wheelchair accessible + WC`,
    accessibilityFilter: ['yes', 'limited'],
    toiletFilter: ['yes'],
  },
  fully: {
    // translator: Button caption in the filter toolbar. Answer to the question 'which places you want to see'
    caption: t`Only fully wheelchair accessible`,
    accessibilityFilter: ['yes'],
    toiletFilter: [],
  },
  fullyWithWC: {
    // translator: Button caption in the filter toolbar. Answer to the question 'which places you want to see'
    caption: t`Only fully wheelchair accessible + WC`,
    accessibilityFilter: ['yes'],
    toiletFilter: ['yes'],
  },
  unknown: {
    // translator: Button caption in the filter toolbar. Answer to the question 'which places you want to see'
    caption: t`Places that I can contribute to`,
    accessibilityFilter: ['unknown'],
    toiletFilter: [],
  },
  notAccessible: {
    // translator: Checkbox caption on the filter toolbar. If the checkbox is clicked, only places that are not wheelchair accessible are shown.
    caption: t`Only places that are not accessible`,
    accessibilityFilter: ['no'],
    toiletFilter: [],
  },
};


function findFilterKey({ toiletFilter, accessibilityFilter }) {
  return Object.keys(availableFilters).find(key => {
    const filter = availableFilters[key];
    const requestedToiletFilter = isEqual(toiletFilter, ['yes', 'no', 'unknown']) ? [] : toiletFilter;
    return isEqual(requestedToiletFilter, filter.toiletFilter) && isEqual(accessibilityFilter.sort(), filter.accessibilityFilter.sort())
  });
}


class AccessibilityFilterMenu extends React.Component<Props, State> {
  static defaultProps: DefaultProps;
  toolbar: ?React.ElementRef<typeof Toolbar>;
  toiletCheckbox: ?React.ElementRef<'input'>;
  closeButton: ?React.ElementRef<typeof CloseButton>;

  state = {
    toiletCheckboxFocused: false,
  };

  render() {
    const { accessibilityFilter, toiletFilter } = this.props;
    const category = this.props.category || 'undefined';
    const currentFilterKey = findFilterKey({ accessibilityFilter, toiletFilter });
    const shownFilterKeys = currentFilterKey ? [currentFilterKey] : Object.keys(availableFilters);
    const lastIndex = shownFilterKeys.length - 1;

    return (
      <section
        className={this.props.className}
        aria-label={t`Wheelchair Accessibility Filter`}
      >
        <section className="accessibility-filter">
          {shownFilterKeys.map((key, index) => (
            <AccessibilityFilterButton
              accessibilityFilter={availableFilters[key].accessibilityFilter}
              toiletFilter={availableFilters[key].toiletFilter}
              caption={availableFilters[key].caption}
              category={category}
              isMainCategory
              isActive={currentFilterKey}
              showCloseButton={shownFilterKeys.length === 1}
              onKeyDown={({nativeEvent}) => {
                const tabPressedOnLastButton = index === lastIndex && nativeEvent.key === 'Tab' && !nativeEvent.shiftKey;
                const shiftTabPressedOnFirstButton = index === 0 && nativeEvent.key === 'Tab' && nativeEvent.shiftKey;
                if(tabPressedOnLastButton || shiftTabPressedOnFirstButton) {
                  this.props.onBlur();
                }
              }}
              history={this.props.history}
              key={key}
              className="accessibility-filter-button"
            />))}
        </section>
      </section>
    );
  }
}

const StyledAccessibilityFilterMenu = styled(AccessibilityFilterMenu)`
  border-top: 1px solid ${colors.borderColor};

  header {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 30px;
    padding-right: 20px; /* For close icon */
  }

  section {
    opacity: 1;
    overflow: hidden;
    transition: opacity 0.1s ease-out, max-height 0.1s ease-out;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: stretch;

    &.section-hidden {
      max-height: 0;
      opacity: 0;
    }
  }

  button, label {
    display: flex;
    margin: 1em 0;
    align-items: center;
    font-size: 1rem;
    cursor: pointer;

    .icon {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 8px;
      &.toilet-filter-icon {
        width: 40px;
        height: 40px;
      }
    }

    .caption {
      flex: 1;
      text-align: left;
    }
  }

  .radio-button.focus-ring {
    border-radius: 100%;
    box-shadow: 0px 0px 0px 2px #4469E1;
  }

  .close-icon {
    margin-left: 1em;
  }
`;

export default StyledAccessibilityFilterMenu;
