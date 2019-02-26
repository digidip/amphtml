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
import {getChildJsonConfig} from '../../../src/json';
import {userAssert} from '../../../src/log';

const errors = {
  REQUIRED_REWRITE_PATTERN: 'rewrite pattern property is required',
};

/**
 * @param {!AmpElement} element
 * @return {!Object}
 */
export function getDigidipOptions(element) {

  const config = getChildJsonConfig(element);

  enforceDigipOptions(config['rewritePattern'],
      errors.REQUIRED_REWRITE_PATTERN);

  console.log(config);


  return {
    rewritePattern: config.rewritePattern,
    hostsIgnore: config.hasOwn('ignoreHosts') ? config['ignoreHosts'] : '',
    elementClickhandler: config.hasOwn('include') &&
    config['include'].hasOwn('value') ? config['include']['value'] : '',
    elementClickhandlerAttribute: config.hasOwn('include') &&
    config['include'].hasOwn('attribute') ? config['include']['attribute'] : '',
    elementIgnoreAttribute: config.hasOwn('exclude') &&
    config['exclude'].hasOwn('attribute') ? config['exclude']['attribute'] : '',
    elementIgnorePattern: config.hasOwn('exclude') &&
    config['exclude'].hasOwn('value') ? config['exclude']['value'] : '',
    elementIgnoreConsiderParents:
      config.hasOwn('checkIfAnchorPartOfExcludeSection') ?
        config['checkIfAnchorPartOfExcludeSection'] : false,
  };
}

/**
 * @param {*} condition
 * @param {string} message
 */
function enforceDigipOptions(condition, message) {
  userAssert(
      condition,
      `There is something wrong with your config: ${message}`
  );
}


