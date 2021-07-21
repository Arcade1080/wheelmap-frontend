import * as React from 'react';
import { hsl } from 'd3-color';
import styled from 'styled-components';
import { t } from 'ttag';

import FocusTrap from 'focus-trap-react';

import { insertPlaceholdersToAddPlaceUrl } from '../../lib/insertPlaceholdersToAddPlaceUrl';
import { translatedStringFromObject, LocalizedString } from '../../lib/i18n';
import colors, { alpha } from '../../lib/colors';
import { MappingEvent } from '../../lib/MappingEvent';

import GlobalActivityIndicator from './GlobalActivityIndicator';
import { LinkData } from '../../App';
import Link, { RouteConsumer } from '../Link/Link';
import { AppContextConsumer } from '../../AppContext';

import CloseIcon from '../icons/actions/Close';

import { useUpdateOmnibarIsOpenContext } from '../Contexts/OmnibarContext';
import SearchIcon from '../SearchFilter/SearchIcon';
import { isOnSmallViewport } from '../../lib/ViewportSize';
import FilterIcon from '../SearchFilter/FilterIcon';
import CombinedIcon from '../SearchFilter/CombinedIcon';

type State = {
  isMenuButtonVisible: boolean,
};

type Props = {
  className: string,
  productName: string,
  onToggle: (isMainMenuOpen: boolean) => void,
  onHomeClick: () => void,
  onMappingEventsLinkClick: () => void,
  onAddPlaceViaCustomLinkClick: () => void,
  uniqueSurveyId: string,
  joinedMappingEvent?: MappingEvent,
  isOpen: boolean,
  lat: number | null,
  lon: number | null,
  zoom: number | null,
  logoURL: string,
  claim: LocalizedString,
  links: Array<LinkData>,
  onClickFilterButton: () => void,
};

function MenuIcon(props) {
  return (
    <svg
      className="menu-icon"
      width="25px"
      height="18px"
      viewBox="0 0 25 18"
      version="1.1"
      alt="Toggle menu"
      {...props}
    >
      <g stroke="none" strokeWidth={1} fillRule="evenodd">
        <rect x="0" y="0" width="25" height="3" />
        <rect x="0" y="7" width="25" height="3" />
        <rect x="0" y="14" width="25" height="3" />
      </g>
    </svg>
  );
}

const Badge = styled.span`
  background-color: ${colors.warningColor};
  border-radius: 0.5rlh;
  padding: 0.2rem 0.3rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: white;
  margin: 0.1rem;
`;

const MENU_BUTTON_VISIBILITY_BREAKPOINT = 1024;

