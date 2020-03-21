import * as React from 'react';

import NodeToolbar from './NodeToolbar';
import EmptyToolbarWithLoadingIndicator from './EmptyToolbarWithLoadingIndicator';

import { Cluster } from '../../components/Map/Cluster';
import Categories, {
  Category,
  CategoryLookupTables,
} from '../../lib/types/Categories';
import { Feature, YesNoLimitedUnknown } from '../../lib/types/Feature';
import { EquipmentInfo } from '../../lib/model/EquipmentInfo';
import { ModalNodeState } from '../../lib/ModalNodeState';
import { PhotoModel } from '../../lib/model/PhotoModel';
import { SourceWithLicense } from '../../app/PlaceDetailsProps';
import {
  PlaceDetailsProps,
  getPlaceDetailsIfAlreadyResolved,
} from '../../app/PlaceDetailsProps';
import { UAResult } from '../../lib/userAgent';
import { getCategoriesForFeature } from '../../lib/api/model/Categories';

type Props = {
  categories: CategoryLookupTables;
  cluster: Cluster | null;
  hidden: boolean;
  modalNodeState: ModalNodeState;
  userAgent: UAResult;
  onClose?: () => void;
  onEquipmentSelected: (
    placeInfoId: string,
    equipmentInfo: EquipmentInfo,
  ) => void;
  onShowPlaceDetails: (featureId: string | number) => void;
  inEmbedMode: boolean;
  onCloseWheelchairAccessibility: () => void;
  onCloseToiletAccessibility: () => void;
  onClickCurrentCluster?: () => void;
  // Simple 3-button wheelchair status editor
  accessibilityPresetStatus?: YesNoLimitedUnknown | null;

  // photo feature
  onStartPhotoUploadFlow: () => void;
  onReportPhoto: (photo: PhotoModel) => void;
  photoFlowNotification?:
    | 'uploadProgress'
    | 'uploadFailed'
    | 'reported'
    | 'waitingForReview';
  photoFlowErrorMessage: string | null;
  onClickCurrentMarkerIcon?: (feature: Feature) => void;
} & PlaceDetailsProps;

type RequiredData = {
  resolvedFeature: Feature | null;
  resolvedEquipmentInfo: EquipmentInfo | null;
};

type State = {
  category: Category | null;
  parentCategory: Category | null;
  resolvedRequiredData: RequiredData | null;
  requiredDataPromise: Promise<RequiredData> | null;
  resolvedSources: SourceWithLicense[] | null;
  resolvedPhotos: PhotoModel[] | null;
  resolvedToiletsNearby: Feature[] | null;
  isLoadingToiletsNearby: boolean;
  lastFeatureId: string | number | null;
  lastEquipmentInfoId: string | null;
};

class NodeToolbarFeatureLoader extends React.Component<Props, State> {
  props: Props;
  state = {
    category: null,
    parentCategory: null,
    resolvedRequiredData: null,
    resolvedSources: null,
    resolvedPhotos: null,
    resolvedToiletsNearby: null,
    isLoadingToiletsNearby: false,
    requiredDataPromise: null,
    lastFeatureId: null,
    lastEquipmentInfoId: null,
  };
  nodeToolbar = React.createRef<NodeToolbar>();

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> {
    // keep old data when unchanged
    if (
      state.lastFeatureId === props.featureId &&
      state.lastEquipmentInfoId === props.equipmentInfoId
    ) {
      return state;
    }

    const resolvedPlaceDetails = getPlaceDetailsIfAlreadyResolved(props);
    // use resolved data if available (on server at least the required data is preloaded)
    if (resolvedPlaceDetails) {
      const resolvedCategories = getCategoriesForFeature(
        props.categories,
        resolvedPlaceDetails.equipmentInfo || resolvedPlaceDetails.feature,
      );
      const { feature, equipmentInfo } = resolvedPlaceDetails;
      return {
        ...state,
        ...resolvedCategories,
        resolvedSources: resolvedPlaceDetails.sources,
        resolvedPhotos: resolvedPlaceDetails.photos,
        resolvedToiletsNearby: resolvedPlaceDetails.toiletsNearby,
        resolvedRequiredData: {
          resolvedFeature: feature,
          resolvedEquipmentInfo: equipmentInfo,
        },
        lastFeatureId: props.featureId,
        lastEquipmentInfoId: props.equipmentInfoId,
      };
    }

    // resolve lightweight categories if it is set
    let categories = { category: null, parentCategory: null };
    if (props.lightweightFeature) {
      categories = getCategoriesForFeature(
        props.categories,
        props.lightweightFeature,
      );
    }

    // wait for new data
    return {
      ...state,
      ...categories,
      lastFeatureId: props.featureId,
      lastEquipmentInfoId: props.equipmentInfoId,
      resolvedRequiredData: null,
      requiredDataPromise: null,
      resolvedPhotos: null,
      resolvedSources: null,
      resolvedToiletsNearby: null,
    };
  }

  componentDidMount() {
    this.awaitRequiredData();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const prevFeatureId = prevProps.featureId;
    const prevEquipmentInfoId = prevProps.equipmentInfoId;

    if (
      prevFeatureId !== this.props.featureId ||
      prevEquipmentInfoId !== this.props.equipmentInfoId
    ) {
      this.awaitRequiredData();
    }
  }

  focus() {
    this.nodeToolbar.current?.focus();
  }

