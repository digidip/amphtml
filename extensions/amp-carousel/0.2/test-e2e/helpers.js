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

const TAG_NAME = 'amp-carousel';
const SLOTTED_CLASS = 'i-amphtml-carousel-slotted';
const SPACER_CLASS = 'i-amphtml-carousel-spacer';
const SCROLLER_SELECTOR = `${TAG_NAME} .i-amphtml-carousel-scroll`;

// TODO(sparhami) Remove once part of the test framework.
export async function enableExperiments(controller) {
  await controller.navigateTo(
      'http://localhost:8000/test/manual/amp-carousel-0-2/enable-experiment.html');
  await controller.findElement('.msg-div');
}

async function waitForImgLoad(controller, el) {
  await expect(controller.getElementProperty(el, 'naturalWidth'))
      .to.be.greaterThan(0);
}

export async function waitForCarouselImg(controller, n) {
  // We cannot use CSS's nth child due to non-slide elements in the scroll
  // container. We query all the imgs upfront, since they might not have
  // laid out yet.
  const el = await controller.findElementXPath(
      `//${TAG_NAME}//div[contains(@class, "${SLOTTED_CLASS}")][${n + 1}]` +
      '//img');
  return await waitForImgLoad(controller, el);
}

export function getSlides(controller) {
  return controller.findElements(`${TAG_NAME} .${SLOTTED_CLASS}`);
}

export async function getSlide(controller, n) {
  const slides = await getSlides(controller);
  return slides[n];
}

export async function getSpacers(controller) {
  return controller.findElements(`${TAG_NAME} .${SPACER_CLASS}`);
}

export async function getSpacersForSlide(controller, n) {
  const spacers = await getSpacers(controller);
  const slideCount = spacers.length / 3;

  return [
    spacers[n],
    spacers[n + slideCount],
    spacers[n + 2 * slideCount],
  ];
}

export async function getScrollingElement(controller) {
  return controller.findElement(SCROLLER_SELECTOR);
}
