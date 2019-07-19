// @flow

import type { AccessibilityCloudFeature, AccessibilityCloudFeatureCollection } from '../Feature';
import FeatureCache from './FeatureCache';
import { equipmentInfoCache } from './EquipmentInfoCache';
import { currentLocales } from '../i18n';
import env from '../env';

type CacheMap = {
  [key: string]: FeatureCache<*, *>,
};

const caches: CacheMap = {
  equipmentInfos: equipmentInfoCache,
};

export default class AccessibilityCloudFeatureCache extends FeatureCache<
  AccessibilityCloudFeature,
  AccessibilityCloudFeatureCollection
> {
  static fetchFeature(
    id: number | string,
    options: { useCache: boolean } = { useCache: true }
  ): Promise<Response> {
    const acLocaleString = currentLocales[0].underscoredString;
    const baseUrl = env.REACT_APP_ACCESSIBILITY_CLOUD_BASE_URL || '';
    const appToken = env.REACT_APP_ACCESSIBILITY_CLOUD_APP_TOKEN || '';
    return this.fetch(
      `${baseUrl}/place-infos/${id}.json?appToken=${appToken}&locale=${acLocaleString}&includePlacesWithoutAccessibility=1`
    );
  }

  static getIdForFeature(feature: AccessibilityCloudFeature): string {
    return String(feature._id || (feature.properties && feature.properties._id));
  }

  cacheFeature(feature: AccessibilityCloudFeature, response: any): void {
    // Cache and index related objects in their respective caches
    Object.keys(caches).forEach(collectionName => {
      const cache = caches[collectionName];
      const idsToDocuments = feature.properties && feature.properties[collectionName];
      if (idsToDocuments) {
        const ids = Object.keys(idsToDocuments || {});
        ids.forEach(_id => cache.cacheFeature(idsToDocuments[_id]));
      }
    });

    super.cacheFeature(feature, response);
  }

  reportPlace(placeId: string, reason: string, message: string): Promise<boolean> {
    const uploadPromise = new Promise((resolve, reject) => {
      this.constructor
        .fetch(
          `${env.REACT_APP_CLASSIC_WHEELMAP_API_BASE_URL ||
            ''}/place-infos/report?id=${placeId}&reason=${reason}&message=${message}&appToken=${process
            .env.REACT_APP_ACCESSIBILITY_CLOUD_APP_TOKEN || ''}`,
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
            },
          }
        )
        .then((response: Response) => {
          if (response.ok) {
            resolve(true);
          } else {
            response
              .json()
              .then(json => {
                reject('unknown');
              })
              .catch(reject);
          }
        })
        .catch(reject)
        .catch(console.error);
    });

    return uploadPromise;
  }
}

export const accessibilityCloudFeatureCache = new AccessibilityCloudFeatureCache();
