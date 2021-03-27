import { loadGlobalEnvironment } from '@sozialhelden/twelve-factor-dotenv';

type Environment = {
  AWS_S3_BUCKET_NAME: string,
  npm_package_version: string,
  ELASTIC_APM_SECRET_TOKEN: string,
  ELASTIC_APM_SERVER_URL: string,
  PUBLIC_URL: string,
  BASE_URL: string,
  SEARCH_ELASTIC_USER: string,
  SEARCH_ELASTIC_PASSWORD: string,
  SEARCH_ELASTIC_BASEURL: string,
  REACT_APP_ACCESSIBILITY_CLOUD_APP_TOKEN: string,
  REACT_APP_ACCESSIBILITY_CLOUD_BASE_URL: string,
  REACT_APP_ACCESSIBILITY_CLOUD_UNCACHED_BASE_URL: string,
  REACT_APP_ALLOW_ADDITIONAL_DATA_URLS: string,
  REACT_APP_ELASTIC_APM_SECRET_TOKEN: string,
  REACT_APP_ELASTIC_APM_SERVER_URL: string,
  REACT_APP_MAPBOX_ACCESS_TOKEN: string,
  REACT_APP_WHEELMAP_API_BASE_URL: string,
  REACT_APP_LEGACY_API_BASE_URL: string,
  REACT_APP_WHEELMAP_API_KEY: string,
  REACT_APP_ALLOW_ADDITIONAL_IMAGE_URLS: string,
};

const env: Environment = loadGlobalEnvironment();

export default env;
