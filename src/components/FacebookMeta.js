// @flow
import React, { PureComponent } from 'react';
import Head from 'next/head';

import { type FacebookConfiguration } from '../lib/ClientSideConfiguration';

type Props = {
  facebook: FacebookConfiguration & {
    imageWidth: number,
    imageHeight: number,
  },
};

class FacebookMeta extends PureComponent<Props> {
  render() {
    const { appId, admins, imageURL, imageWidth, imageHeight } = this.props.facebook;

    return (
      <Head>
        {appId && <meta content={appId} property="fb:app_id" key="fb:app_id" />}
        {admins && <meta content={admins} property="fb:admins" key="fb:admins" />}
        {imageURL && <meta content={imageURL} property="og:image" key="og:image" />}
        {imageURL && <meta content={imageWidth} property="og:image:width" key="og:image:width" />}
        {imageURL && (
          <meta content={imageHeight} property="og:image:height" key="og:image:height" />
        )}
      </Head>
    );
  }
}

export default FacebookMeta;
