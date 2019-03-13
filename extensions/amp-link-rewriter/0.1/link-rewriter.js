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

import {getConfigOpts} from './config-options';
import {getDataParamsFromAttributes} from '../../../src/dom';

export const
    CTX_ATTR_NAME = 'shiftedctx',
    CTX_ATTR_VALUE = () => {
      return Date.now();
    },
    WL_ANCHOR_ATTR = [
      'href',
      'id',
      'rel',
      'rev',
    ],
    PREFIX_DATA_ATTR = /^vars(.+)/,
    NS_DATA_PH = 'data.';

export class LinkRewriter {
  /**
   * @param {!AmpElement} ampElement
   * @param {?../../../src/service/viewer-impl.Viewer} viewer
   */
  constructor(ampElement, viewer) {
    /** @private {?../../../src/service/viewer-impl.Viewer} */
    this.viewer_ = viewer;

    /** @private {?Event} */
    this.event_ = null;

    /** @private {?Object} */
    this.configOpts_ = getConfigOpts(ampElement);

    /** @private {boolean|number|string} */
    this.ctxAttrValue_ = CTX_ATTR_VALUE().toString();

    /** @private {?RegExp} */
    this.regexDomainUrl_ = /^https?:\/\/(www\.)?([^\/:]*)(:\d+)?(\/.*)?$/;

    /** @private {?Object} */
    this.vars_ = viewer.getReferrerUrl().then(referrerUrl => {
      const pageAttributes = {
        referrer: referrerUrl,
        location: viewer.getResolvedViewerUrl(),
      };

      return Object.assign(pageAttributes, this.configOpts_.vars);
    });
  }

  /**
   * @param {!Event} event
   */
  clickHandler(event) {
    this.event_ = event;
    const htmlElement = event.srcElement;
    const trimmedDomain = this.viewer_.win.document.domain
        .replace(/(www\.)?(.*)/, '$2');

    // avoid firefox to trigger the event twice (just caution)
    if ((this.event_.type !== 'contextmenu') && (this.event_.button === 2)) {
      return;
    }

    if (this.wasShifted_(htmlElement)) {
      return;
    }

    if (this.isInternalLink(htmlElement, trimmedDomain)) {
      return;
    }

    this.setRedirectUrl_(htmlElement);
  }

  /**
   * Check if the anchor element was already shifted
   * @param {?Element} htmlElement
   * @return {boolean}
   * @private
   */
  wasShifted_(htmlElement) {
    const ctxAttrValue = this.ctxAttrValue_;
    return (htmlElement.hasAttribute(CTX_ATTR_NAME)) &&
        (htmlElement.getAttribute(CTX_ATTR_NAME) === ctxAttrValue);
  }

  /**
   * Check if the anchor element leads to an internal link
   * @param {?Element} htmlElement
   * @param {?string} trimmedDomain
   * @return {boolean}
   */
  isInternalLink(htmlElement, trimmedDomain) {
    const href = htmlElement.getAttribute('href');

    return !(href && this.regexDomainUrl_.test(href) &&
            RegExp.$2 !== trimmedDomain);
  }

  /**
   *
   * @param {?Element} htmlElement
   */
  setRedirectUrl_(htmlElement) {

    const oldValHref = htmlElement.getAttribute('href');

    this.vars_.then(vars => {
      htmlElement.href = this.replacePlaceHolders(htmlElement, vars);

      // If the link has been "activated" via contextmenu,
      // we have to keep the shifting in mind
      if (this.event_.type === 'contextmenu') {
        this.ctxAttrValue_ = CTX_ATTR_VALUE().toString();
        htmlElement.setAttribute(CTX_ATTR_NAME, this.ctxAttrValue_);
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
   * @param {?Element} htmlElement
   * @param {!Object} vars
   * @return {string}
   */
  replacePlaceHolders(htmlElement, vars) {
    let {output} = this.configOpts_;

    /**
     * Merge vars with attributes of the anchor element
     */
    WL_ANCHOR_ATTR.forEach(val => {
      if (htmlElement.getAttribute(val)) {
        vars[val] = htmlElement.getAttribute(val);
      }
    });

    /**
     * Merge with vars object properties and values set on the element
     * 'data attributes' in case these have the save name that the
     * 'vars config property', 'data attributes' values will
     * overwrite 'vars config values'
     */
    const dataset = getDataParamsFromAttributes(
        htmlElement,
        /* computeParamNameFunc */ undefined,
        PREFIX_DATA_ATTR);

    Object.assign(vars, dataset);

    /**
     * Replace placeholders for properties of the document, anchor attributes
     * and 'vars config property' all of them merged in vars
     */
    Object.keys(vars).forEach(key => {
      if (vars[key]) {
        output = output.replace(
            '${' + key + '}',
            encodeURIComponent(vars[key]));
      }
    });

    /**
     * Finally to clean up we leave empty all placeholders that
     * were not replace in previous steps
     */
    output = output.replace(/\${[A-Za-z0-9]+}+/, () => {
      return '';
    });

    return output;
  }
}
