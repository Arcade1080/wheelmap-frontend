import * as React from 'react';

import StyledFrame from './StyledFrame';
import AccessibilityDetailsTree from './AccessibilityDetailsTree';
import AccessibleDescription from './AccessibleDescription';
import AccessibilitySourceDisclaimer from './AccessibilitySourceDisclaimer';
import WheelchairAndToiletAccessibility from './WheelchairAndToiletAccessibility';

import { Feature, isWheelmapProperties } from '../../../lib/types/Feature';
import { YesNoLimitedUnknown } from '../../../lib/types/Feature';
import { Category } from '../../../lib/types/Categories';
import filterAccessibility from '../../../lib/model/filterAccessibility';
import { isWheelmapFeatureId } from '../../../lib/types/Feature';
import Description from './Description';
import { AppContextConsumer } from '../../../app/context/AppContext';

type Props = {
  featureId: string | number | null,
  category: Category | null,
  cluster: any,
  presetStatus: YesNoLimitedUnknown | null,
  feature: Feature | null,
  toiletsNearby: Feature[] | null,
  isLoadingToiletsNearby: boolean,
};

export default function PlaceAccessibilitySection(props: Props) {
  const { featureId, feature, toiletsNearby, isLoadingToiletsNearby, cluster } = props;
  const properties = feature && feature.properties;
  const isWheelmapFeature = isWheelmapFeatureId(featureId);

  const accessibilityTree =
    properties && !isWheelmapProperties(properties) && typeof properties.accessibility === 'object' ? properties.accessibility : null;
  const filteredAccessibilityTree = accessibilityTree
    ? filterAccessibility(accessibilityTree)
    : null;
  const accessibilityDetailsTree = filteredAccessibilityTree && (
    <AccessibilityDetailsTree details={filteredAccessibilityTree} />
  );
  let description: string = null;
  if (properties && isWheelmapProperties(properties) && typeof properties.wheelchair_description === 'string') {
    description = properties.wheelchair_description;
  }
  const descriptionElement = description ? <Description>{description}</Description> : null;

  return (
    <StyledFrame noseOffsetX={cluster ? 67 : undefined}>
      <WheelchairAndToiletAccessibility
        isEditingEnabled={isWheelmapFeature}
        feature={feature}
        toiletsNearby={toiletsNearby}
        isLoadingToiletsNearby={isLoadingToiletsNearby}
      />
      {description && descriptionElement}
      <AccessibleDescription properties={properties as any} />
      {accessibilityDetailsTree}
      <AppContextConsumer>
        {appContext => (
          <AccessibilitySourceDisclaimer
            properties={properties as any}
            appToken={appContext.app.tokenString}
          />
        )}
      </AppContextConsumer>
    </StyledFrame>
  );
}