  awaitRequiredData() {
    const resolvedPlaceDetails = getPlaceDetailsIfAlreadyResolved(this.props);
    if (resolvedPlaceDetails) {
      const resolvedCategories = getCategoriesForFeature(
        this.props.categories,
        resolvedPlaceDetails.equipmentInfo || resolvedPlaceDetails.feature,
      );
      const { feature, equipmentInfo } = resolvedPlaceDetails;
      this.setState({
        resolvedRequiredData: {
          resolvedFeature: feature,
          resolvedEquipmentInfo: equipmentInfo,
        },
        resolvedSources: resolvedPlaceDetails.sources,
        resolvedPhotos: resolvedPlaceDetails.photos,
        resolvedToiletsNearby: resolvedPlaceDetails.toiletsNearby,
        ...resolvedCategories,
      });
    }

    const {
      feature,
      equipmentInfo,
      sources,
      photos,
      toiletsNearby,
    } = this.props;

    // required data promise
    if (
      feature instanceof Promise &&
      (!equipmentInfo || equipmentInfo instanceof Promise)
    ) {
      const requiredDataPromise: Promise<RequiredData> = feature.then(
        async resolvedFeature => {
          let resolvedEquipmentInfo = null;
          if (equipmentInfo) {
            resolvedEquipmentInfo = await equipmentInfo;
          }
          return { resolvedFeature, resolvedEquipmentInfo };
        },
      );

      this.setState({ requiredDataPromise }, () => {
        requiredDataPromise.then(resolved =>
          this.handleRequiredDataFetched(requiredDataPromise, resolved),
        );
      });
    }

    // toilets nearby promise
    if (toiletsNearby instanceof Promise) {
      this.setState({ isLoadingToiletsNearby: true }, () => {
        toiletsNearby.then(resolved =>
          this.handleToiletsNearbyFetched(toiletsNearby, resolved),
        );
      });
    }

    // sources promise
    if (sources instanceof Promise) {
      sources.then(resolved => this.handleSourcesFetched(sources, resolved));
    }

    // photos promise
    if (photos instanceof Promise) {
      photos.then(resolved => this.handlePhotosFetched(photos, resolved));
    }
  }

  handleRequiredDataFetched(
    requiredDataPromise: Promise<RequiredData>,
    resolved: RequiredData,
  ) {
    // ignore unwanted promise results (e.g. after unmounting)
    if (requiredDataPromise !== this.state.requiredDataPromise) {
      return;
    }

    const { resolvedFeature, resolvedEquipmentInfo } = resolved;
    const resolvedCategories = getCategoriesForFeature(
      this.props.categories,
      resolvedEquipmentInfo || resolvedFeature,
    );
    this.setState({
      resolvedRequiredData: { resolvedFeature, resolvedEquipmentInfo },
      ...resolvedCategories,
    });
  }

  handlePhotosFetched(
    photosPromise: Promise<PhotoModel[]>,
    resolvedPhotos: PhotoModel[],
  ) {
    // ignore unwanted promise results (e.g. after unmounting)
    if (photosPromise !== this.props.photos) {
      return;
    }
    this.setState({ resolvedPhotos });
  }

  handleToiletsNearbyFetched(
    toiletsNearbyPromise: Promise<Feature[]>,
    resolvedToiletsNearby: Feature[],
  ) {
    // ignore unwanted promise results (e.g. after unmounting)
    if (toiletsNearbyPromise !== this.props.toiletsNearby) {
      return;
    }
    this.setState({ resolvedToiletsNearby, isLoadingToiletsNearby: false });
  }

  handleSourcesFetched(
    sourcesPromise: Promise<SourceWithLicense[]>,
    resolvedSources: SourceWithLicense[],
  ) {
    // ignore unwanted promise results (e.g. after unmounting)
    if (sourcesPromise !== this.props.sources) {
      return;
    }
    this.setState({ resolvedSources });
  }

  render() {
    const {
      category,
      parentCategory,
      resolvedRequiredData,
      resolvedPhotos,
      resolvedSources,
      resolvedToiletsNearby,
    } = this.state;
    // strip promises from props
    const {
      feature,
      sources,
      equipmentInfo,
      lightweightFeature,
      photos,
      toiletsNearby,
      ...remainingProps
    } = this.props;

    if (resolvedRequiredData && resolvedRequiredData.resolvedFeature) {
      const { resolvedFeature, resolvedEquipmentInfo } = resolvedRequiredData;

      return (
        <NodeToolbar
          {...remainingProps}
          featureId={remainingProps.featureId}
          equipmentInfoId={remainingProps.equipmentInfoId}
          category={category}
          parentCategory={parentCategory}
          feature={resolvedFeature}
          equipmentInfo={resolvedEquipmentInfo}
          sources={resolvedSources || []}
          photos={resolvedPhotos || []}
          toiletsNearby={resolvedToiletsNearby || []}
          isLoadingToiletsNearby={this.state.isLoadingToiletsNearby}
          ref={this.nodeToolbar}
        />
      );
    } else if (lightweightFeature) {
      return (
        <NodeToolbar
          {...remainingProps}
          featureId={remainingProps.featureId}
          equipmentInfoId={remainingProps.equipmentInfoId}
          category={category}
          parentCategory={parentCategory}
          feature={lightweightFeature}
          equipmentInfo={null}
          toiletsNearby={null}
          isLoadingToiletsNearby={true}
          sources={[]}
          photos={[]}
          ref={this.nodeToolbar}
        />
      );
    }

    return <EmptyToolbarWithLoadingIndicator hidden={this.props.hidden} />;
  }
}

export default NodeToolbarFeatureLoader;
