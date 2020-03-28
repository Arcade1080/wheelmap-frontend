// @flow
import React, { type ReactElement } from 'react';
import styled from 'styled-components';
import { t } from 'ttag';

import colors from '../../lib/colors';
import ChevronLeft from '../ChevronLeft';
import { ChromelessButton } from '../Button';

type Props = {
  title: string,
  subtitle: string,
  icon: ReactElement,
  onCloseButtonClick: () => void,
  className?: String,
};

const DetailPanelHeader = ({ title, subtitle, icon, onCloseButtonClick, className }: Props) => {
  const buttonText = t`back to map`;
  return (
    <header className={className}>
      <ChromelessButton onClick={onCloseButtonClick}>
        <ChevronLeft />
        {buttonText}
      </ChromelessButton>
      <div>
        {icon}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </header>
  );
};

export default styled(DetailPanelHeader)`
  position: relative;

  > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 300px;
    margin-top: -30px;
    margin-right: auto;
    margin-bottom: 0;
    margin-left: auto;
    color: ${colors.textColor};
    word-break: break-word;
  }
  h1 {
    font-size: 1.5rem;
    font-weight: 400;
    margin-bottom: 0;
    text-align: center;
  }

  p {
    color: ${colors.textColorBrighter};
    font-size: 1rem;
  }

  ${ChromelessButton} {
    display: flex;
    position: absolute;
    left: 0;
    top: 50px;

    &:hover {
      background-color: transparent;
      color: ${colors.linkColor};
    }

    ${ChevronLeft} {
      margin: 0 0.5rem 0 0;
      width: 1rem;
      height: 2rem;
    }
  }
`;