const MainMenu = (props: Props) => {
  const [isMenuButtonVisible, setIsMenuButtonVisible] = React.useState<boolean>(false);

  // boundOnResize: () => void;

  const onResize = () => {
    if (window.innerWidth > MENU_BUTTON_VISIBILITY_BREAKPOINT) {
      setIsMenuButtonVisible(false);
    } else {
      setIsMenuButtonVisible(true);
      props.onToggle(false);
    }
  };

  // is called initially
  /**
   * TODO check if eventlistener is removed properly and doesnt eat memory
   */
  React.useEffect(() => {
    window.addEventListener('resize', onResize);
    onResize();
  }, [isMenuButtonVisible, setIsMenuButtonVisible]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onResize);
    }
  }, [isMenuButtonVisible, setIsMenuButtonVisible]);

  const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    props.onToggle(!props.isOpen);
    event.preventDefault();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      props.onToggle(false);
    }
  };

  const renderHomeLink = (extraProps = {}) => {
    return (
      <div className="home-link">
        <button
          className="btn-unstyled home-button"
          onClick={props.onHomeClick}
          aria-label={t`Home`}
          onKeyDown={handleKeyDown}
          {...extraProps}
        >
          {/* translator: The alternative desription of the app logo for screenreaders */}
          <img
            className="logo"
            src={props.logoURL}
            width={156}
            height={30}
            alt={props.productName}
          />
        </button>
      </div>
    );
  };

  const renderAppLinks = (baseUrl: string) => {
    return props.links
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(link => {
        const url =
          link.url &&
          insertPlaceholdersToAddPlaceUrl(
            baseUrl,
            translatedStringFromObject(link.url),
            props.uniqueSurveyId
          );
        const label = translatedStringFromObject(link.label);
        const badgeLabel = translatedStringFromObject(link.badgeLabel);
        const classNamesFromTags = link.tags && link.tags.map(tag => `${tag}-link`);
        const className = ['nav-link'].concat(classNamesFromTags).join(' ');

        let customClickHandler = null;
        const isAddPlaceLink = link.tags && link.tags.indexOf('add-place') !== -1;
        const isAddPlaceLinkWithoutCustomUrl = isAddPlaceLink && (!url || url == '/add-place');

        if (isAddPlaceLinkWithoutCustomUrl) {
          return (
            <Link key="add-place" className={className} to="/add-place" role="menuitem">
              {label}
              {badgeLabel && <Badge>{badgeLabel}</Badge>}
            </Link>
          );
        }

        if (isAddPlaceLink && !isAddPlaceLinkWithoutCustomUrl) {
          customClickHandler = props.onAddPlaceViaCustomLinkClick;
        }

        const isEventsLink = link.tags && link.tags.indexOf('events') !== -1;
        if (isEventsLink) {
          return renderEventsOrJoinedEventLink(label, url, className);
        }

        if (typeof url === 'string') {
          return (
            <Link
              key={url}
              className={className}
              to={url}
              role="menuitem"
              onClick={customClickHandler}
            >
              {label}
              {badgeLabel && <Badge>{badgeLabel}</Badge>}
            </Link>
          );
        }

        return null;
      });
  };

  const renderEventsOrJoinedEventLink = (
    label: string | null,
    url: string | null,
    className: string
  ) => {
    const joinedMappingEvent = props.joinedMappingEvent;
    if (joinedMappingEvent) {
      return (
        <Link
          key={url}
          className={className}
          to="mappingEventDetail"
          params={{ id: joinedMappingEvent._id }}
          role="menuitem"
          onClick={props.onMappingEventsLinkClick}
        >
          {joinedMappingEvent.name}
        </Link>
      );
    } else {
      return (
        <RouteConsumer key={url}>
          {context => {
            let params = { ...context.params };

            delete params.id;

            return (
              <Link
                className={className}
                to="mappingEvents"
                params={params}
                role="menuitem"
                onClick={props.onMappingEventsLinkClick}
              >
                {label}
              </Link>
            );
          }}
        </RouteConsumer>
      );
    }
  };

  const renderCloseButton = () => {
    return (
      <button
        className="btn-unstyled menu"
        onClick={toggleMenu}
        aria-hidden={!isMenuButtonVisible}
        tabIndex={isMenuButtonVisible ? 0 : -1}
        aria-label={t`Menu`}
        aria-haspopup="true"
        aria-expanded={props.isOpen}
        aria-controls="main-menu"
        onKeyDown={handleKeyDown}
      >
        {props.isOpen ? <CloseIcon /> : <MenuIcon />}
      </button>
    );
  };

  const setIsOpen = useUpdateOmnibarIsOpenContext();

  const handleClick = React.useCallback((_event: React.MouseEvent<HTMLElement>) => {
    setIsOpen(true);
  }, []);

  const renderSearchButtonOnSmallViewport = () => {
    return (
      <>
        <div className="search-on-small-vp">
          <button
            className="search btn-unstyled" // TODO use btn-unstyled later once it fits
            onClick={handleClick}
            aria-label={t`search`}
            aria-controls="search"
          >
            <SearchIcon />
          </button>
        </div>
      </>
    );
    // we may need an context hook here?
  };

  const renderFilterButtonOnSmallViewport = () => {
    return (
      <>
        <div className="filter-on-small-vp">
          <button
            onClick={props.onClickFilterButton}
            aria-label={t`Filter`}
            aria-controls="filter"
            className="filter btn-unstyled"
          >
            <div>
              <FilterIcon />
            </div>
          </button>
        </div>
      </>
    );
  };

  const classList = [
    props.className,
    props.isOpen || !isMenuButtonVisible ? 'is-open' : null,
    'main-menu',
  ].filter(Boolean);

  const focusTrapIsActive = isMenuButtonVisible && props.isOpen;

  return (
    <FocusTrap active={focusTrapIsActive}>
      <nav className={classList.join(' ')}>
        {renderHomeLink()}
        <div className="claim">{translatedStringFromObject(props.claim)}</div>
        <GlobalActivityIndicator className="activity-indicator" />

        {isOnSmallViewport() ? renderSearchButtonOnSmallViewport() : null}
        {isOnSmallViewport() ? renderFilterButtonOnSmallViewport() : null}
        <div id="main-menu" role="menu">
          <AppContextConsumer>
            {appContext => renderAppLinks(appContext.baseUrl)}
          </AppContextConsumer>
        </div>

        {renderCloseButton()}
      </nav>
    </FocusTrap>
  );
};

const openMenuHoverColor = hsl(colors.primaryColor).brighter(1.4);
openMenuHoverColor.opacity = 0.5;

