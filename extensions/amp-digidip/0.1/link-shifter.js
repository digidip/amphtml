/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  CTX_ATTR_NAME,
  CTX_ATTR_VALUE,
  WL_ANCHOR_ATTR,
} from './constants';
import {getConfigOpts} from './config-options';

export class LinkShifter {
  /**
   * @param {!AmpElement} ampElement
   * @param {?../../../src/service/viewer-impl.Viewer} viewer
   * @param {?../../../src/service/ampdoc-impl.AmpDoc} ampDoc
   */
  constructor(ampElement, viewer, ampDoc) {
    /** @private {?../../../src/service/viewer-impl.Viewer} */
    this.viewer_ = viewer;

    /** @private {?../../../src/service/ampdoc-impl.AmpDoc} */
    this.ampDoc_ = ampDoc;

    /** @private {?Event} */
    this.event_ = null;

    /** @private {?Object} */
    this.configOpts_ = getConfigOpts(ampElement);

    /** @private {?RegExp} */
    this.regexDomainUrl_ = /^https?:\/\/(www\.)?([^\/:]*)(:\d+)?(\/.*)?$/;
  }

  /**
   * @param {!Event} event
   */
  clickHandler(event) {
    this.event_ = event;
    const htmlElement = event.srcElement;
    const trimmedDomain = this.viewer_.win.document.domain
        .replace(/(www\.)?(.*)/, '$2');

    this.event_.stopPropagation();

    // avoid firefox to trigger the event twice (just caution)
    if ((this.event_.type !== 'contextmenu') && (this.event_.button === 2)) {
      return;
    }

    // check if there is a ignore_attribute and and ignore_pattern defined
    // and check if the current element or it's parent has it
    if (!this.testAttributes_(htmlElement)) {
      return;
    }

    if (this.wasShifted_(htmlElement)) {
      return;
    }

    if (this.isInternalLink(htmlElement, trimmedDomain)) {
      return;
    }

    this.setTrackingUrl_(htmlElement);
  }

  /**
   * Match attributes of the anchor if have been defined in config
   * compare every attribute defined in config as regex with its
   * corresponding value of the anchor element attribute
   * @param {!Node} htmlElement
   */
  testAttributes_(htmlElement) {
    const anchorAttr = this.configOpts_.attribute;
    const attrKeys = Object.keys(anchorAttr);
    let test = true;

    if (attrKeys.length === 0) {
      return true;
    }

    attrKeys.forEach(key => {
      const value = anchorAttr[key];
      const reg = new RegExp(value);

      test = test && reg.test(htmlElement.getAttribute(key));
    });


    return test;
  }

  /**
   * Check if the anchor element was already shifted
   * @param {!Node} htmlElement
   * @return {boolean}
   * @private
   */
  wasShifted_(htmlElement) {
    const ctxAttrValue = CTX_ATTR_VALUE().toString();

    return (htmlElement.hasAttribute(CTX_ATTR_NAME)) &&
        (htmlElement.getAttribute(CTX_ATTR_NAME) === ctxAttrValue);
  }

  /**
   * Check if the anchor element leads to an internal link
   * @param {!Node} htmlElement
   * @param {?string} trimmedDomain
   * @return {boolean}
   */
  isInternalLink(htmlElement, trimmedDomain) {
    const href = htmlElement.getAttribute('href');

    if (!(href && this.regexDomainUrl_.test(href) &&
            RegExp.$2 !== trimmedDomain)
    ) {
      return true;
    }

    return false;
  }

  /**
   *
   * @param {!Node} htmlElement
   * @return {string}
   */
  setTrackingUrl_(htmlElement) {

    const oldValHref = htmlElement.getAttribute('href');

    this.viewer_.getReferrerUrl().then(referrerUrl => {
      const pageAttributes = {
        referrer: referrerUrl,
        location: this.viewer_.getResolvedViewerUrl(),
      };

      htmlElement.href = this.replacePlaceHolders(htmlElement, pageAttributes);

      // If the link has been "activated" via contextmenu,
      // we have to keep the shifting in mind
      if (this.event_.type === 'contextmenu') {
        htmlElement.setAttribute(CTX_ATTR_NAME, CTX_ATTR_VALUE());
      }

      this.viewer_.win.setTimeout(() => {
        htmlElement.href = oldValHref;

        if (htmlElement.hasAttribute(CTX_ATTR_NAME)) {
          htmlElement.removeAttribute(CTX_ATTR_NAME);
        }

      }, ((this.event_.type === 'contextmenu') ? 15000 : 500));
    });
  }

  /**
   * @param {!Node} htmlElement
   * @param {!Object} pageAttributes
   * @return {string}
   */
  replacePlaceHolders(htmlElement, pageAttributes) {
    const {vars} = this.configOpts_;
    let {output} = this.configOpts_;
    /**
     * Replace placeholders for anchor attributes
     * defined in white list constant array
     */
    WL_ANCHOR_ATTR.forEach(val => {
      let attrValue = '';

      if (htmlElement.getAttribute(val)) {
        attrValue = htmlElement.getAttribute(val);
      }

      output = output.replace('${' + val + '}', encodeURIComponent(attrValue));
    });

    /**
     * Replace placeholders for properties of the document
     * at the moment only referrer and location
     */
    Object.keys(pageAttributes).forEach(key => {
      let propValue = '';

      if (pageAttributes[key]) {
        propValue = pageAttributes[key];
      }

      output = output.replace('${' + key + '}', encodeURIComponent(propValue));
    });

    /**
     * Replace placeholders for values defined
     * in vars config property
     */
    Object.keys(vars).forEach(key => {
      let confValue = '';

      if (vars[key]) {
        confValue = vars[key];
      }

      output = output.replace('${' + key + '}', encodeURIComponent(confValue));
    });

    console.log('output', output);

    return output;
  }

}