const StyledMainMenu = styled(MainMenu)`
  box-sizing: border-box;
  padding: 0;
  background-color: rgba(254, 254, 254, 0.9);
  display: flex;
  flex-direction: row;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 0 20px ${alpha(colors.darkLinkColor, 0.25)},
    0 1px 5px ${alpha(colors.darkLinkColor, 0.1)};
  overflow: hidden;

  .logo {
    margin-left: 10px;
    object-fit: contain;
    object-position: left;
  }

  .claim {
    font-weight: 300;
    opacity: 0.6;
    transition: opacity 0.3s ease-out;
    padding-left: 5px;
    flex: 1;
    display: flex;
    justify-content: start;
    align-items: center;

    @media (max-width: 1280px) {
      font-size: 80%;
    }
    @media (max-width: 1180px) {
      display: none;
    }
  }

  #main-menu {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: flex-end;
    align-items: stretch;
    height: 100%;
    overflow: hidden;
    flex: 3;
    min-height: 50px;
  }

  #search-icon-small-vp {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: flex-end;
    align-items: stretch;
    height: 100%;
    overflow: hidden;
    flex: 3;
    min-height: 50px;
  }

  &.is-open {
    #main-menu {
      opacity: 1;
    }
  }

  .nav-link {
    padding: 2px 10px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;

    &,
    &:visited {
      color: ${colors.darkLinkColor};
    }
    &:hover,
    &:focus {
      color: ${colors.linkColorDarker};
      background-color: ${colors.linkBackgroundColorTransparent};
      box-shadow: 0 1px 20px ${colors.linkBackgroundColorTransparent};
    }
    &:active {
      color: ${colors.linkColor};
      background-color: ${hsl(colors.linkColor)
        .brighter(1.7)
        .toString()};
    }
  }

  .primary-link {
    font: inherit;
    border: 0;
    margin: 0;
    font-weight: 500;
    cursor: pointer;
    background-color: transparent;

    &,
    &:visited {
      color: ${colors.linkColor};
    }
  }

  button.btn-unstyled {
    border: none;
    background: transparent;
    cursor: pointer;
    margin: 0;
    padding: 0;
    min-width: 50px;
    min-height: 50px;
  }

  button.search {
    position: fixed;
    margin-right: 100px;
    top: 0;
    top: constant(safe-area-inset-top);
    top: env(safe-area-inset-top);
    right: 0;
    right: constant(safe-area-inset-right);
    right: env(safe-area-inset-right);
    width: 50px;
    height: 50px;
  }

  button.filter {
    position: fixed;
    margin-right: 94px;
    top: 0;
    top: constant(safe-area-inset-top);
    top: env(safe-area-inset-top);
    right: 0;
    right: constant(safe-area-inset-right);
    right: env(safe-area-inset-right);
    width: 50px;
    height: 50px;
    margin-right: 50px;
  }

  button.menu {
    position: fixed;
    top: 0;
    top: constant(safe-area-inset-top);
    top: env(safe-area-inset-top);
    right: 0;
    right: constant(safe-area-inset-right);
    right: env(safe-area-inset-right);
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease-out;

    svg {
      margin: auto;
    }
    svg g {
      fill: ${colors.darkLinkColor};
      transition: fill 0.1s ease-out;
    }
    &:hover {
      background-color: ${colors.linkBackgroundColorTransparent};
      svg g {
        fill: ${colors.linkColor};
      }
    }
    &:active {
      background-color: ${colors.linkBackgroundColorTransparent};
      svg g {
        fill: ${colors.darkLinkColor};
      }
    }
  }

  position: absolute;
  top: 0;
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  backdrop-filter: blur(5px);
  left: 0;
  right: 0;

  @media (max-width: ${MENU_BUTTON_VISIBILITY_BREAKPOINT}px) {
    flex-wrap: wrap;
    flex-direction: column;
    align-items: flex-start;
    background-color: rgba(254, 254, 254, 0.9);
    backdrop-filter: blur(5px);

    #main-menu {
      justify-content: space-between;
      min-height: 0;
    }

    .activity-indicator {
      position: fixed;
      top: 0;
      top: constant(safe-area-inset-top);
      top: env(safe-area-inset-top);
      right: 0;
      right: constant(safe-area-inset-right);
      right: env(safe-area-inset-right);
      margin-right: 80px;
      margin-top: 20px;
    }

    button.menu {
      opacity: 1;
      pointer-events: inherit;
    }

    .flexible-separator {
      display: none;
    }

    .nav-link {
      display: none;
      box-sizing: border-box;
      align-items: center;
      height: 44px;
      padding: 8px;
      width: calc(50% - 16px);
      border-radius: 4px;
      text-align: center;
      background-color: white;
      box-shadow: 0 1px 2px ${alpha(colors.darkLinkColor, 0.1)},
        0 2px 9px ${alpha(colors.darkLinkColor, 0.07)};
      &:focus {
        box-shadow: 0 0px 0px 2px ${alpha(colors.linkColor, 0.7)},
          0 2px 9px ${alpha(colors.darkLinkColor, 0.07)};
      }
    }

    &.is-open {
      .nav-link {
        display: flex;
        margin: 8px;
      }

      #main-menu {
        margin: 16px;
        align-self: flex-end;
      }

      button.menu {
        svg {
          width: 16px;
          height: 16px;
        }
        svg g {
          fill: ${colors.primaryColor};
        }
        &:hover {
          background-color: ${openMenuHoverColor.toString()};
          svg g {
            fill: ${hsl(colors.primaryColor)
              .darker(1)
              .toString()};
          }
        }
        &:active {
          background-color: ${openMenuHoverColor.toString()};
          svg g {
            color: ${hsl(openMenuHoverColor)
              .darker(2)
              .toString()};
          }
        }
      }
    }
  }

  @media (max-height: 400px) {
    padding: 2px 10px 2px 10px;
    padding-left: constant(safe-area-inset-left);
    padding-left: env(safe-area-inset-left);
    &,
    button.menu,
    button.home-button {
      height: 44px;
      min-height: auto;
    }
    &.is-open {
      height: auto;
    }
  }
`;

export default StyledMainMenu;
